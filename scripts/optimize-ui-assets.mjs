import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'assets-source', 'ui', 'astral');
const outputRoot = join(root, 'public', 'assets', 'ui', 'astral', 'optimized');

const assets = [
  ['starfield-map.png', 'starfield-map-1280.png', 1280],
  ['academy-hall.png', 'academy-hall-960.png', 960],
  ['progress-garden.png', 'progress-garden-960.png', 960],
  ['avatar-student-front.png', 'avatar-student-front-512.png', 512],
  ['avatar-student-map.png', 'avatar-student-map-512.png', 512],
  ['panel-frame-wood.png', 'panel-frame-wood-768.png', 768],
  ['panel-frame-parchment.png', 'panel-frame-parchment-768.png', 768],
  ['regions/algebra-vault.png', 'regions/algebra-vault-512.png', 512],
  ['regions/argand-atrium.png', 'regions/argand-atrium-512.png', 512],
  ['regions/calculus-cliffs.png', 'regions/calculus-cliffs-512.png', 512],
  ['regions/differential-shrine.png', 'regions/differential-shrine-512.png', 512],
  ['regions/integral-terraces.png', 'regions/integral-terraces-512.png', 512],
  ['regions/iteration-forge.png', 'regions/iteration-forge-512.png', 512],
  ['regions/logarithm-observatory.png', 'regions/logarithm-observatory-512.png', 512],
  ['regions/trigonometry-spire.png', 'regions/trigonometry-spire-512.png', 512],
  ['regions/vectors-gate.png', 'regions/vectors-gate-512.png', 512],
];

for (const [source, output, maxDimension] of assets) {
  const sourcePath = join(sourceRoot, source);
  const outputPath = join(outputRoot, output);
  mkdirSync(dirname(outputPath), { recursive: true });
  execFileSync('sips', ['-Z', String(maxDimension), sourcePath, '--out', outputPath], { stdio: 'ignore' });
  console.log(`Optimized ${source} -> ${output}`);
}
