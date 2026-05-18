-- Optional browser diagnostic RPC.
-- This returns only non-sensitive project health metadata.

create or replace function public.asterion_health_check()
returns table (
  ok boolean,
  service text,
  schema_phase text,
  checked_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    true as ok,
    'asterion'::text as service,
    'classroom_phase_1'::text as schema_phase,
    now() as checked_at;
$$;

grant execute on function public.asterion_health_check() to anon, authenticated;
