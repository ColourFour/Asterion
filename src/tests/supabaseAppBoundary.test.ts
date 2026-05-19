import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Supabase integration boundary', () => {
  it('keeps dashboard data routes on the dashboard service boundary', () => {
    const teacherDashboard = readFileSync(`${process.cwd()}/src/components/dashboard/TeacherDashboard.tsx`, 'utf8');
    const adminDashboard = readFileSync(`${process.cwd()}/src/components/dashboard/AdminDashboard.tsx`, 'utf8');
    const dashboardDataService = readFileSync(`${process.cwd()}/src/lib/dashboardDataService.ts`, 'utf8');
    const classClaimForm = readFileSync(`${process.cwd()}/src/components/onboarding/ClassCodeClaimForm.tsx`, 'utf8');

    expect(teacherDashboard).toContain('../../lib/dashboardDataService');
    expect(adminDashboard).toContain('../../lib/dashboardDataService');
    expect(teacherDashboard).not.toContain('dashboardMockService');
    expect(adminDashboard).not.toContain('dashboardMockService');
    expect(dashboardDataService).toContain('./dashboardMockService');
    expect(dashboardDataService).toContain('./supabaseDashboardService');
    expect(dashboardDataService).toContain('DashboardDataService');
    expect(classClaimForm).toContain("../../lib/dashboardMockService");
    expect(teacherDashboard).not.toContain('supabaseClient');
    expect(teacherDashboard).not.toContain('.from(');
    expect(classClaimForm).not.toContain('supabase');
    expect(adminDashboard).not.toContain('supabaseClient');
    expect(adminDashboard).not.toContain('.from(');
    expect(adminDashboard).toContain('SupabaseDiagnosticPanel');
  });

  it('keeps student app startup independent from Supabase health', () => {
    const app = readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    const main = readFileSync(`${process.cwd()}/src/main.tsx`, 'utf8');
    const studentComponents = [
      readFileSync(`${process.cwd()}/src/components/world/P3AstralAcademy.tsx`, 'utf8'),
      readFileSync(`${process.cwd()}/src/components/practice/PracticeView.tsx`, 'utf8'),
      readFileSync(`${process.cwd()}/src/components/onboarding/ClassCodeClaimForm.tsx`, 'utf8'),
    ].join('\n');

    expect(`${app}\n${main}`).not.toContain('supabaseHealth');
    expect(studentComponents).not.toContain('supabaseHealth');
    expect(studentComponents).not.toContain('SupabaseDiagnosticPanel');
  });

  it('keeps the browser probe diagnostic-only and RPC-only', () => {
    const health = readFileSync(`${process.cwd()}/src/lib/supabaseHealth.ts`, 'utf8');
    const diagnosticPanel = readFileSync(`${process.cwd()}/src/components/dashboard/SupabaseDiagnosticPanel.tsx`, 'utf8');

    expect(health).toContain("rpc('asterion_health_check')");
    expect(health).not.toContain('.from(');
    expect(health).not.toMatch(/insert|upsert|update|delete/i);
    expect(diagnosticPanel).not.toMatch(/organizations|classes|students|memberships|progress/i);
  });
});
