import { describe, expect, it } from 'vitest';
import { resolveRuntimeConfig } from '../lib/appConfig';

describe('runtime storage config', () => {
  it('defaults to local demo storage', () => {
    const config = resolveRuntimeConfig({});

    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageAvailable).toBe(false);
    expect(config.storageNotice).toBeUndefined();
    expect(config.supabaseConfigured).toBe(false);
  });

  it('recognizes hosted mode without silently activating hosted persistence', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_STORAGE_MODE: 'hosted',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      VITE_ASSET_BASE_URL: 'https://cdn.example.test',
    });

    expect(config.requestedStorageMode).toBe('hosted');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageAvailable).toBe(false);
    expect(config.storageNotice).toContain('not implemented');
    expect(config.supabaseUrl).toBe('https://example.supabase.co');
    expect(config.supabasePublishableKey).toBe('publishable-key');
    expect(config.supabaseConfigured).toBe(true);
    expect(config.assetBaseUrl).toBe('https://cdn.example.test');
  });

  it('treats unknown storage modes as local', () => {
    const config = resolveRuntimeConfig({ VITE_ASTERION_STORAGE_MODE: 'remote' });

    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageRequested).toBe(false);
  });
});
