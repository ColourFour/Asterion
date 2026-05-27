import { describe, expect, it } from 'vitest';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { buildExamTrainingRewardGoals, buildExamTrainingTopicMastery, EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS } from '../lib/examTrainingDashboard';
import { emptyProgress } from '../lib/progressStore';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { Attempt, NormalizedQuestion, RegionProgress } from '../types';

function question(skillId: string): NormalizedQuestion {
  return {
    id: 'q_binomial_validity',
    paperFamily: 'p3',
    paper: '31summer24',
    questionNumber: '1',
    displayTopic: 'Algebra',
    displaySubtopic: 'binomial expansion',
    marksAvailable: 5,
    deepseek: { hasError: false, topic: 'Algebra', subtopic: 'binomial expansion' },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      validatedRegionId: 'algebra-forge',
      displayRegionId: 'algebra-forge',
      primaryTopicId: skillId,
      reasonCodes: [],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: [] },
      practiceEligible: { eligible: true, reasonCodes: [] },
      masteryEligible: { eligible: true, reasonCodes: [] },
      guardianEligible: { eligible: true, reasonCodes: [] },
      generationEligible: { eligible: true, reasonCodes: [] },
      textOnlyEligible: { eligible: false, reasonCodes: [] },
    },
    questionImageRawPaths: ['p3/31summer24/questions/q01.png'],
    markSchemeImageRawPaths: ['p3/31summer24/mark_scheme/q01.png'],
    questionImagePaths: ['p3/31summer24/questions/q01.png'],
    markSchemeImagePaths: ['p3/31summer24/mark_scheme/q01.png'],
    questionImageUrls: ['/assets/exam-bank-data/p3/31summer24/questions/q01.png'],
    markSchemeImageUrls: ['/assets/exam-bank-data/p3/31summer24/mark_scheme/q01.png'],
    questionImageCandidates: [['/assets/exam-bank-data/p3/31summer24/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/exam-bank-data/p3/31summer24/mark_scheme/q01.png']],
    raw: { local: {} },
  };
}

function attempt(): Attempt {
  return {
    id: 'attempt_1',
    profileId: 'profile_1',
    questionId: 'q_binomial_validity',
    paperFamily: 'p3',
    paper: '31summer24',
    questionNumber: '1',
    topicDisplayName: 'Algebra',
    subtopic: 'binomial expansion',
    marksEarned: 4,
    marksAvailable: 5,
    scoreRatio: 0.8,
    mistakeTypes: ['algebra_error'],
    timeSpentSeconds: 300,
    markSchemeRevealed: true,
    attemptedAt: '2026-05-25T00:00:00.000Z',
    masteryEligible: true,
    masteryEvidenceReadiness: 'precise_skill_evidence',
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
  };
}

describe('Exam Training dashboard data', () => {
  it('uses field-guide skill names and avoids fake mastery when there is no evidence', () => {
    const topics = buildExamTrainingTopicMastery({
      progress: emptyProgress(),
      questions: [],
    });

    expect(topics.map((topic) => topic.name)).toContain('Binomial Expansions');
    expect(topics.map((topic) => topic.name)).toContain('Scalar Product');
    expect(topics.every((topic) => topic.status === 'not_tried')).toBe(true);
    expect(topics.every((topic) => topic.evidenceLabel === 'Try a question first')).toBe(true);
  });

  it('keeps Topic Mastery aligned to the approved Field Guide topic contracts', () => {
    const topics = buildExamTrainingTopicMastery({
      progress: emptyProgress(),
      questions: [],
    });
    const fieldGuideTopicNames = Object.values(FIELD_GUIDE_TOPICS_BY_REGION)
      .flatMap((regionTopics) => regionTopics.map((topic) => topic.title));

    expect(topics.map((topic) => topic.name)).toEqual(fieldGuideTopicNames);
    expect(topics.map((topic) => topic.skillId)).toEqual(EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS.map((topic) => topic.skillId));
  });

  it('projects topic status only from clean exam-practice evidence', () => {
    const progress = {
      ...emptyProgress(),
      attempts: [attempt()],
    };
    const topics = buildExamTrainingTopicMastery({
      progress,
      questions: [question('algebra.binomial_validity_range')],
    });

    const binomialExpansion = topics.find((topic) => topic.skillId === 'algebra_binomial_expansion');
    const modulus = topics.find((topic) => topic.skillId === 'algebra_modulus_graph_equations');

    expect(binomialExpansion).toMatchObject({
      name: 'Binomial Expansions',
      status: 'strong',
      scorePercent: 80,
      evidenceLabel: 'Recent saved practice',
    });
    expect(modulus).toMatchObject({
      status: 'not_tried',
      scorePercent: undefined,
    });
  });

  it('keeps reward goals derived from saved progress without persisting inventory rewards', () => {
    const progress = {
      ...emptyProgress(),
      attempts: [attempt()],
    };
    const worldProgress: RegionProgress[] = P3_ASTRAL_ACADEMY.regions.map((region) => ({
      region,
      availableQuestions: 1,
      attempts: region.id === 'algebra-forge' ? 1 : 0,
      totalMarksEarned: region.id === 'algebra-forge' ? 4 : 0,
      totalMarksAvailable: region.id === 'algebra-forge' ? 5 : 0,
      averageScoreRatio: region.id === 'algebra-forge' ? 0.8 : undefined,
      subtopicsTouched: 0,
      rank: region.id === 'algebra-forge' ? 'Discovered' : 'Dormant',
      isActive: true,
    }));
    const topicMastery = buildExamTrainingTopicMastery({ progress, questions: [question('algebra.binomial_validity_range')] });

    expect(buildExamTrainingRewardGoals({ progress, topicMastery, worldProgress })).toEqual([
      expect.objectContaining({ id: 'smurf-hat', current: 1, target: 40 }),
      expect.objectContaining({ id: 'golden-notes', current: 1, target: 5 }),
      expect.objectContaining({ id: 'asterion-gem', current: 1, target: 100 }),
    ]);
  });
});
