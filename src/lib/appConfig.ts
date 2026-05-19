import type { ProgressStorageMode } from './progressAdapter';
import { resolveDashboardDataSource, type DashboardDataSourceKind } from './dashboardDataSource';
import { resolveSupabaseConfig } from './supabaseConfig';

export interface AsterionRuntimeConfig {
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

export function resolveRuntimeConfig(env: RuntimeEnv = import.meta.env): AsterionRuntimeConfig {
  const requestedStorageMode = configuredStorageMode(env.VITE_ASTERION_STORAGE_MODE);
  const hostedStorageRequested = requestedStorageMode === 'hosted';
  const supabase = resolveSupabaseConfig(env);
  const dashboardDemoEnabled = env.VITE_ASTERION_DASHBOARD_DEMO === 'enabled';
  const dashboardDataSource = resolveDashboardDataSource(env);
  const supabaseDashboardRequested = dashboardDataSource.effective === 'supabase';
  const studentClassClaimSource = configuredStudentClassClaimSource(env.VITE_ASTERION_STUDENT_CLAIM_SOURCE);
  const studentClassClaimSourceExplicit = typeof env.VITE_ASTERION_STUDENT_CLAIM_SOURCE === 'string';

  return {
    requestedStorageMode,
    effectiveStorageMode: 'local',
    dashboardDemoEnabled,
    dashboardDataSource: dashboardDataSource.effective,
    dashboardDataSourceExplicit: dashboardDataSource.explicit,
    dashboardDataSourceNotice: dashboardDataSource.fallbackReason,
    dashboardRoutesEnabled: dashboardDemoEnabled || supabaseDashboardRequested,
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
      ? 'Supabase roster claiming was requested, but Supabase browser configuration is incomplete.'
      : undefined,
    assetBaseUrl: envString(env.VITE_ASSET_BASE_URL),
  };
}
