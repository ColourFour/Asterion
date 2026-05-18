import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRegionHubAsset, getRegionHubAssetDimensions, regionHubAssets } from '../src/lib/regionAssets';
import { P3_ASTRAL_ACADEMY } from '../src/lib/worldMap';

function publicPathExists(path: string): boolean {
  return existsSync(join(process.cwd(), 'public', path.replace(/^\/+/, '')));
}

function directoryFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) return directoryFiles(fullPath);
    return fullPath;
  });
}

describe('region hub assets', () => {
  it('covers canonical P3 regions with optimized runtime art paths', () => {
    expect(Object.keys(regionHubAssets).sort()).toEqual(P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort());

    for (const region of P3_ASTRAL_ACADEMY.regions) {
      const assetPath = getRegionHubAsset(region.id);
      expect(assetPath).toMatch(/^\/assets\/region-art\/optimized\/.+-960\.png$/);
      expect(publicPathExists(assetPath ?? '')).toBe(true);
      expect(getRegionHubAssetDimensions(region.id)).toBeTruthy();
    }
  });

  it('keeps generated runtime region art no larger than source art', () => {
    const sourceRoot = join(process.cwd(), 'assets-source/region-art');
    const optimizedRoot = join(process.cwd(), 'public/assets/region-art/optimized');
    const sourceBytes = directoryFiles(sourceRoot).reduce((sum, file) => sum + statSync(file).size, 0);
    const optimizedBytes = directoryFiles(optimizedRoot).reduce((sum, file) => sum + statSync(file).size, 0);

    expect(optimizedBytes).toBeLessThan(sourceBytes);
  });

  it('keeps RegionHub from hard-coding public region-art paths', () => {
    const regionHubSource = readFileSync(join(process.cwd(), 'src/components/world/RegionHub.tsx'), 'utf8');

    expect(regionHubSource).not.toContain('/assets/region-art/');
    expect(regionHubSource).toContain('getRegionHubAsset');
  });

  it('does not ship source, draft, or original region art outside the optimized runtime folder', () => {
    const publicRegionRoot = join(process.cwd(), 'public/assets/region-art');
    const publicFiles = directoryFiles(publicRegionRoot).map((file) => relative(publicRegionRoot, file));
    const misplacedPngs = publicFiles.filter((file) => file.endsWith('.png') && !file.startsWith('optimized/'));
    const sourceNamedPublicFiles = publicFiles.filter((file) => /(?:source|original|draft)/i.test(file));

    expect(misplacedPngs).toEqual([]);
    expect(sourceNamedPublicFiles).toEqual([]);
  });
});
