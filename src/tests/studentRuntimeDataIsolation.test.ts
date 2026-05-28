import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedQuestion } from '../types';
import { loadGeneratedPractice } from '../lib/generatedPractice';
import { loadQuestionBankWithDiagnostics } from '../lib/loadQuestionBank';
import { loadTeachingSnippets } from '../lib/teachingSnippets';
import { isGuardianCandidateQuestion, isMasteryEvidenceQuestion, filterPracticeDisplayQuestionsForRegion } from '../lib/questionEligibility';
import { calculateRegionProgress } from '../lib/regionProgress';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function response(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  } as Response;
}

function fallbackCandidateQuestion(): NormalizedQuestion {
  const region = P3_ASTRAL_ACADEMY.regions.find((item) => item.id === 'algebra-forge')!;
  return {
    id: 'content_lab_candidate_preview_q1',
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    displaySubtopic: 'partial fractions',
    deepseek: { hasError: false, topic: 'Algebra', subtopic: 'partial fractions' },
    routeEvidence: {
      status: 'fallback-display-only',
      source: 'fallback-label',
      regionId: region.id,
      regionName: region.name,
      displayRegionId: region.id,
      displayRegionName: region.name,
      reasonCodes: ['fallback-label-match'],
      matchedLabels: ['Algebra', 'partial fractions'],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      guardianEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      generationEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['missing-question-or-mark-scheme-text'] },
    },
    contentSource: {
      kind: 'unknown',
      unsafeForMastery: true,
      unsafeForGuardian: true,
      unsafeForGeneration: true,
      reasonCodes: ['content-lab-candidate-preview-not-runtime'],
    },
    questionImageRawPaths: ['p3/test/questions/q1.png'],
    markSchemeImageRawPaths: ['p3/test/mark_scheme/q1.png'],
    questionImagePaths: ['p3/test/questions/q1.png'],
    markSchemeImagePaths: ['p3/test/mark_scheme/q1.png'],
    questionImageUrls: ['/assets/test/questions/q1.png'],
    markSchemeImageUrls: ['/assets/test/mark_scheme/q1.png'],
    questionImageCandidates: [['/assets/test/questions/q1.png']],
    markSchemeImageCandidates: [['/assets/test/mark_scheme/q1.png']],
    raw: { local: { source: 'content_lab_candidate_preview' } },
  };
}

describe('student runtime data isolation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads only student-runtime bundles, never raw bank or Content Lab candidates', async () => {
    const projectedMain = {
      schema_name: 'asterion_question_bank_projection',
      schema_version: 2,
      record_count: 1,
      questions: [{
        question_id: 'q1',
        paper_family: 'p3',
        canonical_question_artifact: 'p3/a/questions/q1.png',
        canonical_mark_scheme_artifact: 'p3/a/mark_scheme/q1.png',
      }],
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('asterion_content_lab_candidates_v1.json') || value.includes('question_bank.json')) {
        throw new Error(`Unsafe student runtime fetch: ${value}`);
      }
      if (value.includes('asterion_question_bank_v1.json')) return Promise.resolve(response(projectedMain));
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response({ records: {} }));
      if (value.includes('teaching_snippets.json')) return Promise.resolve(response({ snippets: [] }));
      if (value.includes('generated_practice_bank.json')) return Promise.resolve(response({ items: [] }));
      return Promise.resolve(response({}, false));
    });

    await loadQuestionBankWithDiagnostics();
    await loadTeachingSnippets();
    await loadGeneratedPractice();

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toContain('./assets/exam-bank-data/asterion_question_bank_v1.json');
    expect(urls).toContain('./assets/exam-bank-data/question_bank.topic_routing.v1.json');
    expect(urls).toContain('./data/teaching_snippets.json');
    expect(urls).toContain('./data/generated_practice_bank.json');
    expect(urls.join('\n')).not.toContain('asterion_content_lab_candidates_v1.json');
    expect(urls.join('\n')).not.toContain('./assets/exam-bank-data/question_bank.json');
  });

  it('does not let candidate-style fallback labels drive practice, mastery, Guardian, or progress', () => {
    const region = P3_ASTRAL_ACADEMY.regions.find((item) => item.id === 'algebra-forge')!;
    const candidate = fallbackCandidateQuestion();

    expect(filterPracticeDisplayQuestionsForRegion([candidate], region)).toEqual([]);
    expect(isMasteryEvidenceQuestion(candidate, region)).toBe(false);
    expect(isGuardianCandidateQuestion(candidate, region)).toBe(false);
    expect(calculateRegionProgress(region, [candidate], []).availableQuestions).toBe(0);
    expect(calculateRegionProgress(region, [candidate], []).attempts).toBe(0);
  });
});
