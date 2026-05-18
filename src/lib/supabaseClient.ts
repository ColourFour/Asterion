import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig, supabaseConfig, type SupabaseConfig } from './supabaseConfig';

export type AsterionSupabaseClient = SupabaseClient;

export async function createSupabaseBrowserClient(config: SupabaseConfig = supabaseConfig): Promise<AsterionSupabaseClient | undefined> {
  if (!config.isConfigured || !config.url || !config.publishableKey) return undefined;

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseBrowserClientFromEnv(env: Parameters<typeof resolveSupabaseConfig>[0]): Promise<AsterionSupabaseClient | undefined> {
  return createSupabaseBrowserClient(resolveSupabaseConfig(env));
}
