import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig, supabaseConfig, type SupabaseConfig } from './supabaseConfig';

export type AsterionSupabaseClient = SupabaseClient;

export interface SupabaseBrowserClientOptions {
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
  };
}

export const defaultSupabaseBrowserAuthOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
} as const;

const browserClientPromises = new Map<string, Promise<AsterionSupabaseClient | undefined>>();

function browserClientCacheKey(config: SupabaseConfig, options: SupabaseBrowserClientOptions): string {
  return JSON.stringify({
    url: config.url,
    publishableKey: config.publishableKey,
    persistSession: options.auth?.persistSession ?? defaultSupabaseBrowserAuthOptions.persistSession,
    autoRefreshToken: options.auth?.autoRefreshToken ?? defaultSupabaseBrowserAuthOptions.autoRefreshToken,
    detectSessionInUrl: options.auth?.detectSessionInUrl ?? defaultSupabaseBrowserAuthOptions.detectSessionInUrl,
  });
}

export async function createSupabaseBrowserClient(
  config: SupabaseConfig = supabaseConfig,
  options: SupabaseBrowserClientOptions = {},
): Promise<AsterionSupabaseClient | undefined> {
  if (config.runtimeDisabled) return undefined;
  if (!config.isConfigured || !config.url || !config.publishableKey) return undefined;

  const cacheKey = browserClientCacheKey(config, options);
  const cached = browserClientPromises.get(cacheKey);
  if (cached) return cached;

  const { url, publishableKey } = config;
  const promise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, publishableKey, {
    auth: {
      persistSession: options.auth?.persistSession ?? defaultSupabaseBrowserAuthOptions.persistSession,
      autoRefreshToken: options.auth?.autoRefreshToken ?? defaultSupabaseBrowserAuthOptions.autoRefreshToken,
      detectSessionInUrl: options.auth?.detectSessionInUrl ?? defaultSupabaseBrowserAuthOptions.detectSessionInUrl,
    },
  }));
  browserClientPromises.set(cacheKey, promise);
  return promise;
}

export function createSupabaseBrowserClientFromEnv(env: Parameters<typeof resolveSupabaseConfig>[0]): Promise<AsterionSupabaseClient | undefined> {
  return createSupabaseBrowserClient(resolveSupabaseConfig(env));
}
