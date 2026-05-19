export type DashboardDataSourceKind = 'mock' | 'supabase';

export interface DashboardDataSourceRuntimeEnv {
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
