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

async function download(url, destination) {
  const get = url.startsWith('https:') ? httpsGet : httpGet;
  await new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
        download(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
        return;
      }
      const stream = createWriteStream(destination);
      response.pipe(stream);
      stream.on('finish', () => stream.close(resolve));
      stream.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function prepareBundle(source, destination) {
  if (/^https?:\/\//i.test(source)) {
    await download(source, destination);
    return;
  }
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
      `${manifest.unpackPath} is missing and no asset bundle source is configured. ` +
      'Set ASTERION_EXAM_BANK_ASSET_BUNDLE or fill downloadUrl in asset-manifests/exam-bank-data.json.'
    );
  }

  const tempRoot = await fsMkdtemp(path.join(tmpdir(), 'asterion-exam-bank-assets-'));
  const bundlePath = path.join(tempRoot, manifest.bundleName || 'exam-bank-data.tgz');
  const extractRoot = path.join(tempRoot, 'extract');
  await mkdir(extractRoot, { recursive: true });

  await prepareBundle(source, bundlePath);
  const actualBundleSha = await fileSha256(bundlePath);
  if (expectedBundleSha && actualBundleSha !== expectedBundleSha) {
    throw new Error(`Bundle SHA256 mismatch: expected ${expectedBundleSha}, got ${actualBundleSha}.`);
  }

  await run('tar', ['-xzf', bundlePath, '-C', extractRoot]);

  const bundledRoot = path.join(extractRoot, path.basename(manifest.unpackPath));
  const extractedAssetRoot = existsSync(bundledRoot) ? bundledRoot : extractRoot;
  const parent = path.dirname(targetPath);
  await mkdir(parent, { recursive: true });
  await rm(targetPath, { recursive: true, force: true });
  await cp(extractedAssetRoot, targetPath, { recursive: true });

  const verification = await verifyTarget(manifest, targetPath);
  if (!verification.ok) throw new Error(`Restored exam-bank assets failed verification: ${verification.reason}`);
  await rm(tempRoot, { recursive: true, force: true });
  return { ...verification, bundleSha256: actualBundleSha };
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
    throw new Error(`[exam-bank-assets] verification failed: ${verification.reason}`);
  }

  if (existsSync(targetPath) && !options.force) {
    throw new Error(
      `[exam-bank-assets] verification failed: ${verification.reason} ` +
      'Use --force with a configured bundle source to replace the directory.'
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
