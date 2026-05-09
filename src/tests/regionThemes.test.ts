import { describe, expect, it } from 'vitest';
import { getRegionTheme, listRegionThemes, topicAliasesForRegion } from '../lib/regionThemes';
import type { RegionThemeColors } from '../lib/regionThemes';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const REQUIRED_COLOR_FIELDS: (keyof RegionThemeColors)[] = [
  'background',
  'panel',
  'panelStrong',
  'panelBorder',
  'headingText',
  'bodyText',
  'mutedText',
  'accent',
  'accentText',
  'accentSoft',
  'buttonBackground',
  'buttonText',
  'buttonBorder',
  'badgeBackground',
  'badgeText',
  'focusRing',
];

function hexToRgb(hexColor: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hexColor.trim());
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${hexColor}".`);
  }

  const value = Number.parseInt(match[1], 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function relativeLuminance(hexColor: string): number {
  const convertChannel = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const [red, green, blue] = hexToRgb(hexColor).map(convertChannel) as [number, number, number];

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('region theme lookup', () => {
  it('returns authored theme metadata for the Logarithm Observatory region', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const theme = getRegionTheme(logRegion!);

    expect(theme.regionId).toBe('logarithm-grove');
    expect(theme.title).toBe('Logarithm Observatory');
    expect(theme.topic).toBe('logarithms_and_exponentials');
    expect(theme.topicAliases).toContain('logs');
    expect(theme.snippetTopics).toContain('logarithms_and_exponentials');
    expect(theme.generatedPracticeTopics).toContain('logarithms_and_exponentials');
    expect(theme.accent).toBe('observatory');
    expect(theme.guideMessage).toContain('check every domain restriction');
  });

  it('accepts topic aliases without adding new world-map regions', () => {
    expect(getRegionTheme('logarithms_and_exponentials').regionId).toBe('logarithm-grove');
    expect(getRegionTheme('Logarithms and Exponentials').regionId).toBe('logarithm-grove');
    expect(getRegionTheme('algebra/functions').regionId).toBe('algebra-forge');
    expect(getRegionTheme('integration').regionId).toBe('integration-gardens');
    expect(getRegionTheme('trig').regionId).toBe('trig-observatory');
    expect(getRegionTheme('complex numbers').regionId).toBe('complex-harbor');
    expect(getRegionTheme('vector').regionId).toBe('vector-workshop');
    expect(getRegionTheme('differential equations').regionId).toBe('differential-shrine');
  });

  it('covers every current P3 region with a theme', () => {
    const themes = listRegionThemes();

    expect(themes.map((theme) => theme.regionId).sort()).toEqual(P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort());
    expect(themes.every((theme) => theme.title && theme.subtitle && theme.masteryQuote)).toBe(true);
    expect(themes.every((theme) => theme.paperFamily === 'p3' && theme.topic && theme.topicAliases.length && theme.snippetTopics.length)).toBe(true);
  });

  it('exposes linked snippet and generated-practice topics separately', () => {
    expect(topicAliasesForRegion('logarithm-grove', 'practice')).toContain('logarithms_and_exponentials');
    expect(topicAliasesForRegion('algebra-forge', 'practice')).toContain('binomial_expansion');
    expect(topicAliasesForRegion('integration-gardens', 'snippets')).toContain('partial_fractions');
    expect(topicAliasesForRegion('numerical-mines', 'practice')).toContain('iteration');
  });

  it('defines readable surface, button, and badge tokens for every active region', () => {
    for (const theme of listRegionThemes()) {
      for (const field of REQUIRED_COLOR_FIELDS) {
        expect(theme.colors[field], `${theme.regionId} missing ${field}`).toMatch(/^#[0-9a-f]{6}$/i);
      }

      expect(contrastRatio(theme.colors.headingText, theme.colors.panel), `${theme.regionId} heading text`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(theme.colors.bodyText, theme.colors.panel), `${theme.regionId} body text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.mutedText, theme.colors.panel), `${theme.regionId} muted text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.buttonText, theme.colors.buttonBackground), `${theme.regionId} button text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.badgeText, theme.colors.badgeBackground), `${theme.regionId} badge text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.accentText, theme.colors.accentSoft), `${theme.regionId} accent text on soft accent`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
