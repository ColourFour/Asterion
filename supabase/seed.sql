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
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin-demo@asterion.invalid',
    extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Demo Admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teacher-hypatia@asterion.invalid',
    extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Teacher Hypatia"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teacher-noether@asterion.invalid',
    extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Teacher Noether"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'student-orion@asterion.invalid',
    extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Student Orion"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'student-vega@asterion.invalid',
    extensions.crypt('asterion-demo-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Student Vega"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000303',
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
on conflict (id) do nothing;

insert into public.organizations (id, name, status, created_at, updated_at)
values (
  '10000000-0000-0000-0000-000000000001',
  'Asterion Demo',
  'active',
  '2026-05-01T08:00:00Z',
  '2026-05-15T09:20:00Z'
)
on conflict (id) do update
set name = excluded.name,
    status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.user_roles (id, user_id, role, organization_id, status, created_at, updated_at)
values
  ('11000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000101', 'admin', '10000000-0000-0000-0000-000000000001', 'active', now(), now()),
  ('11000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', 'teacher', '10000000-0000-0000-0000-000000000001', 'active', now(), now()),
  ('11000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000202', 'teacher', '10000000-0000-0000-0000-000000000001', 'active', now(), now()),
  ('11000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', 'student', '10000000-0000-0000-0000-000000000001', 'active', now(), now()),
  ('11000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', 'student', '10000000-0000-0000-0000-000000000001', 'active', now(), now()),
  ('11000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', 'student', '10000000-0000-0000-0000-000000000001', 'active', now(), now())
on conflict (user_id, organization_id, role) do update
set status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.teacher_profiles (id, user_id, organization_id, display_name, email, status, created_at, updated_at)
values
  ('20000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001', 'Teacher Hypatia', 'teacher-hypatia@asterion.invalid', 'active', '2026-04-18T08:00:00Z', '2026-05-15T09:12:00Z'),
  ('20000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000001', 'Teacher Noether', 'teacher-noether@asterion.invalid', 'active', '2026-04-18T08:00:00Z', '2026-05-14T15:45:00Z')
on conflict (id) do update
set display_name = excluded.display_name,
    email = excluded.email,
    status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.student_profiles (id, user_id, organization_id, display_name, optional_email, status, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000001', 'Orion A.', null, 'active', '2026-05-01T09:00:00Z', '2026-05-15T09:20:00Z'),
  ('30000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', '10000000-0000-0000-0000-000000000001', 'Vega B.', null, 'active', '2026-05-01T09:00:00Z', '2026-05-15T09:20:00Z'),
  ('30000000-0000-0000-0000-000000000303', null, '10000000-0000-0000-0000-000000000001', 'Lyra C.', null, 'active', '2026-05-01T09:00:00Z', '2026-05-15T09:20:00Z'),
  ('30000000-0000-0000-0000-000000000304', null, '10000000-0000-0000-0000-000000000001', 'Archive Student', null, 'archived', '2025-09-01T08:00:00Z', '2026-01-10T08:00:00Z')
on conflict (id) do update
set user_id = excluded.user_id,
    display_name = excluded.display_name,
    optional_email = excluded.optional_email,
    status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.classes (id, organization_id, teacher_id, name, course_code, academic_year_or_term, class_code, status, created_at, updated_at)
values
  ('40000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000201', 'P3 Alpha', 'CAIE_9709_P3', '2026 Term 2', 'AST-P3A', 'active', '2026-04-20T08:00:00Z', '2026-05-15T09:20:00Z'),
  ('40000000-0000-0000-0000-000000000402', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000201', 'P3 Beta', 'CAIE_9709_P3', '2026 Term 2', 'AST-P3B', 'active', '2026-04-22T08:00:00Z', '2026-05-15T09:20:00Z'),
  ('40000000-0000-0000-0000-000000000403', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000202', 'P3 Archive 2025', 'CAIE_9709_P3', '2025 Term 3', 'AST-OLD', 'archived', '2025-09-01T08:00:00Z', '2026-01-10T08:00:00Z')
on conflict (id) do update
set teacher_id = excluded.teacher_id,
    name = excluded.name,
    course_code = excluded.course_code,
    academic_year_or_term = excluded.academic_year_or_term,
    class_code = excluded.class_code,
    status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.class_memberships (
  id,
  class_id,
  student_profile_id,
  roster_name,
  roster_status,
  claimed_by_user_id,
  claimed_at,
  archived_at,
  created_at,
  updated_at
)
values
  ('50000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000301', 'Orion A.', 'claimed', '00000000-0000-0000-0000-000000000301', '2026-05-03T09:15:00Z', null, '2026-05-01T09:00:00Z', '2026-05-03T09:15:00Z'),
  ('50000000-0000-0000-0000-000000000502', '40000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000303', 'Lyra C.', 'unclaimed', null, null, null, '2026-05-01T09:10:00Z', '2026-05-01T09:10:00Z'),
  ('50000000-0000-0000-0000-000000000503', '40000000-0000-0000-0000-000000000402', '30000000-0000-0000-0000-000000000302', 'Vega B.', 'claimed', '00000000-0000-0000-0000-000000000302', '2026-05-04T10:30:00Z', null, '2026-05-01T09:20:00Z', '2026-05-04T10:30:00Z'),
  ('50000000-0000-0000-0000-000000000504', '40000000-0000-0000-0000-000000000403', '30000000-0000-0000-0000-000000000304', 'Archive Student', 'archived', null, null, '2026-01-10T08:00:00Z', '2025-09-01T08:30:00Z', '2026-01-10T08:00:00Z')
on conflict (id) do update
set roster_name = excluded.roster_name,
    roster_status = excluded.roster_status,
    claimed_by_user_id = excluded.claimed_by_user_id,
    claimed_at = excluded.claimed_at,
    archived_at = excluded.archived_at,
    updated_at = excluded.updated_at;

insert into public.class_region_access (class_id, region_id, access_status, updated_by_user_id, updated_at, created_at)
select
  c.id,
  r.region_id,
  case
    when c.id = '40000000-0000-0000-0000-000000000401' and r.region_id in ('algebra-forge', 'logarithm-grove', 'trig-observatory') then 'open'
    when c.id = '40000000-0000-0000-0000-000000000402' and r.region_id in ('algebra-forge', 'trig-observatory', 'calculus-cliffs') then 'open'
    when c.id = '40000000-0000-0000-0000-000000000403' and r.region_id = 'algebra-forge' then 'open'
    else 'field_guide_only'
  end,
  case
    when c.id = '40000000-0000-0000-0000-000000000403' then '00000000-0000-0000-0000-000000000101'::uuid
    else '00000000-0000-0000-0000-000000000201'::uuid
  end,
  '2026-05-15T09:20:00Z',
  '2026-05-01T08:00:00Z'
from public.classes c
cross join (
  values
    ('algebra-forge'),
    ('logarithm-grove'),
    ('trig-observatory'),
    ('complex-harbor'),
    ('calculus-cliffs'),
    ('integration-gardens'),
    ('vector-workshop'),
    ('numerical-mines'),
    ('differential-shrine')
) as r(region_id)
on conflict (class_id, region_id) do update
set access_status = excluded.access_status,
    updated_by_user_id = excluded.updated_by_user_id,
    updated_at = excluded.updated_at;

insert into public.student_progress_snapshots (
  id,
  class_membership_id,
  student_profile_id,
  class_id,
  snapshot_version,
  source,
  summary_json,
  region_summary_json,
  created_at
)
values
  (
    '60000000-0000-0000-0000-000000000601',
    '50000000-0000-0000-0000-000000000501',
    '30000000-0000-0000-0000-000000000301',
    '40000000-0000-0000-0000-000000000401',
    1,
    'local_student_app',
    '{"schemaVersion":1,"paperFamily":"p3","generatedAt":"2026-05-15T09:20:00Z","attemptCount":8,"masteryEligibleAttemptCount":7,"learningActivityAttemptCount":4,"issueReportCount":0,"regionsStarted":2,"guardianReadyRegionCount":1,"guardianClearedRegionCount":0,"openRegionCount":9,"fieldGuideOnlyRegionCount":0,"lastActivityAt":"2026-05-15T09:20:00Z"}'::jsonb,
    '{"algebra-forge":{"regionId":"algebra-forge","rank":"Bronze","status":"guardian_unlocked","progressRatio":0.58,"attemptCount":5,"totalMarksEarned":29,"totalMarksAvailable":50,"guardianStatus":"ready","fieldGuideStatus":"completed","accessStatus":"open","lastActivityAt":"2026-05-15T09:20:00Z"},"logarithm-grove":{"regionId":"logarithm-grove","rank":"Discovered","status":"training_in_progress","progressRatio":0.25,"attemptCount":3,"totalMarksEarned":9,"totalMarksAvailable":36,"guardianStatus":"locked","fieldGuideStatus":"started","accessStatus":"open","lastActivityAt":"2026-05-14T15:00:00Z"}}'::jsonb,
    '2026-05-15T09:20:00Z'
  ),
  (
    '60000000-0000-0000-0000-000000000602',
    '50000000-0000-0000-0000-000000000503',
    '30000000-0000-0000-0000-000000000302',
    '40000000-0000-0000-0000-000000000402',
    1,
    'local_student_app',
    '{"schemaVersion":1,"paperFamily":"p3","generatedAt":"2026-05-12T11:00:00Z","attemptCount":3,"masteryEligibleAttemptCount":3,"learningActivityAttemptCount":1,"issueReportCount":0,"regionsStarted":1,"guardianReadyRegionCount":0,"guardianClearedRegionCount":0,"openRegionCount":8,"fieldGuideOnlyRegionCount":1,"lastActivityAt":"2026-05-12T11:00:00Z"}'::jsonb,
    '{"trig-observatory":{"regionId":"trig-observatory","rank":"Discovered","status":"available","progressRatio":0,"attemptCount":0,"totalMarksEarned":0,"totalMarksAvailable":0,"guardianStatus":"locked","fieldGuideStatus":"not_started","accessStatus":"open"},"calculus-cliffs":{"regionId":"calculus-cliffs","rank":"Dormant","status":"locked","progressRatio":0,"attemptCount":0,"totalMarksEarned":0,"totalMarksAvailable":0,"guardianStatus":"locked","fieldGuideStatus":"not_started","accessStatus":"field_guide_only"}}'::jsonb,
    '2026-05-12T11:00:00Z'
  )
on conflict (id) do nothing;

insert into public.audit_events (id, organization_id, actor_user_id, event_type, entity_type, entity_id, metadata, created_at)
values
  ('70000000-0000-0000-0000-000000000701', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'seed.organization.created', 'organization', '10000000-0000-0000-0000-000000000001', '{"source":"seed"}'::jsonb, '2026-05-01T08:00:00Z'),
  ('70000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'seed.roster.created', 'class', '40000000-0000-0000-0000-000000000401', '{"source":"seed"}'::jsonb, '2026-05-01T09:00:00Z')
on conflict (id) do nothing;
