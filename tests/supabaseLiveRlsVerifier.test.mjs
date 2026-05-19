import { describe, expect, it } from 'vitest';

import {
  buildLiveRlsChecks,
  expectedRegionIds,
  liveVerificationEnv,
  requiredTables,
  sanitizeDiagnostic,
  summarizeChecks,
} from '../scripts/verify-supabase-rls-live.mjs';

describe('live Supabase RLS verifier definitions', () => {
  it('uses a server-only database URL env name', () => {
    expect(liveVerificationEnv.dbUrl).toBe('ASTERION_SUPABASE_DB_URL');
    expect(liveVerificationEnv.dbUrl).not.toMatch(/^VITE_/);
  });

  it('defines checks for the required classroom RLS scopes', () => {
    const checkNames = buildLiveRlsChecks().map((check) => check.name);

    for (const table of requiredTables) {
      expect(checkNames).toContain(`anonymous users cannot read protected table ${table}`);
    }

    expect(checkNames).toEqual(
      expect.arrayContaining([
        'unauthenticated users cannot insert progress snapshots',
        'student can read own claimed membership',
        'student cannot read other membership contexts',
        'student can read own class context',
        'student can read only their own class context',
        'student cannot create roster entries or self-add',
        'student can insert snapshot for own claimed membership',
        'student cannot insert snapshot for another membership',
        'teacher can read assigned classes',
        'teacher cannot read unassigned classes',
        'teacher can read assigned roster rows',
        'teacher cannot read unassigned roster rows',
        'teacher can read assigned class region access',
        'teacher cannot read unassigned class region access',
        'teacher can manage assigned class region access',
        'teacher cannot manage unassigned class region access',
        'admin can read setup and support data',
        'unauthenticated users cannot insert audit events',
        'authenticated user cannot insert audit event for another actor',
        'authenticated user can append own audit event',
        'region access rows exist for expected seeded class and region combinations',
      ]),
    );
  });

  it('keeps canonical region coverage in the live data check', () => {
    const regionCheck = buildLiveRlsChecks().find((check) =>
      check.name.includes('region access rows exist'),
    );

    for (const regionId of expectedRegionIds) {
      expect(regionCheck.sql).toContain(regionId);
    }
  });

  it('redacts connection strings and token-like diagnostics', () => {
    const diagnostic = sanitizeDiagnostic(
      'failed postgresql://postgres:secret@example.supabase.co:5432/postgres password=hunter2 access_token=abc123',
    );

    expect(diagnostic).not.toContain('secret');
    expect(diagnostic).not.toContain('hunter2');
    expect(diagnostic).not.toContain('abc123');
    expect(diagnostic).toContain('[redacted database url]');
  });

  it('summarizes pass/fail results without row dumps', () => {
    expect(
      summarizeChecks([
        { name: 'a', ok: true, detail: 'count: 0' },
        { name: 'b', ok: false, detail: 'expected count 0, got 1' },
      ]),
    ).toEqual({
      passed: 1,
      failed: 1,
      total: 2,
      failures: [{ name: 'b', detail: 'expected count 0, got 1' }],
    });
  });
});
