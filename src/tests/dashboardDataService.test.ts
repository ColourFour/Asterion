import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDashboardDataService, dashboardDataService, mockDashboardDataService, type DashboardDataService } from '../lib/dashboardDataService';
import * as dashboardMockService from '../lib/dashboardMockService';

describe('dashboard data service adapter', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', '');
  });

  it('uses the mock dashboard service as the default implementation', () => {
    const service: DashboardDataService = dashboardDataService;

    expect(createDashboardDataService({})).toBe(mockDashboardDataService);
    expect(service.source).toMatchObject({
      kind: 'mock',
      label: 'Mock local dashboard data',
      readOnly: false,
    });
  });

  it('selects Supabase only through the explicit dashboard data-source setting', () => {
    expect(createDashboardDataService({
      VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'supabase',
      VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    }).source).toMatchObject({
      kind: 'supabase',
      readOnly: true,
    });

    expect(createDashboardDataService({ VITE_ASTERION_DASHBOARD_DATA_SOURCE: 'hosted' }).source).toMatchObject({
      kind: 'mock',
      detail: expect.stringContaining('Unsupported dashboard data source'),
    });
  });

  it('returns the same core teacher dashboard data as dashboardMockService', async () => {
    const [adapterClasses, mockClasses] = await Promise.all([
      dashboardDataService.listTeacherClasses('teacher-hypatia'),
      dashboardMockService.listTeacherClasses('teacher-hypatia'),
    ]);

    expect(adapterClasses).toEqual(mockClasses);

    const [adapterDashboard, mockDashboard] = await Promise.all([
      dashboardDataService.getTeacherClassDashboard('class-p3-alpha'),
      dashboardMockService.getTeacherClassDashboard('class-p3-alpha'),
    ]);

    expect(adapterDashboard.class).toEqual(mockDashboard.class);
    expect(adapterDashboard.progressSummary).toEqual(mockDashboard.progressSummary);
    expect(adapterDashboard.regionSummaries).toEqual(mockDashboard.regionSummaries);
    expect(adapterDashboard.focusThisWeek).toEqual(mockDashboard.focusThisWeek);
    expect(adapterDashboard.weeklySummary).toEqual(mockDashboard.weeklySummary);
    expect(adapterDashboard.exportRows).toEqual(mockDashboard.exportRows);
    expect(adapterDashboard.roster).toEqual(mockDashboard.roster);
    expect(adapterDashboard.classCode).toEqual(mockDashboard.classCode);
    expect(adapterDashboard.regionAccess).toEqual(mockDashboard.regionAccess);
  });

  it('returns the same admin records and audit events as dashboardMockService', async () => {
    await expect(dashboardDataService.listAdminTeacherRecords()).resolves.toEqual(await dashboardMockService.listAdminTeacherRecords());
    await expect(dashboardDataService.listAdminClassRecords()).resolves.toEqual(await dashboardMockService.listAdminClassRecords());
    await expect(dashboardDataService.listAdminAuditEvents()).resolves.toEqual(await dashboardMockService.listAdminAuditEvents());
  });

  it('preserves mock formatting and access helper behavior', async () => {
    const dashboard = await dashboardDataService.getTeacherClassDashboard('class-p3-alpha');

    expect(dashboardDataService.generateTeacherCsvExport(dashboard.exportRows)).toEqual(
      dashboardMockService.generateTeacherCsvExport(dashboard.exportRows),
    );
    expect(dashboardDataService.labelForClassRegionAccess('field_guide_only')).toBe(
      dashboardMockService.labelForClassRegionAccess('field_guide_only'),
    );
    expect(dashboardDataService.labelForTeacherRegionStatus('needs_help')).toBe(
      dashboardMockService.labelForTeacherRegionStatus('needs_help'),
    );
    expect(dashboardDataService.canUseRegionActivity('field_guide_only', 'quick_check')).toBe(false);
    expect(dashboardDataService.canUseRegionActivity('open', 'guardian')).toBe(true);
  });

  it('routes mock roster mutations through the adapter boundary', async () => {
    const added = await dashboardDataService.addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Adapter Boundary Student');

    expect(added).toMatchObject({
      classId: 'class-p3-alpha',
      displayName: 'Adapter Boundary Student',
      status: 'unclaimed',
    });

    await expect(dashboardMockService.getTeacherClassRoster('teacher-hypatia', 'class-p3-alpha')).resolves.toEqual(
      expect.objectContaining({
        students: expect.arrayContaining([
          expect.objectContaining({ id: added?.id, displayName: 'Adapter Boundary Student', status: 'unclaimed' }),
        ]),
      }),
    );
  });
});
