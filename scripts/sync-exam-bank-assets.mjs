import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { get as httpsGet } from 'node:https';
import { get as httpGet } from 'node:http';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultManifestPath = path.join(repoRoot, 'asset-manifests/exam-bank-data.json');

function parseArgs(argv) {
  const options = {
    manifestPath: defaultManifestPath,
    source: process.env.ASTERION_EXAM_BANK_ASSET_BUNDLE || '',
    sourceSha256: process.env.ASTERION_EXAM_BANK_ASSET_SHA256 || '',
    force: false,
    verifyOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest') options.manifestPath = path.resolve(argv[++index] ?? '');
    else if (arg === '--source') options.source = argv[++index] ?? '';
    else if (arg === '--sha256') options.sourceSha256 = argv[++index] ?? '';
    else if (arg === '--force') options.force = true;
    else if (arg === '--verify-only') options.verifyOnly = true;
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files.sort();
}

async function fileSha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function treeFingerprint(root) {
  if (!existsSync(root)) return null;
  const files = await collectFiles(root);
  const lines = [];
  let totalBytes = 0;

  for (const filePath of files) {
    const info = await stat(filePath);
    const relativePath = path.relative(root, filePath).split(path.sep).join('/');
    const hash = await fileSha256(filePath);
    totalBytes += info.size;
    lines.push(`${hash} ${info.size} ${relativePath}`);
  }

  return {
    fileCount: files.length,
    totalBytes,
    treeSha256: createHash('sha256').update(`${lines.join('\n')}\n`).digest('hex'),
  };
}

function resolveRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function isUsableSha(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

async function verifyTarget(manifest, targetPath) {
  const fingerprint = await treeFingerprint(targetPath);
  if (!fingerprint) {
    return { ok: false, reason: `${manifest.unpackPath} is missing.` };
  }

  const missing = [
    ...(manifest.requiredTopLevelFiles ?? []),
    ...(manifest.requiredRuntimeDirectories ?? []),
  ].filter((relativePath) => !existsSync(path.join(targetPath, relativePath)));

  if (missing.length) {
    return { ok: false, reason: `Missing required exam-bank entries: ${missing.join(', ')}` };
  }

  if (fingerprint.treeSha256 !== manifest.treeSha256) {
    return {
      ok: false,
      reason: `Tree SHA256 mismatch: expected ${manifest.treeSha256}, got ${fingerprint.treeSha256}.`,
      fingerprint,
    };
  }

  if (fingerprint.fileCount !== manifest.summary?.fileCount) {
    return {
      ok: false,
      reason: `File count mismatch: expected ${manifest.summary?.fileCount}, got ${fingerprint.fileCount}.`,
      fingerprint,
    };
  }

  return { ok: true, fingerprint };
}

async function downloadOnce(url, destination) {
  const get = url.startsWith('https:') ? httpsGet : httpGet;
  await new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
        downloadOnce(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
        return;
      }
      const totalBytes = Number.parseInt(response.headers['content-length'] ?? '', 10);
      let downloadedBytes = 0;
      let nextProgressPercent = 10;
      const stream = createWriteStream(destination);
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (!Number.isFinite(totalBytes) || totalBytes <= 0) return;
        const percent = Math.floor((downloadedBytes / totalBytes) * 100);
        if (percent >= nextProgressPercent) {
          console.info(`[exam-bank-assets] download progress ${Math.min(percent, 100)}% (${downloadedBytes}/${totalBytes} bytes)`);
          nextProgressPercent += 10;
        }
      });
      response.pipe(stream);
      stream.on('finish', () => stream.close(resolve));
      stream.on('error', reject);
    });
    request.setTimeout(60000, () => request.destroy(new Error(`Download timed out: ${url}`)));
    request.on('error', reject);
  });
}

async function download(url, destination) {
  const configuredAttempts = Number.parseInt(process.env.ASTERION_EXAM_BANK_DOWNLOAD_RETRIES || '4', 10);
  const maxAttempts = Number.isFinite(configuredAttempts) ? Math.max(0, configuredAttempts) : 4;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await rm(destination, { force: true });
      console.info(`[exam-bank-assets] downloading bundle attempt ${attempt}/${maxAttempts}`);
      console.info(`[exam-bank-assets] source: ${url}`);
      console.info(`[exam-bank-assets] destination: ${destination}`);
      await downloadOnce(url, destination);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      console.warn(`[exam-bank-assets] download attempt ${attempt} failed: ${error.message}. Retrying...`);
    }
  }

  const releaseAsset = parseGitHubReleaseAssetUrl(url);
  if (releaseAsset) {
    console.warn('[exam-bank-assets] direct download failed; falling back to gh release download.');
    console.warn('[exam-bank-assets] if this fails, install/authenticate GitHub CLI or set ASTERION_EXAM_BANK_ASSET_BUNDLE to a local bundle path.');
    await downloadGitHubReleaseAsset(releaseAsset, destination);
    return;
  }

  const message = lastError?.message ?? `No supported download method succeeded for ${url}.`;
  throw new Error(
    `[exam-bank-assets] build blocked: bundle download failed.\n` +
    `[exam-bank-assets] source: ${url}\n` +
    `[exam-bank-assets] destination: ${destination}\n` +
    `[exam-bank-assets] error: ${message}\n` +
    '[exam-bank-assets] retry: run npm run assets:sync again, or set ASTERION_EXAM_BANK_ASSET_BUNDLE to a local bundle path and run npm run assets:sync -- --force.'
  );
}

function parseGitHubReleaseAssetUrl(source) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 6 || parts[2] !== 'releases' || parts[3] !== 'download') return null;
    return {
      repo: `${parts[0]}/${parts[1]}`,
      tag: decodeURIComponent(parts[4]),
      assetName: decodeURIComponent(parts[5]),
    };
  } catch {
    return null;
  }
}

async function downloadGitHubReleaseAsset({ repo, tag, assetName }, destination) {
  await run('gh', [
    'release',
    'download',
    tag,
    '--repo',
    repo,
    '--pattern',
    assetName,
    '--output',
    destination,
    '--clobber',
  ]);
}

async function prepareBundle(source, destination) {
  if (/^https?:\/\//i.test(source)) {
    await download(source, destination);
    return;
  }
  console.info(`[exam-bank-assets] copying local bundle: ${path.resolve(source)}`);
  console.info(`[exam-bank-assets] destination: ${destination}`);
  await cp(path.resolve(source), destination);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function restoreFromBundle(manifest, targetPath, source, expectedBundleSha) {
  if (!source) {
    throw new Error(
      `[exam-bank-assets] build blocked: ${manifest.unpackPath} is missing and no asset bundle source is configured.\n` +
      '[exam-bank-assets] retry: set ASTERION_EXAM_BANK_ASSET_BUNDLE to a local bundle path, or fill downloadUrl in asset-manifests/exam-bank-data.json, then run npm run assets:sync.'
    );
  }

  const tempRoot = await fsMkdtemp(path.join(tmpdir(), 'asterion-exam-bank-assets-'));
  const bundlePath = path.join(tempRoot, manifest.bundleName || 'exam-bank-data.tgz');
  const extractRoot = path.join(tempRoot, 'extract');
  try {
    await mkdir(extractRoot, { recursive: true });

    console.info('[exam-bank-assets] asset directory is missing or invalid; restoring from bundle.');
    console.info(`[exam-bank-assets] unpack path: ${manifest.unpackPath}`);
    console.info(`[exam-bank-assets] bundle: ${manifest.bundleName || 'exam-bank-data.tgz'}`);
    console.info(`[exam-bank-assets] expected bundle SHA256: ${expectedBundleSha || '(not configured)'}`);
    console.info(`[exam-bank-assets] expected tree SHA256: ${manifest.treeSha256}`);

    await prepareBundle(source, bundlePath);
    const actualBundleSha = await fileSha256(bundlePath);
    console.info(`[exam-bank-assets] actual bundle SHA256: ${actualBundleSha}`);
    if (expectedBundleSha && actualBundleSha !== expectedBundleSha) {
      throw new Error(
        `[exam-bank-assets] build blocked: bundle SHA256 mismatch.\n` +
        `[exam-bank-assets] expected: ${expectedBundleSha}\n` +
        `[exam-bank-assets] actual:   ${actualBundleSha}\n` +
        '[exam-bank-assets] retry: remove the bad bundle, confirm the manifest downloadUrl, then run npm run assets:sync again.'
      );
    }

    console.info(`[exam-bank-assets] extracting bundle to ${extractRoot}`);
    await run('tar', ['-xzf', bundlePath, '-C', extractRoot]);

    const bundledRoot = path.join(extractRoot, path.basename(manifest.unpackPath));
    const extractedAssetRoot = existsSync(bundledRoot) ? bundledRoot : extractRoot;
    const parent = path.dirname(targetPath);
    await mkdir(parent, { recursive: true });
    await rm(targetPath, { recursive: true, force: true });
    await cp(extractedAssetRoot, targetPath, { recursive: true });

    const verification = await verifyTarget(manifest, targetPath);
    if (!verification.ok) {
      throw new Error(
        `[exam-bank-assets] build blocked: restored exam-bank assets failed verification.\n` +
        `[exam-bank-assets] reason: ${verification.reason}\n` +
        '[exam-bank-assets] retry: run npm run assets:sync -- --force, or set ASTERION_EXAM_BANK_ASSET_BUNDLE to a known-good bundle.'
      );
    }
    return { ...verification, bundleSha256: actualBundleSha };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function fsMkdtemp(prefix) {
  const { mkdtemp } = await import('node:fs/promises');
  return mkdtemp(prefix);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await readJson(options.manifestPath);
  const targetPath = resolveRepoPath(manifest.unpackPath);
  const source = options.source || manifest.downloadUrl || '';
  const expectedBundleSha = options.sourceSha256 || (isUsableSha(manifest.bundleSha256) ? manifest.bundleSha256 : '');

  const verification = await verifyTarget(manifest, targetPath);
  if (verification.ok) {
    console.info('[exam-bank-assets] verified', {
      path: manifest.unpackPath,
      treeSha256: verification.fingerprint.treeSha256,
      fileCount: verification.fingerprint.fileCount,
      totalBytes: verification.fingerprint.totalBytes,
    });
    return;
  }

  if (options.verifyOnly) {
    throw new Error(
      `[exam-bank-assets] verification failed: ${verification.reason}\n` +
      '[exam-bank-assets] retry: run npm run assets:sync without --verify-only to restore missing assets.'
    );
  }

  if (existsSync(targetPath) && !options.force) {
    throw new Error(
      `[exam-bank-assets] build blocked: ${verification.reason}\n` +
      '[exam-bank-assets] retry: run npm run assets:sync -- --force to replace the invalid asset directory.'
    );
  }

  const restored = await restoreFromBundle(manifest, targetPath, source, expectedBundleSha);
  console.info('[exam-bank-assets] restored', {
    path: manifest.unpackPath,
    source,
    bundleSha256: restored.bundleSha256,
    treeSha256: restored.fingerprint.treeSha256,
    fileCount: restored.fingerprint.fileCount,
    totalBytes: restored.fingerprint.totalBytes,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
