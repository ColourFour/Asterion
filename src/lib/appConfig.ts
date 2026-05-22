import type { ProgressStorageMode } from './progressAdapter';
import { resolveDashboardDataSource, type DashboardDataSourceKind } from './dashboardDataSource';
import { resolveSupabaseConfig } from './supabaseConfig';

export type AsterionAppProfile = 'student-pilot' | 'classroom-pilot' | 'custom';

export interface AsterionRuntimeProfile {
  name: AsterionAppProfile;
  explicit: boolean;
  staticHostingCompatible: boolean;
  browserLocalProgress: boolean;
  supabaseRequired: boolean;
  hostedProgressSyncEnabled: boolean;
  aiMarkingEnabled: boolean;
  productionDashboardAuthority: boolean;
  dashboardDemoBehaviorEnabled: boolean;
}

export interface AsterionRuntimeConfig {
  profile: AsterionRuntimeProfile;
  profileNotice?: string;
  configurationBlocked: boolean;
  configurationBlockReason?: string;
  requestedStorageMode: ProgressStorageMode;
  effectiveStorageMode: 'local';
  dashboardDemoEnabled: boolean;
  dashboardDataSource: DashboardDataSourceKind;
  dashboardDataSourceExplicit: boolean;
  dashboardDataSourceNotice?: string;
  dashboardRoutesEnabled: boolean;
  hostedStorageRequested: boolean;
  hostedStorageAvailable: false;
  storageNotice?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseConfigured: boolean;
  studentClassClaimSource: 'mock' | 'supabase';
  studentClassClaimSourceExplicit: boolean;
  studentClassClaimNotice?: string;
  assetBaseUrl?: string;
  diagnostics: {
    profileName: AsterionAppProfile;
    profileExplicit: boolean;
    supabaseConfigured: boolean;
    supabaseRequired: boolean;
    dashboardDataSource: DashboardDataSourceKind;
    dashboardRoutesEnabled: boolean;
    studentClassClaimSource: 'mock' | 'supabase';
    hostedProgressSyncEnabled: boolean;
    productionDashboardAuthority: boolean;
  };
}

type RuntimeEnv = Partial<Record<string, string | boolean | undefined>>;

function envString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function envValueEquals(value: string | boolean | undefined, expected: string): boolean {
  return envString(value)?.trim().toLowerCase() === expected;
}

function configuredStorageMode(value: string | boolean | undefined): ProgressStorageMode {
  return value === 'hosted' ? 'hosted' : 'local';
}

function configuredStudentClassClaimSource(value: string | boolean | undefined): 'mock' | 'supabase' | undefined {
  const normalized = envString(value)?.trim().toLowerCase();
  if (normalized === 'mock' || normalized === 'supabase') return normalized;
  return undefined;
}

function invalidStudentClassClaimSource(value: string | boolean | undefined): string | undefined {
  const rawValue = envString(value)?.trim();
  const normalized = rawValue?.toLowerCase();
  if (!rawValue || normalized === 'mock' || normalized === 'supabase') return undefined;
  return rawValue;
}

function configuredAppProfile(value: string | boolean | undefined): AsterionAppProfile | undefined {
  if (value === 'student-pilot') return 'student-pilot';
  if (value === 'classroom-pilot') return 'classroom-pilot';
  return undefined;
}

function hasNonPilotRuntimeOverride(env: RuntimeEnv): boolean {
  return envValueEquals(env.VITE_ASTERION_STORAGE_MODE, 'hosted')
    || envValueEquals(env.VITE_ASTERION_DASHBOARD_DEMO, 'enabled')
    || envValueEquals(env.VITE_ASTERION_DASHBOARD_DATA_SOURCE, 'supabase')
    || envValueEquals(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE, 'supabase');
}

export function resolveRuntimeConfig(env: RuntimeEnv = import.meta.env): AsterionRuntimeConfig {
  const configuredProfile = configuredAppProfile(env.VITE_ASTERION_APP_PROFILE);
  const explicitProfile = configuredProfile !== undefined;
  const profileName: AsterionAppProfile = configuredProfile ?? (hasNonPilotRuntimeOverride(env) ? 'custom' : 'student-pilot');
  const studentPilotProfileActive = profileName === 'student-pilot';
  const classroomPilotProfileActive = profileName === 'classroom-pilot';
  const requestedStorageMode = studentPilotProfileActive || classroomPilotProfileActive ? 'local' : configuredStorageMode(env.VITE_ASTERION_STORAGE_MODE);
  const hostedStorageRequested = requestedStorageMode === 'hosted';
  const supabase = resolveSupabaseConfig(env);
  const dashboardDemoEnabled = studentPilotProfileActive || classroomPilotProfileActive ? false : env.VITE_ASTERION_DASHBOARD_DEMO === 'enabled';
  const dashboardDataSource = resolveDashboardDataSource(env);
  const effectiveDashboardDataSource = studentPilotProfileActive
    ? 'mock'
    : classroomPilotProfileActive ? 'supabase' : dashboardDataSource.effective;
  const supabaseDashboardRequested = effectiveDashboardDataSource === 'supabase';
  const configuredClaimSource = configuredStudentClassClaimSource(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
  const invalidClaimSource = invalidStudentClassClaimSource(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
  const studentClassClaimSource = studentPilotProfileActive
    ? 'mock'
    : classroomPilotProfileActive || supabaseDashboardRequested ? 'supabase' : configuredClaimSource ?? 'mock';
  const studentClassClaimSourceExplicit = classroomPilotProfileActive || supabaseDashboardRequested || typeof env.VITE_ASTERION_STUDENT_CLAIM_SOURCE === 'string';
  const dashboardRoutesEnabled = classroomPilotProfileActive || dashboardDemoEnabled || supabaseDashboardRequested;
  const supabaseSourceWithoutClassroomPilot = !classroomPilotProfileActive
    && !studentPilotProfileActive
    && (supabaseDashboardRequested || studentClassClaimSource === 'supabase');
  const configurationBlockReason = supabaseSourceWithoutClassroomPilot
    ? 'Supabase classroom sources are active without VITE_ASTERION_APP_PROFILE=classroom-pilot. This build is blocked to avoid mixing hosted authority with a custom/local profile.'
    : undefined;
  const profileNotices = [
    studentPilotProfileActive && hasNonPilotRuntimeOverride(env)
      ? 'Student pilot profile is active; hosted storage, Supabase claim/dashboard modes, and dashboard demo routes are disabled for this build.'
      : undefined,
    classroomPilotProfileActive && !supabase.isConfigured
      ? 'Classroom pilot profile requires hosted classroom browser configuration before classroom routes and claims can be used.'
      : undefined,
    !explicitProfile && supabaseDashboardRequested
      ? 'Supabase dashboard data is active without VITE_ASTERION_APP_PROFILE=classroom-pilot.'
      : undefined,
    configurationBlockReason,
    invalidClaimSource
      ? `Unsupported student claim source "${invalidClaimSource}" ignored. Use "mock" or "supabase".`
      : undefined,
  ].filter((notice): notice is string => Boolean(notice));
  const profileNotice = profileNotices.length ? profileNotices.join(' ') : undefined;

  return {
    profile: {
      name: profileName,
      explicit: explicitProfile,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: classroomPilotProfileActive || supabaseDashboardRequested || studentClassClaimSource === 'supabase',
      hostedProgressSyncEnabled: classroomPilotProfileActive || supabaseDashboardRequested,
      aiMarkingEnabled: false,
      productionDashboardAuthority: classroomPilotProfileActive,
      dashboardDemoBehaviorEnabled: dashboardDemoEnabled,
    },
    profileNotice,
    configurationBlocked: Boolean(configurationBlockReason),
    configurationBlockReason,
    requestedStorageMode,
    effectiveStorageMode: 'local',
    dashboardDemoEnabled,
    dashboardDataSource: effectiveDashboardDataSource,
    dashboardDataSourceExplicit: classroomPilotProfileActive || dashboardDataSource.explicit,
    dashboardDataSourceNotice: dashboardDataSource.fallbackReason,
    dashboardRoutesEnabled,
    hostedStorageRequested,
    hostedStorageAvailable: false,
    storageNotice: hostedStorageRequested
      ? 'Hosted storage mode is not implemented yet. Local demo storage is still active in this build.'
      : undefined,
    supabaseUrl: supabase.url,
    supabasePublishableKey: supabase.publishableKey,
    supabaseConfigured: supabase.isConfigured,
    studentClassClaimSource,
    studentClassClaimSourceExplicit,
    studentClassClaimNotice: studentClassClaimSource === 'supabase' && !supabase.isConfigured
      ? supabase.invalid.length > 0
        ? 'Classroom roster entry is active, but the hosted classroom browser configuration is invalid.'
        : 'Classroom roster entry is active, but the hosted classroom browser configuration is incomplete.'
      : undefined,
    assetBaseUrl: envString(env.VITE_ASSET_BASE_URL),
    diagnostics: {
      profileName,
      profileExplicit: explicitProfile,
      supabaseConfigured: supabase.isConfigured,
      supabaseRequired: classroomPilotProfileActive || supabaseDashboardRequested || studentClassClaimSource === 'supabase',
      dashboardDataSource: effectiveDashboardDataSource,
      dashboardRoutesEnabled,
      studentClassClaimSource,
      hostedProgressSyncEnabled: classroomPilotProfileActive || supabaseDashboardRequested,
      productionDashboardAuthority: classroomPilotProfileActive,
    },
  };
}
