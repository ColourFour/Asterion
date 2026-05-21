create or replace function public.admin_add_teacher_by_email(
  p_email text,
  p_display_name text,
  p_organization_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  organization_id uuid,
  display_name text,
  email text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  normalized_display_name text := nullif(trim(coalesce(p_display_name, '')), '');
  target_user record;
  target_organization_id uuid;
  teacher_row public.teacher_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if normalized_email = '' then
    raise exception 'teacher_email_required';
  end if;

  select u.id, u.email
  into target_user
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user.id is null then
    raise exception 'auth_user_missing';
  end if;

  if p_organization_id is not null then
    target_organization_id := p_organization_id;
  else
    select ur.organization_id
    into target_organization_id
    from public.user_roles ur
    join public.organizations o on o.id = ur.organization_id
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.status = 'active'
      and o.status = 'active'
    order by ur.created_at
    limit 1;
  end if;

  if target_organization_id is null or not public.is_admin(target_organization_id) then
    raise exception 'admin_required';
  end if;

  insert into public.user_roles (user_id, role, organization_id, status)
  values (target_user.id, 'teacher', target_organization_id, 'active')
  on conflict (user_id, organization_id, role) do update
    set status = 'active',
        updated_at = now();

  insert into public.teacher_profiles (user_id, organization_id, display_name, email, status)
  values (
    target_user.id,
    target_organization_id,
    coalesce(normalized_display_name, target_user.email, normalized_email),
    target_user.email,
    'active'
  )
  on conflict (user_id, organization_id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        status = 'active',
        updated_at = now()
  returning *
  into teacher_row;

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_organization_id,
    auth.uid(),
    'admin.teacher.attached',
    'teacher_profile',
    teacher_row.id,
    jsonb_build_object('teacher_user_id', target_user.id, 'email', target_user.email)
  );

  return query select
    teacher_row.id,
    teacher_row.user_id,
    teacher_row.organization_id,
    teacher_row.display_name,
    teacher_row.email,
    teacher_row.status,
    teacher_row.created_at,
    teacher_row.updated_at;
end;
$$;

comment on function public.admin_add_teacher_by_email(text, text, uuid) is
  'Admin-only RPC that attaches an existing Supabase Auth user as a teacher. The target user must have signed in once so auth.users contains the email.';

create or replace function public.generate_asterion_class_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'AST-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1
      from public.classes c
      where upper(c.class_code) = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.create_class_with_region_access(
  p_teacher_id uuid,
  p_name text,
  p_academic_year_or_term text,
  p_class_code text default null
)
returns table (
  id uuid,
  organization_id uuid,
  teacher_id uuid,
  name text,
  course_code text,
  academic_year_or_term text,
  class_code text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_teacher public.teacher_profiles%rowtype;
  normalized_name text := nullif(trim(coalesce(p_name, '')), '');
  normalized_term text := nullif(trim(coalesce(p_academic_year_or_term, '')), '');
  normalized_code text := upper(nullif(trim(coalesce(p_class_code, '')), ''));
  class_row public.classes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if normalized_name is null then
    raise exception 'class_name_required';
  end if;

  select *
  into target_teacher
  from public.teacher_profiles tp
  where tp.id = p_teacher_id
    and tp.status = 'active';

  if target_teacher.id is null then
    raise exception 'active_teacher_required';
  end if;

  if not (
    public.is_admin(target_teacher.organization_id)
    or (
      target_teacher.user_id = auth.uid()
      and public.is_teacher_in_organization(target_teacher.organization_id)
    )
  ) then
    raise exception 'teacher_or_admin_required';
  end if;

  insert into public.classes (
    organization_id,
    teacher_id,
    name,
    course_code,
    academic_year_or_term,
    class_code,
    status
  )
  values (
    target_teacher.organization_id,
    target_teacher.id,
    normalized_name,
    'CAIE_9709_P3',
    normalized_term,
    coalesce(normalized_code, public.generate_asterion_class_code()),
    'active'
  )
  returning *
  into class_row;

  insert into public.class_region_access (class_id, region_id, access_status, updated_by_user_id)
  values
    (class_row.id, 'algebra-forge', 'field_guide_only', auth.uid()),
    (class_row.id, 'logarithm-grove', 'field_guide_only', auth.uid()),
    (class_row.id, 'trig-observatory', 'field_guide_only', auth.uid()),
    (class_row.id, 'complex-harbor', 'field_guide_only', auth.uid()),
    (class_row.id, 'calculus-cliffs', 'field_guide_only', auth.uid()),
    (class_row.id, 'integration-gardens', 'field_guide_only', auth.uid()),
    (class_row.id, 'vector-workshop', 'field_guide_only', auth.uid()),
    (class_row.id, 'numerical-mines', 'field_guide_only', auth.uid()),
    (class_row.id, 'differential-shrine', 'field_guide_only', auth.uid());

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_teacher.organization_id,
    auth.uid(),
    'class.created',
    'class',
    class_row.id,
    jsonb_build_object('teacher_id', target_teacher.id, 'class_code', class_row.class_code)
  );

  return query select
    class_row.id,
    class_row.organization_id,
    class_row.teacher_id,
    class_row.name,
    class_row.course_code,
    class_row.academic_year_or_term,
    class_row.class_code,
    class_row.status,
    class_row.created_at,
    class_row.updated_at;
end;
$$;

comment on function public.create_class_with_region_access(uuid, text, text, text) is
  'Creates an active P3 class for an authorized teacher/admin and inserts all canonical class_region_access rows as field_guide_only.';

create or replace function public.add_class_roster_student(
  p_class_id uuid,
  p_roster_name text
)
returns table (
  id uuid,
  class_id uuid,
  student_profile_id uuid,
  roster_name text,
  roster_status text,
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class public.classes%rowtype;
  normalized_roster_name text := nullif(trim(coalesce(p_roster_name, '')), '');
  student_row public.student_profiles%rowtype;
  membership_row public.class_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if normalized_roster_name is null then
    raise exception 'roster_name_required';
  end if;

  select *
  into target_class
  from public.classes c
  where c.id = p_class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  insert into public.student_profiles (organization_id, display_name, status)
  values (target_class.organization_id, normalized_roster_name, 'active')
  returning *
  into student_row;

  insert into public.class_memberships (
    class_id,
    student_profile_id,
    roster_name,
    roster_status
  )
  values (
    target_class.id,
    student_row.id,
    normalized_roster_name,
    'unclaimed'
  )
  returning *
  into membership_row;

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_class.organization_id,
    auth.uid(),
    'class.roster.added',
    'class_membership',
    membership_row.id,
    jsonb_build_object('class_id', target_class.id, 'roster_status', membership_row.roster_status)
  );

  return query select
    membership_row.id,
    membership_row.class_id,
    membership_row.student_profile_id,
    membership_row.roster_name,
    membership_row.roster_status,
    membership_row.claimed_by_user_id,
    membership_row.claimed_at,
    membership_row.archived_at,
    membership_row.created_at,
    membership_row.updated_at;
end;
$$;

comment on function public.add_class_roster_student(uuid, text) is
  'Creates an unclaimed roster slot for an active class. Students cannot self-add roster rows.';

create or replace function public.archive_class_roster_student(
  p_membership_id uuid
)
returns table (
  id uuid,
  class_id uuid,
  student_profile_id uuid,
  roster_name text,
  roster_status text,
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class public.classes%rowtype;
  target_membership public.class_memberships%rowtype;
  membership_row public.class_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select cm.*
  into target_membership
  from public.class_memberships cm
  where cm.id = p_membership_id
  for update;

  if target_membership.id is null then
    raise exception 'roster_membership_required';
  end if;

  select *
  into target_class
  from public.classes c
  where c.id = target_membership.class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  update public.class_memberships
  set roster_status = 'archived',
      claimed_by_user_id = null,
      claimed_at = null,
      archived_at = now(),
      updated_at = now()
  where id = target_membership.id
  returning *
  into membership_row;

  update public.student_profiles
  set user_id = null,
      status = 'archived',
      updated_at = now()
  where id = membership_row.student_profile_id;

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_class.organization_id,
    auth.uid(),
    'class.roster.archived',
    'class_membership',
    membership_row.id,
    jsonb_build_object('class_id', target_class.id, 'previous_status', target_membership.roster_status)
  );

  return query select
    membership_row.id,
    membership_row.class_id,
    membership_row.student_profile_id,
    membership_row.roster_name,
    membership_row.roster_status,
    membership_row.claimed_by_user_id,
    membership_row.claimed_at,
    membership_row.archived_at,
    membership_row.created_at,
    membership_row.updated_at;
end;
$$;

comment on function public.archive_class_roster_student(uuid) is
  'Archives a roster membership for an assigned teacher or admin while clearing claim fields and preserving the row for audit/history.';

create or replace function public.reset_class_roster_claim(
  p_membership_id uuid
)
returns table (
  id uuid,
  class_id uuid,
  student_profile_id uuid,
  roster_name text,
  roster_status text,
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class public.classes%rowtype;
  target_membership public.class_memberships%rowtype;
  membership_row public.class_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select cm.*
  into target_membership
  from public.class_memberships cm
  where cm.id = p_membership_id
  for update;

  if target_membership.id is null then
    raise exception 'roster_membership_required';
  end if;

  if target_membership.roster_status <> 'claimed' then
    raise exception 'claimed_roster_required';
  end if;

  select *
  into target_class
  from public.classes c
  where c.id = target_membership.class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  update public.class_memberships
  set roster_status = 'unclaimed',
      claimed_by_user_id = null,
      claimed_at = null,
      archived_at = null,
      updated_at = now()
  where id = target_membership.id
  returning *
  into membership_row;

  update public.student_profiles
  set user_id = null,
      status = 'active',
      updated_at = now()
  where id = membership_row.student_profile_id;

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_class.organization_id,
    auth.uid(),
    'class.roster.claim_reset',
    'class_membership',
    membership_row.id,
    jsonb_build_object('class_id', target_class.id, 'previous_claimed_by_user_id', target_membership.claimed_by_user_id)
  );

  return query select
    membership_row.id,
    membership_row.class_id,
    membership_row.student_profile_id,
    membership_row.roster_name,
    membership_row.roster_status,
    membership_row.claimed_by_user_id,
    membership_row.claimed_at,
    membership_row.archived_at,
    membership_row.created_at,
    membership_row.updated_at;
end;
$$;

comment on function public.reset_class_roster_claim(uuid) is
  'Resets a claimed roster membership to unclaimed for an assigned teacher or admin and clears the linked student profile user_id.';

create or replace function public.set_class_region_access(
  p_class_id uuid,
  p_region_id text,
  p_access_status text
)
returns table (
  id uuid,
  class_id uuid,
  region_id text,
  access_status text,
  updated_by_user_id uuid,
  updated_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class public.classes%rowtype;
  access_row public.class_region_access%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if p_region_id not in (
    'algebra-forge',
    'logarithm-grove',
    'trig-observatory',
    'complex-harbor',
    'calculus-cliffs',
    'integration-gardens',
    'vector-workshop',
    'numerical-mines',
    'differential-shrine'
  ) then
    raise exception 'invalid_region_id';
  end if;

  if p_access_status not in ('open', 'field_guide_only') then
    raise exception 'invalid_region_access_status';
  end if;

  select *
  into target_class
  from public.classes c
  where c.id = p_class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  insert into public.class_region_access (class_id, region_id, access_status, updated_by_user_id)
  values (target_class.id, p_region_id, p_access_status, auth.uid())
  on conflict (class_id, region_id) do update
    set access_status = excluded.access_status,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = now()
  returning *
  into access_row;

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_class.organization_id,
    auth.uid(),
    'class.region_access.updated',
    'class',
    target_class.id,
    jsonb_build_object('region_id', p_region_id, 'access_status', p_access_status)
  );

  return query select
    access_row.id,
    access_row.class_id,
    access_row.region_id,
    access_row.access_status,
    access_row.updated_by_user_id,
    access_row.updated_at,
    access_row.created_at;
end;
$$;

comment on function public.set_class_region_access(uuid, text, text) is
  'Updates one class-region access row for an assigned teacher or admin. It uses the existing access model; no Algebra-only gate is introduced.';

drop policy if exists "authenticated users can append own audit events" on public.audit_events;

create policy "active organization actors can append own audit events"
on public.audit_events for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.organization_id = audit_events.organization_id
      and ur.status = 'active'
  )
);

revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from public;
revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from anon;
grant execute on function public.admin_add_teacher_by_email(text, text, uuid) to authenticated;

revoke all on function public.create_class_with_region_access(uuid, text, text, text) from public;
revoke all on function public.create_class_with_region_access(uuid, text, text, text) from anon;
grant execute on function public.create_class_with_region_access(uuid, text, text, text) to authenticated;

revoke all on function public.add_class_roster_student(uuid, text) from public;
revoke all on function public.add_class_roster_student(uuid, text) from anon;
grant execute on function public.add_class_roster_student(uuid, text) to authenticated;

revoke all on function public.archive_class_roster_student(uuid) from public;
revoke all on function public.archive_class_roster_student(uuid) from anon;
grant execute on function public.archive_class_roster_student(uuid) to authenticated;

revoke all on function public.reset_class_roster_claim(uuid) from public;
revoke all on function public.reset_class_roster_claim(uuid) from anon;
grant execute on function public.reset_class_roster_claim(uuid) to authenticated;

revoke all on function public.set_class_region_access(uuid, text, text) from public;
revoke all on function public.set_class_region_access(uuid, text, text) from anon;
grant execute on function public.set_class_region_access(uuid, text, text) to authenticated;
