alter table public.teacher_profiles
  alter column user_id drop not null;

alter table public.teacher_profiles
  drop constraint if exists teacher_profiles_status_check;

update public.teacher_profiles
set email = nullif(lower(trim(email)), '')
where email is not null;

alter table public.teacher_profiles
  add constraint teacher_profiles_status_check
  check (status in ('pending', 'active', 'inactive', 'archived', 'disabled'));

alter table public.teacher_profiles
  drop constraint if exists teacher_profiles_email_normalized;

alter table public.teacher_profiles
  add constraint teacher_profiles_email_normalized
  check (email is null or (email = lower(trim(email)) and email <> ''));

create unique index if not exists teacher_profiles_one_email_per_org
on public.teacher_profiles (organization_id, email)
where email is not null;

insert into public.teacher_profiles (
  user_id,
  organization_id,
  display_name,
  email,
  status,
  created_at,
  updated_at
)
select
  null,
  ti.organization_id,
  ti.display_name,
  ti.email,
  'pending',
  ti.created_at,
  ti.updated_at
from public.teacher_invites ti
join public.organizations o on o.id = ti.organization_id
where ti.status = 'pending'
  and o.status = 'active'
on conflict (organization_id, email) where email is not null do update
  set display_name = excluded.display_name,
      status = case
        when public.teacher_profiles.status = 'active' then public.teacher_profiles.status
        else 'pending'
      end,
      updated_at = now();

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
  invite_row public.teacher_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if normalized_email = '' then
    raise exception 'teacher_email_required';
  end if;

  if normalized_display_name is null then
    raise exception 'teacher_display_name_required';
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

  select u.id, u.email
  into target_user
  from auth.users u
  where lower(u.email) = normalized_email
  order by u.created_at desc
  limit 1;

  select *
  into teacher_row
  from public.teacher_profiles tp
  where tp.organization_id = target_organization_id
    and tp.email = normalized_email
  order by tp.created_at
  limit 1
  for update;

  if teacher_row.id is null and target_user.id is not null then
    select *
    into teacher_row
    from public.teacher_profiles tp
    where tp.organization_id = target_organization_id
      and tp.user_id = target_user.id
    order by tp.created_at
    limit 1
    for update;
  end if;

  if target_user.id is null then
    if teacher_row.id is null then
      insert into public.teacher_profiles (user_id, organization_id, display_name, email, status)
      values (null, target_organization_id, normalized_display_name, normalized_email, 'pending')
      on conflict (organization_id, email) where email is not null do update
        set display_name = excluded.display_name,
            status = case
              when public.teacher_profiles.status = 'active' then public.teacher_profiles.status
              else 'pending'
            end,
            updated_at = now()
      returning *
      into teacher_row;
    else
      update public.teacher_profiles
      set display_name = normalized_display_name,
          email = normalized_email,
          status = case
            when status = 'active' then status
            else 'pending'
          end,
          updated_at = now()
      where id = teacher_row.id
      returning *
      into teacher_row;
    end if;

    insert into public.teacher_invites (organization_id, email, display_name, status, created_by)
    values (target_organization_id, normalized_email, normalized_display_name, 'pending', auth.uid())
    on conflict (organization_id, email) where status = 'pending' do update
      set display_name = excluded.display_name,
          created_by = excluded.created_by,
          updated_at = now()
    returning *
    into invite_row;

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      target_organization_id,
      auth.uid(),
      'admin.teacher.pending_profile_upserted',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('email', teacher_row.email, 'teacher_invite_id', invite_row.id)
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
    return;
  end if;

  insert into public.user_roles (user_id, role, organization_id, status)
  values (target_user.id, 'teacher', target_organization_id, 'active')
  on conflict (user_id, organization_id, role) do update
    set status = 'active',
        updated_at = now();

  if teacher_row.id is null then
    insert into public.teacher_profiles (user_id, organization_id, display_name, email, status)
    values (
      target_user.id,
      target_organization_id,
      normalized_display_name,
      normalized_email,
      'active'
    )
    on conflict (organization_id, email) where email is not null do update
      set user_id = excluded.user_id,
          display_name = excluded.display_name,
          email = excluded.email,
          status = 'active',
          updated_at = now()
    returning *
    into teacher_row;
  else
    update public.teacher_profiles
    set user_id = target_user.id,
        display_name = normalized_display_name,
        email = normalized_email,
        status = 'active',
        updated_at = now()
    where id = teacher_row.id
    returning *
    into teacher_row;
  end if;

  update public.teacher_invites
  set status = 'activated',
      activated_user_id = target_user.id,
      activated_teacher_profile_id = teacher_row.id,
      activated_at = now(),
      updated_at = now()
  where organization_id = target_organization_id
    and email = normalized_email
    and status = 'pending';

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    target_organization_id,
    auth.uid(),
    'admin.teacher.attached',
    'teacher_profile',
    teacher_row.id,
    jsonb_build_object('teacher_user_id', target_user.id, 'email', teacher_row.email)
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
  'Admin-only RPC that creates or reuses a real teacher_profiles row by normalized organization email. Existing Auth users become active teachers immediately; missing Auth users become pending teacher profiles that can own classes until sign-in activation.';

create or replace function public.activate_pending_teacher_role_for_current_user()
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
  current_user_id uuid := auth.uid();
  current_email text;
  invite_row public.teacher_invites%rowtype;
  teacher_row public.teacher_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'auth_required';
  end if;

  select lower(trim(u.email))
  into current_email
  from auth.users u
  where u.id = current_user_id
    and u.email is not null
    and u.email_confirmed_at is not null;

  if current_email is null or current_email = '' then
    return;
  end if;

  for teacher_row in
    select tp.*
    from public.teacher_profiles tp
    join public.organizations o on o.id = tp.organization_id
    where tp.email = current_email
      and tp.status = 'pending'
      and o.status = 'active'
    order by tp.created_at
    for update of tp
  loop
    insert into public.user_roles (user_id, role, organization_id, status)
    values (current_user_id, 'teacher', teacher_row.organization_id, 'active')
    on conflict (user_id, organization_id, role) do update
      set status = 'active',
          updated_at = now();

    update public.teacher_profiles
    set user_id = current_user_id,
        email = current_email,
        status = 'active',
        updated_at = now()
    where id = teacher_row.id
    returning *
    into teacher_row;

    update public.teacher_invites
    set status = 'activated',
        activated_user_id = current_user_id,
        activated_teacher_profile_id = teacher_row.id,
        activated_at = now(),
        updated_at = now()
    where organization_id = teacher_row.organization_id
      and email = current_email
      and status = 'pending';

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      teacher_row.organization_id,
      current_user_id,
      'teacher.pending_profile_activated',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('email', current_email)
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
  end loop;

  for invite_row in
    select ti.*
    from public.teacher_invites ti
    join public.organizations o on o.id = ti.organization_id
    where ti.email = current_email
      and ti.status = 'pending'
      and o.status = 'active'
      and not exists (
        select 1
        from public.teacher_profiles tp
        where tp.organization_id = ti.organization_id
          and tp.email = ti.email
      )
    order by ti.created_at
    for update of ti
  loop
    insert into public.user_roles (user_id, role, organization_id, status)
    values (current_user_id, 'teacher', invite_row.organization_id, 'active')
    on conflict (user_id, organization_id, role) do update
      set status = 'active',
          updated_at = now();

    insert into public.teacher_profiles (user_id, organization_id, display_name, email, status)
    values (
      current_user_id,
      invite_row.organization_id,
      invite_row.display_name,
      current_email,
      'active'
    )
    on conflict (organization_id, email) where email is not null do update
      set user_id = excluded.user_id,
          display_name = excluded.display_name,
          email = excluded.email,
          status = 'active',
          updated_at = now()
    returning *
    into teacher_row;

    update public.teacher_invites
    set status = 'activated',
        activated_user_id = current_user_id,
        activated_teacher_profile_id = teacher_row.id,
        activated_at = now(),
        updated_at = now()
    where id = invite_row.id;

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      teacher_row.organization_id,
      current_user_id,
      'teacher.pending_invite_activated',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('teacher_invite_id', invite_row.id, 'email', current_email)
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
  end loop;
end;
$$;

comment on function public.activate_pending_teacher_role_for_current_user() is
  'Authenticated-user RPC that binds auth.uid() to pending teacher_profiles by matching the verified Supabase Auth email server-side. The client supplies no user id or email, and archived/disabled profiles are not activated.';

create or replace function public.ensure_admin_teacher_operator_profile_for_current_user()
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
  current_user_id uuid := auth.uid();
  current_email text;
  admin_role record;
  teacher_row public.teacher_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'auth_required';
  end if;

  select lower(trim(u.email))
  into current_email
  from auth.users u
  where u.id = current_user_id
    and u.email is not null
    and u.email_confirmed_at is not null;

  for admin_role in
    select ur.organization_id
    from public.user_roles ur
    join public.organizations o on o.id = ur.organization_id
    where ur.user_id = current_user_id
      and ur.role = 'admin'
      and ur.status = 'active'
      and o.status = 'active'
    order by ur.created_at
  loop
    select *
    into teacher_row
    from public.teacher_profiles tp
    where tp.organization_id = admin_role.organization_id
      and tp.user_id = current_user_id
    order by tp.created_at
    limit 1
    for update;

    if teacher_row.id is null and current_email is not null and current_email <> '' then
      select *
      into teacher_row
      from public.teacher_profiles tp
      where tp.organization_id = admin_role.organization_id
        and tp.email = current_email
      order by tp.created_at
      limit 1
      for update;
    end if;

    if teacher_row.id is null then
      insert into public.teacher_profiles (user_id, organization_id, display_name, email, status)
      values (
        current_user_id,
        admin_role.organization_id,
        coalesce(current_email, 'Admin Operator'),
        current_email,
        'active'
      )
      returning *
      into teacher_row;
    else
      update public.teacher_profiles
      set user_id = current_user_id,
          email = coalesce(current_email, email),
          status = 'active',
          updated_at = now()
      where id = teacher_row.id
      returning *
      into teacher_row;
    end if;

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      admin_role.organization_id,
      current_user_id,
      'admin.teacher_operator_profile_ensured',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('email', teacher_row.email)
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
  end loop;
end;
$$;

comment on function public.ensure_admin_teacher_operator_profile_for_current_user() is
  'Authenticated repair/bootstrap RPC for active admins. It creates or reuses one real active teacher_profiles operator row per active admin organization, allowing admin-owned setup/test classes without client-side fake teacher ids.';

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

  select tp.*
  into target_teacher
  from public.teacher_profiles tp
  join public.organizations o on o.id = tp.organization_id
  where tp.id = p_teacher_id
    and tp.status in ('active', 'pending')
    and o.status = 'active';

  if target_teacher.id is null then
    raise exception 'teacher_profile_required';
  end if;

  if not (
    public.is_admin(target_teacher.organization_id)
    or (
      target_teacher.status = 'active'
      and target_teacher.user_id = auth.uid()
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
    jsonb_build_object('teacher_id', target_teacher.id, 'teacher_status', target_teacher.status, 'class_code', class_row.class_code)
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
  'Creates an active P3 class for an authorized teacher/admin and inserts all canonical class_region_access rows as field_guide_only. Admins may assign classes to pending or active teacher profiles; non-admin teachers may create only for their own active profile.';

revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from public;
revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from anon;
grant execute on function public.admin_add_teacher_by_email(text, text, uuid) to authenticated;

revoke all on function public.activate_pending_teacher_role_for_current_user() from public;
revoke all on function public.activate_pending_teacher_role_for_current_user() from anon;
grant execute on function public.activate_pending_teacher_role_for_current_user() to authenticated;

revoke all on function public.ensure_admin_teacher_operator_profile_for_current_user() from public;
revoke all on function public.ensure_admin_teacher_operator_profile_for_current_user() from anon;
grant execute on function public.ensure_admin_teacher_operator_profile_for_current_user() to authenticated;

revoke all on function public.create_class_with_region_access(uuid, text, text, text) from public;
revoke all on function public.create_class_with_region_access(uuid, text, text, text) from anon;
grant execute on function public.create_class_with_region_access(uuid, text, text, text) to authenticated;
