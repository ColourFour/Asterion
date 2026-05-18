import type { ProgressStorageMode } from './progressAdapter';
import { resolveSupabaseConfig } from './supabaseConfig';

export interface AsterionRuntimeConfig {
  requestedStorageMode: ProgressStorageMode;
  effectiveStorageMode: 'local';
  hostedStorageRequested: boolean;
  hostedStorageAvailable: false;
  storageNotice?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseConfigured: boolean;
  assetBaseUrl?: string;
}

type RuntimeEnv = Partial<Record<string, string | boolean | undefined>>;

function envString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function configuredStorageMode(value: string | boolean | undefined): ProgressStorageMode {
  return value === 'hosted' ? 'hosted' : 'local';
}

export function resolveRuntimeConfig(env: RuntimeEnv = import.meta.env): AsterionRuntimeConfig {
  const requestedStorageMode = configuredStorageMode(env.VITE_ASTERION_STORAGE_MODE);
  const hostedStorageRequested = requestedStorageMode === 'hosted';
  const supabase = resolveSupabaseConfig(env);

  return {
    requestedStorageMode,
    effectiveStorageMode: 'local',
    hostedStorageRequested,
    hostedStorageAvailable: false,
    storageNotice: hostedStorageRequested
      ? 'Hosted storage mode is not implemented yet. Local demo storage is still active in this build.'
      : undefined,
    supabaseUrl: supabase.url,
    supabasePublishableKey: supabase.publishableKey,
    supabaseConfigured: supabase.isConfigured,
    assetBaseUrl: envString(env.VITE_ASSET_BASE_URL),
  };
}
