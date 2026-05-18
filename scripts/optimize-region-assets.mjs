import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'assets-source', 'region-art');
const outputRoot = join(root, 'public', 'assets', 'region-art', 'optimized');

const assets = [
  ['algebra-region-hub.png', 'algebra-region-hub-960.png', 960],
  ['argand-region-hub.png', 'argand-region-hub-960.png', 960],
  ['calc-region-hub.png', 'calc-region-hub-960.png', 960],
  ['differential-region-hub.png', 'differential-region-hub-960.png', 960],
  ['integral-region-hub.png', 'integral-region-hub-960.png', 960],
  ['iteration-region-hub.png', 'iteration-region-hub-960.png', 960],
  ['log-region-hub.png', 'log-region-hub-960.png', 960],
  ['trig-region-hub.png', 'trig-region-hub-960.png', 960],
  ['vectors-region-hub.png', 'vectors-region-hub-960.png', 960],
];

for (const [source, output, maxDimension] of assets) {
  const sourcePath = join(sourceRoot, source);
  const outputPath = join(outputRoot, output);
  mkdirSync(dirname(outputPath), { recursive: true });
  execFileSync('sips', ['-Z', String(maxDimension), sourcePath, '--out', outputPath], { stdio: 'ignore' });
  console.log(`Optimized ${source} -> ${output}`);
}
