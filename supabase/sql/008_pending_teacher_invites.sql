create table if not exists public.teacher_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'activated', 'archived', 'disabled')),
  created_by uuid references auth.users(id) on delete set null,
  activated_user_id uuid references auth.users(id) on delete set null,
  activated_teacher_profile_id uuid references public.teacher_profiles(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_invites_email_normalized check (email = lower(trim(email)) and email <> ''),
  constraint teacher_invites_activation_state check (
    (
      status = 'activated'
      and activated_user_id is not null
      and activated_teacher_profile_id is not null
      and activated_at is not null
    )
    or (
      status <> 'activated'
      and activated_user_id is null
      and activated_teacher_profile_id is null
      and activated_at is null
    )
  )
);

create unique index if not exists teacher_invites_one_pending_email_per_org
on public.teacher_invites (organization_id, email)
where status = 'pending';

drop trigger if exists teacher_invites_set_updated_at on public.teacher_invites;
create trigger teacher_invites_set_updated_at
before update on public.teacher_invites
for each row execute function public.set_updated_at();

alter table public.teacher_invites enable row level security;

drop policy if exists "admins can read teacher invites" on public.teacher_invites;
create policy "admins can read teacher invites"
on public.teacher_invites for select
to authenticated
using (public.is_admin(organization_id));

revoke all on table public.teacher_invites from public;
revoke all on table public.teacher_invites from anon;
grant select on table public.teacher_invites to authenticated;

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

  if target_user.id is null then
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
      'admin.teacher.invite_pending',
      'teacher_invite',
      invite_row.id,
      jsonb_build_object('email', invite_row.email)
    );

    return query select
      invite_row.id,
      null::uuid,
      invite_row.organization_id,
      invite_row.display_name,
      invite_row.email,
      invite_row.status,
      invite_row.created_at,
      invite_row.updated_at;
    return;
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
    normalized_display_name,
    coalesce(target_user.email, normalized_email),
    'active'
  )
  on conflict (user_id, organization_id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        status = 'active',
        updated_at = now()
  returning *
  into teacher_row;

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
  'Admin-only RPC that pre-authorizes a teacher email. If the Supabase Auth user already exists, it activates the teacher role immediately; otherwise it creates or updates one pending teacher_invites row for the organization.';

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

  for invite_row in
    select ti.*
    from public.teacher_invites ti
    join public.organizations o on o.id = ti.organization_id
    where ti.email = current_email
      and ti.status = 'pending'
      and o.status = 'active'
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
    on conflict (user_id, organization_id) do update
      set display_name = excluded.display_name,
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
      invite_row.organization_id,
      current_user_id,
      'teacher.invite_activated',
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
  'Authenticated-user RPC that activates pending teacher_invites for auth.uid() by matching the verified Supabase Auth email. The client supplies no user id or email.';

revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from public;
revoke all on function public.admin_add_teacher_by_email(text, text, uuid) from anon;
grant execute on function public.admin_add_teacher_by_email(text, text, uuid) to authenticated;

revoke all on function public.activate_pending_teacher_role_for_current_user() from public;
revoke all on function public.activate_pending_teacher_role_for_current_user() from anon;
grant execute on function public.activate_pending_teacher_role_for_current_user() to authenticated;
