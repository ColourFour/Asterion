import type { NormalizedQuestion, RegionDefinition, RegionProgress } from '../types';
import { calculateAcademySummary } from './academyProgress';
import { matchRegionForQuestion } from './worldMap';

export type AvatarLocationSource = 'selected' | 'adaptive-question' | 'recommended' | 'first-active' | 'none';

export interface AvatarLocation {
  source: AvatarLocationSource;
  region?: RegionDefinition;
  regionProgress?: RegionProgress;
  label: string;
}

export interface AvatarLocationContext {
  progress: RegionProgress[];
  selectedRegion?: RegionDefinition;
  currentQuestion?: NormalizedQuestion;
}

function locationForRegion(
  source: AvatarLocationSource,
  region: RegionDefinition | undefined,
  progress: RegionProgress[],
): AvatarLocation | undefined {
  if (!region) return undefined;
  const regionProgress = progress.find((item) => item.region.id === region.id);
  if (!regionProgress) return undefined;

  return {
    source,
    region,
    regionProgress,
    label: source === 'selected'
      ? 'Current focus'
      : source === 'adaptive-question'
        ? 'Current question'
        : source === 'recommended'
          ? 'Recommended focus'
          : 'Open wing',
  };
}

export function determineAvatarLocation({ progress, selectedRegion, currentQuestion }: AvatarLocationContext): AvatarLocation {
  const selected = locationForRegion('selected', selectedRegion, progress);
  if (selected) return selected;

  const questionRegion = currentQuestion ? matchRegionForQuestion(currentQuestion) : undefined;
  const adaptive = locationForRegion('adaptive-question', questionRegion, progress);
  if (adaptive) return adaptive;

  const summary = calculateAcademySummary(progress);
  const recommendedProgress = summary.recommendedRegionName
    ? progress.find((item) => item.region.name === summary.recommendedRegionName)
    : undefined;
  const recommended = locationForRegion('recommended', recommendedProgress?.region, progress);
  if (recommended) return recommended;

  const firstActive = progress.find((item) => item.isActive && item.availableQuestions > 0);
  const fallback = locationForRegion('first-active', firstActive?.region, progress);
  if (fallback) return fallback;

  return {
    source: 'none',
    label: 'No open wing',
  };
}
