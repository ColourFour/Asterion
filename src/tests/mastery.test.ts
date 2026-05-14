import { describe, expect, it } from 'vitest';
import { rankFromMastery, updateTopicProfile } from '../lib/mastery';
import { toMasteryEvidence } from '../lib/masteryEvidence';
import type { Attempt, NormalizedQuestion, TopicProfile } from '../types';

function attempt(scoreRatio: number, difficulty = 'foundation', questionId = 'q1', subtopic = 'polynomials'): Attempt {
  return {
    id: crypto.randomUUID(),
    profileId: 'p1',
    questionId,
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    subtopic,
    difficulty,
    marksEarned: scoreRatio * 10,
    marksAvailable: 10,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: new Date().toISOString(),
    masteryEligible: true,
    validatedRegionId: 'algebra-forge',
  };
}

function question(id = 'q1', subtopic = 'polynomials'): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    displaySubtopic: subtopic,
    localSubtopic: subtopic,
    deepseek: { hasError: false, topic: 'Algebra', subtopic },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: 'algebra-forge',
      regionName: 'Algebra Forge',
      validatedRegionId: 'algebra-forge',
      validatedRegionName: 'Algebra Forge',
      displayRegionId: 'algebra-forge',
      displayRegionName: 'Algebra Forge',
      reasonCodes: ['validated-topic-routing'],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      guardianEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      generationEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['missing-question-or-mark-scheme-text'] },
    },
    questionImageRawPaths: [`p3/test/questions/${id}.png`],
    markSchemeImageRawPaths: [`p3/test/mark_scheme/${id}.png`],
    questionImagePaths: [`p3/test/questions/${id}.png`],
    markSchemeImagePaths: [`p3/test/mark_scheme/${id}.png`],
    questionImageUrls: [`/assets/test/questions/${id}.png`],
    markSchemeImageUrls: [`/assets/test/mark_scheme/${id}.png`],
    questionImageCandidates: [[`/assets/test/questions/${id}.png`]],
    markSchemeImageCandidates: [[`/assets/test/mark_scheme/${id}.png`]],
    raw: { local: {} },
  };
}

function evidence(scoreRatio: number, difficulty = 'foundation', questionId = 'q1', subtopic = 'polynomials') {
  return toMasteryEvidence({
    attempt: attempt(scoreRatio, difficulty, questionId, subtopic),
    question: question(questionId, subtopic),
  })!;
}

function buildProfile(sequence: ReturnType<typeof evidence>[]): TopicProfile {
  const profile = sequence.reduce<TopicProfile | undefined>(
    (current, item) => updateTopicProfile(current, item),
    undefined,
  );
  if (!profile) throw new Error('Expected topic profile');
  return profile;
}

describe('mastery', () => {
  it('updates topic profile from attempts', () => {
    const profile = updateTopicProfile(undefined, evidence(0.8));
    expect(profile.attempts).toBe(1);
    expect(profile.masteryScore).toBeGreaterThan(0.7);
  });

  it('requires enough attempts for higher ranks', () => {
    expect(rankFromMastery(0.95, 1)).toBe('none');
    expect(rankFromMastery(0.8, 6)).toBe('gold');
    expect(rankFromMastery(0.95, 8)).toBe('gold');
  });

  it('keeps topic mastery unchanged when only difficulty metadata changes', () => {
    const base = updateTopicProfile(undefined, evidence(0.8, 'foundation'));
    const changedDifficulty = updateTopicProfile(undefined, evidence(0.8, 'challenge'));

    expect(changedDifficulty).toMatchObject({
      attempts: base.attempts,
      totalMarksEarned: base.totalMarksEarned,
      totalMarksAvailable: base.totalMarksAvailable,
      recentRatios: base.recentRatios,
      masteryScore: base.masteryScore,
      rank: base.rank,
    });
  });

  it('does not reach mastery from repeated attempts on one question', () => {
    const profile = buildProfile(Array.from({ length: 8 }, () => evidence(1, 'foundation', 'q1', 'polynomials')));

    expect(profile.rank).toBe('gold');
    expect(profile.masteryScore).toBe(1);
    expect(profile.distinctQuestionIds).toEqual(['q1']);
    expect(profile.masteryReasonCodes).toContain('insufficient_distinct_questions');
  });

  it('allows clean distinct question and target coverage to reach mastery', () => {
    const sequence = Array.from({ length: 8 }, (_item, index) => index % 2 === 0
      ? evidence(1, 'foundation', 'q1', 'polynomials')
      : evidence(1, 'foundation', 'q2', 'partial fractions'));
    const profile = buildProfile(sequence);

    expect(profile.rank).toBe('mastery');
    expect(profile.distinctQuestionIds?.sort()).toEqual(['q1', 'q2']);
    expect(profile.distinctEvidenceTargets?.sort()).toEqual(['partial fractions', 'polynomials']);
  });

  it('does not treat legacy-compatible attempts as clean current skill mastery', () => {
    const legacyEvidence = toMasteryEvidence({ attempt: attempt(1, 'foundation', 'legacy-q', 'polynomials') })!;
    const profile = buildProfile(Array.from({ length: 8 }, () => legacyEvidence));

    expect(profile.masteryScore).toBe(1);
    expect(profile.rank).toBe('gold');
    expect(profile.masteryReasonCodes).toContain('mastery_evidence_missing');
  });
});
