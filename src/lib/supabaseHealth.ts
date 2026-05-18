import { createSupabaseBrowserClient, type AsterionSupabaseClient } from './supabaseClient';
import { supabaseConfig, type SupabaseConfig } from './supabaseConfig';

export type SupabaseHealthStatus = 'disabled' | 'connected' | 'error';
export type SupabaseHealthDisabledReason = 'missing-config' | 'invalid-config';

export interface SupabaseHealthPayload {
  ok: boolean;
  service: 'asterion';
  schema_phase: 'classroom_phase_1';
  checked_at: string;
}

export type SupabaseHealthResult =
  | {
      status: 'disabled';
      reason: SupabaseHealthDisabledReason;
      message: string;
      checkedAt: string;
    }
  | {
      status: 'connected';
      payload: SupabaseHealthPayload;
      checkedAt: string;
    }
  | {
      status: 'error';
      message: string;
      checkedAt: string;
    };

interface RpcOnlyClient {
  rpc: AsterionSupabaseClient['rpc'];
}

export interface SupabaseHealthProbeOptions {
  config?: SupabaseConfig;
  createClient?: (config: SupabaseConfig) => Promise<RpcOnlyClient | undefined>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function disabledResult(reason: SupabaseHealthDisabledReason, message: string): SupabaseHealthResult {
  return {
    status: 'disabled',
    reason,
    message,
    checkedAt: nowIso(),
  };
}

function safeErrorMessage(error: unknown): string {
  if (!error) return 'Supabase health check failed.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'Supabase health check failed.';
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Supabase health check failed.';
}

function normalizePayload(data: unknown): SupabaseHealthPayload | undefined {
  const value = Array.isArray(data) ? data[0] : data;
  if (!value || typeof value !== 'object') return undefined;
  const payload = value as Partial<SupabaseHealthPayload>;

  if (
    payload.ok === true
    && payload.service === 'asterion'
    && payload.schema_phase === 'classroom_phase_1'
    && typeof payload.checked_at === 'string'
  ) {
    return {
      ok: payload.ok,
      service: payload.service,
      schema_phase: payload.schema_phase,
      checked_at: payload.checked_at,
    };
  }

  return undefined;
}

export async function checkSupabaseHealth(options: SupabaseHealthProbeOptions = {}): Promise<SupabaseHealthResult> {
  const config = options.config ?? supabaseConfig;

  if (config.missing.length > 0) {
    return disabledResult('missing-config', 'Supabase browser config is missing.');
  }

  if (!config.isConfigured || config.invalid.length > 0) {
    return disabledResult('invalid-config', 'Supabase browser config is invalid.');
  }

  try {
    const client = await (options.createClient ?? createSupabaseBrowserClient)(config);
    if (!client) {
      return disabledResult('invalid-config', 'Supabase browser client is disabled.');
    }

    const { data, error } = await client.rpc('asterion_health_check');
    if (error) {
      return {
        status: 'error',
        message: safeErrorMessage(error),
        checkedAt: nowIso(),
      };
    }

    const payload = normalizePayload(data);
    if (!payload) {
      return {
        status: 'error',
        message: 'Supabase health check returned an unexpected diagnostic payload.',
        checkedAt: nowIso(),
      };
    }

    return {
      status: 'connected',
      payload,
      checkedAt: nowIso(),
    };
  } catch (error) {
    return {
      status: 'error',
      message: safeErrorMessage(error),
      checkedAt: nowIso(),
    };
  }
}
