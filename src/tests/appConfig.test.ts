import { describe, expect, it } from 'vitest';
import { resolveRuntimeConfig } from '../lib/appConfig';

describe('runtime storage config', () => {
  it('defaults to local demo storage', () => {
    const config = resolveRuntimeConfig({});

    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageAvailable).toBe(false);
    expect(config.dashboardDemoEnabled).toBe(false);
    expect(config.dashboardDataSource).toBe('mock');
    expect(config.dashboardRoutesEnabled).toBe(false);
    expect(config.storageNotice).toBeUndefined();
    expect(config.supabaseConfigured).toBe(false);
    expect(config.studentClassClaimSource).toBe('mock');
    expect(config.studentClassClaimSourceExplicit).toBe(false);
  });

  it('requires an explicit demo flag for dashboard routes', () => {
    expect(resolveRuntimeConfig({ VITE_ASTERION_DASHBOARD_DEMO: 'true' }).dashboardDemoEnabled).toBe(false);
    expect(resolveRuntimeConfig({ VITE_ASTERION_DASHBOARD_DEMO: 'enabled' }).dashboardDemoEnabled).toBe(true);
    expect(resolveRuntimeConfig({ VITE_ASTERION_DASHBOARD_DEMO: 'enabled' }).dashboardRoutesEnabled).toBe(true);
  });

  it('requires an explicit dashboard data source before Supabase dashboard mode is active', () => {
    expect(resolveRuntimeConfig({ VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'supabase' })).toMatchObject({
      dashboardDataSource: 'supabase',
      dashboardDataSourceExplicit: true,
      dashboardRoutesEnabled: true,
    });

    const invalid = resolveRuntimeConfig({ VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'hosted' });
    expect(invalid.dashboardDataSource).toBe('mock');
    expect(invalid.dashboardRoutesEnabled).toBe(false);
    expect(invalid.dashboardDataSourceNotice).toContain('Unsupported dashboard data source');
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

  it('keeps hosted student roster claiming behind an explicit Supabase source flag', () => {
    const defaultWithSupabase = resolveRuntimeConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(defaultWithSupabase.studentClassClaimSource).toBe('mock');
    expect(defaultWithSupabase.studentClassClaimNotice).toBeUndefined();

    const requested = resolveRuntimeConfig({
      VITE_ASTERION_STUDENT_CLAIM_SOURCE: 'supabase',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(requested.studentClassClaimSource).toBe('supabase');
    expect(requested.studentClassClaimSourceExplicit).toBe(true);
    expect(requested.studentClassClaimNotice).toBeUndefined();

    const missingConfig = resolveRuntimeConfig({
      VITE_ASTERION_STUDENT_CLAIM_SOURCE: 'supabase',
    });

    expect(missingConfig.studentClassClaimSource).toBe('supabase');
    expect(missingConfig.studentClassClaimNotice).toContain('incomplete');
  });

  it('treats unknown storage modes as local', () => {
    const config = resolveRuntimeConfig({ VITE_ASTERION_STORAGE_MODE: 'remote' });

    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageRequested).toBe(false);
  });
});
