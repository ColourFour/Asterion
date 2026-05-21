create or replace function public.asterion_safe_progress_event_identifier(value text)
returns boolean
language sql
immutable
as $$
  select value is null
    or (
      char_length(value) between 1 and 128
      and value ~ '^[A-Za-z0-9._:-]+$'
    );
$$;

create or replace function public.asterion_snapshot_json_has_forbidden_key(payload jsonb, forbidden_keys text[])
returns boolean
language plpgsql
immutable
strict
as $$
declare
  item record;
  value jsonb;
begin
  if jsonb_typeof(payload) = 'object' then
    for item in select key, value from jsonb_each(payload) loop
      if item.key = any (forbidden_keys) then
        return true;
      end if;
      if public.asterion_snapshot_json_has_forbidden_key(item.value, forbidden_keys) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(payload) = 'array' then
    for value in select jsonb_array_elements(payload) loop
      if public.asterion_snapshot_json_has_forbidden_key(value, forbidden_keys) then
        return true;
      end if;
    end loop;
  end if;

  return false;
end;
$$;

drop policy if exists "students can insert own bounded progress snapshots" on public.student_progress_snapshots;

create or replace function public.asterion_valid_progress_event_payload(payload jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 1024
    and not public.asterion_snapshot_json_has_forbidden_key(
      payload,
      array[
        'learnerResponse',
        'prompt',
        'note',
        'notes',
        'issueReport',
        'issueReports',
        'questionImageUrls',
        'markSchemeImageUrls',
        'questionImageRawPaths',
        'markSchemeImageRawPaths',
        'questionImagePaths',
        'markSchemeImagePaths',
        'imagePath',
        'imageUrl',
        'localStorage',
        'sessionStorage',
        'attempts',
        'learningActivityAttempts',
        'fullAttempt',
        'raw'
      ]
    )
    and not exists (
      select 1
      from jsonb_object_keys(payload) as key_name(key)
      where key_name.key not in (
        'scoreRatio',
        'marksEarned',
        'marksAvailable',
        'outcome',
        'completed',
        'passed',
        'durationSeconds'
      )
    )
    and (
      not payload ? 'scoreRatio'
      or (
        jsonb_typeof(payload->'scoreRatio') = 'number'
        and (payload->>'scoreRatio')::numeric between 0 and 1
      )
    )
    and (
      not payload ? 'marksEarned'
      or (
        jsonb_typeof(payload->'marksEarned') = 'number'
        and (payload->>'marksEarned')::numeric between 0 and 999
      )
    )
    and (
      not payload ? 'marksAvailable'
      or (
        jsonb_typeof(payload->'marksAvailable') = 'number'
        and (payload->>'marksAvailable')::numeric between 0 and 999
      )
    )
    and (
      not payload ? 'durationSeconds'
      or (
        jsonb_typeof(payload->'durationSeconds') = 'number'
        and (payload->>'durationSeconds')::numeric between 0 and 86400
      )
    )
    and (
      not payload ? 'outcome'
      or payload->>'outcome' in ('got_it', 'partial', 'missed')
    )
    and (
      not payload ? 'completed'
      or jsonb_typeof(payload->'completed') = 'boolean'
    )
    and (
      not payload ? 'passed'
      or jsonb_typeof(payload->'passed') = 'boolean'
    );
$$;

create table public.student_progress_events (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete cascade,
  class_membership_id uuid not null references public.class_memberships(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  region_id text not null check (region_id in (
    'algebra-forge',
    'logarithm-grove',
    'trig-observatory',
    'complex-harbor',
    'calculus-cliffs',
    'integration-gardens',
    'vector-workshop',
    'numerical-mines',
    'differential-shrine'
  )),
  activity_type text not null check (activity_type in (
    'field_guide',
    'quick_check',
    'warm_up',
    'exam_practice',
    'mark_scheme',
    'guardian'
  )),
  content_id text check (public.asterion_safe_progress_event_identifier(content_id)),
  question_id text check (public.asterion_safe_progress_event_identifier(question_id)),
  skill_id text check (public.asterion_safe_progress_event_identifier(skill_id)),
  event_type text not null check (event_type in (
    'field_guide_completed',
    'quick_check_completed',
    'warm_up_completed',
    'practice_attempt_saved',
    'mark_scheme_revealed',
    'guardian_attempted',
    'guardian_completed'
  )),
  event_payload jsonb not null default '{}'::jsonb check (public.asterion_valid_progress_event_payload(event_payload)),
  created_at timestamptz not null default now(),
  constraint student_progress_events_activity_event_match check (
    (activity_type = 'field_guide' and event_type = 'field_guide_completed')
    or (activity_type = 'quick_check' and event_type = 'quick_check_completed')
    or (activity_type = 'warm_up' and event_type = 'warm_up_completed')
    or (activity_type = 'exam_practice' and event_type = 'practice_attempt_saved')
    or (activity_type = 'mark_scheme' and event_type = 'mark_scheme_revealed')
    or (activity_type = 'guardian' and event_type in ('guardian_attempted', 'guardian_completed'))
  )
);

create index student_progress_events_class_created_idx
  on public.student_progress_events(class_id, created_at desc);

create index student_progress_events_membership_created_idx
  on public.student_progress_events(class_membership_id, created_at desc);

create index student_progress_events_region_idx
  on public.student_progress_events(class_id, region_id, created_at desc);

alter table public.student_progress_events enable row level security;

create policy "students can read own hosted progress events"
on public.student_progress_events
for select
using (public.is_student_for_membership(class_membership_id));

create policy "teachers can read assigned class hosted progress events"
on public.student_progress_events
for select
using (public.is_teacher_for_class(class_id));

create policy "admins can read organization hosted progress events"
on public.student_progress_events
for select
using (public.is_admin(organization_id));

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
  select *
  into membership_row
  from public.class_memberships cm
  where cm.id = new.class_membership_id;

  if membership_row.id is null then
    raise exception 'membership_required';
  end if;

  select *
  into class_row
  from public.classes c
  where c.id = membership_row.class_id;

  select *
  into profile_row
  from public.student_profiles sp
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

create trigger enforce_student_progress_event_membership
before insert on public.student_progress_events
for each row execute function public.enforce_student_progress_event_membership();

create or replace function public.record_student_progress_event(
  p_class_id uuid,
  p_class_membership_id uuid,
  p_student_profile_id uuid,
  p_region_id text,
  p_activity_type text,
  p_event_type text,
  p_content_id text default null,
  p_question_id text default null,
  p_skill_id text default null,
  p_event_payload jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  organization_id uuid,
  class_id uuid,
  class_membership_id uuid,
  student_profile_id uuid,
  actor_user_id uuid,
  region_id text,
  activity_type text,
  content_id text,
  question_id text,
  skill_id text,
  event_type text,
  event_payload jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_row public.class_memberships%rowtype;
  class_row public.classes%rowtype;
  profile_row public.student_profiles%rowtype;
  access_status text;
  inserted_row public.student_progress_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not public.is_student_for_membership(p_class_membership_id) then
    raise exception 'claimed_membership_required';
  end if;

  select *
  into membership_row
  from public.class_memberships cm
  where cm.id = p_class_membership_id
    and cm.roster_status = 'claimed'
    and cm.claimed_by_user_id = auth.uid()
  for update;

  if membership_row.id is null then
    raise exception 'claimed_membership_required';
  end if;

  if membership_row.class_id <> p_class_id
    or membership_row.student_profile_id <> p_student_profile_id then
    raise exception 'membership_context_mismatch';
  end if;

  select *
  into class_row
  from public.classes c
  where c.id = p_class_id
    and c.status = 'active';

  select *
  into profile_row
  from public.student_profiles sp
  where sp.id = p_student_profile_id
    and sp.status = 'active'
    and sp.user_id = auth.uid();

  if class_row.id is null or profile_row.id is null then
    raise exception 'active_membership_context_required';
  end if;

  if class_row.organization_id <> profile_row.organization_id then
    raise exception 'organization_mismatch';
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
    raise exception 'region_required';
  end if;

  if not (
    (p_activity_type = 'field_guide' and p_event_type = 'field_guide_completed')
    or (p_activity_type = 'quick_check' and p_event_type = 'quick_check_completed')
    or (p_activity_type = 'warm_up' and p_event_type = 'warm_up_completed')
    or (p_activity_type = 'exam_practice' and p_event_type = 'practice_attempt_saved')
    or (p_activity_type = 'mark_scheme' and p_event_type = 'mark_scheme_revealed')
    or (p_activity_type = 'guardian' and p_event_type in ('guardian_attempted', 'guardian_completed'))
  ) then
    raise exception 'unsupported_progress_event';
  end if;

  select cra.access_status
  into access_status
  from public.class_region_access cra
  where cra.class_id = p_class_id
    and cra.region_id = p_region_id;

  if access_status is null then
    raise exception 'region_access_required';
  end if;

  if p_activity_type = 'field_guide' then
    if access_status not in ('open', 'field_guide_only') then
      raise exception 'region_access_blocked';
    end if;
  elsif access_status <> 'open' then
    raise exception 'region_access_blocked';
  end if;

  if not public.asterion_safe_progress_event_identifier(p_content_id)
    or not public.asterion_safe_progress_event_identifier(p_question_id)
    or not public.asterion_safe_progress_event_identifier(p_skill_id) then
    raise exception 'unsafe_progress_identifier';
  end if;

  if not public.asterion_valid_progress_event_payload(coalesce(p_event_payload, '{}'::jsonb)) then
    raise exception 'unsafe_progress_payload';
  end if;

  insert into public.student_progress_events (
    organization_id,
    class_id,
    class_membership_id,
    student_profile_id,
    actor_user_id,
    region_id,
    activity_type,
    content_id,
    question_id,
    skill_id,
    event_type,
    event_payload
  )
  values (
    class_row.organization_id,
    p_class_id,
    p_class_membership_id,
    p_student_profile_id,
    auth.uid(),
    p_region_id,
    p_activity_type,
    nullif(trim(p_content_id), ''),
    nullif(trim(p_question_id), ''),
    nullif(trim(p_skill_id), ''),
    p_event_type,
    coalesce(p_event_payload, '{}'::jsonb)
  )
  returning *
  into inserted_row;

  return query select
    inserted_row.id,
    inserted_row.organization_id,
    inserted_row.class_id,
    inserted_row.class_membership_id,
    inserted_row.student_profile_id,
    inserted_row.actor_user_id,
    inserted_row.region_id,
    inserted_row.activity_type,
    inserted_row.content_id,
    inserted_row.question_id,
    inserted_row.skill_id,
    inserted_row.event_type,
    inserted_row.event_payload,
    inserted_row.created_at;
end;
$$;

comment on table public.student_progress_events is
  'Append-only hosted classroom progress events. Teacher-visible activity summaries must be derived from this table, not browser localStorage snapshots.';

comment on function public.record_student_progress_event(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) is
  'Student RPC for hosted classroom progress events. It binds writes to auth.uid(), claimed membership, class context, region access, allowed event types, and bounded metadata. Runtime question/content IDs are format-constrained here; full bank membership remains a pilot limitation.';

revoke all on function public.record_student_progress_event(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) from public;
revoke all on function public.record_student_progress_event(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) from anon;
grant execute on function public.record_student_progress_event(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) to authenticated;
