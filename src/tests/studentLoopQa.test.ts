import { beforeEach, describe, expect, it } from 'vitest';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, RegionDefinition, StoredProgress, StudentProfile } from '../types';
import { canStudentUseRegionActivity, getStudentRegionAccess } from '../lib/classRegionAccess';
import { buildExportJson, buildAttemptsCsv } from '../lib/exportAttempts';
import { normalizeGeneratedPracticeData, reviewedGeneratedPractice, type GeneratedPracticeReviewStatus } from '../lib/generatedPractice';
import { buildRegionLearningSummary } from '../lib/regionLearning';
import { calculateRegionProgress, calculateWorldProgress } from '../lib/regionProgress';
import { emptyProgress, localProgressAdapter } from '../lib/progressStore';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;
const complexRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'complex-harbor')!;

function question(
  id: string,
  region: RegionDefinition = logRegion,
  subtopic = 'logarithmic equations',
  overrides: Partial<NormalizedQuestion> = {},
): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    paper: '31autumn21',
    questionNumber: id.replace(/\D/g, '') || '1',
    displayTopic: region.name,
    displaySubtopic: subtopic,
    localSubtopic: subtopic,
    marksAvailable: 6,
    deepseek: { hasError: false, topic: region.name, subtopic },
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
    ...overrides,
  };
}

function attempt(
  id: string,
  targetQuestion: NormalizedQuestion,
  scoreRatio = 0.8,
  subtopic = targetQuestion.displaySubtopic ?? 'P3 method',
): Attempt {
  const marksAvailable = targetQuestion.marksAvailable ?? 10;
  return {
    id,
    profileId: 'profile-student-loop',
    questionId: targetQuestion.id,
    paperFamily: 'p3',
    paper: targetQuestion.paper,
    questionNumber: targetQuestion.questionNumber,
    topicDisplayName: targetQuestion.displayTopic,
    subtopic,
    marksEarned: scoreRatio * marksAvailable,
    marksAvailable,
    scoreRatio,
    mistakeTypes: scoreRatio >= 1 ? [] : ['algebra_error'],
    fullScoreConfirmed: scoreRatio >= 1 ? true : undefined,
    note: scoreRatio >= 1 ? 'Checked every mark-scheme line.' : undefined,
    timeSpentSeconds: 180,
    markSchemeRevealed: true,
    attemptedAt: `2026-05-23T00:${id.replace(/\D/g, '').padStart(2, '0')}:00.000Z`,
    masteryEligible: true,
    guardianEligible: true,
    validatedRegionId: targetQuestion.routeEvidence?.validatedRegionId,
    displayRegionId: targetQuestion.routeEvidence?.displayRegionId,
    worldName: 'P3 Astral Academy',
    regionName: targetQuestion.routeEvidence?.validatedRegionName,
  };
}

function supportAttempt(
  id: string,
  activityType: LearningActivityAttempt['activityType'],
  outcome: LearningActivityAttempt['outcome'] = 'got_it',
  revealedEarly = false,
  region: RegionDefinition = logRegion,
): LearningActivityAttempt {
  return {
    id,
    profileId: 'profile-student-loop',
    regionId: region.id,
    regionName: region.name,
    activityType,
    activityId: activityType === 'warm_up' ? 'gen_log_guardian_prep_0001' : 'p3-log-laws-qc-001',
    sourceId: activityType === 'warm_up' ? 'p3-log-laws-001' : 'p3-log-laws-qc-001',
    topic: 'logarithms_and_exponentials',
    skillTargetId: 'p3_log_laws_equations',
    prompt: activityType === 'warm_up' ? 'Generated warm-up prompt.' : 'Quick Check prompt.',
    learnerResponse: 'Student method note.',
    revealedEarly,
    outcome,
    confidence: outcome === 'got_it' ? 5 : 2,
    createdAt: `2026-05-23T00:${id.replace(/\D/g, '').padStart(2, '0')}:00.000Z`,
    completedAt: `2026-05-23T00:${id.replace(/\D/g, '').padStart(2, '0')}:30.000Z`,
  };
}

function regionProgress(region: RegionDefinition, overrides = {}) {
  return {
    region,
    availableQuestions: 3,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered' as const,
    isActive: true,
    ...overrides,
  };
}

function claimedStudentProfile(): StudentProfile {
  return {
    id: 'profile-student-loop',
    realName: 'Ada Lovelace',
    classGroup: 'P3 Alpha',
    teacherName: 'Ms Hypatia',
    avatarName: 'Aster',
    classClaim: {
      status: 'claimed',
      classId: 'class-p3-alpha',
      className: 'P3 Alpha',
      classCode: 'AST-P3A',
      teacherId: 'teacher-hypatia',
      teacherName: 'Ms Hypatia',
      rosterStudentId: 'student-ada',
      displayName: 'Ada Lovelace',
      message: 'Roster slot claimed.',
    },
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
  };
}

function rawGeneratedPractice(reviewStatus: GeneratedPracticeReviewStatus, verificationStatus = 'pass') {
  return {
    practice_id: `practice-${reviewStatus}-${verificationStatus}`,
    generator_family: 'logarithms_and_exponentials.log_equation_basic',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    skill_target_id: 'p3_log_laws_equations',
    source_snippet_id: 'p3-log-laws-001',
    snippet_ids: ['p3-log-laws-001'],
    region_ids: [logRegion.id],
    prompt: 'Solve ln(x) = ln(4).',
    answer: 'x = 4',
    worked_solution: ['State x > 0.', 'Equal logs have equal arguments.'],
    parameters: { solution: 4 },
    sequence_role: 'guardian_prep',
    verification: { status: verificationStatus, method: 'deterministic', verifier: 'content_lab_schema_v2' },
    review_status: reviewStatus,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('student loop QA boundaries', () => {
  it('allows support work to guide recommendations without creating mastery or Guardian clearance', () => {
    const supportAttempts = [
      supportAttempt('support-1', 'quick_check'),
      supportAttempt('support-2', 'warm_up'),
      supportAttempt('support-3', 'warm_up'),
    ];
    const summary = buildRegionLearningSummary({
      regionProgress: regionProgress(logRegion),
      learningRecord: {
        regionId: logRegion.id,
        fieldGuideCompletedAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z',
      },
      regionQuestions: [
        question('q1', logRegion, 'logarithmic equations'),
        question('q2', logRegion, 'exponential equations'),
      ],
      regionAttempts: [],
      learningActivityAttempts: supportAttempts,
    });

    expect(summary.learningActivityReadiness).toMatchObject({
      attempts: 3,
      quickCheckAttempts: 1,
      warmUpAttempts: 2,
      gotIt: 3,
    });
    expect(summary.trainingSession.intent).toBe('core_practice');
    expect(summary.guardianEligibility.eligible).toBe(false);
    expect(summary.guardianEligibility.requirements.find((requirement) => requirement.id === 'skill_checklist')).toMatchObject({
      completed: false,
      detail: 'Complete each required Skill Check subtopic (0/6).',
    });
    expect(summary.state).toBe('field_guide_completed');
  });

  it('keeps legacy Guardian unlocks on clean canonical attempt evidence, not generated warm-ups', () => {
    const questions = [
      question('q1', complexRegion, 'modulus and argument'),
      question('q2', complexRegion, 'loci'),
      question('q3', complexRegion, 'modulus and argument', { marksAvailable: 8 }),
    ];
    const canonicalAttempts = [
      attempt('attempt-1', questions[0], 0.72, 'modulus and argument'),
      attempt('attempt-2', questions[1], 0.76, 'loci'),
      attempt('attempt-3', questions[2], 0.82, 'modulus and argument'),
    ];

    const supportOnlySummary = buildRegionLearningSummary({
      regionProgress: regionProgress(complexRegion),
      learningRecord: {
        regionId: complexRegion.id,
        fieldGuideCompletedAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z',
      },
      regionQuestions: questions,
      regionAttempts: [],
      learningActivityAttempts: [
        supportAttempt('support-1', 'warm_up', 'got_it', false, complexRegion),
        supportAttempt('support-2', 'warm_up', 'got_it', false, complexRegion),
        supportAttempt('support-3', 'warm_up', 'got_it', false, complexRegion),
      ],
    });
    const canonicalSummary = buildRegionLearningSummary({
      regionProgress: regionProgress(complexRegion, {
        attempts: canonicalAttempts.length,
        totalMarksEarned: 15.12,
        totalMarksAvailable: 20,
        averageScoreRatio: 0.756,
        recentScoreRatio: 0.756,
        subtopicsTouched: 2,
        rank: 'Bronze',
      }),
      learningRecord: {
        regionId: complexRegion.id,
        fieldGuideCompletedAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z',
      },
      regionQuestions: questions,
      regionAttempts: canonicalAttempts,
      learningActivityAttempts: [supportAttempt('support-4', 'warm_up', 'got_it', false, complexRegion)],
    });

    expect(supportOnlySummary.guardianEligibility.eligible).toBe(false);
    expect(supportOnlySummary.guardianEligibility.guardianQuestion?.id).toBe('q3');
    expect(canonicalSummary.guardianEligibility.eligible).toBe(true);
    expect(canonicalSummary.guardianEligibility.guardianQuestion?.id).toBe('q3');
    expect(canonicalSummary.state).toBe('guardian_unlocked');
  });

  it('keeps needs_review, candidate, blocked, and failed generated practice out of runtime student practice', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        rawGeneratedPractice('teacher_reviewed'),
        rawGeneratedPractice('published'),
        rawGeneratedPractice('needs_review'),
        rawGeneratedPractice('candidate'),
        rawGeneratedPractice('blocked'),
        rawGeneratedPractice('teacher_reviewed', 'fail'),
      ],
    });

    expect(reviewedGeneratedPractice(normalized).map((item) => item.reviewStatus)).toEqual([
      'teacher_reviewed',
      'published',
    ]);
    expect(reviewedGeneratedPractice(normalized).every((item) => item.verification.status === 'pass')).toBe(true);
  });

  it('keeps previously earned region evidence visible when classroom access later locks practice', () => {
    const existingQuestion = question('complex-q1', complexRegion, 'modulus and argument');
    const existingAttempt = attempt('attempt-1', existingQuestion, 0.8, 'modulus and argument');
    const progress = calculateRegionProgress(complexRegion, [existingQuestion], [existingAttempt]);
    const access = getStudentRegionAccess(claimedStudentProfile(), complexRegion.id);

    expect(access).toMatchObject({
      regionId: complexRegion.id,
      access: 'field_guide_only',
      classroomControlled: true,
    });
    expect(canStudentUseRegionActivity(access, 'field_guide')).toBe(true);
    expect(canStudentUseRegionActivity(access, 'exam_practice')).toBe(false);
    expect(canStudentUseRegionActivity(access, 'guardian')).toBe(false);
    expect(canStudentUseRegionActivity(access, 'mastery_progression')).toBe(false);
    expect(progress.attempts).toBe(1);
    expect(progress.totalMarksEarned).toBeCloseTo(4.8);
    expect(progress.averageScoreRatio).toBeCloseTo(0.8);
  });

  it('persists support progress locally without rebuilding mastery profiles', () => {
    const withProfile = localProgressAdapter.saveProfile(claimedStudentProfile());
    localProgressAdapter.completeRegionFieldGuide(logRegion.id);
    localProgressAdapter.addLearningActivityAttempt({
      ...supportAttempt('support-1', 'quick_check'),
      profileId: withProfile.profile!.id,
    });
    localProgressAdapter.addLearningActivityAttempt({
      ...supportAttempt('support-2', 'warm_up'),
      profileId: withProfile.profile!.id,
    });

    const reloaded = localProgressAdapter.loadProgressContext();

    expect(reloaded.regionLearning?.[logRegion.id]?.fieldGuideCompletedAt).toBeTruthy();
    expect(reloaded.learningActivityAttempts.map((item) => item.activityType)).toEqual(['quick_check', 'warm_up']);
    expect(reloaded.attempts).toEqual([]);
    expect(reloaded.topicProfiles).toEqual({});
  });

  it('keeps teacher export mastery summaries attempt-based while preserving support records as support records', () => {
    const cleanQuestion = question('q1', logRegion, 'logarithmic equations');
    const cleanAttempt = attempt('attempt-1', cleanQuestion, 0.8);
    const progress: StoredProgress = {
      ...emptyProgress(),
      profile: claimedStudentProfile(),
      attempts: [cleanAttempt],
      learningActivityAttempts: [supportAttempt('support-1', 'quick_check')],
      regionLearning: {
        [logRegion.id]: {
          regionId: logRegion.id,
          fieldGuideCompletedAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z',
        },
      },
    };
    const regionProgress = calculateWorldProgress([cleanQuestion], progress.attempts, P3_ASTRAL_ACADEMY, progress.regionLearning);
    const exported = buildExportJson(progress, undefined, regionProgress);
    const csv = buildAttemptsCsv(progress);

    expect(exported.learningActivityAttempts).toHaveLength(1);
    expect(exported.regionProgress).toHaveLength(P3_ASTRAL_ACADEMY.regions.length);
    expect(exported.regionProgress?.find((item) => item.region.id === logRegion.id)?.attempts).toBe(1);
    expect(exported.regionProgress?.find((item) => item.region.id === complexRegion.id)?.attempts).toBe(0);
    expect(csv).toContain('"q1"');
    expect(csv).not.toContain('Quick Check prompt.');
    expect(csv).not.toContain('Student method note.');
  });
});
