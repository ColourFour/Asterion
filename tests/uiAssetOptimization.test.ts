import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceFiles = [
  'starfield-map.png',
  'academy-hall.png',
  'progress-garden.png',
  'avatar-student-front.png',
  'avatar-student-map.png',
  'panel-frame-wood.png',
  'panel-frame-parchment.png',
  'regions/algebra-vault.png',
  'regions/argand-atrium.png',
  'regions/calculus-cliffs.png',
  'regions/differential-shrine.png',
  'regions/integral-terraces.png',
  'regions/iteration-forge.png',
  'regions/logarithm-observatory.png',
  'regions/trigonometry-spire.png',
  'regions/vectors-gate.png',
];

function fileSize(path: string): number {
  return statSync(path).size;
}

function directoryFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) return directoryFiles(fullPath);
    return fullPath;
  });
}

describe('optimized UI assets', () => {
  it('keeps generated UI variants substantially smaller than source art', () => {
    const sourceRoot = join(process.cwd(), 'assets-source/ui/astral');
    const optimizedRoot = join(process.cwd(), 'public/assets/ui/astral/optimized');
    const sourceBytes = sourceFiles.reduce((sum, file) => sum + fileSize(join(sourceRoot, file)), 0);
    const optimizedBytes = directoryFiles(optimizedRoot).reduce((sum, file) => sum + fileSize(file), 0);

    expect(optimizedBytes).toBeLessThan(sourceBytes * 0.2);
  });
});
