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
  studentArchiveProfile: '30000000-0000-0000-0000-000000000304',
  classAlpha: '40000000-0000-0000-0000-000000000401',
  classBeta: '40000000-0000-0000-0000-000000000402',
  classArchive: '40000000-0000-0000-0000-000000000403',
  membershipOrionAlpha: '50000000-0000-0000-0000-000000000501',
  membershipLyraAlpha: '50000000-0000-0000-0000-000000000502',
  membershipVegaBeta: '50000000-0000-0000-0000-000000000503',
  membershipArchive: '50000000-0000-0000-0000-000000000504',
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
  'student_progress_events',
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

function sqlString(value) {
  return String(value).replaceAll("'", "''");
}

function asRole(role, sql, userId = null, setupSql = '') {
  const jwtClaims = {
    role,
    ...(userId ? { sub: userId } : {}),
  };
  const userClaims = userId
    ? `
    set local request.jwt.claim.sub = '${sqlString(userId)}';`
    : '';

  return `
    begin;
    ${setupSql}
    set local role ${role};
    set local request.jwt.claim.role = '${sqlString(role)}';
    set local request.jwt.claims = '${sqlString(JSON.stringify(jwtClaims))}';
    ${userClaims}
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
      '{"schemaVersion":1,"paperFamily":"p3","generatedAt":"2026-05-19T00:00:00Z","attemptCount":0,"masteryEligibleAttemptCount":0,"learningActivityAttemptCount":0,"issueReportCount":0,"regionsStarted":0,"guardianReadyRegionCount":0,"guardianClearedRegionCount":0,"openRegionCount":9,"fieldGuideOnlyRegionCount":0}'::jsonb,
      '{"algebra-forge":{"regionId":"algebra-forge","rank":"Discovered","status":"available","progressRatio":0,"attemptCount":0,"totalMarksEarned":0,"totalMarksAvailable":0,"guardianStatus":"locked","fieldGuideStatus":"not_started","accessStatus":"open"}}'::jsonb
    );
  `;
}

function recordProgressEventCountSql({
  classId,
  membershipId,
  studentProfileId,
  regionId,
  activityType,
  eventType,
  questionId = null,
  payload = '{}',
}) {
  return `
    with event_row as (
      select *
      from public.record_student_progress_event(
        '${classId}',
        '${membershipId}',
        '${studentProfileId}',
        '${sqlString(regionId)}',
        '${sqlString(activityType)}',
        '${sqlString(eventType)}',
        null,
        ${questionId ? `'${sqlString(questionId)}'` : 'null'},
        null,
        '${sqlString(payload)}'::jsonb
      )
    )
    select count(*) from event_row where event_type = '${sqlString(eventType)}';
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

function setRegionAccessRpcCountSql({ classId, regionId, accessStatus }) {
  return `
    with updated as (
      select *
      from public.set_class_region_access(
        '${classId}',
        '${sqlString(regionId)}',
        '${sqlString(accessStatus)}'
      )
    )
    select count(*) from updated where access_status = '${sqlString(accessStatus)}';
  `;
}

function createClassWithRegionAccessCountSql({ teacherId, className, classCode }) {
  return `
    with created as (
      select id
      from public.create_class_with_region_access(
        '${teacherId}',
        '${sqlString(className)}',
        '2026 Verification',
        '${sqlString(classCode)}'
      )
    )
    select count(*)
    from created c
    join public.class_region_access cra on cra.class_id = c.id
    where cra.access_status = 'field_guide_only'
      and cra.region_id = any(array[${sqlList(expectedRegionIds)}]);
  `;
}

function addTeacherByEmailCountSql({ email, displayName }) {
  return `
    with teacher as (
      select *
      from public.admin_add_teacher_by_email(
        '${sqlString(email)}',
        '${sqlString(displayName)}',
        '${demoIds.organization}'
      )
    )
    select count(*) from teacher where lower(email) = lower('${sqlString(email)}');
  `;
}

function addRosterStudentCountSql({ classId, rosterName }) {
  return `
    with roster as (
      select *
      from public.add_class_roster_student(
        '${classId}',
        '${sqlString(rosterName)}'
      )
    )
    select count(*)
    from roster
    where roster_name = '${sqlString(rosterName)}'
      and roster_status = 'unclaimed'
      and claimed_by_user_id is null
      and claimed_at is null;
  `;
}

function archiveRosterStudentCountSql({ membershipId }) {
  return `
    with archived as (
      select *
      from public.archive_class_roster_student('${membershipId}')
    )
    select count(*)
    from archived
    where roster_status = 'archived'
      and claimed_by_user_id is null
      and claimed_at is null
      and archived_at is not null;
  `;
}

function resetRosterClaimCountSql({ membershipId }) {
  return `
    with reset_claim as (
      select *
      from public.reset_class_roster_claim('${membershipId}')
    )
    select count(*)
    from reset_claim
    where roster_status = 'unclaimed'
      and claimed_by_user_id is null
      and claimed_at is null
      and archived_at is null;
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

function setupAuthorizedLyraClaimUserSql() {
  return `
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '${demoIds.studentLyraUser}',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'student-lyra@asterion.invalid',
      extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Student Lyra"}'::jsonb,
      now(),
      now()
    )
    on conflict (id) do update
    set aud = excluded.aud,
        role = excluded.role,
        email = excluded.email,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = excluded.updated_at;

    insert into public.user_roles (id, user_id, role, organization_id, status, created_at, updated_at)
    values (
      '11000000-0000-0000-0000-000000000303',
      '${demoIds.studentLyraUser}',
      'student',
      '${demoIds.organization}',
      'active',
      now(),
      now()
    )
    on conflict (user_id, organization_id, role) do update
    set status = excluded.status,
        updated_at = excluded.updated_at;
  `;
}

function claimStatusCountSql({ classCode, rosterName, expectedStatus }) {
  return `
    with claim_result as (
      select status
      from public.claim_class_roster_slot('${sqlString(classCode)}', '${sqlString(rosterName)}')
    )
    select
      count(*) filter (where status = '${sqlString(expectedStatus)}') as matched_count,
      coalesce(string_agg(distinct status, ',' order by status), '[none]') as actual_statuses
    from claim_result;
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
      name: 'student cannot insert local progress snapshots for own claimed membership',
      kind: 'deny',
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
      name: 'student can record field guide event for field-guide-only region',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classAlpha,
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          regionId: 'complex-harbor',
          activityType: 'field_guide',
          eventType: 'field_guide_completed',
          payload: '{"completed":true}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot record quick check event for field-guide-only region',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classAlpha,
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          regionId: 'complex-harbor',
          activityType: 'quick_check',
          eventType: 'quick_check_completed',
          payload: '{"outcome":"got_it","completed":true}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student can record practice event for open region',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classAlpha,
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          regionId: 'algebra-forge',
          activityType: 'exam_practice',
          eventType: 'practice_attempt_saved',
          questionId: '9709_s23_qp32_q1',
          payload: '{"scoreRatio":0.75,"marksEarned":6,"marksAvailable":8,"durationSeconds":240}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot record progress event for another membership',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classBeta,
          membershipId: demoIds.membershipVegaBeta,
          studentProfileId: demoIds.studentVegaProfile,
          regionId: 'algebra-forge',
          activityType: 'exam_practice',
          eventType: 'practice_attempt_saved',
          questionId: '9709_s23_qp32_q1',
          payload: '{"scoreRatio":0.75}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot record event with wrong class or student profile context',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classBeta,
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentVegaProfile,
          regionId: 'algebra-forge',
          activityType: 'exam_practice',
          eventType: 'practice_attempt_saved',
          payload: '{"scoreRatio":0.75}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'student cannot record hosted progress payload with raw learner data keys',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        recordProgressEventCountSql({
          classId: demoIds.classAlpha,
          membershipId: demoIds.membershipOrionAlpha,
          studentProfileId: demoIds.studentOrionProfile,
          regionId: 'algebra-forge',
          activityType: 'exam_practice',
          eventType: 'practice_attempt_saved',
          questionId: '9709_s23_qp32_q1',
          payload: '{"scoreRatio":0.75,"learnerResponse":"raw"}',
        }),
        demoIds.studentOrionUser,
      ),
    },
    {
      name: 'teacher can read assigned hosted progress events',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        `select count(*) from public.student_progress_events where class_id = '${demoIds.classAlpha}';`,
        demoIds.teacherHypatiaUser,
        `
          insert into public.student_profiles (
            id,
            organization_id,
            user_id,
            display_name,
            status
          )
          values (
            '30000000-0000-0000-0000-000000000901',
            '${demoIds.organization}',
            '${demoIds.studentVegaUser}',
            'Verifier Other Class Student',
            'active'
          );

          insert into public.class_memberships (
            id,
            class_id,
            student_profile_id,
            roster_name,
            roster_status,
            claimed_by_user_id,
            claimed_at
          )
          values (
            '50000000-0000-0000-0000-000000000901',
            '${demoIds.classArchive}',
            '30000000-0000-0000-0000-000000000901',
            'Verifier Other Class Student',
            'claimed',
            '${demoIds.studentVegaUser}',
            now()
          );

          insert into public.student_progress_events (
            organization_id,
            class_id,
            class_membership_id,
            student_profile_id,
            actor_user_id,
            region_id,
            activity_type,
            question_id,
            event_type,
            event_payload
          )
          values (
            '${demoIds.organization}',
            '${demoIds.classAlpha}',
            '${demoIds.membershipOrionAlpha}',
            '${demoIds.studentOrionProfile}',
            '${demoIds.studentOrionUser}',
            'algebra-forge',
            'exam_practice',
            '9709_s23_qp32_q1',
            'practice_attempt_saved',
            '{"scoreRatio":0.75}'::jsonb
          );
        `,
      ),
    },
    {
      name: 'teacher cannot read hosted progress events for another teacher class',
      kind: 'count',
      expected: 0,
      sql: asRole(
        'authenticated',
        `select count(*) from public.student_progress_events where class_id = '${demoIds.classArchive}';`,
        demoIds.teacherHypatiaUser,
        `
          insert into public.student_progress_events (
            organization_id,
            class_id,
            class_membership_id,
            student_profile_id,
            actor_user_id,
            region_id,
            activity_type,
            question_id,
            event_type,
            event_payload
          )
          values (
            '${demoIds.organization}',
            '${demoIds.classArchive}',
            '50000000-0000-0000-0000-000000000901',
            '30000000-0000-0000-0000-000000000901',
            '${demoIds.studentVegaUser}',
            'algebra-forge',
            'exam_practice',
            '9709_s23_qp32_q1',
            'practice_attempt_saved',
            '{"scoreRatio":0.75}'::jsonb
          );
        `,
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
      name: 'assigned teacher can update region access through RPC',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        setRegionAccessRpcCountSql({
          classId: demoIds.classAlpha,
          regionId: 'algebra-forge',
          accessStatus: 'open',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot update unassigned region access through RPC',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        setRegionAccessRpcCountSql({
          classId: demoIds.classArchive,
          regionId: 'algebra-forge',
          accessStatus: 'open',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'assigned teacher can add unclaimed roster slot through RPC',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        addRosterStudentCountSql({
          classId: demoIds.classAlpha,
          rosterName: 'Verifier Added Student',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot add roster slot to unassigned class through RPC',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        addRosterStudentCountSql({
          classId: demoIds.classArchive,
          rosterName: 'Verifier Wrong Class Student',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'assigned teacher can archive roster slot through RPC',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        archiveRosterStudentCountSql({ membershipId: demoIds.membershipLyraAlpha }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot archive unassigned roster slot through RPC',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        archiveRosterStudentCountSql({ membershipId: demoIds.membershipVegaBeta }),
        demoIds.teacherNoetherUser,
      ),
    },
    {
      name: 'assigned teacher can reset claimed roster slot through RPC',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        resetRosterClaimCountSql({ membershipId: demoIds.membershipOrionAlpha }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot reset unassigned roster slot through RPC',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        resetRosterClaimCountSql({ membershipId: demoIds.membershipVegaBeta }),
        demoIds.teacherNoetherUser,
      ),
    },
    {
      name: 'teacher can create own class with all regions field guide only',
      kind: 'count',
      expected: expectedRegionIds.length,
      sql: asRole(
        'authenticated',
        createClassWithRegionAccessCountSql({
          teacherId: demoIds.teacherHypatiaProfile,
          className: 'Verifier Teacher Class',
          classCode: 'AST-VT1',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'teacher cannot create class for another teacher',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        createClassWithRegionAccessCountSql({
          teacherId: demoIds.teacherNoetherProfile,
          className: 'Verifier Wrong Teacher Class',
          classCode: 'AST-VT2',
        }),
        demoIds.teacherHypatiaUser,
      ),
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
      name: 'admin can attach existing auth user as teacher',
      kind: 'count',
      expected: 1,
      sql: asRole(
        'authenticated',
        addTeacherByEmailCountSql({
          email: 'teacher-noether@asterion.invalid',
          displayName: 'Teacher Noether Verification',
        }),
        demoIds.adminUser,
      ),
    },
    {
      name: 'teacher cannot self-assign teacher role through admin RPC',
      kind: 'deny',
      sql: asRole(
        'authenticated',
        addTeacherByEmailCountSql({
          email: 'teacher-hypatia@asterion.invalid',
          displayName: 'Teacher Hypatia Self Assign',
        }),
        demoIds.teacherHypatiaUser,
      ),
    },
    {
      name: 'admin can create class for active teacher with all regions field guide only',
      kind: 'count',
      expected: expectedRegionIds.length,
      sql: asRole(
        'authenticated',
        createClassWithRegionAccessCountSql({
          teacherId: demoIds.teacherNoetherProfile,
          className: 'Verifier Admin Class',
          classCode: 'AST-VA1',
        }),
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
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'claimed',
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Lyra C.', expectedStatus: 'claimed' }),
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql(),
      ),
    },
    {
      name: 'student roster claim RPC blocks a second claim of the same slot',
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'already_claimed',
      sql: asRole(
        'authenticated',
        `
          with claim_result as (
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Lyra C.')
            union all
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Lyra C.')
          )
          select
            count(*) filter (where status = 'already_claimed') as matched_count,
            coalesce(string_agg(distinct status, ',' order by status), '[none]') as actual_statuses
          from claim_result;
        `,
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql(),
      ),
    },
    {
      name: 'student roster claim RPC blocks archived roster slots',
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'archived',
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Archived Claim Check', expectedStatus: 'archived' }),
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql() + setupArchivedRosterSlotSql(),
      ),
    },
    {
      name: 'student roster claim RPC reports already claimed roster slots',
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'already_claimed',
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Orion A.', expectedStatus: 'already_claimed' }),
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql(),
      ),
    },
    {
      name: 'student roster claim RPC blocks missing roster names without self-add',
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'roster_name_not_found',
      sql: asRole(
        'authenticated',
        `
          with claim as (
            select status
            from public.claim_class_roster_slot('AST-P3A', 'Self Add Verification')
          )
          select
            count(*) filter (
              where status = 'roster_name_not_found'
                and not exists (
                  select 1
                  from public.class_memberships
                  where class_id = '${demoIds.classAlpha}'
                    and roster_name = 'Self Add Verification'
                )
            ) as matched_count,
            coalesce(string_agg(distinct status, ',' order by status), '[none]') as actual_statuses
          from claim;
        `,
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql(),
      ),
    },
    {
      name: 'student roster claim RPC blocks duplicate roster-name ambiguity',
      kind: 'status_count',
      expected: 1,
      expectedStatus: 'ambiguous_roster_name',
      sql: asRole(
        'authenticated',
        claimStatusCountSql({ classCode: 'AST-P3A', rosterName: 'Lyra C.', expectedStatus: 'ambiguous_roster_name' }),
        demoIds.studentLyraUser,
        setupAuthorizedLyraClaimUserSql() + setupDuplicateRosterSlotSql(),
      ),
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

function parseStatusCount(stdout) {
  const line = stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .at(-1);
  if (!line) {
    throw new Error('Expected status count row, received: [empty output]');
  }

  const [countValue, actualStatuses = '[none]'] = line.split('|');
  const count = Number(countValue);
  if (!Number.isFinite(count)) {
    throw new Error(`Expected status count row, received: ${sanitizeDiagnostic(stdout) || '[empty output]'}`);
  }

  return {
    count,
    actualStatuses: sanitizeDiagnostic(actualStatuses),
  };
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

  if (check.kind === 'status_count') {
    const { count, actualStatuses } = parseStatusCount(output);
    return count === check.expected
      ? { ok: true, detail: `status ${check.expectedStatus}: ${count}` }
      : {
          ok: false,
          detail: `expected status ${check.expectedStatus} count ${check.expected}, got ${count}; actual statuses: ${actualStatuses}`,
        };
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
