import { describe, expect, it } from 'vitest';
import type { NormalizedQuestion, RegionProgress, RegionRank } from '../types';
import { determineAvatarLocation } from '../lib/avatarLocation';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function regionProgress(regionId: string, rank: RegionRank, attempts = 0, availableQuestions = 4): RegionProgress {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId);
  if (!region) throw new Error(`Missing region ${regionId}`);

  return {
    region,
    availableQuestions,
    attempts,
    totalMarksEarned: attempts * 4,
    totalMarksAvailable: attempts * 8,
    averageScoreRatio: attempts > 0 ? 0.5 : undefined,
    recentScoreRatio: attempts > 0 ? 0.5 : undefined,
    subtopicsTouched: attempts > 0 ? 1 : 0,
    rank,
    isActive: true,
  };
}

function question(topic: string, subtopic?: string): NormalizedQuestion {
  return {
    id: `${topic}-${subtopic ?? 'mixed'}`,
    paperFamily: 'p3',
    displayTopic: topic,
    displaySubtopic: subtopic,
    deepseek: { hasError: false, topic, subtopic },
    questionImageRawPaths: [],
    markSchemeImageRawPaths: [],
    questionImagePaths: [],
    markSchemeImagePaths: [],
    questionImageUrls: [],
    markSchemeImageUrls: [],
    questionImageCandidates: [],
    markSchemeImageCandidates: [],
    raw: { local: {} },
  };
}

function routedQuestion(regionId: string, topic: string, subtopic?: string): NormalizedQuestion {
  const base = question(topic, subtopic);
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId)!;
  return {
    ...base,
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: region.id,
      regionName: region.name,
      validatedRegionId: region.id,
      validatedRegionName: region.name,
      displayRegionId: region.id,
      displayRegionName: region.name,
      reasonCodes: ['validated-topic-routing'],
    },
  };
}

describe('avatar location helper', () => {
  it('prefers the selected region over the recommended region', () => {
    const progress = [
      regionProgress('algebra-forge', 'Discovered', 0),
      regionProgress('trig-observatory', 'Bronze', 3),
    ];
    const selectedRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'trig-observatory');
    const location = determineAvatarLocation({ progress, selectedRegion });

    expect(location.source).toBe('selected');
    expect(location.region?.id).toBe('trig-observatory');
  });

  it('uses adaptive question region context when no region is selected', () => {
    const progress = [
      regionProgress('algebra-forge', 'Discovered', 0),
      regionProgress('trig-observatory', 'Discovered', 0),
    ];
    const location = determineAvatarLocation({
      progress,
      currentQuestion: routedQuestion('trig-observatory', 'Unclassified', 'trigonometric identities'),
    });

    expect(location.source).toBe('adaptive-question');
    expect(location.region?.id).toBe('trig-observatory');
  });

  it('falls back to the recommended trainable region from progress', () => {
    const progress = [
      regionProgress('integration-gardens', 'Gold', 7),
      regionProgress('algebra-forge', 'Discovered', 1),
      regionProgress('complex-harbor', 'Bronze', 3),
    ];
    const location = determineAvatarLocation({ progress });

    expect(location.source).toBe('recommended');
    expect(location.region?.id).toBe('algebra-forge');
  });

  it('returns an inert location when no regions are available', () => {
    const location = determineAvatarLocation({ progress: [] });

    expect(location.source).toBe('none');
    expect(location.region).toBeUndefined();
  });
});
