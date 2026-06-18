import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { examQuestionSupportPrompt } from '../src/data/examQuestionSupport';
import { filterTrainableQuestionsForRegion } from '../src/lib/questionTraining';
import { normalizeQuestionBank } from '../src/lib/normalizeQuestionBank';
import { P3_REGION_DEFINITIONS, P3_TOPIC_ID_TO_REGION_ID } from '../src/lib/p3SkillContract';
import { applyP3TopicPackRefreshOverlay } from '../src/lib/p3TopicPackRefreshOverlay';
import { P3_COURSE_MAP } from '../src/lib/worldMap';
import type { NormalizedQuestion } from '../src/types';

interface TopicPackImportMetadata {
  source?: string;
  source_question_id?: string;
  source_repo_name?: string;
  source_manifest_path?: string;
  promoted_topic_slug?: string;
  promoted_topic_id?: string;
  self_marking_mode?: string;
}

interface RuntimeQuestionRecord {
  question_id?: string;
  student_runtime_safe?: boolean;
  review_status?: string;
  canonical_question_artifact?: string;
  canonical_mark_scheme_artifact?: string;
  quality_gate?: {
    reason_codes?: string[];
  };
  asterion_import?: TopicPackImportMetadata;
  subparts?: Array<{
    question_text?: { text?: string } | string;
    mark_scheme_text?: { text?: string } | string;
  }>;
}

interface TopicRoutingRecord {
  primary_topic_id?: string;
  review_required?: boolean;
  review_reasons?: string[];
  route_approved?: boolean;
  route_review_status?: string;
  asterion_import?: TopicPackImportMetadata;
}

const examBankRoot = path.join(process.cwd(), 'public/assets/exam-bank-data');
const baseRuntimeBank = JSON.parse(
  readFileSync(path.join(examBankRoot, 'asterion_question_bank_v1.json'), 'utf8'),
) as { questions: RuntimeQuestionRecord[] };
const baseTopicRouting = JSON.parse(
  readFileSync(path.join(examBankRoot, 'question_bank.topic_routing.v1.json'), 'utf8'),
) as { records: Record<string, TopicRoutingRecord> };
const appliedTopicPackRefresh = applyP3TopicPackRefreshOverlay(baseRuntimeBank, baseTopicRouting) as {
  questionBank: { questions: RuntimeQuestionRecord[] };
  topicRouting: { records: Record<string, TopicRoutingRecord> };
};
const runtimeBank = appliedTopicPackRefresh.questionBank;
const topicRouting = appliedTopicPackRefresh.topicRouting;

const importedTopicPackRecords = {
  '32spring24_q01': 'algebra',
  '32spring23_q03': 'algebra',
  '32autumn23_q03': 'algebra',
  '31summer23_q03': 'algebra',
  '32summer21_q04': 'integration',
  '31autumn21_q04': 'integration',
  '33summer23_q07': 'integration',
  '31summer23_q09': 'numerical-solution-of-equations',
  '32spring24_q07': 'numerical-solution-of-equations',
  '33summer23_q05': 'numerical-solution-of-equations',
  '31summer24_q09': 'vectors',
  '32spring24_q09': 'vectors',
  '32summer23_q11': 'vectors',
  '32spring24_q08': 'trigonometry',
  '32spring23_q06': 'trigonometry',
} as const;

const expectedSupportTokens: Record<keyof typeof importedTopicPackRecords, string[]> = {
  '32spring24_q01': ['x^2 + 5', 'remainder'],
  '32spring23_q03': ['x^2 - x + 1', '3x + 2'],
  '32autumn23_q03': ['p(1/2)', 'p(-1)'],
  '31summer23_q03': ['sqrt(1 + 4x)', 'x^3'],
  '32summer21_q04': ['tan^-1(x/2)', 'integration by parts'],
  '31autumn21_q04': ['u = sqrt(x)', 'sqrt(3)'],
  '33summer23_q07': ['u = cos x', 'sin 2x'],
  '31summer23_q09': ['x e^(-2x)', '1/2 ln(4a + 2)'],
  '32spring24_q07': ['xe^(2x) - 5x', 'fixed-point'],
  '33summer23_q05': ['x^2 cos 3x', 'fixed-point'],
  '31summer24_q09': ['dot product', 'a'],
  '32spring24_q09': ['OA', 'OB', 'OC'],
  '32summer23_q11': ['AB', 'line l'],
  '32spring24_q08': ['cos(x + pi/4)', 'R sin'],
  '32spring23_q06': ['5 sin theta + 12 cos theta', 'R cos'],
};

const priorityTopicMinimums = {
  algebra: 6,
  integration: 6,
  'numerical-solution-of-equations': 6,
  vectors: 6,
  trigonometry: 6,
} as const;

const importedIds = Object.keys(importedTopicPackRecords) as Array<keyof typeof importedTopicPackRecords>;
const validP3RegionIds = new Set(P3_REGION_DEFINITIONS.map((region) => region.id));
const rawRecordById = new Map(runtimeBank.questions.map((record) => [record.question_id, record]));
const normalizedQuestions = normalizeQuestionBank(runtimeBank, {}, topicRouting, {
  contentSourceKind: 'projected-bank',
});
const normalizedById = new Map(normalizedQuestions.map((question) => [question.id, question]));

const criticalUnresolvedReasonCodes = [
  'missing_source_identity',
  'question_crop_missing',
  'mark_scheme_crop_missing',
  'question_crop_not_high_confidence',
  'mark_scheme_crop_not_high_confidence',
  'text_only_fail',
  'validation_status_fail',
  'marks_inconsistent',
  'subpart_marks_missing',
  'unsupported_image_dependency',
];

function topicIdForSlug(slug: string): string {
  const match = Object.entries(P3_TOPIC_ID_TO_REGION_ID).find(([, regionId]) => regionId === slug);
  if (!match) throw new Error(`No P3 topic id found for ${slug}`);
  return match[0];
}

function assetPath(asset: string | undefined): string | undefined {
  if (!asset) return undefined;
  const normalized = asset.replace(/^\/+/, '');
  if (normalized.startsWith('assets/exam-bank-data/')) {
    return path.join(process.cwd(), 'public', normalized);
  }
  if (normalized.startsWith('public/assets/exam-bank-data/')) {
    return path.join(process.cwd(), normalized);
  }
  return path.join(examBankRoot, normalized);
}

function questionText(record: RuntimeQuestionRecord): string {
  return (record.subparts ?? [])
    .map((part) => {
      const value = part.question_text;
      if (typeof value === 'string') return value;
      return value?.text ?? '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markPointCount(question: NormalizedQuestion): number {
  return question.parts?.reduce((count, part) => count + (part.markPoints?.length ?? 0), 0) ?? 0;
}

function importedSourceKey(question: NormalizedQuestion): string {
  const raw = question.raw.local as RuntimeQuestionRecord;
  return raw.asterion_import?.source_question_id ?? question.id;
}

function renderedArticleHtml(topicSlug: string, questionId: string): string {
  const pagePath = path.join(process.cwd(), 'docs/p3/topics', topicSlug, 'exam-training/index.html');
  const html = readFileSync(pagePath, 'utf8');
  const start = html.indexOf(`<article class="exam-question-card" id="question-${questionId}"`);
  if (start < 0) return '';
  const next = html.indexOf('<article class="exam-question-card"', start + 1);
  return html.slice(start, next < 0 ? html.indexOf('</main>', start) : next);
}

describe('P3 topic-pack exam-training refresh', () => {
  it('keeps imported records traceable to the topic-pack source', () => {
    for (const id of importedIds) {
      const record = rawRecordById.get(id);
      expect(record, id).toBeDefined();
      expect(record?.student_runtime_safe, id).toBe(true);
      expect(record?.review_status, id).toBe('reviewed');
      expect(record?.asterion_import, id).toMatchObject({
        source: 'exam-bank-topic-packs',
        source_question_id: id,
        source_repo_name: 'exam-bank-pipeline',
        promoted_topic_slug: importedTopicPackRecords[id],
        promoted_topic_id: topicIdForSlug(importedTopicPackRecords[id]),
        self_marking_mode: 'coarse_image_mark_scheme',
      });
      expect(record?.asterion_import?.source_manifest_path, id).toContain('output/topic_packets/p3/');
    }
  });

  it('assigns imported records only to valid reviewed P3 topic routes', () => {
    for (const id of importedIds) {
      const expectedSlug = importedTopicPackRecords[id];
      const route = topicRouting.records[id];

      expect(validP3RegionIds.has(expectedSlug), id).toBe(true);
      expect(route?.primary_topic_id, id).toBe(topicIdForSlug(expectedSlug));
      expect(route?.review_required, id).toBe(false);
      expect(route?.review_reasons ?? [], id).toEqual([]);
      expect(route?.route_approved, id).toBe(true);
      expect(route?.route_review_status, id).toBe('topic_pack_promoted');
      expect(route?.asterion_import, id).toMatchObject({
        source: 'exam-bank-topic-packs',
        source_question_id: id,
        promoted_topic_slug: expectedSlug,
      });
    }
  });

  it('keeps imported records image-backed and free of unresolved critical QA blockers', () => {
    for (const id of importedIds) {
      const record = rawRecordById.get(id);
      expect(record, id).toBeDefined();

      const reasonCodes = record?.quality_gate?.reason_codes ?? [];
      expect(reasonCodes.filter((code) => criticalUnresolvedReasonCodes.includes(code)), id).toEqual([]);

      const questionAsset = assetPath(record?.canonical_question_artifact);
      const markSchemeAsset = assetPath(record?.canonical_mark_scheme_artifact);
      expect(questionAsset && existsSync(questionAsset), `${id} question asset`).toBe(true);
      expect(markSchemeAsset && existsSync(markSchemeAsset), `${id} mark-scheme asset`).toBe(true);

      const text = questionText(record!);
      expect(text.length, id).toBeGreaterThan(20);
      expect(text, id).not.toMatch(/undefined|null|parse[_ -]?error|ocr failed/i);
    }
  });

  it('uses honest coarse self-marking unless reviewed mark points are available', () => {
    for (const id of importedIds) {
      const record = rawRecordById.get(id);
      const question = normalizedById.get(id);

      expect(question, id).toBeDefined();
      const ticks = markPointCount(question!);
      if (ticks === 0) {
        expect(record?.asterion_import?.self_marking_mode, id).toBe('coarse_image_mark_scheme');
      } else {
        expect(ticks, id).toBeGreaterThan(0);
      }
    }
  });

  it('gives every imported record source-specific first-step support', () => {
    for (const id of importedIds) {
      const prompt = examQuestionSupportPrompt(id)?.firstStep;
      expect(prompt, id).toBeDefined();
      expect(prompt?.length, id).toBeGreaterThan(45);
      expect(prompt, id).not.toMatch(/placeholder|generic|try to solve|read the question/i);
      expect(expectedSupportTokens[id].some((token) => prompt?.includes(token)), id).toBe(true);
    }
  });

  it('does not duplicate the same source question on a topic exam-training page', () => {
    for (const region of P3_COURSE_MAP.regions) {
      const visibleQuestions = filterTrainableQuestionsForRegion(normalizedQuestions, region).slice(0, 8);
      const sourceKeys = visibleQuestions.map(importedSourceKey);
      expect(new Set(sourceKeys).size, region.id).toBe(sourceKeys.length);
    }
  });

  it('raises priority topic exam-training coverage when safe topic-pack records exist', () => {
    for (const [slug, minimum] of Object.entries(priorityTopicMinimums)) {
      const region = P3_COURSE_MAP.regions.find((candidate) => candidate.id === slug);
      expect(region, slug).toBeDefined();
      const visibleCount = filterTrainableQuestionsForRegion(normalizedQuestions, region!).slice(0, 8).length;
      expect(visibleCount, slug).toBeGreaterThanOrEqual(minimum);
    }
  });

  it('renders imported records with student-safe support and honest marking labels', () => {
    const internalTerms = [
      'source_warnings',
      'source_review_reasons',
      'needs_review',
      'topic_pack_promoted',
      'topic-pack',
      'DeepSeek',
      'QA blocker',
      'low_question_crop_confidence',
      'text_only_fail',
    ];

    for (const id of importedIds) {
      const topicSlug = importedTopicPackRecords[id];
      const article = renderedArticleHtml(topicSlug, id);
      expect(article, id).toContain('Need a first step?');
      expect(article, id).toContain('Show mark scheme image');
      expect(article, id).toContain('Self-marked exam work is useful practice evidence');

      for (const term of internalTerms) {
        expect(article.toLowerCase(), `${id} leaked ${term}`).not.toContain(term.toLowerCase());
      }

      const hasTickableMarkPoints = article.includes('data-has-mark-points="true"');
      if (hasTickableMarkPoints) {
        expect(article, id).toContain('Tick mark points you can justify from the mark scheme image');
        expect(article, id).toContain('These ticks are support only. The mark-scheme image is the source of truth.');
      } else {
        expect(article, id).toContain('data-coarse-self-marking="true"');
        expect(article, id).toContain('Coarse self-marking: this source record does not expose reviewed tickable mark points');
      }
    }
  });
});
