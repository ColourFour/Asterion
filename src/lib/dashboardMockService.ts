import {
  P3_REGION_DEFINITIONS,
  isValidP3RegionId,
  type P3RegionId,
} from './p3SkillContract';
import type {
  AdminAuditEvent,
  AdminTeacherSummary,
  ClassProgressSummary,
  EvidenceReference,
  FocusThisWeekItem,
  RecommendedNextStep,
  RegionLearningSignal,
  RegionProgressSummary,
  StudentProgressRow,
  StudentRegionProgressCell,
  StudentSummary,
  TeacherActionCard,
  TeacherClass,
  TeacherClassDashboard,
  TeacherExportRow,
  TeacherRegionStatus,
  WeeklyClassSummary,
} from '../types';

const now = '2026-05-15T09:20:00.000Z';
const inactiveAfterDays = 7;

const classes: TeacherClass[] = [
  {
    id: 'class-p3-alpha',
    name: 'P3 Alpha',
    teacherId: 'teacher-hypatia',
    joinCode: 'AST-P3A',
    createdAt: '2026-04-20T08:00:00.000Z',
  },
  {
    id: 'class-p3-beta',
    name: 'P3 Beta',
    teacherId: 'teacher-hypatia',
    joinCode: 'AST-P3B',
    createdAt: '2026-04-22T08:00:00.000Z',
  },
];

interface StudentRegionSeed {
  progress: number;
  mastery: number;
  attempts: number;
  selfMark?: number;
  guardian?: boolean;
  lastEvidenceAt?: string;
}

interface StudentSeed {
  id: string;
  displayName: string;
  classId: string;
  regions: Partial<Record<P3RegionId, StudentRegionSeed>>;
}

const regionIds = P3_REGION_DEFINITIONS.map((region) => region.id);
const regionNameById = Object.fromEntries(P3_REGION_DEFINITIONS.map((region) => [region.id, region.name]));

const alphaStudents: StudentSeed[] = [
  {
    id: 'student-ada',
    displayName: 'Ada L.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 72, mastery: 64, attempts: 8, selfMark: 58, lastEvidenceAt: '2026-05-15T08:52:00.000Z' },
      'logarithm-grove': { progress: 45, mastery: 40, attempts: 4, selfMark: 42, lastEvidenceAt: '2026-05-12T10:18:00.000Z' },
      'trig-observatory': { progress: 26, mastery: 22, attempts: 5, selfMark: 28, lastEvidenceAt: '2026-05-14T09:35:00.000Z' },
      'integration-gardens': { progress: 18, mastery: 15, attempts: 2, selfMark: 30, lastEvidenceAt: '2026-05-08T14:10:00.000Z' },
    },
  },
  {
    id: 'student-mika',
    displayName: 'Mika C.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 58, mastery: 48, attempts: 7, selfMark: 44, lastEvidenceAt: '2026-05-15T08:48:00.000Z' },
      'logarithm-grove': { progress: 36, mastery: 31, attempts: 3, selfMark: 36, lastEvidenceAt: '2026-05-13T11:20:00.000Z' },
      'trig-observatory': { progress: 20, mastery: 16, attempts: 4, selfMark: 24, lastEvidenceAt: '2026-05-14T08:12:00.000Z' },
      'complex-harbor': { progress: 10, mastery: 8, attempts: 1, selfMark: 20, lastEvidenceAt: '2026-05-10T09:00:00.000Z' },
    },
  },
  {
    id: 'student-sam',
    displayName: 'Sam R.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 40, mastery: 35, attempts: 4, selfMark: 50, lastEvidenceAt: '2026-05-10T10:15:00.000Z' },
      'trig-observatory': { progress: 18, mastery: 14, attempts: 4, selfMark: 22, lastEvidenceAt: '2026-05-14T16:12:00.000Z' },
      'vector-workshop': { progress: 12, mastery: 10, attempts: 2, selfMark: 33, lastEvidenceAt: '2026-05-11T16:00:00.000Z' },
    },
  },
  {
    id: 'student-nora',
    displayName: 'Nora P.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 92, mastery: 86, attempts: 10, selfMark: 82, guardian: true, lastEvidenceAt: '2026-05-14T15:50:00.000Z' },
      'logarithm-grove': { progress: 76, mastery: 70, attempts: 6, selfMark: 70, guardian: true, lastEvidenceAt: '2026-05-13T12:20:00.000Z' },
      'trig-observatory': { progress: 64, mastery: 59, attempts: 6, selfMark: 62, lastEvidenceAt: '2026-05-13T12:45:00.000Z' },
      'calculus-cliffs': { progress: 62, mastery: 55, attempts: 5, selfMark: 60, lastEvidenceAt: '2026-05-15T08:10:00.000Z' },
      'integration-gardens': { progress: 68, mastery: 61, attempts: 7, selfMark: 66, lastEvidenceAt: '2026-05-15T08:10:00.000Z' },
    },
  },
  {
    id: 'student-jun',
    displayName: 'Jun W.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 24, mastery: 18, attempts: 2, selfMark: 25, lastEvidenceAt: '2026-05-06T09:30:00.000Z' },
      'trig-observatory': { progress: 8, mastery: 5, attempts: 1, selfMark: 18, lastEvidenceAt: '2026-05-06T09:45:00.000Z' },
    },
  },
  {
    id: 'student-iman',
    displayName: 'Iman T.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 36, mastery: 30, attempts: 4, selfMark: 38, lastEvidenceAt: '2026-05-09T12:00:00.000Z' },
      'vector-workshop': { progress: 16, mastery: 12, attempts: 3, selfMark: 24, lastEvidenceAt: '2026-05-15T07:46:00.000Z' },
      'complex-harbor': { progress: 12, mastery: 10, attempts: 1, selfMark: 28, lastEvidenceAt: '2026-05-13T14:30:00.000Z' },
    },
  },
  {
    id: 'student-li',
    displayName: 'Li Z.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 96, mastery: 92, attempts: 12, selfMark: 88, guardian: true, lastEvidenceAt: '2026-05-15T08:59:00.000Z' },
      'logarithm-grove': { progress: 88, mastery: 84, attempts: 8, selfMark: 82, guardian: true, lastEvidenceAt: '2026-05-14T16:18:00.000Z' },
      'trig-observatory': { progress: 74, mastery: 68, attempts: 8, selfMark: 70, guardian: true, lastEvidenceAt: '2026-05-14T16:25:00.000Z' },
      'calculus-cliffs': { progress: 80, mastery: 74, attempts: 8, selfMark: 76, guardian: true, lastEvidenceAt: '2026-05-15T08:59:00.000Z' },
      'integration-gardens': { progress: 90, mastery: 84, attempts: 10, selfMark: 82, guardian: true, lastEvidenceAt: '2026-05-15T08:59:00.000Z' },
      'vector-workshop': { progress: 66, mastery: 60, attempts: 6, selfMark: 64, lastEvidenceAt: '2026-05-12T13:18:00.000Z' },
    },
  },
  {
    id: 'student-farah',
    displayName: 'Farah K.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 64, mastery: 54, attempts: 6, selfMark: 54, lastEvidenceAt: '2026-05-15T07:55:00.000Z' },
      'logarithm-grove': { progress: 52, mastery: 48, attempts: 5, selfMark: 50, lastEvidenceAt: '2026-05-11T10:05:00.000Z' },
      'trig-observatory': { progress: 30, mastery: 24, attempts: 5, selfMark: 29, lastEvidenceAt: '2026-05-14T13:22:00.000Z' },
      'numerical-mines': { progress: 22, mastery: 18, attempts: 2, selfMark: 35, lastEvidenceAt: '2026-05-13T09:25:00.000Z' },
    },
  },
  {
    id: 'student-oscar',
    displayName: 'Oscar D.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 50, mastery: 42, attempts: 5, selfMark: 45, lastEvidenceAt: '2026-05-04T15:20:00.000Z' },
      'trig-observatory': { progress: 14, mastery: 9, attempts: 2, selfMark: 20, lastEvidenceAt: '2026-05-04T15:50:00.000Z' },
      'calculus-cliffs': { progress: 10, mastery: 8, attempts: 1, selfMark: 25, lastEvidenceAt: '2026-05-03T10:30:00.000Z' },
    },
  },
  {
    id: 'student-ella',
    displayName: 'Ella S.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 84, mastery: 78, attempts: 9, selfMark: 76, guardian: true, lastEvidenceAt: '2026-05-15T08:30:00.000Z' },
      'logarithm-grove': { progress: 70, mastery: 65, attempts: 6, selfMark: 68, lastEvidenceAt: '2026-05-15T08:35:00.000Z' },
      'trig-observatory': { progress: 42, mastery: 34, attempts: 5, selfMark: 40, lastEvidenceAt: '2026-05-15T08:40:00.000Z' },
      'differential-shrine': { progress: 18, mastery: 12, attempts: 2, selfMark: 34, lastEvidenceAt: '2026-05-12T09:20:00.000Z' },
    },
  },
  {
    id: 'student-ravi',
    displayName: 'Ravi N.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 68, mastery: 58, attempts: 6, selfMark: 55, lastEvidenceAt: '2026-05-15T08:05:00.000Z' },
      'logarithm-grove': { progress: 48, mastery: 42, attempts: 5, selfMark: 46, lastEvidenceAt: '2026-05-14T10:10:00.000Z' },
      'trig-observatory': { progress: 22, mastery: 18, attempts: 4, selfMark: 26, lastEvidenceAt: '2026-05-14T10:35:00.000Z' },
      'integration-gardens': { progress: 28, mastery: 22, attempts: 3, selfMark: 38, lastEvidenceAt: '2026-05-13T10:40:00.000Z' },
    },
  },
  {
    id: 'student-zara',
    displayName: 'Zara H.',
    classId: 'class-p3-alpha',
    regions: {
      'algebra-forge': { progress: 12, mastery: 8, attempts: 1, selfMark: 18, lastEvidenceAt: '2026-05-01T09:20:00.000Z' },
    },
  },
];

const betaStudents: StudentSeed[] = [
  {
    id: 'student-rosa',
    displayName: 'Rosa M.',
    classId: 'class-p3-beta',
    regions: {
      'algebra-forge': { progress: 54, mastery: 46, attempts: 5, selfMark: 48, lastEvidenceAt: '2026-05-14T10:20:00.000Z' },
      'trig-observatory': { progress: 34, mastery: 28, attempts: 3, selfMark: 35, lastEvidenceAt: '2026-05-13T10:20:00.000Z' },
    },
  },
  {
    id: 'student-theo',
    displayName: 'Theo B.',
    classId: 'class-p3-beta',
    regions: {
      'algebra-forge': { progress: 78, mastery: 72, attempts: 7, selfMark: 74, lastEvidenceAt: '2026-05-14T11:02:00.000Z' },
      'calculus-cliffs': { progress: 64, mastery: 58, attempts: 6, selfMark: 62, lastEvidenceAt: '2026-05-14T11:02:00.000Z' },
    },
  },
];

const studentSeeds = [...alphaStudents, ...betaStudents];

const adminTeachers: AdminTeacherSummary[] = [
  { id: 'teacher-hypatia', displayName: 'Ms Hypatia', email: 'hypatia@example.school', classCount: 2, lastActivityAt: '2026-05-15T09:12:00.000Z' },
  { id: 'teacher-noether', displayName: 'Mr Noether', email: 'noether@example.school', classCount: 1, lastActivityAt: '2026-05-14T15:45:00.000Z' },
];

const adminAuditEvents: AdminAuditEvent[] = [
  { id: 'audit-1', actorRole: 'admin', actorName: 'Support Admin', action: 'Viewed class support summary', targetType: 'class', targetLabel: 'P3 Alpha', createdAt: '2026-05-15T09:01:00.000Z' },
  { id: 'audit-2', actorRole: 'admin', actorName: 'Support Admin', action: 'Checked progress snapshot health', targetType: 'student_progress_snapshot', targetLabel: 'P3 Beta', createdAt: '2026-05-14T15:30:00.000Z' },
  { id: 'audit-3', actorRole: 'admin', actorName: 'Support Admin', action: 'Reviewed teacher access request', targetType: 'teacher', targetLabel: 'Mr Noether', createdAt: '2026-05-14T13:15:00.000Z' },
];

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

function isRecent(value: string | undefined): boolean {
  return Boolean(value && daysBetween(value, now) <= inactiveAfterDays);
}

export function labelForTeacherRegionStatus(status: TeacherRegionStatus): string {
  const labels: Record<TeacherRegionStatus, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    needs_help: 'Needs help',
    improving: 'Improving',
    secure: 'Secure',
    no_recent_evidence: 'No recent evidence',
  };
  return labels[status];
}

function statusForCell(seed: StudentRegionSeed | undefined): TeacherRegionStatus {
  if (!seed || seed.attempts === 0) return 'not_started';
  if (!isRecent(seed.lastEvidenceAt)) return 'no_recent_evidence';
  if ((seed.selfMark ?? seed.mastery) < 35 || seed.mastery < 25) return 'needs_help';
  if (seed.progress >= 75 && seed.mastery >= 65) return 'secure';
  if (seed.progress >= 45 && seed.mastery >= 35) return 'improving';
  return 'in_progress';
}

function warningForCell(cell: StudentRegionProgressCell): string | undefined {
  if (cell.status === 'needs_help') return 'low self-mark evidence';
  if (cell.status === 'no_recent_evidence') return 'no recent evidence';
  if (cell.status === 'not_started') return 'not started';
  return undefined;
}

function latestIso(values: Array<string | undefined>): string | undefined {
  const sorted = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return sorted[0];
}

function buildStudentRows(classId: string): StudentProgressRow[] {
  return studentSeeds
    .filter((student) => student.classId === classId)
    .map((student) => {
      const regionCells = regionIds.map((regionId) => {
        const seed = student.regions[regionId];
        const status = statusForCell(seed);
        const cell: StudentRegionProgressCell = {
          regionId,
          regionName: regionNameById[regionId],
          progressPercent: clampPercent(seed?.progress ?? 0),
          masteryPercent: clampPercent(seed?.mastery ?? 0),
          status,
          attemptsCount: seed?.attempts ?? 0,
          averageSelfMarkPercent: seed?.selfMark,
          guardianEligible: Boolean(seed?.guardian),
          lastEvidenceAt: seed?.lastEvidenceAt,
        };
        return { ...cell, warning: warningForCell(cell) };
      });
      const activeCells = regionCells.filter((cell) => cell.attemptsCount > 0);
      const lowCells = regionCells.filter((cell) => cell.status === 'needs_help');
      const staleCells = regionCells.filter((cell) => cell.status === 'no_recent_evidence');
      const startedAverage = activeCells.length
        ? activeCells.reduce((sum, cell) => sum + cell.progressPercent, 0) / activeCells.length
        : 0;
      const lastActivityAt = latestIso(regionCells.map((cell) => cell.lastEvidenceAt));
      const currentFocus = (
        lowCells.sort((a, b) => a.progressPercent - b.progressPercent)[0]
        ?? staleCells.sort((a, b) => a.progressPercent - b.progressPercent)[0]
        ?? regionCells.filter((cell) => cell.status === 'in_progress').sort((a, b) => a.progressPercent - b.progressPercent)[0]
        ?? regionCells.filter((cell) => cell.status === 'not_started')[0]
        ?? regionCells[0]
      );
      const repeatedLowSelfMarkCount = regionCells.filter((cell) => (cell.averageSelfMarkPercent ?? 100) < 35 && cell.attemptsCount >= 2).length;
      const warnings = [
        ...lowCells.map((cell) => `${cell.regionName}: needs help`),
        ...staleCells.map((cell) => `${cell.regionName}: no recent evidence`),
        ...(repeatedLowSelfMarkCount >= 2 ? ['Repeated low self-mark scores'] : []),
        ...(!isRecent(lastActivityAt) ? ['No recent activity'] : []),
      ];
      const notes = [
        activeCells.length ? `${activeCells.length} regions started` : 'No progress evidence yet',
        `${regionCells.filter((cell) => cell.guardianEligible).length} Guardian-ready regions`,
      ];

      return {
        id: student.id,
        displayName: student.displayName,
        classId: student.classId,
        overallProgressPercent: clampPercent(startedAverage),
        currentFocusRegionId: currentFocus.regionId,
        currentFocusRegionName: currentFocus.regionName,
        regionCells,
        lastActivityAt,
        lastActivityLabel: lastActivityAt ? lastActivityAt : 'No recent activity',
        attemptsCount: regionCells.reduce((sum, cell) => sum + cell.attemptsCount, 0),
        repeatedLowSelfMarkCount,
        guardianEligibleRegionCount: regionCells.filter((cell) => cell.guardianEligible).length,
        notes,
        warnings,
      };
    });
}

function buildProgressSummary(rows: StudentProgressRow[]): ClassProgressSummary {
  const averageProgress = rows.reduce((sum, row) => sum + row.overallProgressPercent, 0) / Math.max(rows.length, 1);
  const allCells = rows.flatMap((row) => row.regionCells);
  const startedCells = allCells.filter((cell) => cell.attemptsCount > 0);
  return {
    studentCount: rows.length,
    overallProgressPercent: clampPercent(averageProgress),
    averageMasteryPercent: clampPercent(startedCells.reduce((sum, cell) => sum + cell.masteryPercent, 0) / Math.max(startedCells.length, 1)),
    activeStudentCount: rows.filter((row) => isRecent(row.lastActivityAt)).length,
    inactiveStudentCount: rows.filter((row) => !isRecent(row.lastActivityAt)).length,
    studentsNeedingHelpCount: rows.filter((row) => row.warnings.length > 0).length,
    guardianEligibleCount: rows.filter((row) => row.guardianEligibleRegionCount > 0).length,
    totalAttempts: rows.reduce((sum, row) => sum + row.attemptsCount, 0),
  };
}

function statusForRegionSummary(summary: Omit<RegionProgressSummary, 'status'>): TeacherRegionStatus {
  if (summary.noRecentEvidenceCount >= Math.ceil(summary.studentsNeedingHelpCount / 2) && summary.noRecentEvidenceCount > 0) return 'no_recent_evidence';
  if (summary.studentsNeedingHelpCount >= 4 || summary.averageMasteryPercent < 30) return 'needs_help';
  if (summary.averageProgressPercent === 0) return 'not_started';
  if (summary.averageProgressPercent >= 70 && summary.averageMasteryPercent >= 60) return 'secure';
  if (summary.averageProgressPercent >= 45) return 'improving';
  return 'in_progress';
}

function buildRegionSummaries(rows: StudentProgressRow[]): RegionProgressSummary[] {
  return regionIds.map((regionId) => {
    const cells = rows.map((row) => row.regionCells.find((cell) => cell.regionId === regionId)).filter((cell): cell is StudentRegionProgressCell => Boolean(cell));
    const startedCells = cells.filter((cell) => cell.attemptsCount > 0);
    const summary = {
      regionId,
      regionName: regionNameById[regionId],
      averageProgressPercent: clampPercent(startedCells.reduce((sum, cell) => sum + cell.progressPercent, 0) / Math.max(startedCells.length, 1)),
      averageMasteryPercent: clampPercent(startedCells.reduce((sum, cell) => sum + cell.masteryPercent, 0) / Math.max(startedCells.length, 1)),
      studentsNeedingHelpCount: cells.filter((cell) => cell.status === 'needs_help').length,
      studentsSecureCount: cells.filter((cell) => cell.status === 'secure').length,
      noRecentEvidenceCount: cells.filter((cell) => cell.status === 'no_recent_evidence').length,
      guardianEligibleCount: cells.filter((cell) => cell.guardianEligible).length,
    };
    return { ...summary, status: statusForRegionSummary(summary) };
  });
}

function buildFocusThisWeek(rows: StudentProgressRow[], regions: RegionProgressSummary[]): FocusThisWeekItem[] {
  const weakestRegion = [...regions]
    .filter((region) => region.averageProgressPercent > 0 || region.studentsNeedingHelpCount > 0)
    .sort((a, b) => a.averageMasteryPercent - b.averageMasteryPercent)[0] ?? regions[0];
  const mostHelpRegion = [...regions].sort((a, b) => b.studentsNeedingHelpCount - a.studentsNeedingHelpCount)[0];
  const inactiveStudents = rows.filter((row) => !isRecent(row.lastActivityAt));
  const lowScoreStudents = rows.filter((row) => row.repeatedLowSelfMarkCount >= 2);
  const lowGuardianRegion = [...regions].sort((a, b) => a.guardianEligibleCount - b.guardianEligibleCount)[0];

  const items: FocusThisWeekItem[] = [
    {
      id: 'weakest-region',
      type: 'weakest_region',
      title: `Reteach ${weakestRegion.regionName}`,
      summary: `${weakestRegion.averageMasteryPercent}% average mastery across students with evidence.`,
      regionId: weakestRegion.regionId,
      regionName: weakestRegion.regionName,
      studentIds: rows.filter((row) => row.regionCells.some((cell) => cell.regionId === weakestRegion.regionId && ['needs_help', 'in_progress'].includes(cell.status))).map((row) => row.id),
      suggestedAction: 'Start the week with one worked example, then assign a short image-first Warm-Up in this region.',
      priority: 1,
    },
    {
      id: 'most-help',
      type: 'most_students_needing_help',
      title: `${mostHelpRegion.regionName} has the largest support group`,
      summary: `${mostHelpRegion.studentsNeedingHelpCount} students have low or thin evidence here.`,
      regionId: mostHelpRegion.regionId,
      regionName: mostHelpRegion.regionName,
      studentIds: rows.filter((row) => row.regionCells.some((cell) => cell.regionId === mostHelpRegion.regionId && cell.status === 'needs_help')).map((row) => row.id),
      suggestedAction: 'Use a small-group check before moving these students into exam-style practice.',
      priority: 2,
    },
    {
      id: 'inactive-students',
      type: 'inactive_students',
      title: 'Check students with no recent activity',
      summary: `${inactiveStudents.length} students have no recent evidence in the last ${inactiveAfterDays} days.`,
      studentIds: inactiveStudents.map((row) => row.id),
      suggestedAction: 'Ask these students to complete one Warm-Up or bring their latest written work for review.',
      priority: 3,
    },
    {
      id: 'low-self-marks',
      type: 'repeated_low_scores',
      title: 'Review repeated low self-mark scores',
      summary: `${lowScoreStudents.length} students have repeated low self-mark scores across regions.`,
      studentIds: lowScoreStudents.map((row) => row.id),
      suggestedAction: 'Pair self-mark review with mark-scheme reading so students can identify method marks, not just final answers.',
      priority: 4,
    },
    {
      id: 'low-guardian',
      type: 'low_guardian_eligibility',
      title: `Build Guardian readiness in ${lowGuardianRegion.regionName}`,
      summary: `${lowGuardianRegion.guardianEligibleCount} students are Guardian-ready in this region.`,
      regionId: lowGuardianRegion.regionId,
      regionName: lowGuardianRegion.regionName,
      studentIds: rows.filter((row) => {
        const cell = row.regionCells.find((item) => item.regionId === lowGuardianRegion.regionId);
        return Boolean(cell && cell.attemptsCount > 0 && !cell.guardianEligible);
      }).map((row) => row.id),
      suggestedAction: 'Use one clean practice cycle before treating this as mastery evidence.',
      priority: 5,
    },
  ];

  return items.slice(0, 3);
}

function buildStudentSummaries(rows: StudentProgressRow[]): StudentSummary[] {
  return rows.map((row) => {
    const focusCell = row.regionCells.find((cell) => cell.regionId === row.currentFocusRegionId);
    const recommendedNextStep: RecommendedNextStep =
      focusCell?.status === 'not_started' ? 'needs_field_guide'
        : focusCell?.status === 'needs_help' ? 'needs_teacher_review'
          : focusCell?.status === 'secure' ? 'ready_for_guardian'
            : 'needs_warm_up';
    return {
      id: row.id,
      displayName: row.displayName,
      classId: row.classId,
      currentRegionId: row.currentFocusRegionId,
      lastActivityAt: row.lastActivityAt ?? now,
      evidenceCount: row.attemptsCount,
      recommendedNextStep,
    };
  });
}

function buildRegionSignals(rows: StudentProgressRow[], summaries: RegionProgressSummary[]): RegionLearningSignal[] {
  return summaries.map((region) => {
    const regionRows = rows.filter((row) => row.regionCells.some((cell) => cell.regionId === region.regionId && cell.attemptsCount > 0));
    const cellFor = (row: StudentProgressRow) => row.regionCells.find((cell) => cell.regionId === region.regionId);
    return {
      regionId: region.regionId,
      regionName: region.regionName,
      readinessState: region.status === 'needs_help' ? 'needs_teacher_review' : region.status === 'secure' ? 'ready_for_guardian' : 'mixed',
      studentsNeedingFieldGuide: rows.filter((row) => cellFor(row)?.status === 'not_started').map((row) => row.id),
      studentsNeedingQuickCheck: rows.filter((row) => cellFor(row)?.status === 'in_progress').map((row) => row.id),
      studentsNeedingWarmUp: rows.filter((row) => cellFor(row)?.status === 'improving').map((row) => row.id),
      studentsReadyForExamTraining: rows.filter((row) => ['secure', 'improving'].includes(cellFor(row)?.status ?? '')).map((row) => row.id),
      studentsNeedingTeacherReview: rows.filter((row) => ['needs_help', 'no_recent_evidence'].includes(cellFor(row)?.status ?? '')).map((row) => row.id),
      evidenceCount: regionRows.reduce((sum, row) => sum + (cellFor(row)?.attemptsCount ?? 0), 0),
    };
  });
}

function buildEvidence(row: StudentProgressRow): EvidenceReference[] {
  return row.regionCells
    .filter((cell) => cell.attemptsCount > 0 && isValidP3RegionId(cell.regionId))
    .map((cell, index) => ({
      questionId: `mock-${row.id}-${cell.regionId}-${index + 1}`,
      regionId: cell.regionId,
      skillId: undefined,
      activityType: cell.guardianEligible ? 'guardian' : cell.progressPercent >= 55 ? 'warm_up' : 'quick_check',
      action: cell.status === 'no_recent_evidence' ? 'submitted' : 'completed',
      outcome: cell.status === 'needs_help' ? 'incorrect' : cell.status === 'secure' ? 'correct' : 'partial',
      createdAt: cell.lastEvidenceAt ?? now,
    }));
}

function buildActionCards(classId: string, rows: StudentProgressRow[], focusItems: FocusThisWeekItem[]): TeacherActionCard[] {
  return focusItems.map((item) => ({
    id: `${classId}-${item.id}`,
    type: item.type === 'most_students_needing_help' ? 'small_group' : item.type === 'inactive_students' ? 'needs_evidence' : 'reteach',
    title: item.title,
    summary: item.summary,
    regionId: item.regionId,
    studentIds: item.studentIds,
    evidenceRefs: rows.filter((row) => item.studentIds.includes(row.id)).flatMap(buildEvidence),
    recommendedAction: item.suggestedAction,
  }));
}

function buildExportRows(className: string, rows: StudentProgressRow[]): TeacherExportRow[] {
  return rows.map((row) => {
    const base: TeacherExportRow = {
      className,
      studentName: row.displayName,
      overallProgressPercent: row.overallProgressPercent,
      currentFocusRegion: row.currentFocusRegionName,
      lastActivity: row.lastActivityAt ?? 'No recent activity',
      attemptsCount: row.attemptsCount,
      guardianEligibilitySummary: `${row.guardianEligibleRegionCount} region(s)`,
      notesWarnings: [...row.notes, ...row.warnings].join('; '),
    };

    for (const cell of row.regionCells) {
      base[`${cell.regionName} progress`] = `${cell.progressPercent}%`;
      base[`${cell.regionName} status`] = labelForTeacherRegionStatus(cell.status);
    }

    return base;
  });
}

export function generateTeacherCsvExport(rows: TeacherExportRow[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? '')).join(',')),
  ].join('\n');
}

function buildWeeklySummary(className: string, summary: ClassProgressSummary, regions: RegionProgressSummary[], rows: StudentProgressRow[], focusItems: FocusThisWeekItem[]): WeeklyClassSummary {
  const attentionRows = rows
    .filter((row) => row.warnings.length > 0)
    .slice(0, 6)
    .map((row) => ({ studentId: row.id, displayName: row.displayName, reason: row.warnings[0] ?? 'Needs teacher review' }));
  const strongRows = [...rows]
    .filter((row) => row.overallProgressPercent >= 70 || row.guardianEligibleRegionCount >= 2)
    .sort((a, b) => b.overallProgressPercent - a.overallProgressPercent)
    .slice(0, 4)
    .map((row) => ({ studentId: row.id, displayName: row.displayName, reason: `${row.overallProgressPercent}% overall progress` }));

  return {
    className,
    dateRange: 'May 9-15, 2026',
    classOverallProgressPercent: summary.overallProgressPercent,
    topFocusRegions: focusItems
      .filter((item) => item.regionId && item.regionName)
      .map((item) => ({ regionId: item.regionId!, regionName: item.regionName!, reason: item.summary })),
    studentsNeedingAttention: attentionRows,
    studentsDoingWell: strongRows,
    suggestedTeacherActions: focusItems.map((item) => item.suggestedAction),
    exportDownloadText: 'Download Excel-compatible CSV export',
  };
}

function buildDashboard(classId: string): TeacherClassDashboard {
  const teacherClass = classes.find((item) => item.id === classId) ?? classes[0];
  const rows = buildStudentRows(teacherClass.id);
  const progressSummary = buildProgressSummary(rows);
  const regionSummaries = buildRegionSummaries(rows);
  const focusThisWeek = buildFocusThisWeek(rows, regionSummaries);
  const studentSummaries = buildStudentSummaries(rows);
  const regionSignals = buildRegionSignals(rows, regionSummaries);

  return {
    class: teacherClass,
    lastUpdatedAt: now,
    progressSummary,
    regionSummaries,
    studentRows: rows,
    focusThisWeek,
    weeklySummary: buildWeeklySummary(teacherClass.name, progressSummary, regionSummaries, rows, focusThisWeek),
    exportRows: buildExportRows(teacherClass.name, rows),
    actionCards: buildActionCards(teacherClass.id, rows, focusThisWeek),
    regionSignals,
    studentSummaries,
  };
}

export function groupStudentsByNextStep(studentSummaries: StudentSummary[]): Record<RecommendedNextStep, StudentSummary[]> {
  return {
    needs_field_guide: studentSummaries.filter((student) => student.recommendedNextStep === 'needs_field_guide'),
    needs_quick_check: studentSummaries.filter((student) => student.recommendedNextStep === 'needs_quick_check'),
    needs_warm_up: studentSummaries.filter((student) => student.recommendedNextStep === 'needs_warm_up'),
    ready_for_exam_training: studentSummaries.filter((student) => student.recommendedNextStep === 'ready_for_exam_training'),
    needs_teacher_review: studentSummaries.filter((student) => student.recommendedNextStep === 'needs_teacher_review'),
    ready_for_guardian: studentSummaries.filter((student) => student.recommendedNextStep === 'ready_for_guardian'),
  };
}

export async function listTeacherClasses(): Promise<TeacherClass[]> {
  return classes.filter((item) => !item.archivedAt);
}

export async function getTeacherClassDashboard(classId: string): Promise<TeacherClassDashboard> {
  return buildDashboard(classId);
}

export async function getClassRegionSignals(classId: string): Promise<RegionLearningSignal[]> {
  return buildDashboard(classId).regionSignals;
}

export async function getStudentSummaries(classId: string): Promise<StudentSummary[]> {
  return buildDashboard(classId).studentSummaries;
}

export async function getStudentEvidence(studentId: string): Promise<EvidenceReference[]> {
  const row = studentSeeds.find((student) => student.id === studentId);
  if (!row) return [];
  return buildStudentRows(row.classId).filter((studentRow) => studentRow.id === studentId).flatMap(buildEvidence);
}

export async function listAdminTeachers(): Promise<AdminTeacherSummary[]> {
  return adminTeachers;
}

export async function listAdminClasses(): Promise<TeacherClass[]> {
  return classes;
}

export async function listAdminAuditEvents(): Promise<AdminAuditEvent[]> {
  return adminAuditEvents;
}
