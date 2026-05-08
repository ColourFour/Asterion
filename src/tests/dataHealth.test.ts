import { describe, expect, it } from 'vitest';
import { auditQuestionAssetAvailability, buildDataHealthSummary } from '../lib/dataHealth';
import type { NormalizedQuestion, RegionProgress } from '../types';

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
});
