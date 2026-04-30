import { describe, expect, it } from 'vitest';
import type { Attempt, NormalizedQuestion } from '../types';
import { deriveAvatarGear } from '../lib/avatarGear';
import { calculateRegionProgress, calculateRegionRank } from '../lib/regionProgress';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const algebra = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Algebra Forge')!;
const trig = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Trig Observatory')!;
const complex = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Complex Harbor')!;

function question(id: string, topic: string): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: topic,
    deepseek: { hasError: false, topic },
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

function attempt(id: string, questionId: string, scoreRatio: number, regionName = 'Algebra Forge'): Attempt {
  return {
    id,
    profileId: 'p1',
    questionId,
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    marksEarned: scoreRatio * 10,
    marksAvailable: 10,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 60,
    markSchemeRevealed: true,
    attemptedAt: new Date().toISOString(),
    worldName: 'P3 Astral Academy',
    regionName,
  };
}

describe('region progress and gear', () => {
  it('calculates restoration rank from real attempts', () => {
    const questions = [question('q1', 'Algebra')];
    const attempts = [attempt('a1', 'q1', 0.7), attempt('a2', 'q1', 0.6), attempt('a3', 'q1', 0.8)];
    const progress = calculateRegionProgress(algebra, questions, attempts);

    expect(progress.attempts).toBe(3);
    expect(progress.rank).toBe('Bronze');
    expect(progress.averageScoreRatio).toBeCloseTo(0.7);
  });

  it('keeps mastered locked without mixed review', () => {
    expect(calculateRegionRank({ activeByDefault: true, availableQuestions: 2, attempts: 16, averageScoreRatio: 0.95, recentScoreRatio: 0.95 })).toBe('Gold');
  });

  it('derives avatar gear from region progress', () => {
    const base = { availableQuestions: 1, attempts: 7, totalMarksEarned: 49, totalMarksAvailable: 70, recentScoreRatio: 0.7, averageScoreRatio: 0.7, subtopicsTouched: 2, isActive: true } as const;
    const gear = deriveAvatarGear([
      { ...base, region: algebra, rank: 'Silver' },
      { ...base, region: trig, rank: 'Silver' },
      { ...base, region: complex, rank: 'Discovered' },
    ]);

    expect(gear.gear).toContain('Forge Gauntlets');
    expect(gear.gear).toContain('Star Lens');
    expect(gear.title).toBe('Region Specialist');
  });
});
