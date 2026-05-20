-- Live classroom pilot bootstrap template.
--
-- Use this only after running the classroom schema SQL and after the real app
-- owner has signed into the hosted Supabase project at least once through the
-- Asterion app. The sign-in creates the auth.users row referenced below.
--
-- Replace the two constants inside the block before execution:
-- - app_owner_email: the email used for the owner's first Supabase sign-in
-- - pilot_organization_name: the real school/department organization name
--
-- This template creates or reuses one organization, then grants that existing
-- auth user one active admin role for the organization. It does not create demo
-- users, classes, rosters, class codes, progress snapshots, or self-promotion UI.

do $$
declare
  app_owner_email constant text := 'replace-with-real-owner-email@example.com';
  pilot_organization_name constant text := 'Replace With Real Organization Name';
  owner_user_id uuid;
  pilot_organization_id uuid;
begin
  if app_owner_email = 'replace-with-real-owner-email@example.com'
    or pilot_organization_name = 'Replace With Real Organization Name' then
    raise exception 'Replace app_owner_email and pilot_organization_name before running the live pilot bootstrap.';
  end if;

  select id
  into owner_user_id
  from auth.users
  where lower(email) = lower(app_owner_email)
  order by created_at desc
  limit 1;

  if owner_user_id is null then
    raise exception 'No auth.users row found for %. The app owner must sign in once before bootstrap.', app_owner_email;
  end if;

  select id
  into pilot_organization_id
  from public.organizations
  where name = pilot_organization_name
  order by created_at
  limit 1;

  if pilot_organization_id is null then
    insert into public.organizations (name, status)
    values (pilot_organization_name, 'active')
    returning id into pilot_organization_id;
  else
    update public.organizations
    set status = 'active',
        updated_at = now()
    where id = pilot_organization_id;
  end if;

  insert into public.user_roles (user_id, role, organization_id, status)
  values (owner_user_id, 'admin', pilot_organization_id, 'active')
  on conflict (user_id, organization_id, role) do update
  set status = 'active',
      updated_at = now();

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    pilot_organization_id,
    owner_user_id,
    'live_pilot.owner_admin_bootstrapped',
    'organization',
    pilot_organization_id,
    jsonb_build_object('source', '005_live_pilot_bootstrap_template')
  );

  raise notice 'Bootstrapped owner user % as active admin for organization %.', owner_user_id, pilot_organization_id;
end $$;
