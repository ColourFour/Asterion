import type { CSSProperties, ReactNode } from 'react';
import type { RegionTheme } from '../../../lib/regionThemes';
import { getRegionThemeClass } from '../../../lib/regionThemes';
import type { RegionLearningSummary } from '../../../lib/regionLearning';

interface RegionLearningLayoutProps {
  theme: RegionTheme;
  summary: RegionLearningSummary;
  children: ReactNode;
}

type RegionCssProperties = CSSProperties & Record<`--${string}`, string>;

function regionStyle(theme: RegionTheme): RegionCssProperties {
  const { colors } = theme;
  return {
    '--region-background': colors.background,
    '--region-panel': colors.panel,
    '--region-panel-strong': colors.panelStrong,
    '--region-panel-border': colors.panelBorder,
    '--region-heading': colors.headingText,
    '--region-body': colors.bodyText,
    '--region-muted': colors.mutedText,
    '--region-accent': colors.accent,
    '--region-accent-dark': colors.accentText,
    '--region-accent-soft': colors.accentSoft,
    '--region-button-bg': colors.buttonBackground,
    '--region-button-text': colors.buttonText,
    '--region-button-border': colors.buttonBorder,
    '--region-badge-bg': colors.badgeBackground,
    '--region-badge-text': colors.badgeText,
    '--region-focus-ring': colors.focusRing,
    '--region-wash': `color-mix(in srgb, ${colors.accent} 13%, transparent)`,
    '--region-wash-strong': `color-mix(in srgb, ${colors.accent} 20%, transparent)`,
  };
}

export function RegionLearningLayout({ theme, summary, children }: RegionLearningLayoutProps) {
  return (
    <section
      className={`region-hub region-learning-layout ${getRegionThemeClass(theme)} learning-${summary.visualTreatment}`}
      style={regionStyle(theme)}
      aria-labelledby="region-hub-title"
    >
      {children}
    </section>
  );
}
