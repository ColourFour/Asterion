import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { checkSupabaseHealth, type SupabaseHealthPayload } from '../lib/supabaseHealth';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

function createRpcClient(data: SupabaseHealthPayload | SupabaseHealthPayload[] | null, error: unknown = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe('Supabase health probe', () => {
  it('returns disabled when config is missing', async () => {
    const createClient = vi.fn();
    const result = await checkSupabaseHealth({
      config: resolveSupabaseConfig({}),
      createClient,
    });

    expect(result).toMatchObject({ status: 'disabled', reason: 'missing-config' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns disabled when config is invalid', async () => {
    const createClient = vi.fn();
    const result = await checkSupabaseHealth({
      config: resolveSupabaseConfig({
        VITE_SUPABASE_URL: 'not-a-url',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
      createClient,
    });

    expect(result).toMatchObject({ status: 'disabled', reason: 'invalid-config' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('calls only the diagnostic RPC when configured', async () => {
    const payload: SupabaseHealthPayload = {
      ok: true,
      service: 'asterion',
      schema_phase: 'classroom_phase_1',
      checked_at: '2026-05-18T00:00:00.000Z',
    };
    const client = createRpcClient([payload]);

    const result = await checkSupabaseHealth({
      config: validConfig,
      createClient: vi.fn(async () => client),
    });

    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('asterion_health_check');
    expect(result).toMatchObject({ status: 'connected', payload });
    expect('from' in client).toBe(false);
  });

  it('returns a connected result for a valid RPC payload', async () => {
    const payload: SupabaseHealthPayload = {
      ok: true,
      service: 'asterion',
      schema_phase: 'classroom_phase_1',
      checked_at: '2026-05-18T01:02:03.000Z',
    };

    await expect(checkSupabaseHealth({
      config: validConfig,
      createClient: vi.fn(async () => createRpcClient(payload)),
    })).resolves.toMatchObject({
      status: 'connected',
      payload,
    });
  });

  it('returns a safe error when the RPC fails', async () => {
    const result = await checkSupabaseHealth({
      config: validConfig,
      createClient: vi.fn(async () => createRpcClient(null, { message: 'RPC unavailable' })),
    });

    expect(result).toMatchObject({
      status: 'error',
      message: 'RPC unavailable',
    });
  });

  it('does not use server-only Supabase credential env names', () => {
    const sources = [
      readFileSync(`${process.cwd()}/src/lib/supabaseConfig.ts`, 'utf8'),
      readFileSync(`${process.cwd()}/src/lib/supabaseClient.ts`, 'utf8'),
      readFileSync(`${process.cwd()}/src/lib/supabaseHealth.ts`, 'utf8'),
      readFileSync(`${process.cwd()}/src/components/dashboard/SupabaseDiagnosticPanel.tsx`, 'utf8'),
    ].join('\n');
    const serverOnlyCredentialPattern = new RegExp([
      ['SERVICE', 'ROLE'].join('_'),
      ['PRIVATE', 'KEY'].join('_'),
      ['SECRET'].join('_'),
    ].join('|'), 'i');

    expect(sources).not.toMatch(serverOnlyCredentialPattern);
  });
});
