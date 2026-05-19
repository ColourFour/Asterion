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

try {
  assertStaticContract(readSql());
  console.log('Static Supabase schema checks passed. Run npm run supabase:verify:live for live RLS verification.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
