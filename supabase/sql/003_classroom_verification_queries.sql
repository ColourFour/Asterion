-- Asterion hosted dashboard verification queries.
-- Run this after 001_classroom_schema_v1.sql, 002_classroom_seed_demo.sql,
-- and 007_hosted_progress_events.sql.

do $$
declare
  required_tables text[] := array[
    'organizations',
    'user_roles',
    'teacher_profiles',
    'student_profiles',
    'classes',
    'class_memberships',
    'class_region_access',
    'student_progress_snapshots',
    'student_progress_events',
    'audit_events'
  ];
  canonical_regions text[] := array[
    'algebra-forge',
    'logarithm-grove',
    'trig-observatory',
    'complex-harbor',
    'calculus-cliffs',
    'integration-gardens',
    'vector-workshop',
    'numerical-mines',
    'differential-shrine'
  ];
  found_count integer;
  missing_names text;
begin
  select count(*)
  into found_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name = any(required_tables);

  if found_count <> array_length(required_tables, 1) then
    select string_agg(table_name, ', ' order by table_name)
    into missing_names
    from unnest(required_tables) as expected(table_name)
    where not exists (
      select 1
      from information_schema.tables t
      where t.table_schema = 'public'
        and t.table_name = expected.table_name
    );

    raise exception 'Missing required public tables: %', missing_names;
  end if;

  select string_agg(c.relname, ', ' order by c.relname)
  into missing_names
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(required_tables)
    and not c.relrowsecurity;

  if missing_names is not null then
    raise exception 'Tables missing RLS: %', missing_names;
  end if;

  select string_agg(table_name, ', ' order by table_name)
  into missing_names
  from unnest(required_tables) as expected(table_name)
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = expected.table_name
  );

  if missing_names is not null then
    raise exception 'Tables missing explicit policies: %', missing_names;
  end if;

  if exists (
    select 1
    from public.class_region_access
    where region_id <> all(canonical_regions)
  ) then
    raise exception 'class_region_access contains non-canonical region IDs';
  end if;

  if exists (
    select 1
    from public.classes c
    where (
      select count(*)
      from public.class_region_access cra
      where cra.class_id = c.id
    ) <> array_length(canonical_regions, 1)
  ) then
    raise exception 'At least one class is missing canonical region access rows';
  end if;

  if not exists (
    select 1
    from public.class_memberships
    where roster_status = 'archived'
  ) then
    raise exception 'Seed verification expected at least one archived roster row';
  end if;
end $$;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000301';

select *
from public.record_student_progress_event(
  '40000000-0000-0000-0000-000000000401',
  '50000000-0000-0000-0000-000000000501',
  '30000000-0000-0000-0000-000000000301',
  'algebra-forge',
  'exam_practice',
  'practice_attempt_saved',
  null,
  '9709_s23_qp32_q1',
  null,
  '{"scoreRatio":0.75,"marksEarned":6,"marksAvailable":8,"durationSeconds":240}'::jsonb
);

rollback;

do $$
begin
  begin
    set local role authenticated;
    set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000301';

    insert into public.class_memberships (class_id, student_profile_id, roster_name, roster_status)
    values (
      '40000000-0000-0000-0000-000000000401',
      '30000000-0000-0000-0000-000000000302',
      'Student-created row',
      'unclaimed'
    );

    raise exception 'Student self-add roster insert unexpectedly succeeded';
  exception
    when insufficient_privilege or with_check_option_violation then
      null;
  end;
end $$;

select 'Asterion hosted Supabase Phase 1 verification passed' as result;
