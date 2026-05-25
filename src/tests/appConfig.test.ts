import { describe, expect, it } from 'vitest';
import { resolveRuntimeConfig } from '../lib/appConfig';

describe('runtime storage config', () => {
  it('defaults to browser-local progress storage', () => {
    const config = resolveRuntimeConfig({});

    expect(config.profile).toMatchObject({
      name: 'student-pilot',
      explicit: false,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: false,
      hostedProgressSyncEnabled: false,
      aiMarkingEnabled: false,
      productionDashboardAuthority: false,
      dashboardDemoBehaviorEnabled: false,
    });
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

  it('makes the explicit student pilot profile inspectable and blocks non-pilot runtime flags', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_APP_PROFILE: 'student-pilot',
      VITE_ASTERION_STORAGE_MODE: 'hosted',
      VITE_ASTERION_DASHBOARD_DEMO: 'enabled',
      VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'supabase',
      VITE_ASTERION_STUDENT_CLAIM_SOURCE: 'supabase',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(config.profile).toMatchObject({
      name: 'student-pilot',
      explicit: true,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: false,
      hostedProgressSyncEnabled: false,
      aiMarkingEnabled: false,
      productionDashboardAuthority: false,
      dashboardDemoBehaviorEnabled: false,
    });
    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageRequested).toBe(false);
    expect(config.dashboardDemoEnabled).toBe(false);
    expect(config.dashboardDataSource).toBe('mock');
    expect(config.dashboardRoutesEnabled).toBe(false);
    expect(config.studentClassClaimSource).toBe('mock');
    expect(config.supabaseConfigured).toBe(true);
    expect(config.profileNotice).toContain('Student pilot profile is active');
  });

  it('blocks Supabase classroom sources when no classroom-pilot profile is set', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'supabase',
      VITE_ASTERION_STUDENT_CLAIM_SOURCE: 'supabase',
    });

    expect(config.profile.name).toBe('custom');
    expect(config.profile.explicit).toBe(false);
    expect(config.dashboardDataSource).toBe('supabase');
    expect(config.dashboardRoutesEnabled).toBe(true);
    expect(config.studentClassClaimSource).toBe('supabase');
    expect(config.configurationBlocked).toBe(true);
    expect(config.configurationBlockReason).toContain('without VITE_ASTERION_APP_PROFILE=classroom-pilot');
    expect(config.diagnostics).toMatchObject({
      profileName: 'custom',
      profileExplicit: false,
      supabaseRequired: true,
      dashboardDataSource: 'supabase',
      studentClassClaimSource: 'supabase',
      hostedProgressSyncEnabled: true,
      productionDashboardAuthority: false,
    });
    expect(config.profileNotice).toContain('without VITE_ASTERION_APP_PROFILE=classroom-pilot');
  });

  it('forces Supabase student claims whenever Supabase dashboard data is active', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'supabase',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(config.profile.name).toBe('custom');
    expect(config.dashboardDataSource).toBe('supabase');
    expect(config.studentClassClaimSource).toBe('supabase');
    expect(config.studentClassClaimSourceExplicit).toBe(true);
    expect(config.profile.supabaseRequired).toBe(true);
    expect(config.configurationBlocked).toBe(true);
    expect(config.profileNotice).toContain('without VITE_ASTERION_APP_PROFILE=classroom-pilot');
    expect(config.studentClassClaimNotice).toBeUndefined();
  });

  it('activates hosted classroom behavior through the explicit classroom pilot profile', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_APP_PROFILE: 'classroom-pilot',
      VITE_ASTERION_DASHBOARD_DEMO: 'enabled',
      VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'mock',
      VITE_ASTERION_STUDENT_CLAIM_SOURCE: 'mock',
      VITE_ASTERION_STORAGE_MODE: 'hosted',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(config.profile).toMatchObject({
      name: 'classroom-pilot',
      explicit: true,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: true,
      hostedProgressSyncEnabled: true,
      aiMarkingEnabled: false,
      productionDashboardAuthority: true,
      dashboardDemoBehaviorEnabled: false,
    });
    expect(config.requestedStorageMode).toBe('local');
    expect(config.effectiveStorageMode).toBe('local');
    expect(config.hostedStorageRequested).toBe(false);
    expect(config.dashboardDemoEnabled).toBe(false);
    expect(config.dashboardDataSource).toBe('supabase');
    expect(config.dashboardDataSourceExplicit).toBe(true);
    expect(config.dashboardRoutesEnabled).toBe(true);
    expect(config.studentClassClaimSource).toBe('supabase');
    expect(config.studentClassClaimSourceExplicit).toBe(true);
    expect(config.supabaseConfigured).toBe(true);
    expect(config.configurationBlocked).toBe(false);
    expect(config.profileNotice).toBeUndefined();
    expect(config.studentClassClaimNotice).toBeUndefined();
    expect(config.diagnostics).toMatchObject({
      profileName: 'classroom-pilot',
      profileExplicit: true,
      supabaseConfigured: true,
      supabaseRequired: true,
      dashboardDataSource: 'supabase',
      dashboardRoutesEnabled: true,
      studentClassClaimSource: 'supabase',
      hostedProgressSyncEnabled: true,
      productionDashboardAuthority: true,
    });
  });

  it('keeps classroom pilot on Supabase sources and reports missing Supabase config clearly', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_APP_PROFILE: 'classroom-pilot',
    });

    expect(config.profile.supabaseRequired).toBe(true);
    expect(config.profile.hostedProgressSyncEnabled).toBe(true);
    expect(config.dashboardDataSource).toBe('supabase');
    expect(config.dashboardRoutesEnabled).toBe(true);
    expect(config.studentClassClaimSource).toBe('supabase');
    expect(config.supabaseConfigured).toBe(false);
    expect(config.profileNotice).toContain('Classroom entry needs class connection settings');
    expect(config.studentClassClaimNotice).toContain('Classroom entry is active');
    expect(config.studentClassClaimNotice).toContain('class connection settings are incomplete');
  });

  it('blocks classroom-pilot hosted claims when Supabase browser config is invalid', () => {
    const config = resolveRuntimeConfig({
      VITE_ASTERION_APP_PROFILE: 'classroom-pilot',
      VITE_SUPABASE_URL: 'not-a-url',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(config.studentClassClaimSource).toBe('supabase');
    expect(config.supabaseConfigured).toBe(false);
    expect(config.studentClassClaimNotice).toContain('class connection settings are invalid');
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
