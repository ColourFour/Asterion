import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function parseEnvExample(): Record<string, string> {
  const source = readFileSync(`${process.cwd()}/.env.example`, 'utf8');
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return separator === -1 ? [line, ''] : [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

describe('.env.example', () => {
  it('uses only valid browser-safe runtime values', () => {
    const env = parseEnvExample();

    expect(['', 'student-pilot']).toContain(env.VITE_ASTERION_APP_PROFILE);
    expect(['', 'enabled']).toContain(env.VITE_ASTERION_DASHBOARD_DEMO);
    expect(['', 'mock', 'supabase']).toContain(env.VITE_ASTERION_DASHBOARD_DATA_SOURCE);
    expect(['', 'mock', 'supabase']).toContain(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
    expect(['', 'local', 'hosted']).toContain(env.VITE_ASTERION_STORAGE_MODE);
    expect(env).not.toHaveProperty('ASTERION_SUPABASE_DB_URL');
  });
});
