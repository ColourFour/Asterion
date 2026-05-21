import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Supabase integration boundary', () => {
  it('keeps dashboard data routes on the dashboard service boundary', () => {
    const teacherDashboard = readFileSync(`${process.cwd()}/src/components/dashboard/TeacherDashboard.tsx`, 'utf8');
    const adminDashboard = readFileSync(`${process.cwd()}/src/components/dashboard/AdminDashboard.tsx`, 'utf8');
    const roleGate = readFileSync(`${process.cwd()}/src/components/auth/RoleGate.tsx`, 'utf8');
    const dashboardDataService = readFileSync(`${process.cwd()}/src/lib/dashboardDataService.ts`, 'utf8');
    const supabaseRoleService = readFileSync(`${process.cwd()}/src/lib/supabaseRoleService.ts`, 'utf8');
    const classClaimForm = readFileSync(`${process.cwd()}/src/components/onboarding/ClassCodeClaimForm.tsx`, 'utf8');

    expect(teacherDashboard).toContain('../../lib/dashboardDataService');
    expect(adminDashboard).toContain('../../lib/dashboardDataService');
    expect(roleGate).toContain('../../lib/supabaseRoleService');
    expect(teacherDashboard).not.toContain('dashboardMockService');
    expect(adminDashboard).not.toContain('dashboardMockService');
    expect(dashboardDataService).toContain('./dashboardMockService');
    expect(dashboardDataService).toContain('./supabaseDashboardService');
    expect(dashboardDataService).toContain('DashboardDataService');
    expect(supabaseRoleService).toContain("from<UserRoleRow>('user_roles')");
    expect(supabaseRoleService).toContain("from<TeacherProfileRow>('teacher_profiles')");
    expect(supabaseRoleService).toContain("from<StudentProfileRow>('student_profiles')");
    expect(classClaimForm).toContain('../../lib/studentClassClaimService');
    expect(teacherDashboard).not.toContain('supabaseClient');
    expect(teacherDashboard).not.toContain('.from(');
    expect(roleGate).not.toContain('supabaseClient');
    expect(roleGate).not.toContain('.from(');
    expect(classClaimForm).not.toContain('supabaseClient');
    expect(classClaimForm).not.toContain('.from(');
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
    expect(diagnosticPanel).not.toMatch(/organizations|classes|students|memberships|student_progress_events/i);
    expect(diagnosticPanel).toContain('hosted progress');
  });

  it('keeps staff preview progress in memory instead of using student persistence writes', () => {
    const app = readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');

    expect(app).toContain('createStaffPreviewProgress');
    expect(app).toContain('if (staffPreviewContext) return;');
    expect(app).not.toContain('progressAdapter.saveProfile(staffPreviewInitialProfile');
  });

  it('does not reference server-only Supabase env vars in browser source', () => {
    const browserSources = [
      'src/App.tsx',
      'src/lib/supabaseAuth.ts',
      'src/lib/supabaseAuthRedirect.ts',
      'src/lib/supabaseClient.ts',
      'src/lib/supabaseConfig.ts',
      'src/lib/supabaseDashboardService.ts',
      'src/lib/supabaseProgressEventService.ts',
      'src/lib/supabaseRoleService.ts',
      'src/lib/studentClassClaimService.ts',
      'src/lib/studentClassroomService.ts',
      'src/components/auth/SupabaseAuthPanel.tsx',
      'src/components/auth/RoleGate.tsx',
      'src/components/dashboard/TeacherDashboard.tsx',
      'src/components/dashboard/AdminDashboard.tsx',
      'src/components/dashboard/SupabaseDiagnosticPanel.tsx',
      'src/components/onboarding/ClassCodeClaimForm.tsx',
    ].map((path) => readFileSync(`${process.cwd()}/${path}`, 'utf8')).join('\n');

    expect(browserSources).not.toContain(['ASTERION', 'SUPABASE', 'DB', 'URL'].join('_'));
    expect(browserSources).not.toContain(['SUPABASE', 'SERVICE', 'ROLE'].join('_'));
    expect(browserSources).not.toContain(['SUPABASE', 'JWT', 'SECRET'].join('_'));
    expect(browserSources).not.toMatch(/supabase[_-]?service[_-]?role/i);
    expect(browserSources).not.toMatch(/supabase[_-]?admin[_-]?key/i);
  });
});
