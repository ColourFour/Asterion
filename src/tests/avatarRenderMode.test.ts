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
    expect(avatarLayerAssetCandidates(item('academy-student-base'), 'map')).toEqual([
      '/assets/avatar/base/academy-student-base.png',
      '/assets/ui/astral/optimized/avatar-student-map-512.png',
    ]);
    expect(avatarLayerAssetCandidates(item('practical-crop'), 'map')).toEqual([
      '/assets/avatar/hair/practical-crop.png',
    ]);
    expect(avatarLayerAssetCandidates(item('academy-student-base'), 'region')).toEqual([
      '/assets/avatar/base/academy-student-base.png',
      '/assets/ui/astral/optimized/avatar-student-front-512.png',
    ]);
  });
});
