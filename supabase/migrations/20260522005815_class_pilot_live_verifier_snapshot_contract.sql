-- Second live verifier repair pass, 2026-05-22.
--
-- The remaining 66/71 -> 71/71 failures were caused by the verifier reading
-- SECURITY DEFINER RPC side effects in the same SQL statement that invoked the
-- RPC. PostgreSQL evaluates that statement against one snapshot, so rows
-- written inside create_class_with_region_access(), admin_add_teacher_by_email(),
-- activate_pending_teacher_role_for_current_user(), and claim_class_roster_slot()
-- are visible to subsequent statements in the same transaction, not to sibling
-- subqueries in the invoking statement.
--
-- No database behavior change is required here. This forward migration records
-- the verified live contract and keeps Supabase migration history aligned with
-- the focused repair report.

comment on function public.create_class_with_region_access(uuid, text, text, text) is
  'Creates an active P3 class for an authorized teacher/admin and idempotently inserts all canonical class_region_access rows as field_guide_only. Verifiers must check seeded rows in a subsequent statement after invoking this SECURITY DEFINER RPC.';

comment on function public.admin_add_teacher_by_email(text, text, uuid) is
  'Admin-only RPC that creates or reuses a real teacher_profiles row by normalized organization email. Existing Auth users become active teachers immediately; missing Auth users become pending teacher profiles that can own classes until sign-in activation. Verifiers must check side-effect rows in a subsequent statement after invoking this SECURITY DEFINER RPC.';

comment on function public.activate_pending_teacher_role_for_current_user() is
  'Authenticated-user RPC that binds auth.uid() to pending teacher_profiles or teacher_invites by matching the verified Supabase Auth email server-side. Activated teachers receive the teacher role; invite bookkeeping remains admin/internal setup data.';

comment on function public.claim_class_roster_slot(text, text) is
  'Atomically binds an authenticated user to one existing, exactly named, unclaimed roster slot and provisions the active student role only after validating the active class and roster row. Verifiers must check role/profile/membership side effects in a subsequent statement after invoking this SECURITY DEFINER RPC.';

select pg_notify('pgrst', 'reload schema');
