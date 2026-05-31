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
  it('keeps every reviewed runtime P3 question connected to existing question and mark-scheme files', () => {
    const questions = loadNormalizedQuestions();
    const p3Questions = questions.filter(isP3Question);
    const trainableP3Questions = questions.filter(isTrainableP3Question);
    const assetUrls = collectAssetUrls(join(process.cwd(), 'public/assets'));
    const audit = auditQuestionAssetAvailability(trainableP3Questions, assetUrls);

    expect(p3Questions).toHaveLength(57);
    expect(trainableP3Questions).toHaveLength(57);
    expect(audit.checkedQuestions).toBe(57);
    expect(audit.missingQuestionImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingMarkSchemeImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingExamples, formatMissingAssets(audit.missingExamples)).toEqual([]);
  });

  it('keeps 31summer24 reviewed runtime records connected to canonical question and mark-scheme images', () => {
    const questions = loadNormalizedQuestions();
    const summer24Questions = questions.filter((question) => question.paper === '31summer24');

    expect(summer24Questions).toHaveLength(5);
    expect(summer24Questions.every((question) => isQuestionTrainable(question))).toBe(true);
    expect(summer24Questions.map((question) => question.id)).toEqual([
      '31summer24_q01',
      '31summer24_q02',
      '31summer24_q03',
      '31summer24_q04',
      '31summer24_q07',
    ]);
    expect(summer24Questions.map((question) => Array.from(new Set(question.markSchemeImageRawPaths)))).toEqual([
      ['p3/31summer24/mark_scheme/q01.png'],
      ['p3/31summer24/mark_scheme/q02.png'],
      ['p3/31summer24/mark_scheme/q03.png'],
      ['p3/31summer24/mark_scheme/q04.png'],
      ['p3/31summer24/mark_scheme/q07.png'],
    ]);
  });

  it('reports no missing P3 image groups in the reviewed runtime asset audit', () => {
    const questions = loadNormalizedQuestions();
    const p3Questions = questions.filter(isP3Question);
    const assetUrls = collectAssetUrls(join(process.cwd(), 'public/assets'));
    const audit = auditQuestionAssetAvailability(p3Questions, assetUrls);

    expect(audit.checkedQuestions).toBe(57);
    expect(audit.missingQuestionImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingMarkSchemeImageGroups, formatMissingAssets(audit.missingExamples)).toBe(0);
    expect(audit.missingExamples, formatMissingAssets(audit.missingExamples)).toEqual([]);
  });
});
