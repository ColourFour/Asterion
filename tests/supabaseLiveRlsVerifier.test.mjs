import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
        'student cannot insert local progress snapshots for own claimed membership',
        'student cannot insert snapshot for another membership',
        'student can record field guide event for field-guide-only region',
        'student cannot record quick check event for field-guide-only region',
        'student can record practice event for open region',
        'student cannot record progress event for another membership',
        'student cannot record event with wrong class or student profile context',
        'student cannot record hosted progress payload with raw learner data keys',
        'teacher can read assigned hosted progress events',
        'teacher cannot read hosted progress events for another teacher class',
        'teacher can read assigned classes',
        'teacher cannot read unassigned classes',
        'teacher can read assigned roster rows',
        'teacher cannot read unassigned roster rows',
        'teacher can read assigned class region access',
        'teacher cannot read unassigned class region access',
        'teacher can manage assigned class region access',
        'teacher cannot manage unassigned class region access',
        'assigned teacher can update region access through RPC',
        'teacher cannot update unassigned region access through RPC',
        'teacher can create own class with all regions field guide only',
        'teacher cannot create class for another teacher',
        'admin can read setup and support data',
        'admin can attach existing auth user as teacher',
        'admin can pre-authorize teacher email before auth user exists',
        'pending teacher activates after sign-in with matching email',
        'wrong teacher email cannot activate pending teacher access',
        'archived pending teacher invite does not activate',
        'teacher cannot self-assign teacher role through admin RPC',
        'admin can create class for active teacher with all regions field guide only',
        'unauthenticated users cannot insert audit events',
        'authenticated user cannot insert audit event for another actor',
        'authenticated user can append own audit event',
        'region access rows exist for expected seeded class and region combinations',
      ]),
    );
  });

  it('checks hosted setup RPCs in rollback-local live verification', () => {
    const checks = buildLiveRlsChecks();
    const teacherCreateCheck = checks.find(
      (check) => check.name === 'teacher can create own class with all regions field guide only',
    );
    const adminAttachCheck = checks.find(
      (check) => check.name === 'admin can attach existing auth user as teacher',
    );
    const selfAssignCheck = checks.find(
      (check) => check.name === 'teacher cannot self-assign teacher role through admin RPC',
    );
    const pendingAttachCheck = checks.find(
      (check) => check.name === 'admin can pre-authorize teacher email before auth user exists',
    );
    const activationCheck = checks.find(
      (check) => check.name === 'pending teacher activates after sign-in with matching email',
    );

    expect(teacherCreateCheck.kind).toBe('count');
    expect(teacherCreateCheck.expected).toBe(expectedRegionIds.length);
    expect(teacherCreateCheck.sql).toContain('begin;');
    expect(teacherCreateCheck.sql).toContain('rollback;');
    expect(teacherCreateCheck.sql).toContain('public.create_class_with_region_access');
    expect(teacherCreateCheck.sql).toContain("cra.access_status = 'field_guide_only'");
    for (const regionId of expectedRegionIds) {
      expect(teacherCreateCheck.sql).toContain(regionId);
    }

    expect(adminAttachCheck.sql).toContain('public.admin_add_teacher_by_email');
    expect(adminAttachCheck.sql).toContain('teacher-noether@asterion.invalid');
    expect(pendingAttachCheck.sql).toContain('public.admin_add_teacher_by_email');
    expect(pendingAttachCheck.sql).toContain('public.teacher_invites');
    expect(pendingAttachCheck.sql).toContain('pending-teacher@asterion.invalid');
    expect(activationCheck.sql).toContain('public.activate_pending_teacher_role_for_current_user');
    expect(activationCheck.sql).toContain('insert into auth.users');
    expect(activationCheck.sql).toContain('insert into public.teacher_invites');
    expect(selfAssignCheck.kind).toBe('deny');
    expect(selfAssignCheck.sql).toContain('public.admin_add_teacher_by_email');
    expect(selfAssignCheck.sql).toContain('teacher-hypatia@asterion.invalid');
  });

  it('keeps canonical region coverage in the live data check', () => {
    const regionCheck = buildLiveRlsChecks().find((check) =>
      check.name.includes('region access rows exist'),
    );

    for (const regionId of expectedRegionIds) {
      expect(regionCheck.sql).toContain(regionId);
    }
  });

  it('sets the Supabase authenticated JWT context for roster-claim RPC checks in one transaction', () => {
    const claimCheck = buildLiveRlsChecks().find(
      (check) => check.name === 'student roster claim RPC claims an existing unclaimed slot',
    );

    expect(claimCheck.kind).toBe('status_count');
    expect(claimCheck.sql).toContain('begin;');
    expect(claimCheck.sql).toContain('insert into auth.users');
    expect(claimCheck.sql).toContain('insert into public.user_roles');
    expect(claimCheck.sql).toContain(
      "'11000000-0000-0000-0000-000000000303'",
    );
    expect(claimCheck.sql).toContain(
      "'00000000-0000-0000-0000-000000000303'",
    );
    expect(claimCheck.sql).toContain("'student'");
    expect(claimCheck.sql).toContain(
      "'10000000-0000-0000-0000-000000000001'",
    );
    expect(claimCheck.sql).toContain("'active'");
    expect(claimCheck.sql.indexOf('insert into public.user_roles')).toBeLessThan(
      claimCheck.sql.indexOf('set local role authenticated;'),
    );
    expect(claimCheck.sql).toContain('set local role authenticated;');
    expect(claimCheck.sql).toContain("set local request.jwt.claim.role = 'authenticated';");
    expect(claimCheck.sql).toContain(
      'set local request.jwt.claims = \'{\"role\":\"authenticated\",\"sub\":\"00000000-0000-0000-0000-000000000303\"}\';',
    );
    expect(claimCheck.sql).toContain(
      "set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000303';",
    );
    expect(claimCheck.sql.indexOf('set local role authenticated;')).toBeLessThan(
      claimCheck.sql.indexOf('public.claim_class_roster_slot'),
    );
    expect(claimCheck.sql).toContain('rollback;');
  });

  it('keeps every authenticated roster-claim RPC check rollback-local and Lyra-authorized', () => {
    const claimChecks = buildLiveRlsChecks().filter(
      (check) =>
        check.name.includes('student roster claim RPC') &&
        check.name !== 'anonymous users cannot execute student roster claim RPC',
    );

    expect(claimChecks).toHaveLength(6);

    for (const check of claimChecks) {
      expect(check.sql).toContain('begin;');
      expect(check.sql).toContain('rollback;');
      expect(check.sql).toContain('insert into auth.users');
      expect(check.sql).toContain('insert into public.user_roles');
      expect(check.sql).toContain("'00000000-0000-0000-0000-000000000303'");
      expect(check.sql).toContain("'student'");
      expect(check.sql).toContain("'active'");
      expect(check.sql.indexOf('insert into public.user_roles')).toBeLessThan(
        check.sql.indexOf('set local role authenticated;'),
      );
      expect(check.sql.indexOf('set local role authenticated;')).toBeLessThan(
        check.sql.indexOf('public.claim_class_roster_slot'),
      );
    }
  });

  it('does not add the Lyra authorization fixture to the anonymous roster-claim denial check', () => {
    const anonClaimCheck = buildLiveRlsChecks().find(
      (check) => check.name === 'anonymous users cannot execute student roster claim RPC',
    );

    expect(anonClaimCheck.kind).toBe('deny');
    expect(anonClaimCheck.sql).toContain('set local role anon;');
    expect(anonClaimCheck.sql).not.toContain('insert into auth.users');
    expect(anonClaimCheck.sql).not.toContain('insert into public.user_roles');
  });

  it('keeps the hosted demo seed copy aligned with the authorized Lyra claim user', () => {
    const seedSql = readFileSync(
      join(process.cwd(), 'supabase', 'sql', '002_classroom_seed_demo.sql'),
      'utf8',
    );

    expect(seedSql).toContain("'00000000-0000-0000-0000-000000000303'");
    expect(seedSql).toContain("'student-lyra@asterion.invalid'");
    expect(seedSql).toContain(
      "('11000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', 'student', '10000000-0000-0000-0000-000000000001', 'active'",
    );
  });

  it('keeps setup rows and authenticated roster-claim RPC calls inside the same transaction', () => {
    const archivedClaimCheck = buildLiveRlsChecks().find(
      (check) => check.name === 'student roster claim RPC blocks archived roster slots',
    );

    expect(archivedClaimCheck.sql.indexOf('begin;')).toBeLessThan(
      archivedClaimCheck.sql.indexOf('Archived Claim Check'),
    );
    expect(archivedClaimCheck.sql.indexOf('Archived Claim Check')).toBeLessThan(
      archivedClaimCheck.sql.indexOf('set local role authenticated;'),
    );
    expect(archivedClaimCheck.sql.indexOf('set local role authenticated;')).toBeLessThan(
      archivedClaimCheck.sql.indexOf('public.claim_class_roster_slot'),
    );
    expect(archivedClaimCheck.sql.indexOf('public.claim_class_roster_slot')).toBeLessThan(
      archivedClaimCheck.sql.indexOf('rollback;'),
    );
  });

  it('returns actual roster-claim statuses for live verifier diagnostics', () => {
    const claimCheck = buildLiveRlsChecks().find(
      (check) => check.name === 'student roster claim RPC blocks missing roster names without self-add',
    );

    expect(claimCheck.kind).toBe('status_count');
    expect(claimCheck.expectedStatus).toBe('roster_name_not_found');
    expect(claimCheck.sql).toContain('actual_statuses');
    expect(claimCheck.sql).toContain('string_agg(distinct status');
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
