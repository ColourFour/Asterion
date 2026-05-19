create extension if not exists pgcrypto with schema extensions;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'student')),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id, role)
);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  email text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  optional_email text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete restrict,
  name text not null,
  course_code text not null default 'CAIE_9709_P3',
  academic_year_or_term text,
  class_code text not null unique,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete restrict,
  roster_name text not null,
  roster_status text not null default 'unclaimed' check (roster_status in ('unclaimed', 'claimed', 'archived')),
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_profile_id),
  constraint class_memberships_claim_state check (
    (
      roster_status = 'claimed'
      and claimed_by_user_id is not null
      and claimed_at is not null
    )
    or (
      roster_status <> 'claimed'
      and claimed_by_user_id is null
      and claimed_at is null
    )
  ),
  constraint class_memberships_archived_state check (
    (roster_status = 'archived' and archived_at is not null)
    or (roster_status <> 'archived' and archived_at is null)
  )
);

create table public.class_region_access (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  region_id text not null check (
    region_id in (
      'algebra-forge',
      'logarithm-grove',
      'trig-observatory',
      'complex-harbor',
      'calculus-cliffs',
      'integration-gardens',
      'vector-workshop',
      'numerical-mines',
      'differential-shrine'
    )
  ),
  access_status text not null default 'field_guide_only' check (access_status in ('open', 'field_guide_only')),
  updated_by_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (class_id, region_id)
);

create or replace function public.asterion_snapshot_json_has_forbidden_key(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  item record;
  value jsonb;
  forbidden_keys text[] := array[
    'answer',
    'answerText',
    'attempt',
    'attempts',
    'explanation',
    'imagePaths',
    'imageUrls',
    'issueReport',
    'issueReports',
    'learnerResponse',
    'learningActivityAttempts',
    'localStorage',
    'markSchemeImagePaths',
    'markSchemeImageRawPaths',
    'markSchemeImageUrls',
    'markSchemeImages',
    'note',
    'notes',
    'prompt',
    'questionImagePaths',
    'questionImageRawPaths',
    'questionImageUrls',
    'questionImages',
    'raw',
    'rawAnswer',
    'rawResponse',
    'response',
    'studentExplanation',
    'studentNote',
    'studentResponse'
  ];
begin
  if payload is null then
    return false;
  end if;

  if jsonb_typeof(payload) = 'object' then
    for item in select key, value from jsonb_each(payload) loop
      if item.key = any (forbidden_keys) then
        return true;
      end if;
      if public.asterion_snapshot_json_has_forbidden_key(item.value) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(payload) = 'array' then
    for value in select jsonb_array_elements(payload) loop
      if public.asterion_snapshot_json_has_forbidden_key(value) then
        return true;
      end if;
    end loop;
  end if;

  return false;
end;
$$;

create or replace function public.asterion_valid_progress_snapshot_summary(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  key text;
  numeric_key text;
  required_keys text[] := array[
    'schemaVersion',
    'paperFamily',
    'generatedAt',
    'attemptCount',
    'masteryEligibleAttemptCount',
    'learningActivityAttemptCount',
    'issueReportCount',
    'regionsStarted',
    'guardianReadyRegionCount',
    'guardianClearedRegionCount',
    'openRegionCount',
    'fieldGuideOnlyRegionCount'
  ];
  allowed_keys text[] := required_keys || array['lastActivityAt'];
begin
  if jsonb_typeof(payload) <> 'object' then
    return false;
  end if;

  if length(payload::text) > 2048 or public.asterion_snapshot_json_has_forbidden_key(payload) then
    return false;
  end if;

  for key in select jsonb_object_keys(payload) loop
    if key <> all (allowed_keys) then
      return false;
    end if;
  end loop;

  foreach key in array required_keys loop
    if not payload ? key then
      return false;
    end if;
  end loop;

  if payload->>'schemaVersion' <> '1' or payload->>'paperFamily' <> 'p3' then
    return false;
  end if;

  if jsonb_typeof(payload->'generatedAt') <> 'string' or length(payload->>'generatedAt') > 40 then
    return false;
  end if;

  if payload ? 'lastActivityAt' and (jsonb_typeof(payload->'lastActivityAt') <> 'string' or length(payload->>'lastActivityAt') > 40) then
    return false;
  end if;

  foreach numeric_key in array array[
    'attemptCount',
    'masteryEligibleAttemptCount',
    'learningActivityAttemptCount',
    'issueReportCount',
    'regionsStarted',
    'guardianReadyRegionCount',
    'guardianClearedRegionCount',
    'openRegionCount',
    'fieldGuideOnlyRegionCount'
  ] loop
    if jsonb_typeof(payload->numeric_key) <> 'number'
      or (payload->>numeric_key)::numeric < 0
      or (payload->>numeric_key)::numeric > 100000
      or trunc((payload->>numeric_key)::numeric) <> (payload->>numeric_key)::numeric then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function public.asterion_valid_progress_snapshot_regions(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  region_key text;
  region_value jsonb;
  key text;
  numeric_key text;
  region_count integer := 0;
  allowed_region_ids text[] := array[
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
  allowed_keys text[] := array[
    'regionId',
    'rank',
    'status',
    'progressRatio',
    'attemptCount',
    'totalMarksEarned',
    'totalMarksAvailable',
    'guardianStatus',
    'fieldGuideStatus',
    'accessStatus',
    'lastActivityAt'
  ];
  required_keys text[] := array[
    'regionId',
    'rank',
    'status',
    'progressRatio',
    'attemptCount',
    'totalMarksEarned',
    'totalMarksAvailable',
    'guardianStatus',
    'fieldGuideStatus',
    'accessStatus'
  ];
begin
  if jsonb_typeof(payload) <> 'object' then
    return false;
  end if;

  if length(payload::text) > 12000 or public.asterion_snapshot_json_has_forbidden_key(payload) then
    return false;
  end if;

  for region_key, region_value in select key, value from jsonb_each(payload) loop
    region_count := region_count + 1;
    if region_count > 9 or region_key <> all (allowed_region_ids) then
      return false;
    end if;

    if jsonb_typeof(region_value) <> 'object' then
      return false;
    end if;

    for key in select jsonb_object_keys(region_value) loop
      if key <> all (allowed_keys) then
        return false;
      end if;
    end loop;

    foreach key in array required_keys loop
      if not region_value ? key then
        return false;
      end if;
    end loop;

    if region_value->>'regionId' <> region_key then
      return false;
    end if;

    if (region_value->>'rank') <> all (array['Dormant', 'Discovered', 'Bronze', 'Silver', 'Gold', 'Mastered']) then
      return false;
    end if;

    if (region_value->>'status') <> all (array[
      'locked',
      'available',
      'field_guide_started',
      'field_guide_completed',
      'training_in_progress',
      'guardian_unlocked',
      'guardian_attempted',
      'guardian_cleared',
      'mastered',
      'needs_review'
    ]) then
      return false;
    end if;

    if (region_value->>'guardianStatus') <> all (array['locked', 'ready', 'attempted', 'cleared', 'mastered', 'needs_review']) then
      return false;
    end if;

    if (region_value->>'fieldGuideStatus') <> all (array['not_started', 'started', 'completed']) then
      return false;
    end if;

    if (region_value->>'accessStatus') <> all (array['open', 'field_guide_only']) then
      return false;
    end if;

    foreach numeric_key in array array['progressRatio', 'attemptCount', 'totalMarksEarned', 'totalMarksAvailable'] loop
      if jsonb_typeof(region_value->numeric_key) <> 'number'
        or (region_value->>numeric_key)::numeric < 0
        or (region_value->>numeric_key)::numeric > 1000000 then
        return false;
      end if;
    end loop;

    if (region_value->>'progressRatio')::numeric > 1
      or trunc((region_value->>'attemptCount')::numeric) <> (region_value->>'attemptCount')::numeric
      or (region_value->>'totalMarksEarned')::numeric > (region_value->>'totalMarksAvailable')::numeric then
      return false;
    end if;

    if region_value ? 'lastActivityAt' and (jsonb_typeof(region_value->'lastActivityAt') <> 'string' or length(region_value->>'lastActivityAt') > 40) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create table public.student_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  class_membership_id uuid not null references public.class_memberships(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  snapshot_version integer not null check (snapshot_version > 0),
  source text not null default 'local_student_app' check (source in ('local_student_app')),
  summary_json jsonb not null check (public.asterion_valid_progress_snapshot_summary(summary_json)),
  region_summary_json jsonb not null check (public.asterion_valid_progress_snapshot_regions(region_summary_json)),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_class_teacher_organization()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.teacher_profiles tp
    where tp.id = new.teacher_id
      and tp.organization_id = new.organization_id
  ) then
    raise exception 'class teacher must belong to the same organization';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_progress_snapshot_membership()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.class_memberships cm
    where cm.id = new.class_membership_id
      and cm.class_id = new.class_id
      and cm.student_profile_id = new.student_profile_id
  ) then
    raise exception 'progress snapshot membership, class, and student profile must match';
  end if;

  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

create trigger teacher_profiles_set_updated_at
before update on public.teacher_profiles
for each row execute function public.set_updated_at();

create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger classes_enforce_teacher_organization
before insert or update on public.classes
for each row execute function public.enforce_class_teacher_organization();

create trigger class_memberships_set_updated_at
before update on public.class_memberships
for each row execute function public.set_updated_at();

create trigger class_region_access_set_updated_at
before update on public.class_region_access
for each row execute function public.set_updated_at();

create trigger student_progress_snapshots_enforce_membership
before insert or update on public.student_progress_snapshots
for each row execute function public.enforce_progress_snapshot_membership();

create or replace function public.teacher_profile_organization_id(target_teacher_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.teacher_profiles
  where id = target_teacher_id
$$;

create or replace function public.membership_student_profile_id(target_membership_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select student_profile_id
  from public.class_memberships
  where id = target_membership_id
$$;

create or replace function public.membership_class_id(target_membership_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select class_id
  from public.class_memberships
  where id = target_membership_id
$$;

create or replace function public.is_admin(target_organization_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
      and (target_organization_id is null or organization_id = target_organization_id)
  )
$$;

create or replace function public.is_teacher_in_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'teacher'
      and status = 'active'
      and organization_id = target_organization_id
  )
$$;

create or replace function public.is_teacher_for_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    join public.teacher_profiles tp on tp.id = c.teacher_id
    join public.user_roles ur
      on ur.user_id = auth.uid()
      and ur.organization_id = c.organization_id
      and ur.role = 'teacher'
      and ur.status = 'active'
    where c.id = target_class_id
      and tp.user_id = auth.uid()
      and tp.status = 'active'
  )
$$;

create or replace function public.is_student_for_membership(target_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    join public.student_profiles sp on sp.id = cm.student_profile_id
    join public.user_roles ur
      on ur.user_id = auth.uid()
      and ur.organization_id = sp.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
    where cm.id = target_membership_id
      and cm.roster_status = 'claimed'
      and cm.claimed_by_user_id = auth.uid()
      and sp.user_id = auth.uid()
      and sp.status = 'active'
  )
$$;

create or replace function public.is_student_in_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and public.is_student_for_membership(cm.id)
  )
$$;

create or replace function public.claim_class_roster_slot(
  p_class_code text,
  p_roster_name text
)
returns table (
  status text,
  class_id uuid,
  class_name text,
  class_code text,
  teacher_id uuid,
  teacher_name text,
  roster_membership_id uuid,
  roster_name text,
  claimed_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_user_id uuid := auth.uid();
  normalized_class_code text := upper(trim(coalesce(p_class_code, '')));
  normalized_roster_name text := lower(trim(coalesce(p_roster_name, '')));
  target_class record;
  target_membership record;
  claim_timestamp timestamptz;
  matching_count integer;
begin
  if claim_user_id is null then
    return query select
      'unauthenticated'::text,
      null::uuid,
      null::text,
      null::text,
      null::uuid,
      null::text,
      null::uuid,
      null::text,
      null::timestamptz,
      'Sign in before claiming a roster slot.'::text;
    return;
  end if;

  select c.id, c.name, c.class_code, c.organization_id, tp.id as teacher_id, tp.display_name as teacher_name
  into target_class
  from public.classes c
  join public.teacher_profiles tp on tp.id = c.teacher_id
  where upper(c.class_code) = normalized_class_code
    and c.status = 'active'
  limit 1;

  if target_class.id is null then
    return query select
      'invalid_class_code'::text,
      null::uuid,
      null::text,
      null::text,
      null::uuid,
      null::text,
      null::uuid,
      null::text,
      null::timestamptz,
      'Enter a valid active class code from your teacher.'::text;
    return;
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
  ) then
    return query select
      'unauthorized'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      null::uuid,
      null::text,
      null::timestamptz,
      'This signed-in account is not authorized to claim a student roster slot for this organization.'::text;
    return;
  end if;

  select count(*)
  into matching_count
  from public.class_memberships cm
  where cm.class_id = target_class.id
    and lower(trim(cm.roster_name)) = normalized_roster_name;

  if matching_count = 0 then
    return query select
      'roster_name_not_found'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      null::uuid,
      null::text,
      null::timestamptz,
      'Ask your teacher to add your name to the roster first.'::text;
    return;
  end if;

  if matching_count > 1 then
    return query select
      'ambiguous_roster_name'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      null::uuid,
      trim(coalesce(p_roster_name, '')),
      null::timestamptz,
      'More than one roster entry uses that name. Ask your teacher to make the roster name unique before claiming.'::text;
    return;
  end if;

  select cm.id, cm.student_profile_id, cm.roster_name, cm.roster_status, cm.claimed_by_user_id, sp.user_id as student_user_id
  into target_membership
  from public.class_memberships cm
  join public.student_profiles sp on sp.id = cm.student_profile_id
  where cm.class_id = target_class.id
    and lower(trim(cm.roster_name)) = normalized_roster_name
  for update of cm, sp;

  if target_membership.roster_status = 'archived' then
    return query select
      'archived'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This roster entry is archived. Ask your teacher or admin for help.'::text;
    return;
  end if;

  if target_membership.roster_status = 'claimed' then
    return query select
      'already_claimed'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This roster entry has already been claimed. Ask your teacher or admin for help.'::text;
    return;
  end if;

  if target_membership.student_user_id is not null and target_membership.student_user_id <> claim_user_id then
    return query select
      'unauthorized'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This roster entry is reserved for another signed-in account.'::text;
    return;
  end if;

  update public.student_profiles sp
  set user_id = claim_user_id
  where sp.id = target_membership.student_profile_id
    and (sp.user_id is null or sp.user_id = claim_user_id);

  update public.class_memberships cm
  set roster_status = 'claimed',
      claimed_by_user_id = claim_user_id,
      claimed_at = now(),
      updated_at = now()
  where cm.id = target_membership.id
    and cm.roster_status = 'unclaimed'
    and cm.claimed_by_user_id is null
    and cm.claimed_at is null
  returning cm.claimed_at
  into claim_timestamp;

  if claim_timestamp is null then
    return query select
      'already_claimed'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This roster entry has already been claimed. Ask your teacher or admin for help.'::text;
    return;
  end if;

  return query select
    'claimed'::text,
    target_class.id,
    target_class.name,
    target_class.class_code,
    target_class.teacher_id,
    target_class.teacher_name,
    target_membership.id,
    target_membership.roster_name,
    claim_timestamp,
    'Roster slot claimed. Optional details can be added later.'::text;
end;
$$;

comment on function public.claim_class_roster_slot(text, text) is
  'Atomically binds an authenticated student user to one existing, uniquely named, unclaimed roster slot. SECURITY DEFINER is required because unclaimed roster rows are intentionally hidden by RLS; this function performs no inserts and returns only a safe claim result.';

revoke all on function public.claim_class_roster_slot(text, text) from public;
revoke all on function public.claim_class_roster_slot(text, text) from anon;
grant execute on function public.claim_class_roster_slot(text, text) to authenticated;

alter table public.organizations enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.class_region_access enable row level security;
alter table public.student_progress_snapshots enable row level security;
alter table public.audit_events enable row level security;

create policy "admins can read organizations"
on public.organizations for select
to authenticated
using (public.is_admin(id));

create policy "admins can create organizations"
on public.organizations for insert
to authenticated
with check (public.is_admin());

create policy "admins can update organizations"
on public.organizations for update
to authenticated
using (public.is_admin(id))
with check (public.is_admin(id));

create policy "users can read own active role rows"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.is_admin(organization_id));

create policy "admins can create role rows"
on public.user_roles for insert
to authenticated
with check (public.is_admin(organization_id));

create policy "admins can update role rows"
on public.user_roles for update
to authenticated
using (public.is_admin(organization_id))
with check (public.is_admin(organization_id));

create policy "admins teachers and assigned students can read teacher profiles"
on public.teacher_profiles for select
to authenticated
using (
  public.is_admin(organization_id)
  or user_id = auth.uid()
  or exists (
    select 1
    from public.classes c
    where c.teacher_id = teacher_profiles.id
      and public.is_student_in_class(c.id)
  )
);

create policy "admins can create teacher profiles"
on public.teacher_profiles for insert
to authenticated
with check (public.is_admin(organization_id));

create policy "admins and profile owners can update teacher profiles"
on public.teacher_profiles for update
to authenticated
using (public.is_admin(organization_id) or user_id = auth.uid())
with check (public.is_admin(organization_id) or user_id = auth.uid());

create policy "admins teachers and profile owners can read student profiles"
on public.student_profiles for select
to authenticated
using (
  public.is_admin(organization_id)
  or user_id = auth.uid()
  or exists (
    select 1
    from public.class_memberships cm
    where cm.student_profile_id = student_profiles.id
      and public.is_teacher_for_class(cm.class_id)
  )
);

create policy "admins and teachers can create student profiles"
on public.student_profiles for insert
to authenticated
with check (
  public.is_admin(organization_id)
  or public.is_teacher_in_organization(organization_id)
);

create policy "admins teachers and profile owners can update student profiles"
on public.student_profiles for update
to authenticated
using (
  public.is_admin(organization_id)
  or user_id = auth.uid()
  or exists (
    select 1
    from public.class_memberships cm
    where cm.student_profile_id = student_profiles.id
      and public.is_teacher_for_class(cm.class_id)
  )
)
with check (
  public.is_admin(organization_id)
  or user_id = auth.uid()
  or exists (
    select 1
    from public.class_memberships cm
    where cm.student_profile_id = student_profiles.id
      and public.is_teacher_for_class(cm.class_id)
  )
);

create policy "class participants can read classes"
on public.classes for select
to authenticated
using (
  public.is_admin(organization_id)
  or public.is_teacher_for_class(id)
  or public.is_student_in_class(id)
);

create policy "admins can create classes"
on public.classes for insert
to authenticated
with check (public.is_admin(organization_id));

create policy "admins and assigned teachers can update classes"
on public.classes for update
to authenticated
using (public.is_admin(organization_id) or public.is_teacher_for_class(id))
with check (public.is_admin(organization_id) or public.is_teacher_for_class(id));

create policy "class participants can read memberships"
on public.class_memberships for select
to authenticated
using (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
  or public.is_student_for_membership(id)
);

create policy "admins and assigned teachers can create roster entries"
on public.class_memberships for insert
to authenticated
with check (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or (
    public.is_teacher_for_class(class_id)
    and roster_status = 'unclaimed'
    and claimed_by_user_id is null
    and claimed_at is null
  )
);

create policy "admins and assigned teachers can update roster entries"
on public.class_memberships for update
to authenticated
using (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
)
with check (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
);

create policy "class participants can read region access"
on public.class_region_access for select
to authenticated
using (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
  or public.is_student_in_class(class_id)
);

create policy "admins can create region access"
on public.class_region_access for insert
to authenticated
with check (public.is_admin((select organization_id from public.classes where id = class_id)));

create policy "admins and assigned teachers can update region access"
on public.class_region_access for update
to authenticated
using (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
)
with check (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
);

create policy "students teachers and admins can read scoped snapshots"
on public.student_progress_snapshots for select
to authenticated
using (
  public.is_admin((select organization_id from public.classes where id = class_id))
  or public.is_teacher_for_class(class_id)
  or public.is_student_for_membership(class_membership_id)
);

create policy "students can insert own bounded progress snapshots"
on public.student_progress_snapshots for insert
to authenticated
with check (
  source = 'local_student_app'
  and public.is_student_for_membership(class_membership_id)
  and public.membership_student_profile_id(class_membership_id) = student_profile_id
  and public.membership_class_id(class_membership_id) = class_id
);

create policy "admins and actors can read audit events"
on public.audit_events for select
to authenticated
using (public.is_admin(organization_id) or actor_user_id = auth.uid());

create policy "authenticated users can append own audit events"
on public.audit_events for insert
to authenticated
with check (actor_user_id = auth.uid());
