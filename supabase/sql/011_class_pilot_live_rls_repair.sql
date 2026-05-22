-- Repair live class-pilot RLS/RPC contracts found by the 2026-05-22 verifier.
-- This migration replaces function bodies only, plus one non-destructive unique
-- constraint that matches the existing normalized teacher email contract.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.teacher_profiles'::regclass
      and conname = 'teacher_profiles_organization_id_email_key'
  ) then
    alter table public.teacher_profiles
      add constraint teacher_profiles_organization_id_email_key unique (organization_id, email);
  end if;
end;
$$;

create or replace function public.asterion_snapshot_json_has_forbidden_key(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  object_entry record;
  array_entry jsonb;
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
    for object_entry in
      select entry.entry_key, entry.entry_value
      from jsonb_each(payload) as entry(entry_key, entry_value)
    loop
      if object_entry.entry_key = any (forbidden_keys) then
        return true;
      end if;

      if public.asterion_snapshot_json_has_forbidden_key(object_entry.entry_value) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(payload) = 'array' then
    for array_entry in
      select element.element_value
      from jsonb_array_elements(payload) as element(element_value)
    loop
      if public.asterion_snapshot_json_has_forbidden_key(array_entry) then
        return true;
      end if;
    end loop;
  end if;

  return false;
end;
$$;

comment on function public.asterion_snapshot_json_has_forbidden_key(jsonb) is
  'Recursively rejects forbidden raw learner-data keys in bounded progress snapshot JSON using aliased JSONB traversal.';

create or replace function public.asterion_snapshot_json_has_forbidden_key(payload jsonb, forbidden_keys text[])
returns boolean
language plpgsql
immutable
strict
as $$
declare
  object_entry record;
  array_entry jsonb;
begin
  if jsonb_typeof(payload) = 'object' then
    for object_entry in
      select entry.entry_key, entry.entry_value
      from jsonb_each(payload) as entry(entry_key, entry_value)
    loop
      if object_entry.entry_key = any (forbidden_keys) then
        return true;
      end if;

      if public.asterion_snapshot_json_has_forbidden_key(object_entry.entry_value, forbidden_keys) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(payload) = 'array' then
    for array_entry in
      select element.element_value
      from jsonb_array_elements(payload) as element(element_value)
    loop
      if public.asterion_snapshot_json_has_forbidden_key(array_entry, forbidden_keys) then
        return true;
      end if;
    end loop;
  end if;

  return false;
end;
$$;

comment on function public.asterion_snapshot_json_has_forbidden_key(jsonb, text[]) is
  'Recursively rejects caller-provided forbidden keys in bounded hosted progress event payload JSON using aliased JSONB traversal.';

create or replace function public.enforce_student_progress_event_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_row public.class_memberships%rowtype;
  class_row public.classes%rowtype;
  profile_row public.student_profiles%rowtype;
begin
  select cm.*
  into membership_row
  from public.class_memberships as cm
  where cm.id = new.class_membership_id;

  if membership_row.id is null then
    raise exception 'membership_required';
  end if;

  select c.*
  into class_row
  from public.classes as c
  where c.id = membership_row.class_id;

  select sp.*
  into profile_row
  from public.student_profiles as sp
  where sp.id = membership_row.student_profile_id;

  if class_row.id is null or profile_row.id is null then
    raise exception 'membership_context_required';
  end if;

  if new.class_id <> membership_row.class_id
    or new.student_profile_id <> membership_row.student_profile_id
    or new.organization_id <> class_row.organization_id
    or profile_row.organization_id <> class_row.organization_id then
    raise exception 'membership_context_mismatch';
  end if;

  if new.actor_user_id <> membership_row.claimed_by_user_id
    or profile_row.user_id <> membership_row.claimed_by_user_id then
    raise exception 'actor_membership_mismatch';
  end if;

  return new;
end;
$$;

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
  v_organization_id uuid;
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
    v_organization_id := p_organization_id;
  else
    select ur.organization_id
    into v_organization_id
    from public.user_roles as ur
    join public.organizations as o on o.id = ur.organization_id
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.status = 'active'
      and o.status = 'active'
    order by ur.created_at
    limit 1;
  end if;

  if v_organization_id is null or not public.is_admin(v_organization_id) then
    raise exception 'admin_required';
  end if;

  select u.id, u.email
  into target_user
  from auth.users as u
  where lower(u.email) = normalized_email
  order by u.created_at desc
  limit 1;

  select tp.*
  into teacher_row
  from public.teacher_profiles as tp
  where tp.organization_id = v_organization_id
    and tp.email = normalized_email
  order by tp.created_at
  limit 1
  for update;

  if teacher_row.id is null and target_user.id is not null then
    select tp.*
    into teacher_row
    from public.teacher_profiles as tp
    where tp.organization_id = v_organization_id
      and tp.user_id = target_user.id
    order by tp.created_at
    limit 1
    for update;
  end if;

  if target_user.id is null then
    if teacher_row.id is null then
      insert into public.teacher_profiles as tp (user_id, organization_id, display_name, email, status)
      values (null, v_organization_id, normalized_display_name, normalized_email, 'pending')
      on conflict on constraint teacher_profiles_organization_id_email_key do update
        set display_name = excluded.display_name,
            status = case
              when tp.status = 'active' then tp.status
              else 'pending'
            end,
            updated_at = now()
      returning tp.*
      into teacher_row;
    else
      update public.teacher_profiles as tp
      set display_name = normalized_display_name,
          email = normalized_email,
          status = case
            when tp.status = 'active' then tp.status
            else 'pending'
          end,
          updated_at = now()
      where tp.id = teacher_row.id
      returning tp.*
      into teacher_row;
    end if;

    update public.teacher_invites as ti
    set display_name = normalized_display_name,
        created_by = auth.uid(),
        updated_at = now()
    where ti.organization_id = v_organization_id
      and ti.email = normalized_email
      and ti.status = 'pending'
    returning ti.*
    into invite_row;

    if invite_row.id is null then
      insert into public.teacher_invites (organization_id, email, display_name, status, created_by)
      values (v_organization_id, normalized_email, normalized_display_name, 'pending', auth.uid())
      returning *
      into invite_row;
    end if;

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      v_organization_id,
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

  insert into public.user_roles as ur (user_id, role, organization_id, status)
  values (target_user.id, 'teacher', v_organization_id, 'active')
  on conflict on constraint user_roles_user_id_organization_id_role_key do update
    set status = 'active',
        updated_at = now();

  if teacher_row.id is null then
    insert into public.teacher_profiles as tp (user_id, organization_id, display_name, email, status)
    values (
      target_user.id,
      v_organization_id,
      normalized_display_name,
      normalized_email,
      'active'
    )
    on conflict on constraint teacher_profiles_organization_id_email_key do update
      set user_id = excluded.user_id,
          display_name = excluded.display_name,
          email = excluded.email,
          status = 'active',
          updated_at = now()
    returning tp.*
    into teacher_row;
  else
    update public.teacher_profiles as tp
    set user_id = target_user.id,
        display_name = normalized_display_name,
        email = normalized_email,
        status = 'active',
        updated_at = now()
    where tp.id = teacher_row.id
    returning tp.*
    into teacher_row;
  end if;

  update public.teacher_invites as ti
  set status = 'activated',
      activated_user_id = target_user.id,
      activated_teacher_profile_id = teacher_row.id,
      activated_at = now(),
      updated_at = now()
  where ti.organization_id = v_organization_id
    and ti.email = normalized_email
    and ti.status = 'pending';

  insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_organization_id,
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
  v_user_id uuid := auth.uid();
  v_email text;
  invite_row public.teacher_invites%rowtype;
  teacher_row public.teacher_profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  select lower(trim(au.email))
  into v_email
  from auth.users as au
  where au.id = v_user_id
    and au.email is not null
    and au.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    return;
  end if;

  for teacher_row in
    select tp.*
    from public.teacher_profiles as tp
    join public.organizations as o on o.id = tp.organization_id
    where tp.email = v_email
      and tp.status = 'pending'
      and o.status = 'active'
    order by tp.created_at
    for update of tp
  loop
    insert into public.user_roles as ur (user_id, role, organization_id, status)
    values (v_user_id, 'teacher', teacher_row.organization_id, 'active')
    on conflict on constraint user_roles_user_id_organization_id_role_key do update
      set status = 'active',
          updated_at = now();

    update public.teacher_profiles as tp
    set user_id = v_user_id,
        email = v_email,
        status = 'active',
        updated_at = now()
    where tp.id = teacher_row.id
    returning tp.*
    into teacher_row;

    update public.teacher_invites as ti
    set status = 'activated',
        activated_user_id = v_user_id,
        activated_teacher_profile_id = teacher_row.id,
        activated_at = now(),
        updated_at = now()
    where ti.organization_id = teacher_row.organization_id
      and ti.email = v_email
      and ti.status = 'pending';

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      teacher_row.organization_id,
      v_user_id,
      'teacher.pending_profile_activated',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('email', v_email)
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
    from public.teacher_invites as ti
    join public.organizations as o on o.id = ti.organization_id
    where ti.email = v_email
      and ti.status = 'pending'
      and o.status = 'active'
      and not exists (
        select 1
        from public.teacher_profiles as tp
        where tp.organization_id = ti.organization_id
          and tp.email = ti.email
      )
    order by ti.created_at
    for update of ti
  loop
    insert into public.user_roles as ur (user_id, role, organization_id, status)
    values (v_user_id, 'teacher', invite_row.organization_id, 'active')
    on conflict on constraint user_roles_user_id_organization_id_role_key do update
      set status = 'active',
          updated_at = now();

    insert into public.teacher_profiles as tp (user_id, organization_id, display_name, email, status)
    values (
      v_user_id,
      invite_row.organization_id,
      invite_row.display_name,
      v_email,
      'active'
    )
    on conflict on constraint teacher_profiles_organization_id_email_key do update
      set user_id = excluded.user_id,
          display_name = excluded.display_name,
          email = excluded.email,
          status = 'active',
          updated_at = now()
    returning tp.*
    into teacher_row;

    update public.teacher_invites as ti
    set status = 'activated',
        activated_user_id = v_user_id,
        activated_teacher_profile_id = teacher_row.id,
        activated_at = now(),
        updated_at = now()
    where ti.id = invite_row.id;

    insert into public.audit_events (organization_id, actor_user_id, event_type, entity_type, entity_id, metadata)
    values (
      teacher_row.organization_id,
      v_user_id,
      'teacher.pending_invite_activated',
      'teacher_profile',
      teacher_row.id,
      jsonb_build_object('teacher_invite_id', invite_row.id, 'email', v_email)
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
  'Authenticated-user RPC that binds auth.uid() to pending teacher_profiles or teacher_invites by matching the verified Supabase Auth email server-side.';

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
  from public.teacher_profiles as tp
  join public.organizations as o on o.id = tp.organization_id
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
  select
    class_row.id,
    region.region_id,
    'field_guide_only',
    auth.uid()
  from unnest(array[
    'algebra-forge',
    'logarithm-grove',
    'trig-observatory',
    'complex-harbor',
    'calculus-cliffs',
    'integration-gardens',
    'vector-workshop',
    'numerical-mines',
    'differential-shrine'
  ]::text[]) as region(region_id)
  on conflict on constraint class_region_access_class_id_region_id_key do update
    set access_status = excluded.access_status,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = now();

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
  'Creates an active P3 class for an authorized teacher/admin and idempotently inserts all canonical class_region_access rows as field_guide_only.';

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
  from public.class_memberships as cm
  where cm.id = p_membership_id
  for update;

  if target_membership.id is null then
    raise exception 'roster_membership_required';
  end if;

  select c.*
  into target_class
  from public.classes as c
  where c.id = target_membership.class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  update public.class_memberships as cm
  set roster_status = 'archived',
      claimed_by_user_id = null,
      claimed_at = null,
      archived_at = now(),
      updated_at = now()
  where cm.id = target_membership.id
  returning cm.*
  into membership_row;

  update public.student_profiles as sp
  set user_id = null,
      status = 'archived',
      updated_at = now()
  where sp.id = membership_row.student_profile_id;

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
  from public.class_memberships as cm
  where cm.id = p_membership_id
  for update;

  if target_membership.id is null then
    raise exception 'roster_membership_required';
  end if;

  if target_membership.roster_status <> 'claimed' then
    raise exception 'claimed_roster_required';
  end if;

  select c.*
  into target_class
  from public.classes as c
  where c.id = target_membership.class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  update public.class_memberships as cm
  set roster_status = 'unclaimed',
      claimed_by_user_id = null,
      claimed_at = null,
      archived_at = null,
      updated_at = now()
  where cm.id = target_membership.id
  returning cm.*
  into membership_row;

  update public.student_profiles as sp
  set user_id = null,
      status = 'active',
      updated_at = now()
  where sp.id = membership_row.student_profile_id;

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

  select c.*
  into target_class
  from public.classes as c
  where c.id = p_class_id
    and c.status = 'active';

  if target_class.id is null then
    raise exception 'active_class_required';
  end if;

  if not (public.is_admin(target_class.organization_id) or public.is_teacher_for_class(target_class.id)) then
    raise exception 'teacher_or_admin_required';
  end if;

  insert into public.class_region_access as cra (class_id, region_id, access_status, updated_by_user_id)
  values (target_class.id, p_region_id, p_access_status, auth.uid())
  on conflict on constraint class_region_access_class_id_region_id_key do update
    set access_status = excluded.access_status,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = now()
  returning cra.*
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
  'Updates one class-region access row for an assigned teacher or admin using canonical region IDs.';

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
  normalized_roster_name text := trim(coalesce(p_roster_name, ''));
  target_class record;
  target_membership record;
  claim_timestamp timestamptz;
  matching_count integer;
begin
  if claim_user_id is null then
    return query select
      'unauthenticated'::text, null::uuid, null::text, null::text, null::uuid,
      null::text, null::uuid, null::text, null::timestamptz,
      'Sign in before claiming a roster slot.'::text;
    return;
  end if;

  select c.id, c.name, c.class_code, c.organization_id, tp.id as teacher_id, tp.display_name as teacher_name
  into target_class
  from public.classes as c
  join public.teacher_profiles as tp on tp.id = c.teacher_id
  where upper(c.class_code) = normalized_class_code
    and c.status = 'active'
  limit 1;

  if target_class.id is null then
    return query select
      'invalid_class_code'::text, null::uuid, null::text, null::text, null::uuid,
      null::text, null::uuid, null::text, null::timestamptz,
      'Enter a valid active class code from your teacher.'::text;
    return;
  end if;

  select count(*)
  into matching_count
  from public.class_memberships as cm
  where cm.class_id = target_class.id
    and cm.roster_name = normalized_roster_name;

  if matching_count = 0 then
    return query select
      'roster_name_not_found'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      null::uuid, null::text, null::timestamptz,
      'Ask your teacher to add your exact roster name first.'::text;
    return;
  end if;

  if matching_count > 1 then
    return query select
      'ambiguous_roster_name'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      null::uuid, normalized_roster_name, null::timestamptz,
      'More than one roster entry uses that name. Ask your teacher to make the roster name unique before claiming.'::text;
    return;
  end if;

  select cm.id, cm.student_profile_id, cm.roster_name, cm.roster_status, cm.claimed_by_user_id, sp.user_id as student_user_id
  into target_membership
  from public.class_memberships as cm
  join public.student_profiles as sp on sp.id = cm.student_profile_id
  where cm.class_id = target_class.id
    and cm.roster_name = normalized_roster_name
  for update of cm, sp;

  if target_membership.roster_status = 'archived' then
    return query select
      'archived'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This roster entry is archived. Ask your teacher or admin for help.'::text;
    return;
  end if;

  if target_membership.roster_status = 'claimed' then
    return query select
      'already_claimed'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This roster entry has already been claimed. Ask your teacher or admin for help.'::text;
    return;
  end if;

  if target_membership.student_user_id is not null and target_membership.student_user_id <> claim_user_id then
    return query select
      'reserved_for_other_user'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This roster entry is reserved for another signed-in account.'::text;
    return;
  end if;

  if exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role in ('admin', 'teacher')
      and ur.status = 'active'
  )
  and not exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
  ) then
    return query select
      'staff_account_cannot_claim_student_slot'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This staff account is not a student account. Use a student sign-in to claim this roster slot.'::text;
    return;
  end if;

  if exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status <> 'active'
  )
  and not exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
  ) then
    return query select
      'unauthorized'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This student role is inactive. Ask your teacher or admin to restore access before claiming.'::text;
    return;
  end if;

  insert into public.user_roles as ur (user_id, organization_id, role, status)
  values (claim_user_id, target_class.organization_id, 'student', 'active')
  on conflict on constraint user_roles_user_id_organization_id_role_key do nothing;

  if not exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
  ) then
    return query select
      'unauthorized'::text,
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
      'This account could not be activated as a student. Ask your teacher or admin for help.'::text;
    return;
  end if;

  update public.student_profiles as sp
  set user_id = claim_user_id,
      updated_at = now()
  where sp.id = target_membership.student_profile_id
    and (sp.user_id is null or sp.user_id = claim_user_id);

  update public.class_memberships as cm
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
      target_class.id, target_class.name, target_class.class_code,
      target_class.teacher_id, target_class.teacher_name,
      target_membership.id, target_membership.roster_name, null::timestamptz,
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
    'Roster slot claimed. Student access is active.'::text;
end;
$$;

comment on function public.claim_class_roster_slot(text, text) is
  'Atomically binds an authenticated user to one existing, exactly named, unclaimed roster slot and provisions the active student role only after validating the active class and roster row.';

revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from public;
revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from anon;
grant execute on function public.admin_add_teacher_by_email(text, text, uuid) to authenticated;

revoke all on function public.activate_pending_teacher_role_for_current_user() from public;
revoke all on function public.activate_pending_teacher_role_for_current_user() from anon;
grant execute on function public.activate_pending_teacher_role_for_current_user() to authenticated;

revoke all on function public.create_class_with_region_access(uuid, text, text, text) from public;
revoke all on function public.create_class_with_region_access(uuid, text, text, text) from anon;
grant execute on function public.create_class_with_region_access(uuid, text, text, text) to authenticated;

revoke all on function public.archive_class_roster_student(uuid) from public;
revoke all on function public.archive_class_roster_student(uuid) from anon;
grant execute on function public.archive_class_roster_student(uuid) to authenticated;

revoke all on function public.reset_class_roster_claim(uuid) from public;
revoke all on function public.reset_class_roster_claim(uuid) from anon;
grant execute on function public.reset_class_roster_claim(uuid) to authenticated;

revoke all on function public.set_class_region_access(uuid, text, text) from public;
revoke all on function public.set_class_region_access(uuid, text, text) from anon;
grant execute on function public.set_class_region_access(uuid, text, text) to authenticated;

revoke all on function public.claim_class_roster_slot(text, text) from public;
revoke all on function public.claim_class_roster_slot(text, text) from anon;
grant execute on function public.claim_class_roster_slot(text, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
