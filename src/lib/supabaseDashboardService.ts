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
import { P3_REGION_DEFINITIONS, isValidP3RegionId, type P3RegionId } from './p3SkillContract';
import type { ProgressSnapshotRegionJson, ProgressSnapshotSummaryJson } from './progressSnapshot';
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

interface StudentProgressSnapshotRow {
  id: string;
  class_membership_id: string;
  student_profile_id: string;
  class_id: string;
  snapshot_version: number;
  source: 'local_student_app';
  summary_json: ProgressSnapshotSummaryJson;
  region_summary_json: Partial<Record<P3RegionId, ProgressSnapshotRegionJson>>;
  created_at: string;
}

interface ClassroomRows {
  teachers: TeacherProfileRow[];
  classes: ClassRow[];
  memberships: ClassMembershipRow[];
  regionAccess: ClassRegionAccessRow[];
  progressSnapshots: StudentProgressSnapshotRow[];
}

const classColumns = 'id, organization_id, teacher_id, name, course_code, academic_year_or_term, class_code, status, created_at, updated_at';
const teacherColumns = 'id, user_id, organization_id, display_name, email, status, created_at, updated_at';
const membershipColumns = 'id, class_id, student_profile_id, roster_name, roster_status, claimed_by_user_id, claimed_at, archived_at, created_at, updated_at';
const regionAccessColumns = 'id, class_id, region_id, access_status, updated_by_user_id, updated_at, created_at';
const progressSnapshotColumns = 'id, class_membership_id, student_profile_id, class_id, snapshot_version, source, summary_json, region_summary_json, created_at';

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

function percent(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function latestSnapshotByMembership(snapshots: StudentProgressSnapshotRow[]): Map<string, StudentProgressSnapshotRow> {
  const byMembership = new Map<string, StudentProgressSnapshotRow>();
  for (const snapshot of snapshots) {
    const current = byMembership.get(snapshot.class_membership_id);
    if (!current || Date.parse(snapshot.created_at) > Date.parse(current.created_at)) {
      byMembership.set(snapshot.class_membership_id, snapshot);
    }
  }
  return byMembership;
}

function teacherStatusForRegion(region: ProgressSnapshotRegionJson | undefined): TeacherRegionStatus {
  if (!region || (region.attemptCount === 0 && region.fieldGuideStatus === 'not_started' && region.guardianStatus === 'locked')) return 'not_started';
  if (region.guardianStatus === 'cleared' || region.guardianStatus === 'mastered' || region.rank === 'Gold' || region.rank === 'Mastered') return 'secure';
  if (region.attemptCount > 0 && region.progressRatio < 0.45) return 'needs_help';
  if (region.attemptCount > 0 && region.progressRatio >= 0.7) return 'improving';
  return 'in_progress';
}

function currentFocusRegion(access: ClassRegionAccess[], snapshot?: StudentProgressSnapshotRow): ClassRegionAccess {
  const regionsWithActivity = snapshot
    ? Object.values(snapshot.region_summary_json)
      .filter((region): region is ProgressSnapshotRegionJson => Boolean(region?.lastActivityAt))
      .sort((a, b) => Date.parse(a.lastActivityAt ?? '') - Date.parse(b.lastActivityAt ?? ''))
    : [];
  const latestRegion = regionsWithActivity[regionsWithActivity.length - 1];
  return access.find((item) => item.regionId === latestRegion?.regionId) ?? firstOpenRegion(access);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function lastActivityLabel(lastActivityAt?: string): string {
  if (!lastActivityAt) return 'No hosted progress yet';
  return `Last hosted activity ${lastActivityAt.slice(0, 10)}`;
}

function studentRowsForRoster(roster: TeacherClassRoster, access: ClassRegionAccess[], snapshots: StudentProgressSnapshotRow[]): StudentProgressRow[] {
  const visibleStudents = roster.students.filter((student) => student.status === 'claimed' || student.status === 'active');
  const snapshotsByMembership = latestSnapshotByMembership(snapshots);

  return visibleStudents.map((student) => {
    const snapshot = snapshotsByMembership.get(student.id);
    const focusRegion = currentFocusRegion(access, snapshot);
    const regionCells: StudentRegionProgressCell[] = access.map((regionAccess) => {
      const excluded = regionAccess.access !== 'open';
      const regionSnapshot = isValidP3RegionId(regionAccess.regionId)
        ? snapshot?.region_summary_json[regionAccess.regionId]
        : undefined;
      return {
        regionId: regionAccess.regionId,
        regionName: regionAccess.regionName,
        access: regionAccess.access,
        accessLabel: labelForClassRegionAccess(regionAccess.access),
        excludedFromClassProgress: excluded,
        progressPercent: percent(regionSnapshot?.progressRatio),
        masteryPercent: percent(regionSnapshot?.progressRatio),
        status: teacherStatusForRegion(regionSnapshot),
        attemptsCount: regionSnapshot?.attemptCount ?? 0,
        averageSelfMarkPercent: regionSnapshot ? percent(regionSnapshot.progressRatio) : undefined,
        guardianEligible: regionSnapshot?.guardianStatus === 'ready' || regionSnapshot?.guardianStatus === 'attempted',
        lastEvidenceAt: regionSnapshot?.lastActivityAt,
        warning: excluded && regionSnapshot && (regionSnapshot.attemptCount > 0 || regionSnapshot.fieldGuideStatus !== 'not_started' || regionSnapshot.guardianStatus !== 'locked')
          ? 'Existing progress from a currently Field Guide only region.'
          : undefined,
      };
    });
    const openProgress = regionCells.filter((cell) => !cell.excludedFromClassProgress).map((cell) => cell.progressPercent);
    const guardianEligibleRegionCount = regionCells.filter((cell) => cell.guardianEligible).length;

    return {
      id: student.id,
      displayName: student.displayName,
      classId: roster.classId,
      overallProgressPercent: average(openProgress),
      currentFocusRegionId: focusRegion.regionId,
      currentFocusRegionName: focusRegion.regionName,
      regionCells,
      lastActivityAt: snapshot?.summary_json.lastActivityAt,
      lastActivityLabel: lastActivityLabel(snapshot?.summary_json.lastActivityAt),
      attemptsCount: snapshot?.summary_json.attemptCount ?? 0,
      repeatedLowSelfMarkCount: 0,
      guardianEligibleRegionCount,
      notes: snapshot ? ['Hosted progress summary read from latest bounded snapshot.'] : ['No hosted progress snapshot has been synced for this student yet.'],
      warnings: regionCells.flatMap((cell) => cell.warning ? [cell.warning] : []),
    };
  });
}

function progressSummaryFor(rows: StudentProgressRow[], access: ClassRegionAccess[]): ClassProgressSummary {
  const openRegionCount = access.filter((item) => item.access === 'open').length;
  const lockedRegionCount = access.length - openRegionCount;
  const activeRows = rows.filter((row) => Boolean(row.lastActivityAt));
  return {
    studentCount: rows.length,
    overallProgressPercent: average(rows.map((row) => row.overallProgressPercent)),
    averageMasteryPercent: average(rows.flatMap((row) => row.regionCells.filter((cell) => !cell.excludedFromClassProgress).map((cell) => cell.masteryPercent))),
    activeStudentCount: activeRows.length,
    inactiveStudentCount: rows.length - activeRows.length,
    studentsNeedingHelpCount: rows.filter((row) => row.regionCells.some((cell) => cell.status === 'needs_help')).length,
    guardianEligibleCount: rows.filter((row) => row.guardianEligibleRegionCount > 0).length,
    totalAttempts: rows.reduce((sum, row) => sum + row.attemptsCount, 0),
    openRegionCount,
    lockedRegionCount,
    excludedLockedRegionCount: lockedRegionCount,
  };
}

function regionSummariesFor(access: ClassRegionAccess[], rows: StudentProgressRow[]): RegionProgressSummary[] {
  return access.map((item) => ({
    regionId: item.regionId,
    regionName: item.regionName,
    access: item.access,
    accessLabel: labelForClassRegionAccess(item.access),
    excludedFromClassProgress: item.access !== 'open',
    averageProgressPercent: average(rows.map((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.progressPercent ?? 0)),
    averageMasteryPercent: average(rows.map((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.masteryPercent ?? 0)),
    studentsNeedingHelpCount: rows.filter((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'needs_help').length,
    studentsSecureCount: rows.filter((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'secure').length,
    noRecentEvidenceCount: rows.filter((row) => !row.regionCells.find((cell) => cell.regionId === item.regionId)?.lastEvidenceAt).length,
    guardianEligibleCount: rows.filter((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.guardianEligible).length,
    status: rows.some((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'needs_help')
      ? 'needs_help'
      : rows.some((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'secure')
        ? 'secure'
        : rows.some((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'in_progress' || row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'improving')
          ? 'in_progress'
          : 'not_started',
  }));
}

function focusItemsFor(rows: StudentProgressRow[], roster: TeacherClassRoster): FocusThisWeekItem[] {
  const unclaimed = roster.students.filter((student) => student.status === 'unclaimed');
  const unsynced = rows.filter((row) => !row.lastActivityAt);
  const needsHelp = rows.filter((row) => row.regionCells.some((cell) => cell.status === 'needs_help'));
  const items: FocusThisWeekItem[] = [];

  if (needsHelp.length > 0) {
    items.push({
      id: `${roster.classId}-hosted-needs-help`,
      type: 'repeated_low_scores',
      title: 'Low recent self-mark summaries',
      summary: `${needsHelp.length} student${needsHelp.length === 1 ? '' : 's'} have a hosted region summary below 45%.`,
      studentIds: needsHelp.map((row) => row.id),
      suggestedAction: 'Check in during the next face-to-face practice block and compare against the mark scheme.',
      priority: 1,
    });
  }

  if (unsynced.length > 0) {
    items.push({
      id: `${roster.classId}-hosted-unsynced`,
      type: 'inactive_students',
      title: 'No hosted snapshot yet',
      summary: `${unsynced.length} claimed student${unsynced.length === 1 ? ' has' : 's have'} not synced a teacher-visible progress summary yet.`,
      studentIds: unsynced.map((row) => row.id),
      suggestedAction: 'Ask students to complete a Field Guide, Quick Check, Warm-Up, or save an attempt.',
      priority: 2,
    });
  }

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
    evidenceCount: row.attemptsCount,
    recommendedNextStep: row.guardianEligibleRegionCount > 0
      ? 'ready_for_guardian'
      : row.attemptsCount > 0
        ? 'ready_for_exam_training'
        : 'needs_field_guide',
  }));
}

function regionSignalsFor(access: ClassRegionAccess[], rows: StudentProgressRow[]): RegionLearningSignal[] {
  return access.map((item) => ({
    regionId: item.regionId,
    regionName: item.regionName,
    readinessState: rows.some((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.guardianEligible)
      ? 'ready_for_guardian'
      : rows.some((row) => (row.regionCells.find((cell) => cell.regionId === item.regionId)?.attemptsCount ?? 0) > 0)
        ? 'ready_for_exam_training'
        : 'needs_field_guide',
    studentsNeedingFieldGuide: rows.filter((row) => (row.regionCells.find((cell) => cell.regionId === item.regionId)?.attemptsCount ?? 0) === 0).map((row) => row.id),
    studentsNeedingQuickCheck: [],
    studentsNeedingWarmUp: [],
    studentsReadyForExamTraining: rows.filter((row) => (row.regionCells.find((cell) => cell.regionId === item.regionId)?.attemptsCount ?? 0) > 0).map((row) => row.id),
    studentsNeedingTeacherReview: rows.filter((row) => row.regionCells.find((cell) => cell.regionId === item.regionId)?.status === 'needs_help').map((row) => row.id),
    evidenceCount: rows.reduce((sum, row) => sum + (row.regionCells.find((cell) => cell.regionId === item.regionId)?.attemptsCount ?? 0), 0),
  }));
}

function weeklySummaryFor(classRow: ClassRow, rows: StudentProgressRow[], focusItems: FocusThisWeekItem[]): WeeklyClassSummary {
  const activeRows = rows.filter((row) => row.lastActivityAt);
  return {
    className: classRow.name,
    dateRange: 'Latest hosted snapshots',
    classOverallProgressPercent: average(rows.map((row) => row.overallProgressPercent)),
    topFocusRegions: [],
    studentsNeedingAttention: rows
      .filter((row) => row.regionCells.some((cell) => cell.status === 'needs_help'))
      .map((row) => ({ studentId: row.id, displayName: row.displayName, reason: 'Low hosted self-mark summary in at least one region.' })),
    studentsDoingWell: activeRows
      .filter((row) => row.overallProgressPercent >= 70 || row.guardianEligibleRegionCount > 0)
      .map((row) => ({ studentId: row.id, displayName: row.displayName, reason: 'Hosted summary shows secure progress or Guardian readiness.' })),
    suggestedTeacherActions: focusItems.map((item) => item.suggestedAction),
    exportDownloadText: 'CSV export uses latest hosted bounded progress snapshots. Raw learner work remains local.',
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
      overallProgressPercent: row.overallProgressPercent,
      currentFocusRegion: row.currentFocusRegionName,
      lastActivity: row.lastActivityAt ?? 'No hosted progress yet',
      attemptsCount: row.attemptsCount,
      guardianEligibilitySummary: `${row.guardianEligibleRegionCount} region(s)`,
      notesWarnings: [...row.notes, ...row.warnings].join('; '),
    };

    for (const cell of row.regionCells) {
      base[`${cell.regionName} progress`] = `${cell.progressPercent}%`;
      base[`${cell.regionName} status`] = cell.status.replace(/_/g, ' ');
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
  const studentRows = studentRowsForRoster(
    roster,
    regionAccess,
    rows.progressSnapshots.filter((snapshot) => snapshot.class_id === classRow.id),
  );
  const focusThisWeek = focusItemsFor(studentRows, roster);

  return {
    class: toTeacherClass(classRow),
    lastUpdatedAt: now,
    progressSummary: progressSummaryFor(studentRows, regionAccess),
    regionSummaries: regionSummariesFor(regionAccess, studentRows),
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
        progressSnapshots: [],
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
        progressSnapshots: [],
      };
    }

    const [memberships, regionAccess, progressSnapshots] = await Promise.all([
      readRows(client.from<ClassMembershipRow>('class_memberships').select(membershipColumns).in('class_id', classIds).order('roster_name', { ascending: true }), 'class_memberships'),
      readRows(client.from<ClassRegionAccessRow>('class_region_access').select(regionAccessColumns).in('class_id', classIds).order('region_id', { ascending: true }), 'class_region_access'),
      readRows(client.from<StudentProgressSnapshotRow>('student_progress_snapshots').select(progressSnapshotColumns).in('class_id', classIds).order('created_at', { ascending: false }), 'student_progress_snapshots'),
    ]);

    return {
      teachers,
      classes,
      memberships,
      regionAccess,
      progressSnapshots,
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
