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

  select count(*)
  into matching_count
  from public.class_memberships cm
  where cm.class_id = target_class.id
    and cm.roster_name = normalized_roster_name;

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
      'Ask your teacher to add your exact roster name first.'::text;
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
      normalized_roster_name,
      null::timestamptz,
      'More than one roster entry uses that name. Ask your teacher to make the roster name unique before claiming.'::text;
    return;
  end if;

  select cm.id, cm.student_profile_id, cm.roster_name, cm.roster_status, cm.claimed_by_user_id, sp.user_id as student_user_id
  into target_membership
  from public.class_memberships cm
  join public.student_profiles sp on sp.id = cm.student_profile_id
  where cm.class_id = target_class.id
    and cm.roster_name = normalized_roster_name
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
      'reserved_for_other_user'::text,
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

  if exists (
    select 1
    from public.user_roles ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role in ('admin', 'teacher')
      and ur.status = 'active'
  )
  and not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status = 'active'
  ) then
    return query select
      'staff_account_cannot_claim_student_slot'::text,
      target_class.id,
      target_class.name,
      target_class.class_code,
      target_class.teacher_id,
      target_class.teacher_name,
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This staff account is not a student account. Use a student sign-in to claim this roster slot.'::text;
    return;
  end if;

  if exists (
    select 1
    from public.user_roles ur
    where ur.user_id = claim_user_id
      and ur.organization_id = target_class.organization_id
      and ur.role = 'student'
      and ur.status <> 'active'
  )
  and not exists (
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
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This student role is inactive. Ask your teacher or admin to restore access before claiming.'::text;
    return;
  end if;

  insert into public.user_roles (user_id, organization_id, role, status)
  values (claim_user_id, target_class.organization_id, 'student', 'active')
  on conflict (user_id, organization_id, role) do nothing;

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
      target_membership.id,
      target_membership.roster_name,
      null::timestamptz,
      'This account could not be activated as a student. Ask your teacher or admin for help.'::text;
    return;
  end if;

  update public.student_profiles sp
  set user_id = claim_user_id,
      updated_at = now()
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
    'Roster slot claimed. Student access is active.'::text;
end;
$$;

comment on function public.claim_class_roster_slot(text, text) is
  'Atomically binds an authenticated user to one existing, exactly named, unclaimed roster slot and provisions the active student role only after validating the active class and roster row. SECURITY DEFINER is required because unclaimed roster rows are intentionally hidden by RLS.';

revoke all on function public.claim_class_roster_slot(text, text) from public;
revoke all on function public.claim_class_roster_slot(text, text) from anon;
grant execute on function public.claim_class_roster_slot(text, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
