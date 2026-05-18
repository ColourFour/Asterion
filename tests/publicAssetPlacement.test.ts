import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public asset placement', () => {
  it('does not ship legacy question-bank bundles from public/data', () => {
    const publicDataDir = join(process.cwd(), 'public/data');
    const files = existsSync(publicDataDir) ? readdirSync(publicDataDir) : [];

    expect(files.filter((file) => /^question_bank(\.|$)/.test(file))).toEqual([]);
  });

  it('keeps only reviewed runtime support JSON in public/data', () => {
    const publicDataDir = join(process.cwd(), 'public/data');
    const files = existsSync(publicDataDir) ? readdirSync(publicDataDir).sort() : [];

    expect(files).toEqual([
      'generated_practice_bank.json',
      'teaching_snippets.json',
    ]);
  });

  it('does not ship source UI art from public/assets/ui/astral', () => {
    const publicUiRoot = join(process.cwd(), 'public/assets/ui/astral');
    const files = existsSync(publicUiRoot) ? directoryFiles(publicUiRoot) : [];
    const nonOptimizedPngs = files
      .map((file) => relative(publicUiRoot, file))
      .filter((file) => file.endsWith('.png') && !file.startsWith('optimized/'));

    expect(nonOptimizedPngs).toEqual([]);
  });

  it('does not ship source region hub art from public/assets/region-art', () => {
    const publicRegionRoot = join(process.cwd(), 'public/assets/region-art');
    const files = existsSync(publicRegionRoot) ? directoryFiles(publicRegionRoot) : [];
    const nonOptimizedPngs = files
      .map((file) => relative(publicRegionRoot, file))
      .filter((file) => file.endsWith('.png') && !file.startsWith('optimized/'));

    expect(nonOptimizedPngs).toEqual([]);
  });
});

function directoryFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) return directoryFiles(fullPath);
    return fullPath;
  });
}
