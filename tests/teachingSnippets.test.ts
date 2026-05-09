import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getPrerequisiteSnippets,
  getQuickCheckSnippets,
  getSnippetsByRegion,
  getSnippetsByTopic,
  getTeachingSnippetsByTopic,
  getTeachingSnippetsForRegion,
  loadTeachingSnippets,
  normalizeTeachingSnippetsData,
  reviewedTeachingSnippets,
} from '../src/lib/teachingSnippets';
import { P3_ASTRAL_ACADEMY } from '../src/lib/worldMap';

const publicSnippetData = JSON.parse(readFileSync('public/data/teaching_snippets.json', 'utf8'));

describe('teaching snippets runtime loader', () => {
  it('filters unreviewed snippets out of runtime selection', () => {
    const snippetsPayload = {
      snippets: [
        {
          snippet_id: 'published',
          paper_family: 'p3',
          topics: ['logarithms_and_exponentials'],
          region_ids: ['logarithm-grove'],
          title: 'Published',
          student_goal: 'Use reviewed content.',
          body: 'Published body.',
          steps: ['Step one.'],
          exam_move: 'Use it.',
          common_trap: 'Skip it.',
          review_status: 'published',
          source: 'teacher_authored',
        },
        {
          snippet_id: 'draft',
          paper_family: 'p3',
          topics: ['logarithms_and_exponentials'],
          region_ids: ['logarithm-grove'],
          title: 'Draft',
          student_goal: 'This should not render.',
          body: 'Draft body.',
          steps: ['Step one.'],
          exam_move: 'Draft.',
          common_trap: 'Draft.',
          review_status: 'needs_review',
          source: 'template_authored',
        },
      ],
    };
    const snippets = normalizeTeachingSnippetsData(snippetsPayload);

    expect(reviewedTeachingSnippets(snippets).map((snippet) => snippet.snippetId)).toEqual(['published']);
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'logarithms_and_exponentials').map((snippet) => snippet.snippetId)).toEqual(['published']);
  });

  it('normalizes enriched learning-card fields without making them mandatory', () => {
    const snippets = normalizeTeachingSnippetsData({
      snippets: [
        {
          snippet_id: 'enriched',
          paper_family: 'p3',
          topics: ['logarithms_and_exponentials'],
          region_ids: ['logarithm-grove'],
          title: 'Enriched',
          student_goal: 'Use a small pre-check before practice.',
          body: 'Teaching body.',
          steps: ['Core step.'],
          exam_move: 'Check the form first.',
          common_trap: 'Starting without a domain check.',
          review_status: 'published',
          source: 'teacher_authored',
          prerequisites: ['Index laws.'],
          micro_steps: ['Circle the base.', 'Rewrite the statement.'],
          common_mistakes: ['Treating the log value as the base.'],
          worked_example: {
            id: 'enriched-example-1',
            prompt: 'Simplify $\\ln x+\\ln2$.',
            steps: ['Use the product law.', 'Multiply the log inputs.'],
            answer: '$\\ln(2x)$',
            teaching_note: 'Adding logs means multiplying inputs.',
          },
          quick_check: {
            prompt: 'Rewrite $\\log_3 9=2$.',
            answer: '$3^2=9$',
            explanation: 'The log value is the exponent.',
          },
          guardian_readiness: {
            supports_topics: ['logarithms_and_exponentials'],
            recommended_before_question_ids: ['q1'],
            readiness_note: 'Use before a logarithm Guardian question.',
          },
          estimated_time_minutes: 2,
          snippet_type: 'quick_check',
          source_question_ids: ['source_q'],
          source_skill_target_ids: ['p3_logarithms_and_exponentials'],
          related_skill_targets: ['p3_logarithms_and_exponentials'],
        },
        {
          snippet_id: 'legacy',
          paper_family: 'p3',
          topics: ['logarithms_and_exponentials'],
          region_ids: ['logarithm-grove'],
          title: 'Legacy',
          student_goal: 'Keep older snippets loadable.',
          body: 'Legacy body.',
          steps: ['Step one.'],
          exam_move: 'Use it.',
          common_trap: 'Skip it.',
          review_status: 'published',
          source: 'teacher_authored',
        },
      ],
    });

    expect(snippets).toHaveLength(2);
    expect(snippets[0]).toMatchObject({
      snippetId: 'enriched',
      prerequisites: ['Index laws.'],
      microSteps: ['Circle the base.', 'Rewrite the statement.'],
      commonMistakes: ['Treating the log value as the base.'],
      workedExamples: [
        {
          id: 'enriched-example-1',
          prompt: 'Simplify $\\ln x+\\ln2$.',
          steps: ['Use the product law.', 'Multiply the log inputs.'],
          answer: '$\\ln(2x)$',
          teachingNote: 'Adding logs means multiplying inputs.',
        },
      ],
      estimatedTimeMinutes: 2,
      snippetType: 'quick_check',
      sourceQuestionIds: ['source_q'],
      sourceSkillTargetIds: ['p3_logarithms_and_exponentials'],
      relatedSkillTargetIds: ['p3_logarithms_and_exponentials'],
    });
    expect(snippets[0].quickCheck).toEqual({
      prompt: 'Rewrite $\\log_3 9=2$.',
      answer: '$3^2=9$',
      explanation: 'The log value is the exponent.',
    });
    expect(snippets[0].guardianReadiness).toEqual({
      supportsTopics: ['logarithms_and_exponentials'],
      recommendedBeforeQuestionIds: ['q1'],
      readinessNote: 'Use before a logarithm Guardian question.',
    });
    expect(snippets[1].quickCheck).toBeUndefined();
    expect(snippets[1].workedExamples).toEqual([]);
    expect(getPrerequisiteSnippets(snippets).map((snippet) => snippet.snippetId)).toEqual(['enriched']);
    expect(getQuickCheckSnippets(snippets).map((snippet) => snippet.snippetId)).toEqual(['enriched']);
  });

  it('filters unreviewed snippets during async loading', async () => {
    const loaded = await loadTeachingSnippets(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        snippets: [
          {
            snippet_id: 'published',
            paper_family: 'p3',
            topics: ['logarithms_and_exponentials'],
            region_ids: ['logarithm-grove'],
            title: 'Published',
            student_goal: 'Use reviewed content.',
            body: 'Published body.',
            steps: ['Step one.'],
            exam_move: 'Use it.',
            common_trap: 'Skip it.',
            review_status: 'published',
            source: 'teacher_authored',
          },
          {
            snippet_id: 'needs_review',
            paper_family: 'p3',
            topics: ['logarithms_and_exponentials'],
            region_ids: ['logarithm-grove'],
            title: 'Needs review',
            student_goal: 'Do not show yet.',
            body: 'Needs review body.',
            steps: ['Step one.'],
            exam_move: 'Review.',
            common_trap: 'Review.',
            review_status: 'needs_review',
            source: 'template_authored',
          },
        ],
      }),
    } as Response));

    expect(loaded.map((snippet) => snippet.snippetId)).toEqual(['published']);
  });

  it('selects snippets by paper family, topic, and P3 region', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');

    expect(logRegion).toBeTruthy();
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'logarithms_and_exponentials').length).toBeGreaterThanOrEqual(3);
    expect(getTeachingSnippetsByTopic(snippets, 'p4', 'logarithms_and_exponentials')).toEqual([]);
    expect(getTeachingSnippetsForRegion(snippets, 'p3', logRegion!, 8).map((snippet) => snippet.snippetId)).toContain('p3-log-laws-001');
    expect(getSnippetsByTopic(snippets, 'p3', 'logarithms_and_exponentials').map((snippet) => snippet.snippetId)).toContain('p3-log-domain-001');
    expect(getSnippetsByRegion(snippets, 'p3', logRegion!, 8).map((snippet) => snippet.snippetId)).toContain('p3-log-laws-001');
  });

  it('maps Batch 7 algebra, log, and trig depth snippets to reviewed skill targets and quick checks', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);
    const byId = new Map(snippets.map((snippet) => [snippet.snippetId, snippet]));

    for (const snippetId of [
      'p3-binomial-validity-range-001',
      'p3-partial-fractions-repeated-linear-001',
      'p3-modulus-cases-001',
      'p3-polynomial-theorem-001',
    ]) {
      const snippet = byId.get(snippetId);
      expect(snippet?.regionIds).toContain('algebra-forge');
      expect(snippet?.relatedSkillTargetIds.length).toBeGreaterThan(0);
      expect(snippet?.quickCheck?.skillTargetId).toBe(snippet?.relatedSkillTargetIds[0]);
    }

    for (const snippetId of ['p3-log-linearisation-001', 'p3-log-invalid-operations-001', 'p3-ln-e-inverse-001']) {
      const snippet = byId.get(snippetId);
      expect(snippet?.regionIds).toContain('logarithm-grove');
      expect(snippet?.quickCheck?.topic).toBe('logarithms_and_exponentials');
      expect(snippet?.quickCheck?.reviewStatus).toBe('teacher_reviewed');
    }

    for (const snippetId of ['p3-trig-identity-selection-001', 'p3-trig-reciprocal-rform-001', 'p3-trig-lost-solutions-001']) {
      const snippet = byId.get(snippetId);
      expect(snippet?.regionIds).toContain('trig-observatory');
      expect(snippet?.quickCheck?.skillTargetId).toBe('p3_trigonometry');
      expect(snippet?.guardianReadiness?.supportsTopics).toContain('trigonometry');
    }
  });

  it('keeps priority method snippets example-first', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);
    const priorityRegions = new Set(['algebra-forge', 'logarithm-grove', 'trig-observatory']);
    const priorityMethodSnippets = snippets.filter((snippet) => (
      ['concept', 'method', 'mistake_repair'].includes(String(snippet.snippetType))
      && snippet.regionIds.some((regionId) => priorityRegions.has(regionId))
    ));

    expect(priorityMethodSnippets.length).toBeGreaterThan(0);
    expect(priorityMethodSnippets.every((snippet) => snippet.workedExamples.length > 0)).toBe(true);
    expect(priorityMethodSnippets.every((snippet) => snippet.quickCheck)).toBe(true);
    expect(priorityMethodSnippets.every((snippet) => snippet.workedExamples.every((example) => (
      example.steps.length >= 1 && example.steps.length <= 6
    )))).toBe(true);
  });

  it('keeps Quick Checks smaller than worked examples for priority snippets', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);
    const checked = snippets.filter((snippet) => (
      snippet.regionIds.some((regionId) => ['algebra-forge', 'logarithm-grove', 'trig-observatory'].includes(regionId))
      && snippet.quickCheck
      && snippet.workedExamples.length > 0
    ));

    expect(checked.length).toBeGreaterThan(0);
    expect(checked.every((snippet) => (
      snippet.quickCheck!.prompt.length < snippet.workedExamples.map((example) => example.prompt.length + example.steps.join(' ').length).reduce((max, value) => Math.max(max, value), 0)
    ))).toBe(true);
  });

  it('keeps the public runtime file limited to reviewed or published snippets', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);

    expect(snippets.length).toBeGreaterThanOrEqual(10);
    expect(snippets.every((snippet) => snippet.reviewStatus === 'teacher_reviewed' || snippet.reviewStatus === 'published')).toBe(true);
  });

  it('covers every current P3 region with at least one reviewed public snippet', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);

    for (const region of P3_ASTRAL_ACADEMY.regions) {
      expect(getTeachingSnippetsForRegion(snippets, 'p3', region).length, region.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('loads revealable quick-check data from the public runtime file', () => {
    const snippets = normalizeTeachingSnippetsData(publicSnippetData);
    const logLawSnippet = snippets.find((snippet) => snippet.snippetId === 'p3-log-laws-001');

    expect(snippets.every((snippet) => snippet.quickCheck)).toBe(true);
    expect(logLawSnippet?.quickCheck).toMatchObject({
      prompt: expect.stringContaining('Simplify'),
      answer: expect.stringContaining('\\ln'),
      explanation: expect.stringContaining('product law'),
    });
    expect(logLawSnippet?.workedExamples[0]).toMatchObject({
      prompt: expect.stringContaining('\\ln x+\\ln5'),
      answer: expect.stringContaining('\\ln(5x)'),
    });
  });
});
