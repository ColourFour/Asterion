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

export type DashboardSourceKind = 'mock';

export type RegionActivityAccess = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'guardian' | 'mastery_progression';

export interface DashboardDataService {
  readonly source: {
    kind: DashboardSourceKind;
    label: string;
  };
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

export const dashboardDataService: DashboardDataService = mockDashboardDataService;
