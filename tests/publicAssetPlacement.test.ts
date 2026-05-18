import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public asset placement', () => {
  it('does not ship legacy question-bank bundles from public/data', () => {
    const publicDataDir = join(process.cwd(), 'public/data');
    const files = existsSync(publicDataDir) ? readdirSync(publicDataDir) : [];

    expect(files.filter((file) => /^question_bank(\.|$)/.test(file))).toEqual([]);
  });

  it('keeps only reviewed runtime support JSON in public/data', () => {
    const publicDataDir = join(process.cwd(), 'public/data');
    const files = existsSync(publicDataDir) ? readdirSync(publicDataDir).sort() : [];

    expect(files).toEqual([
      'generated_practice_bank.json',
      'teaching_snippets.json',
    ]);
  });
});
