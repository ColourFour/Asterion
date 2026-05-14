import { describe, expect, it } from 'vitest';
import { explainNonMasteryEvidence, getNonMasteryEvidenceReports, toMasteryEvidence } from '../lib/masteryEvidence';
import type { Attempt, NormalizedQuestion, QuestionRouteEvidence } from '../types';

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'attempt-1',
    profileId: 'profile-1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    subtopic: 'polynomials',
    marksEarned: 8,
    marksAvailable: 10,
    scoreRatio: 0.8,
    mistakeType: 'algebra_error',
    mistakeTypes: ['algebra_error'],
    timeSpentSeconds: 180,
    markSchemeRevealed: true,
    attemptedAt: '2026-05-08T00:00:00.000Z',
    masteryEligible: true,
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
    ...overrides,
  };
}

function routeEvidence(overrides: Partial<QuestionRouteEvidence> = {}): QuestionRouteEvidence {
  return {
    status: 'clean',
    source: 'topic-routing',
    regionId: 'algebra-forge',
    regionName: 'Algebra Forge',
    validatedRegionId: 'algebra-forge',
    validatedRegionName: 'Algebra Forge',
    displayRegionId: 'algebra-forge',
    displayRegionName: 'Algebra Forge',
    reasonCodes: ['validated-topic-routing'],
    ...overrides,
  };
}

function question(overrides: Partial<NormalizedQuestion> = {}): NormalizedQuestion {
  return {
    id: 'q1',
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    displaySubtopic: 'polynomials',
    deepseek: { hasError: false, topic: 'Algebra', subtopic: 'polynomials' },
    routeEvidence: routeEvidence(),
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      guardianEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      generationEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['missing-question-or-mark-scheme-text'] },
    },
    questionImageRawPaths: ['p3/test/questions/q01.png'],
    markSchemeImageRawPaths: ['p3/test/mark_scheme/q01.png'],
    questionImagePaths: ['p3/test/questions/q01.png'],
    markSchemeImagePaths: ['p3/test/mark_scheme/q01.png'],
    questionImageUrls: ['/assets/test/questions/q01.png'],
    markSchemeImageUrls: ['/assets/test/mark_scheme/q01.png'],
    questionImageCandidates: [['/assets/test/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/test/mark_scheme/q01.png']],
    raw: { local: {} },
    ...overrides,
  };
}

describe('mastery evidence adapter', () => {
  it('accepts clean P3 core evidence with a validated route', () => {
    const evidence = toMasteryEvidence({ attempt: attempt(), question: question() });

    expect(evidence).toMatchObject({
      topic: 'Algebra',
      validatedRegionId: 'algebra-forge',
      scoreRatio: 0.8,
      marksEarned: 8,
      marksAvailable: 10,
    });
  });

  it('rejects ambiguous multi-topic routes for precise mastery', () => {
    const ambiguousQuestion = question({
      routeEvidence: routeEvidence({
        status: 'ambiguous-route',
        validatedRegionId: undefined,
        candidateRegionIds: ['algebra-forge', 'trig-observatory'],
        reasonCodes: ['multiple-p3-candidate-regions'],
      }),
      topicRouting: {
        primaryTopicId: '9709_p3_topic_algebra',
        topicDistribution: [
          { topicId: '9709_p3_topic_algebra', mappedRegionId: 'algebra-forge', fitPercent: 50 },
          { topicId: '9709_p3_topic_trigonometry', mappedRegionId: 'trig-observatory', fitPercent: 50 },
        ],
      },
      eligibility: {
        ...question().eligibility!,
        masteryEligible: { eligible: false, reasonCodes: ['blocked-ambiguous-route'] },
      },
    });

    expect(toMasteryEvidence({ attempt: attempt(), question: ambiguousQuestion })).toBeUndefined();
    expect(explainNonMasteryEvidence({ attempt: attempt(), question: ambiguousQuestion })).toEqual(
      expect.arrayContaining(['ambiguous-route', 'ambiguous-without-part-mapping', 'mastery-ineligible']),
    );
  });

  it('keeps multi-part questions without reviewed part mapping out of precise mastery', () => {
    const multiPartQuestion = question({
      parts: [
        { label: '(a)', marksAvailable: 6 },
        { label: '(b)', marksAvailable: 4 },
      ],
    });

    expect(toMasteryEvidence({ attempt: attempt(), question: multiPartQuestion })).toBeUndefined();
    expect(explainNonMasteryEvidence({ attempt: attempt(), question: multiPartQuestion })).toContain('insufficient-part-mapping');
  });

  it('rejects known multi-topic whole-question attempts without reviewed part mapping', () => {
    const multiTopicQuestion = question({
      topicRouting: {
        primaryTopicId: '9709_p3_topic_algebra',
        topicDistribution: [
          { topicId: '9709_p3_topic_algebra', mappedRegionId: 'algebra-forge', fitPercent: 60 },
          { topicId: '9709_p3_topic_integration', mappedRegionId: 'integration-gardens', fitPercent: 40 },
        ],
      },
    });

    expect(toMasteryEvidence({ attempt: attempt(), question: multiTopicQuestion })).toBeUndefined();
    expect(explainNonMasteryEvidence({ attempt: attempt(), question: multiTopicQuestion })).toContain('broad-region-evidence-only');
  });

  it('preserves reviewed part and subpart metadata in precise evidence', () => {
    const reviewedPartQuestion = question({
      topicRouting: {
        primaryTopicId: '9709_p3_topic_algebra',
        topicDistribution: [
          { topicId: '9709_p3_topic_algebra', mappedRegionId: 'algebra-forge', fitPercent: 60 },
          { topicId: '9709_p3_topic_integration', mappedRegionId: 'integration-gardens', fitPercent: 40 },
        ],
      },
      parts: [
        {
          partId: 'part-a',
          subpartId: 'q1_a',
          label: '(a)',
          marksAvailable: 6,
          primaryTopicId: '9709_p3_topic_algebra',
          skillRef: 'p3_alg_structure_rearrangement',
          mappedRegionId: 'algebra-forge',
          routeEvidenceStatus: 'clean',
          mappingReviewed: true,
          reviewStatus: 'teacher_reviewed',
        },
        {
          partId: 'part-b',
          subpartId: 'q1_b',
          label: '(b)',
          marksAvailable: 4,
          primaryTopicId: '9709_p3_topic_algebra',
          skillRef: 'p3_alg_structure_rearrangement',
          mappedRegionId: 'algebra-forge',
          routeEvidenceStatus: 'clean',
          mappingReviewed: true,
          reviewStatus: 'teacher_reviewed',
        },
      ],
    });
    const reviewedAttempt = attempt({
      partScores: [
        { label: '(a)', marksEarned: 5, marksAvailable: 6 },
        { label: '(b)', marksEarned: 4, marksAvailable: 4 },
      ],
      marksEarned: 9,
      marksAvailable: 10,
      scoreRatio: 0.9,
    });

    expect(toMasteryEvidence({ attempt: reviewedAttempt, question: reviewedPartQuestion })).toMatchObject({
      partEvidence: [
        {
          partId: 'part-a',
          subpartId: 'q1_a',
          label: '(a)',
          marksEarned: 5,
          marksAvailable: 6,
          primaryTopicId: '9709_p3_topic_algebra',
          skillRef: 'p3_alg_structure_rearrangement',
          mappedRegionId: 'algebra-forge',
          mappingReviewed: true,
        },
        {
          partId: 'part-b',
          subpartId: 'q1_b',
          label: '(b)',
          marksEarned: 4,
          marksAvailable: 4,
          primaryTopicId: '9709_p3_topic_algebra',
          skillRef: 'p3_alg_structure_rearrangement',
          mappedRegionId: 'algebra-forge',
          mappingReviewed: true,
        },
      ],
    });
  });

  it.each([
    ['fallback-display-only'],
    ['missing-route'],
    ['ambiguous-route'],
    ['review-only'],
    ['prerequisite-only'],
    ['not-P3'],
    ['hard-failure'],
  ] as const)('rejects %s routes', (status) => {
    const unsafeQuestion = question({
      routeEvidence: routeEvidence({
        status,
        validatedRegionId: undefined,
      }),
      eligibility: {
        ...question().eligibility!,
        masteryEligible: { eligible: false, reasonCodes: [`blocked-${status}`] },
      },
    });

    expect(toMasteryEvidence({ attempt: attempt(), question: unsafeQuestion })).toBeUndefined();
    expect(explainNonMasteryEvidence({ attempt: attempt(), question: unsafeQuestion })).toContain(
      status === 'not-P3' ? 'not-p3' : status,
    );
  });

  it('rejects saved attempts that only have display-region labels', () => {
    const displayOnlyAttempt = attempt({
      masteryEligible: undefined,
      validatedRegionId: undefined,
      displayRegionId: 'algebra-forge',
      regionName: 'Algebra Forge',
    });

    expect(toMasteryEvidence({ attempt: displayOnlyAttempt })).toBeUndefined();
    expect(explainNonMasteryEvidence({ attempt: displayOnlyAttempt })).toContain('missing-route');
  });

  it('reports unsafe attempts as non-mastery evidence', () => {
    const reports = getNonMasteryEvidenceReports({
      attempts: [
        attempt({ id: 'safe' }),
        attempt({ id: 'unsafe', masteryEligible: false }),
      ],
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].attempt.id).toBe('unsafe');
    expect(reports[0].reasons).toContain('mastery-ineligible');
  });
});
