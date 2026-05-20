import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function parseEnvFile(relativePath: string): Record<string, string> {
  const source = readFileSync(`${process.cwd()}/${relativePath}`, 'utf8');
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
    const env = parseEnvFile('.env.example');

    expect(['', 'student-pilot', 'classroom-pilot']).toContain(env.VITE_ASTERION_APP_PROFILE);
    expect(['', 'enabled']).toContain(env.VITE_ASTERION_DASHBOARD_DEMO);
    expect(['', 'mock', 'supabase']).toContain(env.VITE_ASTERION_DASHBOARD_DATA_SOURCE);
    expect(['', 'mock', 'supabase']).toContain(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
    expect(['', 'local', 'hosted']).toContain(env.VITE_ASTERION_STORAGE_MODE);
    expect(env).not.toHaveProperty('ASTERION_SUPABASE_DB_URL');
  });

  it('keeps the classroom pilot example browser-safe and Supabase-backed', () => {
    const env = parseEnvFile('.env.classroom-pilot.example');

    expect(env.VITE_ASTERION_APP_PROFILE).toBe('classroom-pilot');
    expect(env.VITE_ASTERION_DASHBOARD_DATA_SOURCE).toBe('supabase');
    expect(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE).toBe('supabase');
    expect(env.VITE_ASTERION_STORAGE_MODE).toBe('local');
    expect(env).toHaveProperty('VITE_SUPABASE_URL');
    expect(env).toHaveProperty('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(env).not.toHaveProperty('ASTERION_SUPABASE_DB_URL');
  });
});
