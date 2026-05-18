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

create table public.student_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  class_membership_id uuid not null references public.class_memberships(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  snapshot_version integer not null check (snapshot_version > 0),
  source text not null default 'local_student_app' check (source in ('local_student_app')),
  summary_json jsonb not null default '{}'::jsonb,
  region_summary_json jsonb not null default '{}'::jsonb,
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
