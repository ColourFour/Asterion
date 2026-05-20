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
}

type RuntimeEnv = Partial<Record<string, string | boolean | undefined>>;

function envString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function configuredStorageMode(value: string | boolean | undefined): ProgressStorageMode {
  return value === 'hosted' ? 'hosted' : 'local';
}

function configuredStudentClassClaimSource(value: string | boolean | undefined): 'mock' | 'supabase' {
  return value === 'supabase' ? 'supabase' : 'mock';
}

function configuredAppProfile(value: string | boolean | undefined): AsterionAppProfile | undefined {
  if (value === 'student-pilot') return 'student-pilot';
  if (value === 'classroom-pilot') return 'classroom-pilot';
  return undefined;
}

function hasNonPilotRuntimeOverride(env: RuntimeEnv): boolean {
  return env.VITE_ASTERION_STORAGE_MODE === 'hosted'
    || env.VITE_ASTERION_DASHBOARD_DEMO === 'enabled'
    || env.VITE_ASTERION_DASHBOARD_DATA_SOURCE === 'supabase'
    || env.VITE_ASTERION_STUDENT_CLAIM_SOURCE === 'supabase';
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
  const studentClassClaimSource = studentPilotProfileActive
    ? 'mock'
    : classroomPilotProfileActive ? 'supabase' : configuredStudentClassClaimSource(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
  const studentClassClaimSourceExplicit = classroomPilotProfileActive || typeof env.VITE_ASTERION_STUDENT_CLAIM_SOURCE === 'string';
  const dashboardRoutesEnabled = classroomPilotProfileActive || dashboardDemoEnabled || supabaseDashboardRequested;
  const profileNotices = [
    studentPilotProfileActive && hasNonPilotRuntimeOverride(env)
      ? 'Student pilot profile is active; hosted storage, Supabase claim/dashboard modes, and dashboard demo routes are disabled for this build.'
      : undefined,
    classroomPilotProfileActive && !supabase.isConfigured
      ? 'Classroom pilot profile requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before hosted classroom routes and claims can be used.'
      : undefined,
  ].filter((notice): notice is string => Boolean(notice));
  const profileNotice = profileNotices.length ? profileNotices.join(' ') : undefined;

  return {
    profile: {
      name: profileName,
      explicit: explicitProfile,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: classroomPilotProfileActive,
      hostedProgressSyncEnabled: classroomPilotProfileActive,
      aiMarkingEnabled: false,
      productionDashboardAuthority: classroomPilotProfileActive,
      dashboardDemoBehaviorEnabled: dashboardDemoEnabled,
    },
    profileNotice,
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
      ? 'Supabase roster claiming is active, but Supabase browser configuration is incomplete.'
      : undefined,
    assetBaseUrl: envString(env.VITE_ASSET_BASE_URL),
  };
}
