export interface SupabaseRuntimeEnv {
  VITE_SUPABASE_URL?: string | boolean;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string | boolean;
}

export interface SupabaseConfig {
  url?: string;
  publishableKey?: string;
  isConfigured: boolean;
  missing: Array<'url' | 'publishableKey'>;
  invalid: Array<'url'>;
}

function envString(value: string | boolean | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function isValidHttpsUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function resolveSupabaseConfig(env: SupabaseRuntimeEnv = import.meta.env): SupabaseConfig {
  const url = envString(env.VITE_SUPABASE_URL);
  const publishableKey = envString(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const missing: SupabaseConfig['missing'] = [];
  const invalid: SupabaseConfig['invalid'] = [];

  if (!url) missing.push('url');
  else if (!isValidHttpsUrl(url)) invalid.push('url');
  if (!publishableKey) missing.push('publishableKey');

  return {
    url,
    publishableKey,
    isConfigured: Boolean(url && publishableKey && invalid.length === 0),
    missing,
    invalid,
  };
}

export const supabaseConfig = resolveSupabaseConfig();
