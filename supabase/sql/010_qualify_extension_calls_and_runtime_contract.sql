-- Keep hosted Supabase projects independent from session search_path changes.
-- pgcrypto is installed in the extensions schema in Supabase projects, so
-- SECURITY DEFINER code and table defaults must qualify extension functions.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table if exists public.organizations
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.user_roles
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.teacher_profiles
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.student_profiles
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.classes
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.class_memberships
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.class_region_access
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.student_progress_snapshots
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.audit_events
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.student_progress_events
  alter column id set default extensions.gen_random_uuid();

alter table if exists public.teacher_invites
  alter column id set default extensions.gen_random_uuid();

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

comment on function public.generate_asterion_class_code() is
  'Generates a unique class code using pgcrypto from the extensions schema so SECURITY DEFINER search_path settings do not break hosted class creation.';
