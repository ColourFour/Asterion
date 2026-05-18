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
  'student_profiles',
  'classes',
  'class_memberships',
  'class_region_access',
  'student_progress_snapshots',
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

function assertStaticContract(sql) {
  if (!existsSync(seedPath)) fail('supabase/seed.sql is missing');
  if (!existsSync(envExamplePath)) fail('.env.example is missing');

  for (const table of requiredTables) {
    const tablePattern = new RegExp(`create\\s+table\\s+public\\.${table}\\b`, 'i');
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

function commandExists(command) {
  const result = spawnSync('command', ['-v', command], {
    shell: true,
    stdio: 'ignore',
  });
  return result.status === 0;
}

function psql(args, options = {}) {
  return spawnSync('psql', args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
}

function runPsqlOrThrow(dbUrl, sql, label) {
  const result = psql([dbUrl, '-v', 'ON_ERROR_STOP=1', '-Atqc', sql]);
  if (result.status !== 0) {
    fail(`${label} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function assertLiveContract() {
  if (!commandExists('psql')) {
    console.log('Static Supabase checks passed. Skipping live checks because psql is not installed.');
    return;
  }

  const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  const ping = psql([dbUrl, '-Atqc', 'select 1']);
  if (ping.status !== 0) {
    console.log('Static Supabase checks passed. Skipping live checks because local Supabase Postgres is not reachable.');
    return;
  }

  const tableCount = runPsqlOrThrow(
    dbUrl,
    `
      select count(*)
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any(array[${requiredTables.map((table) => `'${table}'`).join(',')}]);
    `,
    'Required table check',
  );
  if (Number(tableCount) !== requiredTables.length) {
    fail(`Expected ${requiredTables.length} required tables, found ${tableCount}`);
  }

  const missingRls = runPsqlOrThrow(
    dbUrl,
    `
      select coalesce(string_agg(c.relname, ', ' order by c.relname), '')
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any(array[${requiredTables.map((table) => `'${table}'`).join(',')}])
        and not c.relrowsecurity;
    `,
    'Live RLS check',
  );
  if (missingRls) fail(`Tables missing live RLS: ${missingRls}`);

  const invalidRegions = runPsqlOrThrow(
    dbUrl,
    `
      select count(*)
      from public.class_region_access
      where region_id <> all(array[${expectedRegionIds.map((id) => `'${id}'`).join(',')}]);
    `,
    'Canonical region row check',
  );
  if (Number(invalidRegions) !== 0) fail(`Found ${invalidRegions} non-canonical region access rows`);

  const classesMissingRegions = runPsqlOrThrow(
    dbUrl,
    `
      select count(*)
      from public.classes c
      where (
        select count(*)
        from public.class_region_access cra
        where cra.class_id = c.id
      ) <> ${expectedRegionIds.length};
    `,
    'Class region coverage check',
  );
  if (Number(classesMissingRegions) !== 0) {
    fail(`${classesMissingRegions} classes do not have all canonical region access rows`);
  }

  const classesMissingTeacher = runPsqlOrThrow(
    dbUrl,
    `
      select count(*)
      from public.classes c
      left join public.teacher_profiles tp on tp.id = c.teacher_id
      where tp.id is null;
    `,
    'One teacher per class check',
  );
  if (Number(classesMissingTeacher) !== 0) fail(`${classesMissingTeacher} classes do not have one teacher`);

  const archivedRows = runPsqlOrThrow(
    dbUrl,
    "select count(*) from public.class_memberships where roster_status = 'archived';",
    'Archived roster check',
  );
  if (Number(archivedRows) < 1) fail('Seed data is missing an archived roster row');

  const studentSelfAdd = psql([
    dbUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-Atqc',
    `
      begin;
      set local role authenticated;
      set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000301';
      insert into public.class_memberships (class_id, student_profile_id, roster_name, roster_status)
      values (
        '40000000-0000-0000-0000-000000000401',
        '30000000-0000-0000-0000-000000000302',
        'Student-created row',
        'unclaimed'
      );
      rollback;
    `,
  ]);
  if (studentSelfAdd.status === 0) fail('Student self-add roster insert unexpectedly succeeded');

  runPsqlOrThrow(
    dbUrl,
    `
      begin;
      set local role authenticated;
      set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000301';
      insert into public.student_progress_snapshots (
        class_membership_id,
        student_profile_id,
        class_id,
        snapshot_version,
        source,
        summary_json,
        region_summary_json
      )
      values (
        '50000000-0000-0000-0000-000000000501',
        '30000000-0000-0000-0000-000000000301',
        '40000000-0000-0000-0000-000000000401',
        2,
        'local_student_app',
        '{"verify":true}'::jsonb,
        '{}'::jsonb
      );
      rollback;
    `,
    'Student-owned progress snapshot insert check',
  );

  const outsiderSnapshot = psql([
    dbUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-Atqc',
    `
      begin;
      set local role authenticated;
      set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000302';
      insert into public.student_progress_snapshots (
        class_membership_id,
        student_profile_id,
        class_id,
        snapshot_version,
        source,
        summary_json,
        region_summary_json
      )
      values (
        '50000000-0000-0000-0000-000000000501',
        '30000000-0000-0000-0000-000000000301',
        '40000000-0000-0000-0000-000000000401',
        2,
        'local_student_app',
        '{"verify":true}'::jsonb,
        '{}'::jsonb
      );
      rollback;
    `,
  ]);
  if (outsiderSnapshot.status === 0) fail('Outsider progress snapshot insert unexpectedly succeeded');

  console.log('Static and live Supabase schema checks passed.');
}

try {
  assertStaticContract(readSql());
  assertLiveContract();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
