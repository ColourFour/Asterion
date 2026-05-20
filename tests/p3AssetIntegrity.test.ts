import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditQuestionAssetAvailability } from '../src/lib/dataHealth';
import { normalizeQuestionBank } from '../src/lib/normalizeQuestionBank';
import { isQuestionTrainable, isTrainableP3Question } from '../src/lib/questionTraining';
import { isP3Question } from '../src/lib/worldMap';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectAssetUrls(directory: string): Set<string> {
  const urls = new Set<string>();
  const publicRoot = join(process.cwd(), 'public');

  for (const entry of readdirSync(directory)) {
    const fullPath = `${directory}/${entry}`;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      for (const url of collectAssetUrls(fullPath)) urls.add(url);
      continue;
    }
    const publicPath = relative(publicRoot, fullPath).split('/').join('/');
    urls.add(`/${publicPath}`);
  }

  return urls;
}

function loadNormalizedQuestions() {
  const bank = readJson(join(process.cwd(), 'public/assets/exam-bank-data/asterion_question_bank_v1.json'));
  const routing = readJson(join(process.cwd(), 'public/assets/exam-bank-data/question_bank.topic_routing.v1.json'));
  return normalizeQuestionBank(bank, {}, routing);
}

function formatMissingAssets(missing: ReturnType<typeof auditQuestionAssetAvailability>['missingExamples']): string {
  return missing.map((item) => (
    `${item.id} | ${item.paper ?? 'paper n/a'} | ${item.questionNumber ? `Q${item.questionNumber}` : 'Q n/a'} | missing ${item.missing} | checked: ${item.candidates.join(', ') || 'no candidates'}`
  )).join('\n');
}

describe('real P3 asset integrity', () => {
  it('keeps every trainable P3 question connected to existing question and mark-scheme files', () => {
    const questions = loadNormalizedQuestions();
    const p3Questions = questions.filter(isP3Question);
    const trainableP3Questions = questions.filter(isTrainableP3Question);
    const assetUrls = collectAssetUrls(join(process.cwd(), 'public/assets'));
    const audit = auditQuestionAssetAvailability(trainableP3Questions, assetUrls);

    expect(p3Questions).toHaveLength(396);
    expect(trainableP3Questions).toHaveLength(396);
    expect(audit.checkedQuestions).toBe(396);
    expect(audit.missingQuestionImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingMarkSchemeImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingExamples, formatMissingAssets(audit.missingExamples)).toEqual([]);
  });

  it('keeps 33autumn25 connected to canonical question and mark-scheme images', () => {
    const questions = loadNormalizedQuestions();
    const autumn25Questions = questions.filter((question) => question.paper === '33autumn25');

    expect(autumn25Questions).toHaveLength(11);
    expect(autumn25Questions.every((question) => isQuestionTrainable(question))).toBe(true);
    expect(autumn25Questions.map((question) => question.id)).toEqual([
      '33autumn25_q01',
      '33autumn25_q02',
      '33autumn25_q03',
      '33autumn25_q04',
      '33autumn25_q05',
      '33autumn25_q06',
      '33autumn25_q07',
      '33autumn25_q08',
      '33autumn25_q09',
      '33autumn25_q10',
      '33autumn25_q11',
    ]);
    expect(autumn25Questions.map((question) => Array.from(new Set(question.markSchemeImageRawPaths)))).toEqual([
      ['p3/33autumn25/mark_scheme/q01.png'],
      ['p3/33autumn25/mark_scheme/q02.png'],
      ['p3/33autumn25/mark_scheme/q03.png'],
      ['p3/33autumn25/mark_scheme/q04.png'],
      ['p3/33autumn25/mark_scheme/q05.png'],
      ['p3/33autumn25/mark_scheme/q06.png'],
      ['p3/33autumn25/mark_scheme/q07.png'],
      ['p3/33autumn25/mark_scheme/q08.png'],
      ['p3/33autumn25/mark_scheme/q09.png'],
      ['p3/33autumn25/mark_scheme/q10.png'],
      ['p3/33autumn25/mark_scheme/q11.png'],
    ]);
  });

  it('reports no missing P3 image groups in the full P3 asset audit', () => {
    const questions = loadNormalizedQuestions();
    const p3Questions = questions.filter(isP3Question);
    const assetUrls = collectAssetUrls(join(process.cwd(), 'public/assets'));
    const audit = auditQuestionAssetAvailability(p3Questions, assetUrls);

    expect(audit.checkedQuestions).toBe(396);
    expect(audit.missingQuestionImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingMarkSchemeImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingExamples, formatMissingAssets(audit.missingExamples)).toEqual([]);
  });
});
