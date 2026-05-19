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

export async function createSupabaseBrowserClient(
  config: SupabaseConfig = supabaseConfig,
  options: SupabaseBrowserClientOptions = {},
): Promise<AsterionSupabaseClient | undefined> {
  if (!config.isConfigured || !config.url || !config.publishableKey) return undefined;

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: options.auth?.persistSession ?? false,
      autoRefreshToken: options.auth?.autoRefreshToken ?? false,
      detectSessionInUrl: options.auth?.detectSessionInUrl ?? false,
    },
  });
}

export function createSupabaseBrowserClientFromEnv(env: Parameters<typeof resolveSupabaseConfig>[0]): Promise<AsterionSupabaseClient | undefined> {
  return createSupabaseBrowserClient(resolveSupabaseConfig(env));
}
