import { ArrowLeft, Sparkles } from 'lucide-react';
import type { RegionProgress } from '../../../types';
import type { RegionTheme } from '../../../lib/regionThemes';
import { getAstralRegionAsset } from '../../../lib/astralAssets';

interface RegionHeroProps {
  regionProgress: RegionProgress;
  theme: RegionTheme;
  stateLabel: string;
  onReturnToMap: () => void;
}

export function RegionHero({ regionProgress, theme, stateLabel, onReturnToMap }: RegionHeroProps) {
  const regionImage = getAstralRegionAsset(regionProgress.region.id);

  return (
    <header className="region-hero">
      <div className="region-hero-copy">
        <span className="mode-pill">Region learning loop</span>
        <div className="region-hero-title-row">
          <span className="region-hero-monogram" aria-hidden="true">{theme.icon}</span>
          <div>
            <h2 id="region-hub-title">{theme.title}</h2>
            <p>{theme.subtitle}</p>
          </div>
        </div>
        <div className="region-atmosphere">
          <Sparkles size={18} />
          <span>{theme.atmosphere}</span>
        </div>
        <strong className="region-state-chip">{stateLabel}</strong>
      </div>
      <div className="region-hero-art">
        {regionImage ? <img src={regionImage} alt="" aria-hidden="true" /> : null}
      </div>
      <button className="region-return-button" type="button" onClick={onReturnToMap}>
        <ArrowLeft size={18} />
        Return to map
      </button>
    </header>
  );
}
