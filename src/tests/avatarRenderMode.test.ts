import { describe, expect, it } from 'vitest';
import { findAvatarItem } from '../data/avatarCatalog';
import { avatarLayerAssetCandidates } from '../lib/avatarAssetMap';
import { avatarModeUsesFullCustomization, avatarSlotsForRenderMode } from '../lib/avatarRenderMode';

function item(id: string) {
  const found = findAvatarItem(id);
  if (!found) throw new Error(`Missing avatar item ${id}`);
  return found;
}

describe('avatar render modes', () => {
  it('keeps the builder as the full customization surface', () => {
    expect(avatarModeUsesFullCustomization('builder')).toBe(true);
    expect(avatarModeUsesFullCustomization('portrait')).toBe(true);
    expect(avatarModeUsesFullCustomization('map')).toBe(false);
    expect(avatarSlotsForRenderMode('builder')).toContain('frame');
    expect(avatarSlotsForRenderMode('map')).not.toContain('frame');
  });

  it('uses mode-specific asset candidates with safe generic fallbacks', () => {
    expect(avatarLayerAssetCandidates(item('student-body-a'), 'map')).toEqual([
      '/assets/avatar-v0.2/base/student-body-a.png',
      '/assets/ui/astral/optimized/avatar-student-map-512.png',
    ]);
    expect(avatarLayerAssetCandidates(item('tousled-short'), 'map')).toEqual([
      '/assets/avatar-v0.2/hair/tousled-short.png',
    ]);
    expect(avatarLayerAssetCandidates(item('student-body-a'), 'region')).toEqual([
      '/assets/avatar-v0.2/base/student-body-a.png',
      '/assets/ui/astral/optimized/avatar-student-front-512.png',
    ]);
  });
});
