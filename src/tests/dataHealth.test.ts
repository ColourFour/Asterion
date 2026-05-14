import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { auditQuestionAssetAvailability, buildDataHealthSummary, buildP3RouteEvidenceDistribution } from '../lib/dataHealth';
import { normalizeQuestionBankWithDiagnostics } from '../lib/normalizeQuestionBank';
import type { NormalizedQuestion, RegionProgress } from '../types';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(`${process.cwd()}/${path}`, 'utf8'));
}

function markSchemeCandidate(candidate: string): string {
  return candidate.replace(/\/questions\/q01\.png$/, '/mark_scheme/q01.png');
}

function question(id: string, candidate: string): NormalizedQuestion {
  const markScheme = markSchemeCandidate(candidate);
  return {
    id,
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    deepseek: { hasError: false, topic: 'Algebra' },
    questionImageRawPaths: ['p3/a/questions/q1.png'],
    markSchemeImageRawPaths: ['p3/a/mark_scheme/q1.png'],
    questionImagePaths: ['p3/a/questions/q1.png'],
    markSchemeImagePaths: ['p3/a/mark_scheme/q1.png'],
    questionImageUrls: [candidate],
    markSchemeImageUrls: [markScheme],
    questionImageCandidates: [[candidate]],
    markSchemeImageCandidates: [[markScheme]],
    raw: { local: {} },
  };
}

function blockedQuestion(id: string): NormalizedQuestion {
  return {
    ...question(id, '/assets/31autumn21/questions/q01.png'),
    trainingStatus: 'quarantined_missing_canonical_mark_scheme',
    trainingBlockers: ['Missing canonical mark scheme.'],
  };
}

describe('buildDataHealthSummary', () => {
  it('reports the preferred public assets root layout from generated candidates', () => {
    const summary = buildDataHealthSummary([
      question('q1', '/assets/31autumn21/questions/q01.png'),
    ], []);

    expect(summary.imageRootMode).toBe('public/assets root layout');
  });

  it('reports legacy fallback layouts when those are the preferred candidates', () => {
    const familySummary = buildDataHealthSummary([
      question('q1', '/assets/questions/p3/31autumn21/questions/q01.png'),
    ], []);
    const paperOnlySummary = buildDataHealthSummary([
      question('q2', '/assets/questions/31autumn21/questions/q01.png'),
    ], []);

    expect(familySummary.imageRootMode).toBe('family-folder layout');
    expect(paperOnlySummary.imageRootMode).toBe('paper-only layout');
  });

  it('keeps data health stable when no image candidates exist', () => {
    const summary = buildDataHealthSummary([], [] as RegionProgress[]);

    expect(summary.imageRootMode).toBe('unknown');
  });

  it('reports P3 questions blocked from practice without removing them from data health', () => {
    const summary = buildDataHealthSummary([
      question('q1', '/assets/31autumn21/questions/q01.png'),
      blockedQuestion('q2'),
    ], []);

    expect(summary.totalP3Questions).toBe(2);
    expect(summary.trainableP3Questions).toBe(1);
    expect(summary.p3QuestionsBlockedFromPractice).toBe(1);
    expect(summary.practiceBlockedExamples).toEqual([
      {
        id: 'q2',
        blockers: ['Missing canonical mark scheme.'],
        labels: 'Algebra | Algebra',
      },
    ]);
  });

  it('reports actual asset availability from resolved candidate groups', () => {
    const availableAssets = new Set(['/assets/31autumn21/questions/q01.png']);
    const questions = [
      question('q1', '/assets/31autumn21/questions/q01.png'),
    ];
    const assetAudit = auditQuestionAssetAvailability(questions, availableAssets);
    const summary = buildDataHealthSummary(questions, [], undefined, assetAudit);

    expect(summary.p3QuestionImageGroupsAvailable).toBe(1);
    expect(summary.p3QuestionImageGroupsChecked).toBe(1);
    expect(summary.p3MarkSchemeImageGroupsAvailable).toBe(0);
    expect(summary.p3MarkSchemeImageGroupsChecked).toBe(1);
    expect(summary.missingAssetAvailabilityExamples).toEqual([
      {
        id: 'q1',
        missing: 'mark_scheme',
        candidates: ['/assets/31autumn21/mark_scheme/q01.png'],
      },
    ]);
  });

  it('surfaces route, eligibility, source, fallback-only, and generation gate diagnostics', () => {
    const cleanQuestion: NormalizedQuestion = {
      ...question('clean', '/assets/31autumn21/questions/q01.png'),
      routeEvidence: {
        status: 'clean',
        source: 'topic-routing',
        validatedRegionId: 'algebra',
        displayRegionId: 'algebra',
        reasonCodes: ['validated-topic-routing'],
      },
      contentSource: {
        kind: 'projected-bank',
        unsafeForMastery: false,
        unsafeForGuardian: false,
        unsafeForGeneration: false,
        reasonCodes: [],
      },
      eligibility: {
        regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
        practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
        masteryEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
        guardianEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
        generationEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
        textOnlyEligible: { eligible: false, reasonCodes: ['text-only-display-not-allowed'] },
      },
    };
    const rawFallbackQuestion: NormalizedQuestion = {
      ...question('fallback', '/assets/31autumn21/questions/q01.png'),
      routeEvidence: {
        status: 'fallback-display-only',
        source: 'fallback-label',
        displayRegionId: 'calculus',
        reasonCodes: ['fallback-label-match'],
      },
      contentSource: {
        kind: 'raw-bank-fallback',
        unsafeForMastery: true,
        unsafeForGuardian: true,
        unsafeForGeneration: true,
        reasonCodes: ['unsafe-raw-bank-fallback'],
      },
      eligibility: {
        regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
        practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
        masteryEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only', 'unsafe-raw-bank-fallback'] },
        guardianEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only', 'unsafe-raw-bank-fallback'] },
        generationEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only', 'unsafe-raw-bank-fallback'] },
        textOnlyEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      },
    };

    const summary = buildDataHealthSummary([cleanQuestion, rawFallbackQuestion], []);

    expect(summary.routeEvidenceStatusCounts).toEqual({ clean: 1, 'fallback-display-only': 1 });
    expect(summary.eligibilityBucketCounts.generationEligible).toEqual({ eligible: 1, blocked: 1, missing: 0 });
    expect(summary.blockerReasonCodeCounts).toMatchObject({
      'blocked-fallback-display-only': 4,
      'unsafe-raw-bank-fallback': 3,
      'text-only-display-not-allowed': 1,
    });
    expect(summary.contentSourceCounts).toEqual({ 'projected-bank': 1, 'raw-bank-fallback': 1 });
    expect(summary.fallbackDisplayOnlyCountsByRegion).toEqual({ calculus: 1 });
    expect(summary.rawBankFallbackCount).toBe(1);
    expect(summary.rawBankDebugCount).toBe(0);
    expect(summary.rawBankWarningExamples).toEqual(['fallback: raw-bank-fallback']);
    expect(summary.generationEligibleCounts).toEqual({ true: 1, false: 1, missing: 0 });
    expect(summary.generationBlockerReasonCounts).toEqual({
      'blocked-fallback-display-only': 1,
      'unsafe-raw-bank-fallback': 1,
    });
  });
});

describe('buildP3RouteEvidenceDistribution', () => {
  it('keeps the normalized P3 route-evidence distribution aligned with the deterministic report', () => {
    const projectedBank = readJson('public/assets/exam-bank-data/asterion_question_bank_v1.json');
    const topicRouting = readJson('public/assets/exam-bank-data/question_bank.topic_routing.v1.json');
    const report = readJson('tools/content_lab/reports/p3_route_evidence_status_report.json') as {
      normalized_distribution: {
        total_p3_questions: number;
        status_counts: Record<string, number>;
        validated_region_id_count: number;
        display_region_id_only_count: number;
        fallback_display_only_count: number;
        no_display_region_id_count: number;
      };
      route_report_distribution: {
        normalized_status_by_route_report_category: Record<string, Record<string, number>>;
      };
    };
    const { questions } = normalizeQuestionBankWithDiagnostics(projectedBank, {}, topicRouting, {
      contentSourceKind: 'projected-bank',
    });
    const distribution = buildP3RouteEvidenceDistribution(questions);

    expect(distribution).toMatchObject({
      totalP3Questions: 396,
      statusCounts: {
        clean: 317,
        'review-only': 60,
        'ambiguous-route': 19,
      },
      validatedRegionIdCount: 317,
      displayRegionIdOnlyCount: 26,
      fallbackDisplayOnlyCount: 0,
      noDisplayRegionIdCount: 53,
    });
    expect(distribution.totalP3Questions).toBe(report.normalized_distribution.total_p3_questions);
    expect(distribution.statusCounts).toEqual(report.normalized_distribution.status_counts);
    expect(distribution.validatedRegionIdCount).toBe(report.normalized_distribution.validated_region_id_count);
    expect(distribution.displayRegionIdOnlyCount).toBe(report.normalized_distribution.display_region_id_only_count);
    expect(distribution.fallbackDisplayOnlyCount).toBe(report.normalized_distribution.fallback_display_only_count);
    expect(distribution.noDisplayRegionIdCount).toBe(report.normalized_distribution.no_display_region_id_count);
    expect(report.route_report_distribution.normalized_status_by_route_report_category).toEqual({
      safe_p3_route: { clean: 317 },
      missing_p3_route: { 'review-only': 53 },
      ambiguous_multi_topic_route: { 'ambiguous-route': 14 },
      review_needed_route: { 'ambiguous-route': 5, 'review-only': 7 },
    });

    const healthSummary = buildDataHealthSummary(questions, []);
    expect(healthSummary.routeEvidenceStatusCounts).toEqual({
      clean: 317,
      'review-only': 60,
      'ambiguous-route': 19,
    });
    expect(healthSummary.eligibilityBucketCounts).toMatchObject({
      generationEligible: { eligible: 293, blocked: 103, missing: 0 },
      masteryEligible: { eligible: 307, blocked: 89, missing: 0 },
      guardianEligible: { eligible: 307, blocked: 89, missing: 0 },
    });
    expect(healthSummary.contentSourceCounts).toEqual({ 'projected-bank': 396 });
    expect(healthSummary.fallbackDisplayOnlyCountsByRegion).toEqual({});
    expect(healthSummary.rawBankFallbackCount).toBe(0);
    expect(healthSummary.rawBankDebugCount).toBe(0);
    expect(healthSummary.generationEligibleCounts).toEqual({ true: 293, false: 103, missing: 0 });
    expect(healthSummary.generationBlockerReasonCounts).toEqual({
      'blocked-review-only': 60,
      'blocked-hard-failed-text': 31,
      'missing-content-lab-usable-text': 31,
      'blocked-ambiguous-route': 19,
    });
  });
});
