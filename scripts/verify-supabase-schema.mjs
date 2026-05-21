import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const migrationDir = path.join(root, 'supabase', 'migrations');
const seedPath = path.join(root, 'supabase', 'seed.sql');
const p3ContractPath = path.join(root, 'src', 'lib', 'p3SkillContract.ts');
const envExamplePath = path.join(root, '.env.example');

const requiredTables = [
  'organizations',
  'user_roles',
  'teacher_profiles',
  'teacher_invites',
  'student_profiles',
  'classes',
  'class_memberships',
  'class_region_access',
  'student_progress_snapshots',
  'student_progress_events',
  'audit_events',
];

const expectedRegionIds = [
  'algebra-forge',
  'logarithm-grove',
  'trig-observatory',
  'complex-harbor',
  'calculus-cliffs',
  'integration-gardens',
  'vector-workshop',
  'numerical-mines',
  'differential-shrine',
];

function fail(message) {
  throw new Error(message);
}

function readSql() {
  if (!existsSync(migrationDir)) fail('supabase/migrations is missing');
  const files = readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  if (files.length === 0) fail('No Supabase migration files found');
  return files.map((file) => readFileSync(path.join(migrationDir, file), 'utf8')).join('\n');
}

function extractQuotedRegionIds(source) {
  return new Set([...source.matchAll(/'([a-z]+(?:-[a-z]+)+)'/g)].map((match) => match[1]));
}

function extractFunctionBody(sql, functionName) {
  const startPattern = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${functionName}\\b`, 'i');
  const starts = [...sql.matchAll(new RegExp(startPattern.source, 'gi'))].map((match) => match.index ?? -1);
  const start = starts.at(-1) ?? -1;
  const end = sql.indexOf(`comment on function public.${functionName}`, start);
  if (start === -1 || end === -1) fail(`Missing documentation comment for public.${functionName}`);
  return sql.slice(start, end);
}

function assertNoAmbiguousBareIdPatterns(sql) {
  const checkedFunctions = [
    'admin_add_teacher_by_email',
    'activate_pending_teacher_role_for_current_user',
    'ensure_admin_teacher_operator_profile_for_current_user',
    'create_class_with_region_access',
  ];
  const forbiddenPatterns = [
    [/\bwhere\s+id\s*=/i, 'bare WHERE id ='],
    [/\breturning\s+id\b/i, 'bare RETURNING id'],
    [/\bselect\s+id\b/i, 'bare SELECT id'],
    [/\bupdate\s+public\.[a-z_]+\s+set[\s\S]{0,500}\bwhere\s+id\s*=/i, 'unaliased UPDATE ... WHERE id ='],
    [/\bcoalesce\s*\([^)]*,\s*email\s*\)/i, 'bare email fallback inside coalesce()'],
    [/\bwhen\s+status\s*=/i, 'bare status in CASE predicate'],
  ];

  for (const functionName of checkedFunctions) {
    const body = extractFunctionBody(sql, functionName);
    for (const [pattern, description] of forbiddenPatterns) {
      if (pattern.test(body)) {
        fail(`Potential ambiguous SQL reference in public.${functionName}: ${description}`);
      }
    }
  }
}

function assertStaticContract(sql) {
  if (!existsSync(seedPath)) fail('supabase/seed.sql is missing');
  if (!existsSync(envExamplePath)) fail('.env.example is missing');

  for (const table of requiredTables) {
    const tablePattern = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\b`, 'i');
    if (!tablePattern.test(sql)) fail(`Missing table public.${table}`);

    const rlsPattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
    if (!rlsPattern.test(sql)) fail(`Missing RLS enablement for public.${table}`);

    const policyPattern = new RegExp(`create\\s+policy\\s+[^;]+on\\s+public\\.${table}\\s+for\\s+`, 'i');
    if (!policyPattern.test(sql)) fail(`Missing explicit RLS policy for public.${table}`);
  }

  for (const helper of ['is_admin', 'is_teacher_for_class', 'is_student_for_membership']) {
    const helperPattern = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${helper}\\b`, 'i');
    if (!helperPattern.test(sql)) fail(`Missing RLS helper public.${helper}`);
  }

  assertRosterClaimRpc(sql);
  assertHostedSetupWrites(sql);
  assertNoAmbiguousBareIdPatterns(sql);
  assertProgressSnapshotContract(sql);
  assertHostedProgressEventContract(sql);

  const p3Contract = readFileSync(p3ContractPath, 'utf8');
  const contractRegionIds = expectedRegionIds.filter((regionId) => p3Contract.includes(`id: '${regionId}'`));
  if (contractRegionIds.length !== expectedRegionIds.length) {
    fail('Expected canonical region IDs do not match src/lib/p3SkillContract.ts');
  }

  const migrationRegionIds = extractQuotedRegionIds(sql);
  for (const regionId of expectedRegionIds) {
    if (!migrationRegionIds.has(regionId)) {
      fail(`Migration does not enforce canonical region ID ${regionId}`);
    }
  }

  assertClientEnvSafety();
}

function assertHostedSetupWrites(sql) {
  const requiredRpcs = [
    'admin_add_teacher_by_email',
    'activate_pending_teacher_role_for_current_user',
    'ensure_admin_teacher_operator_profile_for_current_user',
    'create_class_with_region_access',
    'add_class_roster_student',
    'archive_class_roster_student',
    'reset_class_roster_claim',
    'set_class_region_access',
  ];

  for (const rpc of requiredRpcs) {
    const rpcPattern = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${rpc}\\b`, 'i');
    if (!rpcPattern.test(sql)) fail(`Missing hosted setup RPC public.${rpc}`);
  }

  const addTeacherStart = sql.search(/create\s+or\s+replace\s+function\s+public\.admin_add_teacher_by_email\b/i);
  const addTeacherEnd = sql.indexOf('comment on function public.admin_add_teacher_by_email', addTeacherStart);
  if (addTeacherStart === -1 || addTeacherEnd === -1) fail('Missing documentation comment for public.admin_add_teacher_by_email');
  const addTeacherBody = sql.slice(addTeacherStart, addTeacherEnd);

  const addTeacherPatterns = [
    [/security\s+definer/i, 'admin_add_teacher_by_email must be SECURITY DEFINER'],
    [/from\s+auth\.users/i, 'admin_add_teacher_by_email must look up an existing auth.users row'],
    [/insert\s+into\s+public\.teacher_profiles[\s\S]+status[\s\S]+'pending'/i, 'admin_add_teacher_by_email must create pending teacher profile rows when no auth user exists'],
    [/insert\s+into\s+public\.teacher_invites/i, 'admin_add_teacher_by_email must create pending teacher invites when no auth user exists'],
    [/on\s+conflict\s+\(organization_id,\s*email\)\s+where\s+email\s+is\s+not\s+null/i, 'admin_add_teacher_by_email must deduplicate teacher profiles by normalized email per organization'],
    [/on\s+conflict\s+\(organization_id,\s*email\)\s+where\s+status\s*=\s*'pending'/i, 'admin_add_teacher_by_email must deduplicate pending teacher emails per organization'],
    [/public\.is_admin\(/i, 'admin_add_teacher_by_email must require an admin role'],
    [/insert\s+into\s+public\.user_roles/i, 'admin_add_teacher_by_email must activate a teacher role row'],
    [/insert\s+into\s+public\.teacher_profiles/i, 'admin_add_teacher_by_email must create or update a teacher profile'],
    [/grant\s+execute\s+on\s+function\s+public\.admin_add_teacher_by_email\(text,\s*text,\s*uuid\)\s+to\s+authenticated/i, 'admin_add_teacher_by_email must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.admin_add_teacher_by_email\(text,\s*text,\s*uuid\)\s+from\s+anon/i, 'admin_add_teacher_by_email must not be executable by anon users'],
  ];

  for (const [pattern, message] of addTeacherPatterns) {
    if (!pattern.test(addTeacherBody) && !pattern.test(sql)) fail(message);
  }

  const activateTeacherStart = sql.search(/create\s+or\s+replace\s+function\s+public\.activate_pending_teacher_role_for_current_user\b/i);
  const activateTeacherEnd = sql.indexOf('comment on function public.activate_pending_teacher_role_for_current_user', activateTeacherStart);
  if (activateTeacherStart === -1 || activateTeacherEnd === -1) fail('Missing documentation comment for public.activate_pending_teacher_role_for_current_user');
  const activateTeacherBody = sql.slice(activateTeacherStart, activateTeacherEnd);

  const activateTeacherPatterns = [
    [/security\s+definer/i, 'activate_pending_teacher_role_for_current_user must be SECURITY DEFINER'],
    [/auth\.uid\(\)/i, 'activate_pending_teacher_role_for_current_user must use auth.uid()'],
    [/from\s+auth\.users/i, 'activate_pending_teacher_role_for_current_user must read the signed-in auth user email server-side'],
    [/email_confirmed_at/i, 'activate_pending_teacher_role_for_current_user must require a verified Supabase Auth email'],
    [/public\.teacher_profiles/i, 'activate_pending_teacher_role_for_current_user must consume pending teacher profiles'],
    [/public\.teacher_invites/i, 'activate_pending_teacher_role_for_current_user must consume pending teacher invites'],
    [/status\s*=\s*'pending'/i, 'activate_pending_teacher_role_for_current_user must activate only pending invites'],
    [/insert\s+into\s+public\.user_roles/i, 'activate_pending_teacher_role_for_current_user must create or reactivate the hosted teacher role'],
    [/insert\s+into\s+public\.teacher_profiles/i, 'activate_pending_teacher_role_for_current_user must create or update the hosted teacher profile'],
    [/grant\s+execute\s+on\s+function\s+public\.activate_pending_teacher_role_for_current_user\(\)\s+to\s+authenticated/i, 'activate_pending_teacher_role_for_current_user must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.activate_pending_teacher_role_for_current_user\(\)\s+from\s+anon/i, 'activate_pending_teacher_role_for_current_user must not be executable by anon users'],
  ];

  for (const [pattern, message] of activateTeacherPatterns) {
    if (!pattern.test(activateTeacherBody) && !pattern.test(sql)) fail(message);
  }

  const ensureOperatorStart = sql.search(/create\s+or\s+replace\s+function\s+public\.ensure_admin_teacher_operator_profile_for_current_user\b/i);
  const ensureOperatorEnd = sql.indexOf('comment on function public.ensure_admin_teacher_operator_profile_for_current_user', ensureOperatorStart);
  if (ensureOperatorStart === -1 || ensureOperatorEnd === -1) fail('Missing documentation comment for public.ensure_admin_teacher_operator_profile_for_current_user');
  const ensureOperatorBody = sql.slice(ensureOperatorStart, ensureOperatorEnd);

  const ensureOperatorPatterns = [
    [/security\s+definer/i, 'ensure_admin_teacher_operator_profile_for_current_user must be SECURITY DEFINER'],
    [/auth\.uid\(\)/i, 'ensure_admin_teacher_operator_profile_for_current_user must use auth.uid()'],
    [/from\s+auth\.users/i, 'ensure_admin_teacher_operator_profile_for_current_user must read the signed-in auth user email server-side'],
    [/role\s*=\s*'admin'/i, 'ensure_admin_teacher_operator_profile_for_current_user must require an active admin role'],
    [/insert\s+into\s+public\.teacher_profiles/i, 'ensure_admin_teacher_operator_profile_for_current_user must create a real teacher profile'],
    [/grant\s+execute\s+on\s+function\s+public\.ensure_admin_teacher_operator_profile_for_current_user\(\)\s+to\s+authenticated/i, 'ensure_admin_teacher_operator_profile_for_current_user must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.ensure_admin_teacher_operator_profile_for_current_user\(\)\s+from\s+anon/i, 'ensure_admin_teacher_operator_profile_for_current_user must not be executable by anon users'],
  ];

  for (const [pattern, message] of ensureOperatorPatterns) {
    if (!pattern.test(ensureOperatorBody) && !pattern.test(sql)) fail(message);
  }

  const createClassStart = sql.search(/create\s+or\s+replace\s+function\s+public\.create_class_with_region_access\b/i);
  const createClassEnd = sql.indexOf('comment on function public.create_class_with_region_access', createClassStart);
  if (createClassStart === -1 || createClassEnd === -1) fail('Missing documentation comment for public.create_class_with_region_access');
  const createClassBody = sql.slice(createClassStart, createClassEnd);

  const createClassPatterns = [
    [/security\s+definer/i, 'create_class_with_region_access must be SECURITY DEFINER'],
    [/public\.is_admin\(.+public\.is_teacher_in_organization/s, 'create_class_with_region_access must allow only admins or the assigned teacher'],
    [/tp\.status\s+in\s+\('active',\s*'pending'\)/i, 'create_class_with_region_access must let admins assign classes to active or pending teacher profiles'],
    [/target_teacher\.status\s*=\s*'active'[\s\S]+target_teacher\.user_id\s*=\s*auth\.uid\(\)/i, 'create_class_with_region_access must require non-admin teachers to use their own active profile'],
    [/insert\s+into\s+public\.classes/i, 'create_class_with_region_access must create the class row'],
    [/insert\s+into\s+public\.class_region_access/i, 'create_class_with_region_access must create class_region_access rows'],
    [/field_guide_only/i, 'create_class_with_region_access must default region access to field_guide_only'],
    [/grant\s+execute\s+on\s+function\s+public\.create_class_with_region_access\(uuid,\s*text,\s*text,\s*text\)\s+to\s+authenticated/i, 'create_class_with_region_access must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.create_class_with_region_access\(uuid,\s*text,\s*text,\s*text\)\s+from\s+anon/i, 'create_class_with_region_access must not be executable by anon users'],
  ];

  for (const [pattern, message] of createClassPatterns) {
    if (!pattern.test(createClassBody) && !pattern.test(sql)) fail(message);
  }

  const pendingProfileContract = [
    [/alter\s+table\s+public\.teacher_profiles\s+alter\s+column\s+user_id\s+drop\s+not\s+null/i, 'teacher_profiles.user_id must be nullable for pending teachers'],
    [/teacher_profiles_status_check[\s\S]+status\s+in\s+\('pending',\s*'active',\s*'inactive',\s*'archived',\s*'disabled'\)/i, 'teacher_profiles.status must support pending and inactive lifecycle states'],
    [/teacher_profiles_email_normalized/i, 'teacher_profiles must enforce normalized email storage'],
    [/create\s+unique\s+index\s+if\s+not\s+exists\s+teacher_profiles_one_email_per_org/i, 'teacher_profiles must deduplicate normalized emails per organization'],
  ];

  for (const [pattern, message] of pendingProfileContract) {
    if (!pattern.test(sql)) fail(message);
  }

  for (const regionId of expectedRegionIds) {
    const regionInsertPattern = new RegExp(`\\(class_row\\.id,\\s*'${regionId}',\\s*'field_guide_only'`, 'i');
    if (!regionInsertPattern.test(createClassBody)) {
      fail(`create_class_with_region_access does not create locked access for ${regionId}`);
    }
  }

  const addRosterStart = sql.search(/create\s+or\s+replace\s+function\s+public\.add_class_roster_student\b/i);
  const addRosterEnd = sql.indexOf('comment on function public.add_class_roster_student', addRosterStart);
  if (addRosterStart === -1 || addRosterEnd === -1) fail('Missing documentation comment for public.add_class_roster_student');
  const addRosterBody = sql.slice(addRosterStart, addRosterEnd);

  const addRosterPatterns = [
    [/security\s+definer/i, 'add_class_roster_student must be SECURITY DEFINER'],
    [/public\.is_admin\(.+public\.is_teacher_for_class/s, 'add_class_roster_student must allow only admins or the assigned teacher'],
    [/insert\s+into\s+public\.student_profiles/i, 'add_class_roster_student must create a hosted student profile row'],
    [/insert\s+into\s+public\.class_memberships/i, 'add_class_roster_student must create a class membership row'],
    [/roster_status[\s\S]+unclaimed/i, 'add_class_roster_student must create unclaimed roster rows'],
    [/grant\s+execute\s+on\s+function\s+public\.add_class_roster_student\(uuid,\s*text\)\s+to\s+authenticated/i, 'add_class_roster_student must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.add_class_roster_student\(uuid,\s*text\)\s+from\s+anon/i, 'add_class_roster_student must not be executable by anon users'],
  ];

  for (const [pattern, message] of addRosterPatterns) {
    if (!pattern.test(addRosterBody) && !pattern.test(sql)) fail(message);
  }

  const archiveRosterStart = sql.search(/create\s+or\s+replace\s+function\s+public\.archive_class_roster_student\b/i);
  const archiveRosterEnd = sql.indexOf('comment on function public.archive_class_roster_student', archiveRosterStart);
  if (archiveRosterStart === -1 || archiveRosterEnd === -1) fail('Missing documentation comment for public.archive_class_roster_student');
  const archiveRosterBody = sql.slice(archiveRosterStart, archiveRosterEnd);

  const archiveRosterPatterns = [
    [/security\s+definer/i, 'archive_class_roster_student must be SECURITY DEFINER'],
    [/for\s+update/i, 'archive_class_roster_student must lock the roster row before changing claim state'],
    [/public\.is_admin\(.+public\.is_teacher_for_class/s, 'archive_class_roster_student must allow only admins or the assigned teacher'],
    [/set\s+roster_status\s*=\s*'archived'[\s\S]+claimed_by_user_id\s*=\s*null[\s\S]+claimed_at\s*=\s*null[\s\S]+archived_at\s*=\s*now\(\)/i, 'archive_class_roster_student must archive and clear claim fields safely'],
    [/update\s+public\.student_profiles[\s\S]+user_id\s*=\s*null/i, 'archive_class_roster_student must clear the linked student profile user_id'],
    [/grant\s+execute\s+on\s+function\s+public\.archive_class_roster_student\(uuid\)\s+to\s+authenticated/i, 'archive_class_roster_student must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.archive_class_roster_student\(uuid\)\s+from\s+anon/i, 'archive_class_roster_student must not be executable by anon users'],
  ];

  for (const [pattern, message] of archiveRosterPatterns) {
    if (!pattern.test(archiveRosterBody) && !pattern.test(sql)) fail(message);
  }

  const resetRosterStart = sql.search(/create\s+or\s+replace\s+function\s+public\.reset_class_roster_claim\b/i);
  const resetRosterEnd = sql.indexOf('comment on function public.reset_class_roster_claim', resetRosterStart);
  if (resetRosterStart === -1 || resetRosterEnd === -1) fail('Missing documentation comment for public.reset_class_roster_claim');
  const resetRosterBody = sql.slice(resetRosterStart, resetRosterEnd);

  const resetRosterPatterns = [
    [/security\s+definer/i, 'reset_class_roster_claim must be SECURITY DEFINER'],
    [/for\s+update/i, 'reset_class_roster_claim must lock the roster row before changing claim state'],
    [/roster_status\s*<>\s*'claimed'/i, 'reset_class_roster_claim must only work on claimed rows'],
    [/public\.is_admin\(.+public\.is_teacher_for_class/s, 'reset_class_roster_claim must allow only admins or the assigned teacher'],
    [/set\s+roster_status\s*=\s*'unclaimed'[\s\S]+claimed_by_user_id\s*=\s*null[\s\S]+claimed_at\s*=\s*null/i, 'reset_class_roster_claim must reset claimed rows to unclaimed and clear claim fields'],
    [/update\s+public\.student_profiles[\s\S]+user_id\s*=\s*null/i, 'reset_class_roster_claim must clear the linked student profile user_id'],
    [/grant\s+execute\s+on\s+function\s+public\.reset_class_roster_claim\(uuid\)\s+to\s+authenticated/i, 'reset_class_roster_claim must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.reset_class_roster_claim\(uuid\)\s+from\s+anon/i, 'reset_class_roster_claim must not be executable by anon users'],
  ];

  for (const [pattern, message] of resetRosterPatterns) {
    if (!pattern.test(resetRosterBody) && !pattern.test(sql)) fail(message);
  }

  const auditPolicyPattern = /create\s+policy\s+"active organization actors can append own audit events"[\s\S]+actor_user_id\s*=\s*auth\.uid\(\)[\s\S]+public\.user_roles[\s\S]+status\s*=\s*'active'/i;
  if (!auditPolicyPattern.test(sql)) {
    fail('Audit insert policy must require actor_user_id = auth.uid() and an active organization role');
  }
}

function assertProgressSnapshotContract(sql) {
  const oneArgForbiddenKeyHelperPattern = /create\s+or\s+replace\s+function\s+public\.asterion_snapshot_json_has_forbidden_key\s*\(\s*payload\s+jsonb\s*\)/i;
  if (!oneArgForbiddenKeyHelperPattern.test(sql)) {
    fail('Missing progress snapshot validator public.asterion_snapshot_json_has_forbidden_key(jsonb)');
  }

  for (const helper of ['asterion_valid_progress_snapshot_summary', 'asterion_valid_progress_snapshot_regions']) {
    const helperPattern = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${helper}\\b`, 'i');
    if (!helperPattern.test(sql)) fail(`Missing progress snapshot validator public.${helper}`);
  }

  const snapshotStart = sql.search(/create\s+table\s+public\.student_progress_snapshots\b/i);
  if (snapshotStart === -1) fail('Missing table public.student_progress_snapshots');
  const snapshotEnd = sql.indexOf(');', snapshotStart);
  const snapshotTable = sql.slice(snapshotStart, snapshotEnd);

  if (!/summary_json\s+jsonb\s+not\s+null\s+check\s*\(\s*public\.asterion_valid_progress_snapshot_summary\(summary_json\)\s*\)/i.test(snapshotTable)) {
    fail('student_progress_snapshots.summary_json must be guarded by the bounded snapshot summary validator');
  }

  if (!/region_summary_json\s+jsonb\s+not\s+null\s+check\s*\(\s*public\.asterion_valid_progress_snapshot_regions\(region_summary_json\)\s*\)/i.test(snapshotTable)) {
    fail('student_progress_snapshots.region_summary_json must be guarded by the bounded region summary validator');
  }

  const requiredSnapshotTerms = [
    'learnerResponse',
    'learningActivityAttempts',
    'issueReports',
    'questionImageUrls',
    'markSchemeImageUrls',
    'localStorage',
    'schemaVersion',
    'masteryEligibleAttemptCount',
    'guardianReadyRegionCount',
    'fieldGuideOnlyRegionCount',
    'guardianStatus',
    'accessStatus',
  ];

  for (const term of requiredSnapshotTerms) {
    if (!sql.includes(term)) fail(`Progress snapshot SQL contract is missing ${term}`);
  }

  const seed = readFileSync(seedPath, 'utf8');
  if (/"overallProgress"|"verify":true|"learnerResponse"|"note"/.test(seed)) {
    fail('supabase/seed.sql contains a legacy or raw progress snapshot key');
  }

  if (!/drop\s+policy\s+if\s+exists\s+"students can insert own bounded progress snapshots"\s+on\s+public\.student_progress_snapshots/i.test(sql)) {
    fail('Student direct insert policy for local progress snapshots must be dropped after hosted progress events are introduced');
  }
}

function assertHostedProgressEventContract(sql) {
  const requiredFunctions = [
    'asterion_safe_progress_event_identifier',
    'asterion_valid_progress_event_payload',
    'enforce_student_progress_event_membership',
    'record_student_progress_event',
  ];

  for (const helper of requiredFunctions) {
    const helperPattern = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${helper}\\b`, 'i');
    if (!helperPattern.test(sql)) fail(`Missing hosted progress event function public.${helper}`);
  }

  const twoArgForbiddenKeyHelperPattern = /create\s+or\s+replace\s+function\s+public\.asterion_snapshot_json_has_forbidden_key\s*\(\s*payload\s+jsonb\s*,\s*forbidden_keys\s+text\[\]\s*\)[\s\S]+?immutable[\s\S]+?strict/i;
  if (!twoArgForbiddenKeyHelperPattern.test(sql)) {
    fail('Missing strict immutable overload public.asterion_snapshot_json_has_forbidden_key(jsonb, text[]) for hosted progress event payload validation');
  }

  const overloadStart = sql.search(/create\s+or\s+replace\s+function\s+public\.asterion_snapshot_json_has_forbidden_key\s*\(\s*payload\s+jsonb\s*,\s*forbidden_keys\s+text\[\]\s*\)/i);
  const payloadValidatorStart = sql.search(/create\s+or\s+replace\s+function\s+public\.asterion_valid_progress_event_payload\b/i);
  if (overloadStart === -1 || payloadValidatorStart === -1 || overloadStart > payloadValidatorStart) {
    fail('Hosted progress event SQL must define the jsonb/text[] forbidden-key overload before first use');
  }

  const eventStart = sql.search(/create\s+table\s+public\.student_progress_events\b/i);
  if (eventStart === -1) fail('Missing table public.student_progress_events');
  const eventEnd = sql.indexOf(');', eventStart);
  const eventTable = sql.slice(eventStart, eventEnd);

  const requiredColumns = [
    'organization_id',
    'class_id',
    'class_membership_id',
    'student_profile_id',
    'actor_user_id',
    'region_id',
    'activity_type',
    'content_id',
    'question_id',
    'skill_id',
    'event_type',
    'event_payload',
  ];

  for (const column of requiredColumns) {
    if (!new RegExp(`\\b${column}\\b`, 'i').test(eventTable)) fail(`student_progress_events is missing ${column}`);
  }

  for (const term of [
    'field_guide_completed',
    'quick_check_completed',
    'warm_up_completed',
    'practice_attempt_saved',
    'guardian_attempted',
    'guardian_completed',
    'field_guide_only',
    'learnerResponse',
    'localStorage',
    'sessionStorage',
  ]) {
    if (!sql.includes(term)) fail(`Hosted progress event SQL contract is missing ${term}`);
  }

  const rpcStart = sql.search(/create\s+or\s+replace\s+function\s+public\.record_student_progress_event\b/i);
  const rpcEnd = sql.indexOf('comment on function public.record_student_progress_event', rpcStart);
  if (rpcStart === -1 || rpcEnd === -1) fail('Missing documentation comment for public.record_student_progress_event');
  const rpcBody = sql.slice(rpcStart, rpcEnd);

  const requiredPatterns = [
    [/security\s+definer/i, 'record_student_progress_event must be SECURITY DEFINER'],
    [/auth\.uid\(\)/i, 'record_student_progress_event must bind writes to auth.uid()'],
    [/public\.is_student_for_membership\(p_class_membership_id\)/i, 'record_student_progress_event must require own claimed membership'],
    [/cm\.roster_status\s*=\s*'claimed'/i, 'record_student_progress_event must require claimed roster status'],
    [/cm\.claimed_by_user_id\s*=\s*auth\.uid\(\)/i, 'record_student_progress_event must require actor membership ownership'],
    [/membership_row\.class_id\s*<>\s*p_class_id/i, 'record_student_progress_event must reject wrong class context'],
    [/membership_row\.student_profile_id\s*<>\s*p_student_profile_id/i, 'record_student_progress_event must reject wrong student profile context'],
    [/public\.class_region_access/i, 'record_student_progress_event must check class_region_access'],
    [/access_status\s*<>\s*'open'/i, 'record_student_progress_event must block progression events outside open regions'],
    [/insert\s+into\s+public\.student_progress_events/i, 'record_student_progress_event must insert append-only progress events'],
    [/grant\s+execute\s+on\s+function\s+public\.record_student_progress_event\(uuid,\s*uuid,\s*uuid,\s*text,\s*text,\s*text,\s*text,\s*text,\s*text,\s*jsonb\)\s+to\s+authenticated/i, 'record_student_progress_event must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.record_student_progress_event\(uuid,\s*uuid,\s*uuid,\s*text,\s*text,\s*text,\s*text,\s*text,\s*text,\s*jsonb\)\s+from\s+anon/i, 'record_student_progress_event must not be executable by anon users'],
  ];

  for (const [pattern, message] of requiredPatterns) {
    if (!pattern.test(rpcBody) && !pattern.test(sql)) fail(message);
  }

  if (/student_progress_snapshots|summary_json|region_summary_json/i.test(rpcBody)) {
    fail('record_student_progress_event must not write local-progress snapshots');
  }

  if (/create\s+policy\s+[^;]+on\s+public\.student_progress_events\s+for\s+(insert|update|delete)/i.test(sql)) {
    fail('student_progress_events must not expose direct insert, update, or delete policies during the pilot');
  }
}

function assertRosterClaimRpc(sql) {
  const rpcPattern = /create\s+or\s+replace\s+function\s+public\.claim_class_roster_slot\s*\(\s*p_class_code\s+text\s*,\s*p_roster_name\s+text\s*\)/i;
  if (!rpcPattern.test(sql)) fail('Missing RPC public.claim_class_roster_slot(text, text)');

  const rpcStart = sql.search(rpcPattern);
  const rpcEnd = sql.indexOf('comment on function public.claim_class_roster_slot', rpcStart);
  if (rpcEnd === -1) fail('Missing documentation comment for public.claim_class_roster_slot');
  const rpcBody = sql.slice(rpcStart, rpcEnd);

  const requiredPatterns = [
    [/security\s+definer/i, 'RPC must be SECURITY DEFINER so it can inspect hidden unclaimed roster rows without broad RLS policies'],
    [/auth\.uid\(\)/i, 'RPC must bind claims to auth.uid()'],
    [/for\s+update\s+of\s+cm\s*,\s*sp/i, 'RPC must lock the matching roster row before claiming'],
    [/update\s+public\.class_memberships/i, 'RPC must update an existing roster membership'],
    [/update\s+public\.student_profiles/i, 'RPC must bind the existing student profile to the authenticated user'],
    [/insert\s+into\s+public\.user_roles/i, 'RPC must provision a student role after roster validation for first-time claimants'],
    [/on\s+conflict\s*\(\s*user_id\s*,\s*organization_id\s*,\s*role\s*\)\s+do\s+nothing/i, 'RPC must use the existing user_roles uniqueness constraint safely'],
    [/matching_count\s*>\s*1/i, 'RPC must detect duplicate roster-name ambiguity'],
    [/reserved_for_other_user/i, 'RPC must explicitly block roster rows reserved for another auth user'],
    [/staff_account_cannot_claim_student_slot/i, 'RPC must explicitly block staff accounts without an active student role'],
    [/roster_status\s*=\s*'unclaimed'/i, 'RPC must only claim unclaimed roster slots'],
    [/roster_status\s*=\s*'archived'/i, 'RPC must explicitly block archived roster slots'],
    [/grant\s+execute\s+on\s+function\s+public\.claim_class_roster_slot\(text,\s*text\)\s+to\s+authenticated/i, 'RPC must be executable by authenticated users'],
    [/revoke\s+all\s+on\s+function\s+public\.claim_class_roster_slot\(text,\s*text\)\s+from\s+anon/i, 'RPC must not be executable by anon users'],
  ];

  for (const [pattern, message] of requiredPatterns) {
    if (!pattern.test(sql)) fail(message);
  }

  if (/insert\s+into\s+public\.(class_memberships|student_profiles|student_progress_snapshots)/i.test(rpcBody)) {
    fail('Roster claim RPC must not create roster, profile, or progress rows');
  }

  if (/student_progress_snapshots|summary_json|region_summary_json/i.test(rpcBody)) {
    fail('Roster claim RPC must not touch progress snapshot or learner response data');
  }
}

function assertClientEnvSafety() {
  const envExample = readFileSync(envExamplePath, 'utf8');
  const envNames = [...envExample.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]);
  const supabaseEnvNames = envNames.filter((name) => name.includes('SUPABASE'));
  const expectedSupabaseEnvNames = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];

  for (const expectedName of expectedSupabaseEnvNames) {
    if (!supabaseEnvNames.includes(expectedName)) {
      fail(`.env.example is missing ${expectedName}`);
    }
  }

  for (const name of supabaseEnvNames) {
    if (!expectedSupabaseEnvNames.includes(name)) {
      fail(`.env.example contains unexpected Supabase browser variable ${name}`);
    }
  }

  if (/service[_-]?role|secret|password|jwt|admin/i.test(envExample)) {
    fail('.env.example must not mention privileged Supabase keys, passwords, JWT secrets, or admin credentials');
  }

  const forbiddenClientPatterns = [
    /SERVICE_ROLE/i,
    /service_role/i,
    /SUPABASE_SERVICE/i,
    /SUPABASE_DB_PASSWORD/i,
    /SUPABASE_SECRET/i,
    /DATABASE_PASSWORD/i,
    /JWT_SECRET/i,
  ];

  for (const target of ['src', 'public', 'vite.config.ts']) {
    if (!existsSync(path.join(root, target))) continue;
    const scan = spawnSync('rg', [forbiddenClientPatterns.map((pattern) => pattern.source).join('|'), target], {
      cwd: root,
      encoding: 'utf8',
    });
    if (scan.status === 0) {
      fail(`Browser-facing files reference server-only Supabase credentials:\n${scan.stdout.trim()}`);
    }
  }

  const clientEnvDocPaths = [
    'README.md',
    'docs/supabase-phase-1.md',
    'docs/supabase-hosted-setup.md',
    'docs/hosted-storage-design.md',
    'docs/backend-contract.md',
    'docs/TEACHER_ADMIN_DASHBOARD_V0.md',
  ];

  for (const relativePath of clientEnvDocPaths) {
    const fullPath = path.join(root, relativePath);
    if (!existsSync(fullPath)) continue;
    const source = readFileSync(fullPath, 'utf8');

    if (source.includes('VITE_SUPABASE_ANON_KEY')) {
      fail(`${relativePath} documents deprecated VITE_SUPABASE_ANON_KEY; use VITE_SUPABASE_PUBLISHABLE_KEY`);
    }

    if (source.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      fail(`${relativePath} documents a privileged Supabase key name in Vite-facing docs`);
    }

    for (const line of source.split('\n')) {
      if (/VITE_[A-Z0-9_]*(SECRET|SERVICE|ADMIN|PASSWORD|JWT)[A-Z0-9_]*/.test(line)) {
        fail(`${relativePath} documents a VITE_ variable as secret/service/admin/password/JWT config: ${line.trim()}`);
      }
    }
  }
}

try {
  assertStaticContract(readSql());
  console.log('Static Supabase schema checks passed. Run npm run supabase:verify:live for live RLS verification.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
