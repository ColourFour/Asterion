import type {
  AdminAuditEvent,
  AdminClassRecord,
  AdminTeacherRecord,
  AdminTeacherSummary,
  ClassRegionAccess,
  ClassRegionAccessMode,
  ClassRosterStudent,
  EvidenceReference,
  RegionLearningSignal,
  StudentSummary,
  TeacherClass,
  TeacherClassDashboard,
  TeacherClassRoster,
  TeacherExportRow,
  TeacherRegionStatus,
} from '../types';
import { resolveDashboardDataSource, type DashboardDataSourceKind } from './dashboardDataSource';
import { DashboardDataServiceError, isDashboardDataServiceError } from './dashboardServiceErrors';
import {
  addAdminClass,
  addAdminTeacher,
  addRosterStudent,
  archiveRosterStudent,
  canUseRegionActivity,
  generateTeacherCsvExport,
  getClassRegionAccess,
  getClassRegionSignals,
  getStudentEvidence,
  getStudentSummaries,
  getTeacherClassDashboard,
  getTeacherClassDashboardForTeacher,
  getTeacherClassRoster,
  labelForClassRegionAccess,
  labelForTeacherRegionStatus,
  listAdminAuditEvents,
  listAdminClasses,
  listAdminClassRecords,
  listAdminTeacherRecords,
  listAdminTeachers,
  listTeacherClasses,
  resetRosterClaim,
  setClassRegionAccess,
} from './dashboardMockService';
import { createSupabaseDashboardDataService } from './supabaseDashboardService';
import { resolveSupabaseConfig } from './supabaseConfig';

export { DashboardDataServiceError, isDashboardDataServiceError };

export type RegionActivityAccess = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'guardian' | 'mastery_progression';

export interface DashboardServiceSource {
  kind: DashboardDataSourceKind;
  label: string;
  readOnly: boolean;
  detail?: string;
}

export interface DashboardDataService {
  readonly source: DashboardServiceSource;
  listTeacherClasses(teacherId?: string): Promise<TeacherClass[]>;
  getTeacherClassDashboard(classId: string): Promise<TeacherClassDashboard>;
  getTeacherClassDashboardForTeacher(teacherId: string, classId: string): Promise<TeacherClassDashboard | undefined>;
  getTeacherClassRoster(teacherId: string, classId: string): Promise<TeacherClassRoster | undefined>;
  getClassRegionSignals(classId: string): Promise<RegionLearningSignal[]>;
  getStudentSummaries(classId: string): Promise<StudentSummary[]>;
  getStudentEvidence(studentId: string): Promise<EvidenceReference[]>;
  getClassRegionAccess(classId: string): ClassRegionAccess[];
  addRosterStudent(teacherId: string, classId: string, displayName: string): Promise<ClassRosterStudent | undefined>;
  archiveRosterStudent(teacherId: string, classId: string, rosterStudentId: string): Promise<ClassRosterStudent | undefined>;
  resetRosterClaim(input: {
    actorRole: 'admin' | 'teacher';
    actorTeacherId?: string;
    classId: string;
    rosterStudentId: string;
  }): Promise<ClassRosterStudent | undefined>;
  setClassRegionAccess(input: {
    actorRole: 'admin' | 'teacher';
    actorTeacherId?: string;
    classId: string;
    regionId: string;
    access: ClassRegionAccessMode;
  }): Promise<ClassRegionAccess | undefined>;
  listAdminTeachers(): Promise<AdminTeacherSummary[]>;
  listAdminTeacherRecords(): Promise<AdminTeacherRecord[]>;
  listAdminClasses(): Promise<TeacherClass[]>;
  listAdminClassRecords(): Promise<AdminClassRecord[]>;
  listAdminAuditEvents(): Promise<AdminAuditEvent[]>;
  addAdminTeacher(input: { name: string; email: string; status?: 'active' | 'inactive' }): Promise<AdminTeacherRecord>;
  addAdminClass(input: { name: string; teacherId: string; academicYearTerm: string; code: string }): Promise<AdminClassRecord>;
  generateTeacherCsvExport(rows: TeacherExportRow[]): string;
  labelForClassRegionAccess(access: ClassRegionAccessMode): string;
  labelForTeacherRegionStatus(status: TeacherRegionStatus): string;
  canUseRegionActivity(access: ClassRegionAccessMode, activity: RegionActivityAccess): boolean;
}

export const mockDashboardDataService: DashboardDataService = {
  source: {
    kind: 'mock',
    label: 'Mock local dashboard data',
    readOnly: false,
    detail: 'Local demo data. No Supabase classroom tables are read.',
  },
  listTeacherClasses,
  getTeacherClassDashboard,
  getTeacherClassDashboardForTeacher,
  getTeacherClassRoster,
  getClassRegionSignals,
  getStudentSummaries,
  getStudentEvidence,
  getClassRegionAccess,
  addRosterStudent,
  archiveRosterStudent,
  resetRosterClaim,
  setClassRegionAccess,
  listAdminTeachers,
  listAdminTeacherRecords,
  listAdminClasses,
  listAdminClassRecords,
  listAdminAuditEvents,
  addAdminTeacher,
  addAdminClass,
  generateTeacherCsvExport,
  labelForClassRegionAccess,
  labelForTeacherRegionStatus,
  canUseRegionActivity,
};

type DashboardRuntimeEnv = Parameters<typeof resolveDashboardDataSource>[0] & Parameters<typeof resolveSupabaseConfig>[0];

export function createDashboardDataService(env: DashboardRuntimeEnv = import.meta.env): DashboardDataService {
  const selection = resolveDashboardDataSource(env);
  if (selection.effective === 'supabase') {
    return createSupabaseDashboardDataService({ config: resolveSupabaseConfig(env) });
  }

  if (selection.fallbackReason) {
    return {
      ...mockDashboardDataService,
      source: {
        ...mockDashboardDataService.source,
        detail: selection.fallbackReason,
      },
    };
  }

  return mockDashboardDataService;
}

function activeDashboardDataService(): DashboardDataService {
  return createDashboardDataService();
}

export const dashboardDataService: DashboardDataService = {
  get source() {
    return activeDashboardDataService().source;
  },
  listTeacherClasses: (...args) => activeDashboardDataService().listTeacherClasses(...args),
  getTeacherClassDashboard: (...args) => activeDashboardDataService().getTeacherClassDashboard(...args),
  getTeacherClassDashboardForTeacher: (...args) => activeDashboardDataService().getTeacherClassDashboardForTeacher(...args),
  getTeacherClassRoster: (...args) => activeDashboardDataService().getTeacherClassRoster(...args),
  getClassRegionSignals: (...args) => activeDashboardDataService().getClassRegionSignals(...args),
  getStudentSummaries: (...args) => activeDashboardDataService().getStudentSummaries(...args),
  getStudentEvidence: (...args) => activeDashboardDataService().getStudentEvidence(...args),
  getClassRegionAccess: (...args) => activeDashboardDataService().getClassRegionAccess(...args),
  addRosterStudent: (...args) => activeDashboardDataService().addRosterStudent(...args),
  archiveRosterStudent: (...args) => activeDashboardDataService().archiveRosterStudent(...args),
  resetRosterClaim: (...args) => activeDashboardDataService().resetRosterClaim(...args),
  setClassRegionAccess: (...args) => activeDashboardDataService().setClassRegionAccess(...args),
  listAdminTeachers: (...args) => activeDashboardDataService().listAdminTeachers(...args),
  listAdminTeacherRecords: (...args) => activeDashboardDataService().listAdminTeacherRecords(...args),
  listAdminClasses: (...args) => activeDashboardDataService().listAdminClasses(...args),
  listAdminClassRecords: (...args) => activeDashboardDataService().listAdminClassRecords(...args),
  listAdminAuditEvents: (...args) => activeDashboardDataService().listAdminAuditEvents(...args),
  addAdminTeacher: (...args) => activeDashboardDataService().addAdminTeacher(...args),
  addAdminClass: (...args) => activeDashboardDataService().addAdminClass(...args),
  generateTeacherCsvExport: (...args) => activeDashboardDataService().generateTeacherCsvExport(...args),
  labelForClassRegionAccess: (...args) => activeDashboardDataService().labelForClassRegionAccess(...args),
  labelForTeacherRegionStatus: (...args) => activeDashboardDataService().labelForTeacherRegionStatus(...args),
  canUseRegionActivity: (...args) => activeDashboardDataService().canUseRegionActivity(...args),
};
