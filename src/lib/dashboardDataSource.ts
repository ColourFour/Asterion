import { isChinaStaticPilotMode, type StaticPilotRuntimeEnv } from './staticPilotMode';

export type DashboardDataSourceKind = 'mock' | 'supabase';

export interface DashboardDataSourceRuntimeEnv extends StaticPilotRuntimeEnv {
  VITE_ASTERION_APP_PROFILE?: string | boolean;
  VITE_ASTERION_DASHBOARD_DATA_SOURCE?: string | boolean;
}

export interface DashboardDataSourceSelection {
  requested: DashboardDataSourceKind;
  effective: DashboardDataSourceKind;
  explicit: boolean;
  invalidValue?: string;
  fallbackReason?: string;
}

function envString(value: string | boolean | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function resolveDashboardDataSource(env: DashboardDataSourceRuntimeEnv = import.meta.env): DashboardDataSourceSelection {
  const rawValue = envString(env.VITE_ASTERION_DASHBOARD_DATA_SOURCE);
  if (isChinaStaticPilotMode(env)) {
    return {
      requested: rawValue?.toLowerCase() === 'supabase' ? 'supabase' : 'mock',
      effective: 'mock',
      explicit: Boolean(rawValue),
      fallbackReason: rawValue
        ? 'China static pilot mode disables hosted dashboard data; using mock/local mode.'
        : undefined,
    };
  }

  const appProfile = envString(env.VITE_ASTERION_APP_PROFILE)?.toLowerCase();
  if (appProfile === 'classroom-pilot') {
    const fallbackReason = rawValue && rawValue.toLowerCase() !== 'supabase'
      ? `Classroom pilot profile requires Supabase dashboard data; VITE_ASTERION_DASHBOARD_DATA_SOURCE="${rawValue}" ignored.`
      : undefined;
    return {
      requested: 'supabase',
      effective: 'supabase',
      explicit: true,
      fallbackReason,
    };
  }

  if (!rawValue) {
    return {
      requested: 'mock',
      effective: 'mock',
      explicit: false,
    };
  }

  const normalized = rawValue.toLowerCase();
  if (normalized === 'mock' || normalized === 'supabase') {
    return {
      requested: normalized,
      effective: normalized,
      explicit: true,
    };
  }

  return {
    requested: 'mock',
    effective: 'mock',
    explicit: true,
    invalidValue: rawValue,
    fallbackReason: `Unsupported dashboard data source "${rawValue}" ignored; using mock data.`,
  };
}
