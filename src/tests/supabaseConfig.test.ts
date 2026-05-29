import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSupabaseBrowserClient, createSupabaseBrowserClientFromEnv, defaultSupabaseBrowserAuthOptions } from '../lib/supabaseClient';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

describe('Supabase browser config smoke check', () => {
  it('is disabled when browser-safe env is missing', async () => {
    const config = resolveSupabaseConfig({});

    expect(config.isConfigured).toBe(false);
    expect(config.missing).toEqual(['url', 'publishableKey']);
    await expect(createSupabaseBrowserClient(config)).resolves.toBeUndefined();
  });

  it('is configured when browser-safe URL and publishable key are present', async () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });

    expect(config).toMatchObject({
      url: 'https://asterion-example.supabase.co',
      publishableKey: 'sb_publishable_example',
      isConfigured: true,
      missing: [],
      invalid: [],
    });
    await expect(createSupabaseBrowserClient(config)).resolves.toBeTruthy();
  });

  it('defaults browser clients to persistent Supabase sessions and token refresh', () => {
    expect(defaultSupabaseBrowserAuthOptions).toEqual({
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    });
  });

  it('does not create a client for malformed URL config', async () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'not-a-url',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });

    expect(config.isConfigured).toBe(false);
    expect(config.invalid).toEqual(['url']);
    await expect(createSupabaseBrowserClient(config)).resolves.toBeUndefined();
  });

  it('does not create a client in China static pilot mode even when Supabase env vars are present', async () => {
    const config = resolveSupabaseConfig({
      VITE_CHINA_STATIC_PILOT: 'true',
      VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });

    expect(config.isConfigured).toBe(false);
    expect(config.runtimeDisabled).toBe(true);
    expect(config.disabledReason).toContain('China static pilot mode');
    await expect(createSupabaseBrowserClient(config)).resolves.toBeUndefined();
  });

  it('ignores privileged server credential env names', async () => {
    const serverRoleName = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');
    const viteServerRoleName = ['VITE', serverRoleName].join('_');
    const privateKeyName = ['SUPABASE', 'PRIVATE', 'KEY'].join('_');
    const config = resolveSupabaseConfig({
      [viteServerRoleName]: 'must-not-be-read',
      [serverRoleName]: 'must-not-be-read',
      [privateKeyName]: 'must-not-be-read',
    } as Parameters<typeof resolveSupabaseConfig>[0]);

    expect(config.isConfigured).toBe(false);
    expect(config.url).toBeUndefined();
    expect(config.publishableKey).toBeUndefined();
    await expect(createSupabaseBrowserClientFromEnv({
      [viteServerRoleName]: 'must-not-be-read',
    } as Parameters<typeof resolveSupabaseConfig>[0])).resolves.toBeUndefined();
  });

  it('keeps privileged server credential names out of Supabase browser modules', () => {
    const sources = [
      readFileSync(`${process.cwd()}/src/lib/supabaseConfig.ts`, 'utf8'),
      readFileSync(`${process.cwd()}/src/lib/supabaseClient.ts`, 'utf8'),
      readFileSync(`${process.cwd()}/src/lib/supabaseHealth.ts`, 'utf8'),
    ].join('\n');
    const serverOnlyCredentialPattern = new RegExp([
      ['SERVICE', 'ROLE'].join('_'),
      ['PRIVATE', 'KEY'].join('_'),
    ].join('|'), 'i');

    expect(sources).not.toMatch(serverOnlyCredentialPattern);
  });
});
