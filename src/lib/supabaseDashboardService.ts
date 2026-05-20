import type {
  AdminAuditEvent,
  AdminClassRecord,
  AdminTeacherRecord,
  AdminTeacherSummary,
  ClassCodeRecord,
  ClassProgressSummary,
  ClassRegionAccess,
  ClassRegionAccessMode,
  ClassRosterStudent,
  EvidenceReference,
  FocusThisWeekItem,
  RegionLearningSignal,
  RegionProgressSummary,
  StudentProgressRow,
  StudentRegionProgressCell,
  StudentSummary,
  TeacherActionCard,
  TeacherClass,
  TeacherClassDashboard,
  TeacherClassRoster,
  TeacherExportRow,
  TeacherRegionStatus,
  WeeklyClassSummary,
} from '../types';
import type { DashboardDataService } from './dashboardDataService';
import {
  canUseRegionActivity,
  generateTeacherCsvExport,
  labelForClassRegionAccess,
  labelForTeacherRegionStatus,
} from './dashboardMockService';
import { DashboardDataServiceError } from './dashboardServiceErrors';
import { P3_REGION_DEFINITIONS, isValidP3RegionId } from './p3SkillContract';
import { createSupabaseBrowserClient } from './supabaseClient';
import { supabaseConfig, type SupabaseConfig } from './supabaseConfig';

interface SupabaseAuthSession {
  user?: {
    id?: string;
    email?: string;
  };
}

interface SupabaseAuthClient {
  getSession(): Promise<{ data?: { session?: SupabaseAuthSession | null } | null; error?: unknown }>;
}

interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: unknown;
}

interface SupabaseRpcResult<T> {
  data: T[] | T | null;
  error: unknown;
}

export interface SupabaseQueryBuilder<T = Record<string, unknown>> extends PromiseLike<SupabaseQueryResult<T>> {
  select(columns: string): SupabaseQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
  in(column: string, values: unknown[]): SupabaseQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder<T>;
}

export interface SupabaseDashboardClient {
  auth: SupabaseAuthClient;
  from<T = Record<string, unknown>>(table: string): SupabaseQueryBuilder<T>;
  rpc<T = Record<string, unknown>>(fn: string, args?: Record<string, unknown>): Promise<SupabaseRpcResult<T>>;
}

interface SupabaseDashboardServiceOptions {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseDashboardClient | undefined>;
  now?: () => string;
}

interface TeacherProfileRow {
  id: string;
  user_id: string;
  organization_id: string;
  display_name: string;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ClassRow {
  id: string;
  organization_id: string;
  teacher_id: string;
  name: string;
  course_code: string;
  academic_year_or_term: string | null;
  class_code: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ClassMembershipRow {
  id: string;
  class_id: string;
  student_profile_id: string;
  roster_name: string;
  roster_status: 'unclaimed' | 'claimed' | 'archived';
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ClassRegionAccessRow {
  id: string;
  class_id: string;
  region_id: string;
  access_status: 'open' | 'field_guide_only';
  updated_by_user_id: string | null;
  updated_at: string;
  created_at: string;
}

interface ClassroomRows {
  teachers: TeacherProfileRow[];
  classes: ClassRow[];
  memberships: ClassMembershipRow[];
  regionAccess: ClassRegionAccessRow[];
}

const classColumns = 'id, organization_id, teacher_id, name, course_code, academic_year_or_term, class_code, status, created_at, updated_at';
const teacherColumns = 'id, user_id, organization_id, display_name, email, status, created_at, updated_at';
const membershipColumns = 'id, class_id, student_profile_id, roster_name, roster_status, claimed_by_user_id, claimed_at, archived_at, created_at, updated_at';
const regionAccessColumns = 'id, class_id, region_id, access_status, updated_by_user_id, updated_at, created_at';

function queryErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Supabase dashboard data could not be read.';
}

async function readRows<T>(query: PromiseLike<SupabaseQueryResult<T>>, context: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    throw new DashboardDataServiceError('read_failed', `${context}: ${queryErrorMessage(error)}`, error);
  }
  return data ?? [];
}

async function readRpcSingle<T>(rpc: Promise<SupabaseRpcResult<T>>, context: string): Promise<T> {
  const { data, error } = await rpc;
  if (error) {
    throw new DashboardDataServiceError('write_failed', `${context}: ${queryErrorMessage(error)}`, error);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new DashboardDataServiceError('write_failed', `${context}: Supabase RPC returned no row.`);
  }
  return row;
}

function classCodeFor(row: ClassRow): ClassCodeRecord {
  return {
    id: `code-${row.id}`,
    classId: row.id,
    code: row.class_code,
    status: row.status === 'archived' ? 'retired' : 'active',
    createdAt: row.created_at,
    retiredAt: row.status === 'archived' ? row.updated_at : undefined,
  };
}

function toTeacherClass(row: ClassRow): TeacherClass {
  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacher_id,
    joinCode: row.class_code,
    focus: 'CAIE 9709 P3',
    academicYearTerm: row.academic_year_or_term ?? undefined,
    archivedAt: row.status === 'archived' ? row.updated_at : undefined,
    createdAt: row.created_at,
  };
}

function mapAccessRow(row: ClassRegionAccessRow): ClassRegionAccess | undefined {
  if (!isValidP3RegionId(row.region_id)) return undefined;
  const region = P3_REGION_DEFINITIONS.find((item) => item.id === row.region_id);
  if (!region) return undefined;
  const access: ClassRegionAccessMode = row.access_status === 'open' ? 'open' : 'field_guide_only';
  return {
    regionId: region.id,
    regionName: region.name,
    access,
    openedAt: access === 'open' ? row.updated_at : undefined,
    lockedAt: access === 'field_guide_only' ? row.updated_at : undefined,
    updatedByRole: 'teacher',
    updatedAt: row.updated_at,
  };
}

function regionAccessForClass(classId: string, accessRows: ClassRegionAccessRow[]): ClassRegionAccess[] {
  const byRegion = new Map(
    accessRows
      .filter((row) => row.class_id === classId)
      .map((row) => {
        const mapped = mapAccessRow(row);
        return mapped ? [mapped.regionId, mapped] : undefined;
      })
      .filter((item): item is [string, ClassRegionAccess] => Boolean(item)),
  );

  return P3_REGION_DEFINITIONS.map((region) => (
    byRegion.get(region.id) ?? {
      regionId: region.id,
      regionName: region.name,
      access: 'field_guide_only',
      lockedAt: undefined,
      updatedByRole: 'teacher',
      updatedAt: new Date(0).toISOString(),
    }
  ));
}

function rosterStudentFromMembership(row: ClassMembershipRow): ClassRosterStudent {
  return {
    id: row.id,
    classId: row.class_id,
    displayName: row.roster_name,
    status: row.roster_status,
    claimedAt: row.claimed_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rosterForClass(classRow: ClassRow, memberships: ClassMembershipRow[]): TeacherClassRoster {
  return {
    classId: classRow.id,
    className: classRow.name,
    teacherId: classRow.teacher_id,
    classCode: classCodeFor(classRow),
    students: memberships
      .filter((row) => row.class_id === classRow.id)
      .map(rosterStudentFromMembership),
  };
}

function firstOpenRegion(access: ClassRegionAccess[]): ClassRegionAccess {
  return access.find((item) => item.access === 'open') ?? access[0];
}

function studentRowsForRoster(roster: TeacherClassRoster, access: ClassRegionAccess[]): StudentProgressRow[] {
  const visibleStudents = roster.students.filter((student) => student.status === 'claimed' || student.status === 'active');
  const focusRegion = firstOpenRegion(access);

  return visibleStudents.map((student) => {
    const regionCells: StudentRegionProgressCell[] = access.map((regionAccess) => {
      const excluded = regionAccess.access !== 'open';
      return {
        regionId: regionAccess.regionId,
        regionName: regionAccess.regionName,
        access: regionAccess.access,
        accessLabel: labelForClassRegionAccess(regionAccess.access),
        excludedFromClassProgress: excluded,
        progressPercent: 0,
        masteryPercent: 0,
        status: 'not_started',
        attemptsCount: 0,
        guardianEligible: false,
      };
    });

    return {
      id: student.id,
      displayName: student.displayName,
      classId: roster.classId,
      overallProgressPercent: 0,
      currentFocusRegionId: focusRegion.regionId,
      currentFocusRegionName: focusRegion.regionName,
      regionCells,
      lastActivityLabel: 'No hosted progress read',
      attemptsCount: 0,
      repeatedLowSelfMarkCount: 0,
      guardianEligibleRegionCount: 0,
      notes: ['Roster is Supabase-backed; progress snapshots are not read in this pass.'],
      warnings: [],
    };
  });
}

function progressSummaryFor(rows: StudentProgressRow[], access: ClassRegionAccess[]): ClassProgressSummary {
  const openRegionCount = access.filter((item) => item.access === 'open').length;
  const lockedRegionCount = access.length - openRegionCount;
  return {
    studentCount: rows.length,
    overallProgressPercent: 0,
    averageMasteryPercent: 0,
    activeStudentCount: 0,
    inactiveStudentCount: rows.length,
    studentsNeedingHelpCount: 0,
    guardianEligibleCount: 0,
    totalAttempts: 0,
    openRegionCount,
    lockedRegionCount,
    excludedLockedRegionCount: lockedRegionCount,
  };
}

function regionSummariesFor(access: ClassRegionAccess[]): RegionProgressSummary[] {
  return access.map((item) => ({
    regionId: item.regionId,
    regionName: item.regionName,
    access: item.access,
    accessLabel: labelForClassRegionAccess(item.access),
    excludedFromClassProgress: item.access !== 'open',
    averageProgressPercent: 0,
    averageMasteryPercent: 0,
    studentsNeedingHelpCount: 0,
    studentsSecureCount: 0,
    noRecentEvidenceCount: 0,
    guardianEligibleCount: 0,
    status: 'not_started',
  }));
}

function focusItemsFor(rows: StudentProgressRow[], roster: TeacherClassRoster): FocusThisWeekItem[] {
  const unclaimed = roster.students.filter((student) => student.status === 'unclaimed');
  const items: FocusThisWeekItem[] = [
    {
      id: `${roster.classId}-hosted-progress-not-read`,
      type: 'inactive_students',
      title: 'Progress sync not connected',
      summary: 'Supabase mode is reading classroom setup only. No progress snapshots are read or used for recommendations in this pass.',
      studentIds: rows.map((row) => row.id),
      suggestedAction: 'Use this view to verify class, roster, and region setup only.',
      priority: 1,
    },
  ];

  if (unclaimed.length > 0) {
    items.push({
      id: `${roster.classId}-unclaimed-roster`,
      type: 'inactive_students',
      title: 'Unclaimed roster slots',
      summary: `${unclaimed.length} roster ${unclaimed.length === 1 ? 'entry is' : 'entries are'} not claimed.`,
      studentIds: unclaimed.map((student) => student.id),
      suggestedAction: 'Ask students to claim existing roster names before using this as an operational dashboard.',
      priority: 2,
    });
  }

  return items;
}

function studentSummariesFor(rows: StudentProgressRow[]): StudentSummary[] {
  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    classId: row.classId,
    currentRegionId: row.currentFocusRegionId,
    lastActivityAt: row.lastActivityAt ?? '',
    evidenceCount: 0,
    recommendedNextStep: 'needs_field_guide',
  }));
}

function regionSignalsFor(access: ClassRegionAccess[], rows: StudentProgressRow[]): RegionLearningSignal[] {
  const studentIds = rows.map((row) => row.id);
  return access.map((item) => ({
    regionId: item.regionId,
    regionName: item.regionName,
    readinessState: 'needs_field_guide',
    studentsNeedingFieldGuide: studentIds,
    studentsNeedingQuickCheck: [],
    studentsNeedingWarmUp: [],
    studentsReadyForExamTraining: [],
    studentsNeedingTeacherReview: [],
    evidenceCount: 0,
  }));
}

function weeklySummaryFor(classRow: ClassRow, rows: StudentProgressRow[], focusItems: FocusThisWeekItem[]): WeeklyClassSummary {
  return {
    className: classRow.name,
    dateRange: 'Hosted setup only',
    classOverallProgressPercent: 0,
    topFocusRegions: [],
    studentsNeedingAttention: [],
    studentsDoingWell: [],
    suggestedTeacherActions: focusItems.map((item) => item.suggestedAction),
    exportDownloadText: 'CSV export includes Supabase roster setup only; no hosted progress snapshots are read.',
  };
}

function exportRowsFor(classRow: ClassRow, teacher: TeacherProfileRow | undefined, rows: StudentProgressRow[], roster: TeacherClassRoster): TeacherExportRow[] {
  return rows.map((row) => {
    const rosterStudent = roster.students.find((student) => student.id === row.id);
    const base: TeacherExportRow = {
      className: classRow.name,
      classCode: classRow.class_code,
      teacherName: teacher?.display_name ?? classRow.teacher_id,
      studentName: row.displayName,
      rosterStatus: rosterStudent?.status ?? 'claimed',
      overallProgressPercent: 0,
      currentFocusRegion: row.currentFocusRegionName,
      lastActivity: 'No hosted progress read',
      attemptsCount: 0,
      guardianEligibilitySummary: '0 region(s)',
      notesWarnings: row.notes.join('; '),
    };

    for (const cell of row.regionCells) {
      base[`${cell.regionName} progress`] = '0%';
      base[`${cell.regionName} status`] = 'Not started';
      base[`${cell.regionName} access`] = cell.access === 'open' ? 'open' : 'Field Guide only';
      base[`${cell.regionName} excluded from class progress`] = cell.excludedFromClassProgress ? 'yes' : 'no';
    }

    return base;
  });
}

function actionCardsFor(_classId: string): TeacherActionCard[] {
  return [];
}

function dashboardFromRows(rows: ClassroomRows, classId: string, now: string): TeacherClassDashboard {
  const classRow = rows.classes.find((item) => item.id === classId);
  if (!classRow) {
    throw new DashboardDataServiceError('not_found', 'The requested Supabase class was not found or is not visible to this session.');
  }

  const teacher = rows.teachers.find((item) => item.id === classRow.teacher_id);
  const regionAccess = regionAccessForClass(classRow.id, rows.regionAccess);
  const roster = rosterForClass(classRow, rows.memberships);
  const studentRows = studentRowsForRoster(roster, regionAccess);
  const focusThisWeek = focusItemsFor(studentRows, roster);

  return {
    class: toTeacherClass(classRow),
    lastUpdatedAt: now,
    progressSummary: progressSummaryFor(studentRows, regionAccess),
    regionSummaries: regionSummariesFor(regionAccess),
    studentRows,
    focusThisWeek,
    weeklySummary: weeklySummaryFor(classRow, studentRows, focusThisWeek),
    exportRows: exportRowsFor(classRow, teacher, studentRows, roster),
    actionCards: actionCardsFor(classRow.id),
    regionSignals: regionSignalsFor(regionAccess, studentRows),
    studentSummaries: studentSummariesFor(studentRows),
    roster,
    classCode: classCodeFor(classRow),
    regionAccess,
  };
}

function adminClassFromRows(classRow: ClassRow, rows: ClassroomRows): AdminClassRecord {
  const memberships = rows.memberships.filter((item) => item.class_id === classRow.id);
  return {
    id: classRow.id,
    name: classRow.name,
    teacherId: classRow.teacher_id,
    focus: 'CAIE 9709 P3',
    academicYearTerm: classRow.academic_year_or_term ?? '',
    status: classRow.status,
    classCode: classCodeFor(classRow),
    rosterStudentIds: memberships.map((item) => item.id),
    regionAccess: regionAccessForClass(classRow.id, rows.regionAccess),
    createdAt: classRow.created_at,
    updatedAt: classRow.updated_at,
    archivedAt: classRow.status === 'archived' ? classRow.updated_at : undefined,
  };
}

function adminTeacherFromRows(teacher: TeacherProfileRow, classes: ClassRow[]): AdminTeacherRecord {
  return {
    id: teacher.id,
    name: teacher.display_name,
    email: teacher.email ?? '',
    assignedClassIds: classes.filter((item) => item.teacher_id === teacher.id).map((item) => item.id),
    status: teacher.status,
    createdAt: teacher.created_at,
    updatedAt: teacher.updated_at,
  };
}

export function createSupabaseDashboardDataService(options: SupabaseDashboardServiceOptions = {}): DashboardDataService {
  const config = options.config ?? supabaseConfig;
  const now = options.now ?? (() => new Date().toISOString());
  const createClient = options.createClient ?? (async () => (
    await createSupabaseBrowserClient(config, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }) as SupabaseDashboardClient | undefined
  ));

  async function requireClient(): Promise<SupabaseDashboardClient> {
    if (config.missing.length > 0) {
      throw new DashboardDataServiceError('config_missing', 'Supabase dashboard mode is enabled, but browser-safe Supabase config is missing.');
    }
    if (!config.isConfigured) {
      throw new DashboardDataServiceError('config_invalid', 'Supabase dashboard mode is enabled, but browser-safe Supabase config is invalid.');
    }

    const client = await createClient();
    if (!client) {
      throw new DashboardDataServiceError('supabase_unavailable', 'Supabase dashboard mode is enabled, but the browser client could not be created.');
    }

    const sessionResult = await client.auth.getSession();
    if (sessionResult.error) {
      throw new DashboardDataServiceError('auth_required', `Supabase Auth session could not be verified: ${queryErrorMessage(sessionResult.error)}`, sessionResult.error);
    }
    if (!sessionResult.data?.session) {
      throw new DashboardDataServiceError('auth_required', 'Supabase dashboard data requires a signed-in Supabase session. Mock data is not shown in Supabase mode.');
    }

    return client;
  }

  async function readClassroomRows(classId?: string): Promise<ClassroomRows> {
    const client = await requireClient();
    let classesQuery = client.from<ClassRow>('classes').select(classColumns).order('name', { ascending: true });
    if (classId) classesQuery = classesQuery.eq('id', classId);
    const classes = await readRows(classesQuery, 'classes');
    const classIds = classes.map((row) => row.id);
    const teacherIds = Array.from(new Set(classes.map((row) => row.teacher_id)));

    if (classId && classIds.length === 0) {
      return {
        teachers: [],
        classes,
        memberships: [],
        regionAccess: [],
      };
    }

    const teachers = teacherIds.length
      ? await readRows(client.from<TeacherProfileRow>('teacher_profiles').select(teacherColumns).in('id', teacherIds).order('display_name', { ascending: true }), 'teacher_profiles')
      : await readRows(client.from<TeacherProfileRow>('teacher_profiles').select(teacherColumns).order('display_name', { ascending: true }), 'teacher_profiles');

    if (classIds.length === 0) {
      return {
        teachers,
        classes,
        memberships: [],
        regionAccess: [],
      };
    }

    const [memberships, regionAccess] = await Promise.all([
      readRows(client.from<ClassMembershipRow>('class_memberships').select(membershipColumns).in('class_id', classIds).order('roster_name', { ascending: true }), 'class_memberships'),
      readRows(client.from<ClassRegionAccessRow>('class_region_access').select(regionAccessColumns).in('class_id', classIds).order('region_id', { ascending: true }), 'class_region_access'),
    ]);

    return {
      teachers,
      classes,
      memberships,
      regionAccess,
    };
  }

  async function listTeacherClasses(teacherId?: string): Promise<TeacherClass[]> {
    const rows = await readClassroomRows();
    return rows.classes
      .filter((item) => item.status === 'active')
      .filter((item) => !teacherId || item.teacher_id === teacherId)
      .map(toTeacherClass);
  }

  async function getTeacherClassDashboard(classId: string): Promise<TeacherClassDashboard> {
    return dashboardFromRows(await readClassroomRows(classId), classId, now());
  }

  async function getTeacherClassDashboardForTeacher(teacherId: string, classId: string): Promise<TeacherClassDashboard | undefined> {
    const rows = await readClassroomRows(classId);
    const classRow = rows.classes.find((item) => item.id === classId && item.teacher_id === teacherId && item.status === 'active');
    return classRow ? dashboardFromRows(rows, classRow.id, now()) : undefined;
  }

  async function getTeacherClassRoster(teacherId: string, classId: string): Promise<TeacherClassRoster | undefined> {
    const rows = await readClassroomRows(classId);
    const classRow = rows.classes.find((item) => item.id === classId && item.teacher_id === teacherId && item.status === 'active');
    return classRow ? rosterForClass(classRow, rows.memberships) : undefined;
  }

  async function getClassRegionSignals(classId: string): Promise<RegionLearningSignal[]> {
    return (await getTeacherClassDashboard(classId)).regionSignals;
  }

  async function getStudentSummaries(classId: string): Promise<StudentSummary[]> {
    return (await getTeacherClassDashboard(classId)).studentSummaries;
  }

  async function getStudentEvidence(_studentId: string): Promise<EvidenceReference[]> {
    await requireClient();
    return [];
  }

  async function listAdminTeacherRecords(): Promise<AdminTeacherRecord[]> {
    const rows = await readClassroomRows();
    return rows.teachers.map((teacher) => adminTeacherFromRows(teacher, rows.classes));
  }

  async function listAdminTeachers(): Promise<AdminTeacherSummary[]> {
    const rows = await readClassroomRows();
    return rows.teachers.map((teacher) => ({
      id: teacher.id,
      displayName: teacher.display_name,
      email: teacher.email ?? '',
      classCount: rows.classes.filter((item) => item.teacher_id === teacher.id && item.status === 'active').length,
      lastActivityAt: teacher.updated_at,
      status: teacher.status,
    }));
  }

  async function listAdminClasses(): Promise<TeacherClass[]> {
    const rows = await readClassroomRows();
    return rows.classes.map(toTeacherClass);
  }

  async function listAdminClassRecords(): Promise<AdminClassRecord[]> {
    const rows = await readClassroomRows();
    return rows.classes.map((classRow) => adminClassFromRows(classRow, rows));
  }

  async function listAdminAuditEvents(): Promise<AdminAuditEvent[]> {
    await requireClient();
    return [];
  }

  async function addAdminTeacher(input: { name: string; email: string; status?: 'active' | 'inactive'; organizationId?: string }): Promise<AdminTeacherRecord> {
    const client = await requireClient();
    const teacher = await readRpcSingle<TeacherProfileRow>(
      client.rpc('admin_add_teacher_by_email', {
        p_email: input.email,
        p_display_name: input.name,
        p_organization_id: input.organizationId ?? null,
      }),
      'admin_add_teacher_by_email',
    );
    const rows = await readClassroomRows();
    return adminTeacherFromRows(teacher, rows.classes);
  }

  async function addAdminClass(input: { name: string; teacherId: string; academicYearTerm: string; code?: string }): Promise<AdminClassRecord> {
    const client = await requireClient();
    const classRow = await readRpcSingle<ClassRow>(
      client.rpc('create_class_with_region_access', {
        p_teacher_id: input.teacherId,
        p_name: input.name,
        p_academic_year_or_term: input.academicYearTerm,
        p_class_code: input.code?.trim() ? input.code : null,
      }),
      'create_class_with_region_access',
    );
    const rows = await readClassroomRows(classRow.id);
    return adminClassFromRows(classRow, rows);
  }

  async function setClassRegionAccess(input: {
    actorRole: 'admin' | 'teacher';
    actorTeacherId?: string;
    classId: string;
    regionId: string;
    access: ClassRegionAccessMode;
  }): Promise<ClassRegionAccess | undefined> {
    if (!isValidP3RegionId(input.regionId)) return undefined;
    const client = await requireClient();
    const row = await readRpcSingle<ClassRegionAccessRow>(
      client.rpc('set_class_region_access', {
        p_class_id: input.classId,
        p_region_id: input.regionId,
        p_access_status: input.access,
      }),
      'set_class_region_access',
    );
    return mapAccessRow(row);
  }

  async function addRosterStudent(_teacherId: string, classId: string, displayName: string): Promise<ClassRosterStudent | undefined> {
    const trimmedName = displayName.trim();
    if (!trimmedName) return undefined;
    const client = await requireClient();
    const row = await readRpcSingle<ClassMembershipRow>(
      client.rpc('add_class_roster_student', {
        p_class_id: classId,
        p_roster_name: trimmedName,
      }),
      'add_class_roster_student',
    );
    return rosterStudentFromMembership(row);
  }

  async function archiveRosterStudent(_teacherId: string, _classId: string, rosterStudentId: string): Promise<ClassRosterStudent | undefined> {
    const client = await requireClient();
    const row = await readRpcSingle<ClassMembershipRow>(
      client.rpc('archive_class_roster_student', {
        p_membership_id: rosterStudentId,
      }),
      'archive_class_roster_student',
    );
    return rosterStudentFromMembership(row);
  }

  async function resetRosterClaim(input: {
    actorRole: 'admin' | 'teacher';
    actorTeacherId?: string;
    classId: string;
    rosterStudentId: string;
  }): Promise<ClassRosterStudent | undefined> {
    const client = await requireClient();
    const row = await readRpcSingle<ClassMembershipRow>(
      client.rpc('reset_class_roster_claim', {
        p_membership_id: input.rosterStudentId,
      }),
      'reset_class_roster_claim',
    );
    return rosterStudentFromMembership(row);
  }

  return {
    source: {
      kind: 'supabase',
      label: 'Supabase classroom setup data',
      readOnly: false,
      detail: 'Auth required. Teacher attachment, class creation, roster management, and region access writes use Supabase RPCs.',
    },
    listTeacherClasses,
    getTeacherClassDashboard,
    getTeacherClassDashboardForTeacher,
    getTeacherClassRoster,
    getClassRegionSignals,
    getStudentSummaries,
    getStudentEvidence,
    getClassRegionAccess: () => [],
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
}
