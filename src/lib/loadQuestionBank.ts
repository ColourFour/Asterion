import type { NormalizedQuestion } from '../types';
import { normalizeQuestionBank } from './normalizeQuestionBank';

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

export async function loadQuestionBank(): Promise<NormalizedQuestion[]> {
  const [localResult, deepseekResult] = await Promise.allSettled([
    fetchJson('./data/question_bank.json'),
    fetchJson('./data/question_bank.deepseek.json'),
  ]);

  if (localResult.status === 'rejected') {
    throw new Error(`Could not load question_bank.json: ${localResult.reason instanceof Error ? localResult.reason.message : String(localResult.reason)}`);
  }

  const sidecar = deepseekResult.status === 'fulfilled' ? deepseekResult.value : {};
  return normalizeQuestionBank(localResult.value, sidecar);
}
