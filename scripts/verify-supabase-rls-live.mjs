import { spawnSync } from 'node:child_process';
import process from 'node:process';

export const liveVerificationEnv = {
  dbUrl: 'ASTERION_SUPABASE_DB_URL',
};

export const demoIds = {
  organization: '10000000-0000-0000-0000-000000000001',
  adminUser: '00000000-0000-0000-0000-000000000101',
  teacherHypatiaUser: '00000000-0000-0000-0000-000000000201',
  teacherNoetherUser: '00000000-0000-0000-0000-000000000202',
  studentOrionUser: '00000000-0000-0000-0000-000000000301',
  studentVegaUser: '00000000-0000-0000-0000-000000000302',
  studentLyraUser: '00000000-0000-0000-0000-000000000303',
  teacherHypatiaProfile: '20000000-0000-0000-0000-000000000201',
  teacherNoetherProfile: '20000000-0000-0000-0000-000000000202',
  studentOrionProfile: '30000000-0000-0000-0000-000000000301',
  studentVegaProfile: '30000000-0000-0000-0000-000000000302',
  classAlpha: '40000000-0000-0000-0000-000000000401',
  classBeta: '40000000-0000-0000-0000-000000000402',
  classArchive: '40000000-0000-0000-0000-000000000403',
  membershipOrionAlpha: '50000000-0000-0000-0000-000000000501',
  membershipLyraAlpha: '50000000-0000-0000-0000-000000000502',
  membershipVegaBeta: '50000000-0000-0000-0000-000000000503',
  snapshotOrionAlpha: '60000000-0000-0000-0000-000000000601',
  snapshotVegaBeta: '60000000-0000-0000-0000-000000000602',
};

export const requiredTables = [
  'organizations',
  'user_roles',
  'teacher_profiles',
  'student_profiles',
  'classes',
  'class_memberships',
  'class_region_access',
  'student_progress_snapshots',
  'audit_events',
];

export const expectedRegionIds = [
  'algebra-forge',
  'logarithm-grove',
  'trig-observatory',
  'complex-harbor',
  'calculus-cliffs',
  'integration-gardens',
  'vector-workshop',
  'numerical-mines',
  'differential-shrine',
];

const protectedReadTables = requiredTables;

function sqlList(values) {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(',');
}

function asRole(role, sql, userId = null) {
  const claims = userId ? `set local request.jwt.claim.sub = '${userId}';` : '';
  return `
    begin;
    set local role ${role};
    ${claims}
    ${sql}
    rollback;
  `;
}

function insertSnapshotSql({ membershipId, studentProfileId, classId }) {
  return `
    insert into public.student_progress_snapshots (
      class_membership_id,
      student_profile_id,
      class_id,
      snapshot_version,
      source,
      summary_json,
      region_summary_json
    )
    values (
      '${membershipId}',
      '${studentProfileId}',
      '${classId}',
      99,
      'local_student_app',
      '{"verify":true}'::jsonb,
      '{}'::jsonb
    );
  `;
}

function updateRegionAccessSql(classId) {
  return `
    with updated as (
      update public.class_region_access
      set access_status = access_status
      where class_id = '${classId}'
      returning 1
    )
    select count(*) from updated;
  `;
}

function insertAuditEventSql(actorUserId = 'auth.uid()') {
  return `
    insert into public.audit_events (
      organization_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      metadata
    )
    values (
      '${demoIds.organization}',
      ${actorUserId},
      'verify.audit.append',
      'organization',
      '${demoIds.organization}',
      '{"verify":true}'::jsonb
    );
  `;
}

function claimStatusCountSql({ classCode, rosterName, expectedStatus }) {
  return `
    select count(*)
    from public.claim_class_roster_slot('${classCode.replaceAll("'", "''")}', '${rosterName.replaceAll("'", "''")}')
    where status = '${expectedStatus.replaceAll("'", "''")}';
  `;
}

function setupArchivedRosterSlotSql() {
  return `
    insert into public.student_profiles (id, organization_id, display_name, status)
    values (
      '30000000-0000-0000-0000-000000000801',
      '${demoIds.organization}',
      'Archived Claim Check',
      'archived'
    );

    insert into public.class_memberships (
      id,
      class_id,
      student_profile_id,
      roster_name,
      roster_status,
      archived_at
    )
    values (
      '50000000-0000-0000-0000-000000000801',
      '${demoIds.classAlpha}',
      '30000000-0000-0000-0000-000000000801',
      'Archived Claim Check',
      'archived',
      now()
    );
  `;
}

function setupDuplicateRosterSlotSql() {
  return `
    insert into public.student_profiles (id, organization_id, display_name, status)
    values (
      '30000000-0000-0000-0000-000000000802',
      '${demoIds.organization}',
      'Lyra C.',
      'active'
    );

    insert into public.class_memberships (
      id,
      class_id,
      student_profile_id,
      roster_name,
      roster_status
    )
    values (
      '50000000-0000-0000-0000-000000000802',
      '${demoIds.classAlpha}',
      '30000000-0000-0000-0000-000000000802',
      'Lyra C.',
      'unclaimed'
    );
  `;
}

export function buildLiveRlsChecks() {
  const checks = [
    {
      name: 'seed demo rows are present',
      kind: 'count',
      expected: 1,
      sql: `
        select
          case when
            exists (select 1 from public.organizations where id = '${demoIds.organization}')
            and exists (select 1 from public.classes where id in ('${demoIds.classAlpha}', '${demoIds.classBeta}', '${demoIds.classArchive}'))
            and exists (select 1 from public.class_memberships where id in ('${demoIds.membershipOrionAlpha}', '${demoIds.membershipVegaBeta}'))
            and exists (select 1 from public.student_progress_snapshots where id in ('${demoIds.snapshotOrionAlpha}', '${demoIds.snapshotVegaBeta}'))
          then 1 else 0 end;
      `,
    },
    {
      name: 'all required public tables exist',
      kind: 'count',
      expected: requiredTables.length,
      sql: `
        select count(*)
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any(array[${sqlList(requiredTables)}]);
      `,
    },
    {
      name: 'RLS is enabled on all required public tables',
      kind: 'count',
      expected: 0,
      sql: `
        select count(*)
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = any(array[${sqlList(requiredTables)}])
          and not c.relrowsecurity;
      `,
    },
    {
      name: 'region access rows exist for expected seeded class and region combinations',
      kind: 'count',
      expected: 0,
      sql: `
        with expected as (
          select c.class_id, r.region_id
          from unnest(array['${demoIds.classAlpha}', '${demoIds.classBeta}', '${demoIds.classArchive}']::uuid[]) as c(class_id)
          cross join unnest(array[${sqlList(expectedRegionIds)}]) as r(region_id)
        )
        select count(*)
        from expected e
        where not exists (
          select 1
          from public.class_region_access cra
          where cra.class_id = e.class_id
            and cra.region_id = e.region_id
        );
      `,
    },
  ];

  for (const table of protectedReadTables) {
    checks.push({
      name: `anonymous users cannot read protected table ${table}`,
      kind: 'deny_or_zero',
      sql: asRole('anon', `select count(*) from public.${table};`),
    });
  }

  checks.push(
    {
      name: 'unauthenticated users cannot insert progress snapshots',
      kind: 'deny',
      sql: asRole(
        'anon',
        insertSnapshotSql({
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          classId: demoIds.classAlpha,
        }),
      ),
    },
    {
      name: 'student can read own claimed membership',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_memberships where id = '${demoIds.membershipOrionAlpha}';`,
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot read other membership contexts',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_memberships where id in ('${demoIds.membershipLyraAlpha}', '${demoIds.membershipVegaBeta}');`,
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student can read own class context',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `select count(*) from public.classes where id = '${demoIds.classAlpha}';`,
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student can read only their own class context',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.classes where id <> '${demoIds.classAlpha}';`,
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot create roster entries or self-add',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        `
          insert into public.class_memberships (class_id, student_profile_id, roster_name, roster_status)
          values (
            '${demoIds.classAlpha}',
            '${demoIds.studentVegaProfile}',
            'Verification row',
            'unclaimed'
          );
        `,
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student can insert snapshot for own claimed membership',
      kind: 'allow',
      sql: asRole(
        'authenticated',
        insertSnapshotSql({
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          classId: demoIds.classAlpha,
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot insert snapshot for another membership',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        insertSnapshotSql({
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          classId: demoIds.classAlpha,
        }),
        demoIds.studentVegaUser,
      ),
    },
    {
      name: 'teacher can read assigned classes',
      kind: 'count',
      expected: 2,
      sql: asRole(
        'authenticated',
        `select count(*) from public.classes where id in ('${demoIds.classAlpha}', '${demoIds.classBeta}');`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot read unassigned classes',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.classes where id = '${demoIds.classArchive}';`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher can read assigned roster rows',
      kind: 'count',
      expected: 3,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_memberships where class_id in ('${demoIds.classAlpha}', '${demoIds.classBeta}');`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot read unassigned roster rows',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_memberships where class_id = '${demoIds.classArchive}';`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher can read assigned class region access',
      kind: 'count',
      expected: expectedRegionIds.length * 2,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_region_access where class_id in ('${demoIds.classAlpha}', '${demoIds.classBeta}');`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot read unassigned class region access',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.class_region_access where class_id = '${demoIds.classArchive}';`,
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher can manage assigned class region access',
      kind: 'count',
      expected: expectedRegionIds.length,
      sql: asRole('authenticated', updateRegionAccessSql(demoIds.classAlpha), demoIds.teacherHypatiaUser),
    },
    {
      name: 'teacher cannot manage unassigned class region access',
      kind: 'count',
      expected: 0,
      sql: asRole('authenticated', updateRegionAccessSql(demoIds.classArchive), demoIds.teacherHypatiaUser),
    },
    {
      name: 'admin can read setup and support data',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `
          select
            case when
              exists (select 1 from public.organizations where id = '${demoIds.organization}')
              and exists (select 1 from public.user_roles where organization_id = '${demoIds.organization}')
              and exists (select 1 from public.teacher_profiles where id = '${demoIds.teacherHypatiaProfile}')
              and exists (select 1 from public.student_profiles where id = '${demoIds.studentOrionProfile}')
              and exists (select 1 from public.classes where id = '${demoIds.classAlpha}')
              and exists (select 1 from public.audit_events where organization_id = '${demoIds.organization}')
            then 1 else 0 end;
        `,
        demoIds.adminUser,
      ),
    },
    {
      name: 'unauthenticated users cannot insert audit events',
      kind: 'deny',
      sql: asRole('anon', insertAuditEventSql('null')),
    },
    {
      name: 'authenticated user cannot insert audit event for another actor',
      kind: 'deny',
      sql: asRole('authenticated', insertAuditEventSql(`'${demoIds.teacherHypatiaUser}'`), demoIds.studentOrionUser),
    },
    {
      name: 'authenticated user can append own audit event',
      kind: 'allow',
      sql: asRole('authenticated', insertAuditEventSql('auth.uid()'), demoIds.studentOrionUser),
    },
    {
      name: 'student roster claim RPC claims an existing unclaimed slot',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Lyra C.', expectedStatus: 'claimed' }),
        demoIds.studentLyraUser,
      ),
    },
    {
      name: 'student roster claim RPC blocks a second claim of the same slot',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `
          select count(*)
          from (
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Lyra C.')
            union all
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Lyra C.')
          ) results
          where status = 'already_claimed';
        `,
        demoIds.studentLyraUser,
      ),
    },
    {
      name: 'student roster claim RPC blocks archived roster slots',
      kind: 'count',
      expected: 1,
      sql: `
        begin;
        ${setupArchivedRosterSlotSql()}
        set local role authenticated;
        set local request.jwt.claim.sub = '${demoIds.studentLyraUser}';
        ${claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Archived Claim Check', expectedStatus: 'archived' })}
        rollback;
      `,
    },
    {
      name: 'student roster claim RPC reports already claimed roster slots',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Orion A.', expectedStatus: 'already_claimed' }),
        demoIds.studentLyraUser,
      ),
    },
    {
      name: 'student roster claim RPC blocks missing roster names without self-add',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `
          with claim as (
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Self Add Verification')
          )
          select count(*)
          from claim
          where status = 'roster_name_not_found'
            and not exists (
              select 1
              from public.class_memberships
              where class_id = '${demoIds.classAlpha}'
                and roster_name = 'Self Add Verification'
            );
        `,
        demoIds.studentLyraUser,
      ),
    },
    {
      name: 'student roster claim RPC blocks duplicate roster-name ambiguity',
      kind: 'count',
      expected: 1,
      sql: `
        begin;
        ${setupDuplicateRosterSlotSql()}
        set local role authenticated;
        set local request.jwt.claim.sub = '${demoIds.studentLyraUser}';
        ${claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Lyra C.', expectedStatus: 'ambiguous_roster_name' })}
        rollback;
      `,
    },
    {
      name: 'anonymous users cannot execute student roster claim RPC',
      kind: 'deny',
      sql: asRole('anon', `select * from public.claim_class_roster_slot('AST-P3A', 'Lyra C.');`),
    },
  );

  return checks;
}

export function sanitizeDiagnostic(value) {
  return String(value)
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted database url]')
    .replace(/(password=)[^\s]+/gi, '$1[redacted]')
    .replace(/(access_token|refresh_token|service_role|jwt_secret|apikey|authorization)=?[^\s]*/gi, '$1=[redacted]')
    .trim();
}

function commandExists(command) {
  const result = spawnSync('command', ['-v', command], {
    shell: true,
    stdio: 'ignore',
  });
  return result.status === 0;
}

function getRequiredDbUrl(env) {
  const dbUrl = env[liveVerificationEnv.dbUrl];
  if (!dbUrl) {
    throw new Error(
      `Missing required server-only env var ${liveVerificationEnv.dbUrl}. Set it only in a local shell or CI secret store; do not add it to Vite env.`,
    );
  }
  return dbUrl;
}

function assertNoViteSecretEnv(env) {
  const unsafeNames = Object.keys(env).filter((name) =>
    /^VITE_/.test(name) && /(DB|DATABASE|PASSWORD|SECRET|SERVICE|JWT|TOKEN|KEY)/i.test(name)
      ? !['VITE_SUPABASE_PUBLISHABLE_KEY'].includes(name)
      : false,
  );

  if (unsafeNames.length > 0) {
    throw new Error(`Refusing live verification because Vite env contains server-looking secret names: ${unsafeNames.join(', ')}`);
  }
}

function runPsql(dbUrl, sql) {
  return spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-Atqc', sql], {
    encoding: 'utf8',
  });
}

function parseCount(stdout) {
  const value = Number(stdout.trim());
  if (!Number.isFinite(value)) {
    throw new Error(`Expected numeric count, received: ${sanitizeDiagnostic(stdout) || '[empty output]'}`);
  }
  return value;
}

function evaluateCheck(check, result) {
  const output = result.stdout.trim();
  const diagnostic = sanitizeDiagnostic(result.stderr || result.stdout);

  if (check.kind === 'deny') {
    return result.status === 0
      ? { ok: false, detail: 'operation unexpectedly succeeded' }
      : { ok: true, detail: 'denied as expected' };
  }

  if (check.kind === 'allow') {
    return result.status === 0
      ? { ok: true, detail: 'allowed as expected' }
      : { ok: false, detail: diagnostic || 'operation was unexpectedly denied' };
  }

  if (check.kind === 'deny_or_zero') {
    if (result.status !== 0) return { ok: true, detail: 'denied as expected' };
    const count = parseCount(output);
    return count === 0
      ? { ok: true, detail: 'visible rows: 0' }
      : { ok: false, detail: `visible rows: ${count}` };
  }

  if (result.status !== 0) {
    return { ok: false, detail: diagnostic || 'query failed' };
  }

  const count = parseCount(output);
  return count === check.expected
    ? { ok: true, detail: `count: ${count}` }
    : { ok: false, detail: `expected count ${check.expected}, got ${count}` };
}

export function summarizeChecks(results) {
  const failed = results.filter((result) => !result.ok);
  return {
    passed: results.length - failed.length,
    failed: failed.length,
    total: results.length,
    failures: failed.map(({ name, detail }) => ({ name, detail })),
  };
}

export function runLiveRlsVerification({ env = process.env } = {}) {
  assertNoViteSecretEnv(env);

  if (!commandExists('psql')) {
    throw new Error('psql is required for live Supabase RLS verification but was not found on PATH.');
  }

  const dbUrl = getRequiredDbUrl(env);
  const ping = runPsql(dbUrl, 'select 1;');
  if (ping.status !== 0) {
    throw new Error(`Could not connect to the live Supabase database: ${sanitizeDiagnostic(ping.stderr || ping.stdout)}`);
  }

  return buildLiveRlsChecks().map((check) => {
    try {
      return {
        name: check.name,
        ...evaluateCheck(check, runPsql(dbUrl, check.sql)),
      };
    } catch (error) {
      return {
        name: check.name,
        ok: false,
        detail: sanitizeDiagnostic(error instanceof Error ? error.message : error),
      };
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const results = runLiveRlsVerification();
    const summary = summarizeChecks(results);

    console.log(`Live Supabase RLS verification: ${summary.passed}/${summary.total} passed, ${summary.failed} failed.`);

    if (summary.failed > 0) {
      for (const failure of summary.failures) {
        console.error(`FAIL ${failure.name}: ${failure.detail}`);
      }
      process.exit(1);
    }

    console.log('No secrets were printed. Live RLS checks passed.');
  } catch (error) {
    console.error(sanitizeDiagnostic(error instanceof Error ? error.message : error));
    process.exit(1);
  }
}
