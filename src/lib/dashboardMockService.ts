import type {
  AdminAuditEvent,
  AdminTeacherSummary,
  EvidenceReference,
  RecommendedNextStep,
  RegionLearningSignal,
  StudentSummary,
  TeacherActionCard,
  TeacherClass,
  TeacherClassDashboard,
} from '../types';

const now = '2026-05-15T09:20:00.000Z';

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

const students: StudentSummary[] = [
  { id: 'student-ada', displayName: 'Ada L.', classId: 'class-p3-alpha', currentRegionId: 'algebra-forge', lastActivityAt: '2026-05-15T08:52:00.000Z', evidenceCount: 8, recommendedNextStep: 'needs_warm_up' },
  { id: 'student-mika', displayName: 'Mika C.', classId: 'class-p3-alpha', currentRegionId: 'algebra-forge', lastActivityAt: '2026-05-15T08:48:00.000Z', evidenceCount: 7, recommendedNextStep: 'needs_warm_up' },
  { id: 'student-sam', displayName: 'Sam R.', classId: 'class-p3-alpha', currentRegionId: 'trig-observatory', lastActivityAt: '2026-05-14T16:12:00.000Z', evidenceCount: 4, recommendedNextStep: 'needs_quick_check' },
  { id: 'student-nora', displayName: 'Nora P.', classId: 'class-p3-alpha', currentRegionId: 'integration-gardens', lastActivityAt: '2026-05-15T08:10:00.000Z', evidenceCount: 10, recommendedNextStep: 'ready_for_exam_training' },
  { id: 'student-jun', displayName: 'Jun W.', classId: 'class-p3-alpha', currentRegionId: 'trig-observatory', lastActivityAt: '2026-05-13T14:32:00.000Z', evidenceCount: 2, recommendedNextStep: 'needs_field_guide' },
  { id: 'student-iman', displayName: 'Iman T.', classId: 'class-p3-alpha', currentRegionId: 'vector-workshop', lastActivityAt: '2026-05-15T07:46:00.000Z', evidenceCount: 3, recommendedNextStep: 'needs_teacher_review' },
  { id: 'student-li', displayName: 'Li Z.', classId: 'class-p3-alpha', currentRegionId: 'integration-gardens', lastActivityAt: '2026-05-15T08:59:00.000Z', evidenceCount: 12, recommendedNextStep: 'ready_for_guardian' },
  { id: 'student-rosa', displayName: 'Rosa M.', classId: 'class-p3-beta', currentRegionId: 'algebra-forge', lastActivityAt: '2026-05-14T10:20:00.000Z', evidenceCount: 5, recommendedNextStep: 'needs_quick_check' },
  { id: 'student-theo', displayName: 'Theo B.', classId: 'class-p3-beta', currentRegionId: 'calculus-cliffs', lastActivityAt: '2026-05-14T11:02:00.000Z', evidenceCount: 9, recommendedNextStep: 'ready_for_exam_training' },
];

const evidenceByStudent: Record<string, EvidenceReference[]> = {
  'student-ada': [
    { questionId: '9709-2023-32-q05', regionId: 'algebra-forge', skillId: 'p3-algebra-partial-fractions', activityType: 'warm_up', action: 'submitted', outcome: 'partial', createdAt: '2026-05-15T08:52:00.000Z' },
    { questionId: '9709-2022-31-q04', regionId: 'algebra-forge', skillId: 'p3-algebra-partial-fractions', activityType: 'quick_check', action: 'completed', outcome: 'self_review', createdAt: '2026-05-14T09:08:00.000Z' },
  ],
  'student-mika': [
    { questionId: '9709-2021-33-q03', regionId: 'algebra-forge', skillId: 'p3-algebra-modulus-equations', activityType: 'warm_up', action: 'revealed', outcome: 'self_review', createdAt: '2026-05-15T08:48:00.000Z' },
  ],
  'student-sam': [
    { questionId: '9709-2022-32-q08', regionId: 'trig-observatory', skillId: 'p3-trig-identities', activityType: 'quick_check', action: 'submitted', outcome: 'incorrect', createdAt: '2026-05-14T16:12:00.000Z' },
  ],
  'student-nora': [
    { questionId: '9709-2023-31-q10', regionId: 'integration-gardens', skillId: 'p3-integration-substitution', activityType: 'warm_up', action: 'completed', outcome: 'correct', createdAt: '2026-05-15T08:10:00.000Z' },
  ],
  'student-jun': [
    { questionId: '9709-2020-32-q06', regionId: 'trig-observatory', skillId: 'p3-trig-equations', activityType: 'field_guide', action: 'started', outcome: 'unknown', createdAt: '2026-05-13T14:32:00.000Z' },
  ],
  'student-iman': [
    { questionId: '9709-2023-33-q09', regionId: 'vector-workshop', skillId: 'p3-vectors-lines', activityType: 'exam_training', action: 'revealed', outcome: 'unknown', createdAt: '2026-05-15T07:46:00.000Z' },
  ],
  'student-li': [
    { questionId: '9709-2021-31-q11', regionId: 'integration-gardens', skillId: 'p3-integration-by-parts', activityType: 'guardian', action: 'completed', outcome: 'correct', createdAt: '2026-05-15T08:59:00.000Z' },
  ],
  'student-rosa': [
    { questionId: '9709-2022-33-q02', regionId: 'algebra-forge', skillId: 'p3-algebra-functions', activityType: 'quick_check', action: 'submitted', outcome: 'partial', createdAt: '2026-05-14T10:20:00.000Z' },
  ],
  'student-theo': [
    { questionId: '9709-2023-32-q07', regionId: 'calculus-cliffs', skillId: 'p3-differentiation-parametric', activityType: 'warm_up', action: 'completed', outcome: 'correct', createdAt: '2026-05-14T11:02:00.000Z' },
  ],
};

const adminTeachers: AdminTeacherSummary[] = [
  { id: 'teacher-hypatia', displayName: 'Ms Hypatia', email: 'hypatia@example.school', classCount: 2, lastActivityAt: '2026-05-15T09:12:00.000Z' },
  { id: 'teacher-noether', displayName: 'Mr Noether', email: 'noether@example.school', classCount: 1, lastActivityAt: '2026-05-14T15:45:00.000Z' },
];

const adminAuditEvents: AdminAuditEvent[] = [
  { id: 'audit-1', actorRole: 'admin', actorName: 'Support Admin', action: 'Viewed class support summary', targetType: 'class', targetLabel: 'P3 Alpha', createdAt: '2026-05-15T09:01:00.000Z' },
  { id: 'audit-2', actorRole: 'admin', actorName: 'Support Admin', action: 'Checked progress snapshot health', targetType: 'student_progress_snapshot', targetLabel: 'P3 Beta', createdAt: '2026-05-14T15:30:00.000Z' },
  { id: 'audit-3', actorRole: 'admin', actorName: 'Support Admin', action: 'Reviewed teacher access request', targetType: 'teacher', targetLabel: 'Mr Noether', createdAt: '2026-05-14T13:15:00.000Z' },
];

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

function evidenceForStudents(studentIds: string[]): EvidenceReference[] {
  return studentIds.flatMap((studentId) => evidenceByStudent[studentId] ?? []);
}

function buildRegionSignals(classId: string): RegionLearningSignal[] {
  const classStudents = students.filter((student) => student.classId === classId);
  const regions = [
    { regionId: 'algebra-forge', regionName: 'Algebra Vault' },
    { regionId: 'trig-observatory', regionName: 'Trigonometry Spire' },
    { regionId: 'integration-gardens', regionName: 'Integral Terraces' },
    { regionId: 'vector-workshop', regionName: 'Vectors Gate' },
    { regionId: 'calculus-cliffs', regionName: 'Calculus Cliffs' },
  ];

  return regions.map((region) => {
    const regionStudents = classStudents.filter((student) => student.currentRegionId === region.regionId);
    const studentsNeedingFieldGuide = regionStudents.filter((student) => student.recommendedNextStep === 'needs_field_guide').map((student) => student.id);
    const studentsNeedingQuickCheck = regionStudents.filter((student) => student.recommendedNextStep === 'needs_quick_check').map((student) => student.id);
    const studentsNeedingWarmUp = regionStudents.filter((student) => student.recommendedNextStep === 'needs_warm_up').map((student) => student.id);
    const studentsReadyForExamTraining = regionStudents.filter((student) => student.recommendedNextStep === 'ready_for_exam_training' || student.recommendedNextStep === 'ready_for_guardian').map((student) => student.id);
    const studentsNeedingTeacherReview = regionStudents.filter((student) => student.recommendedNextStep === 'needs_teacher_review').map((student) => student.id);
    const evidenceCount = regionStudents.reduce((sum, student) => sum + student.evidenceCount, 0);
    const readinessState = studentsNeedingTeacherReview.length
      ? 'needs_teacher_review'
      : studentsNeedingFieldGuide.length
        ? 'needs_field_guide'
        : studentsNeedingQuickCheck.length
          ? 'needs_quick_check'
          : studentsNeedingWarmUp.length
            ? 'needs_warm_up'
            : studentsReadyForExamTraining.length
              ? 'ready_for_exam_training'
              : 'mixed';

    return {
      ...region,
      readinessState,
      studentsNeedingFieldGuide,
      studentsNeedingQuickCheck,
      studentsNeedingWarmUp,
      studentsReadyForExamTraining,
      studentsNeedingTeacherReview,
      evidenceCount,
    };
  });
}

function buildActionCards(classId: string): TeacherActionCard[] {
  const classStudents = students.filter((student) => student.classId === classId);
  const algebraWarmUpIds = classStudents.filter((student) => student.currentRegionId === 'algebra-forge' && student.recommendedNextStep === 'needs_warm_up').map((student) => student.id);
  const trigSupportIds = classStudents.filter((student) => student.currentRegionId === 'trig-observatory' && ['needs_field_guide', 'needs_quick_check'].includes(student.recommendedNextStep)).map((student) => student.id);
  const examReadyIds = classStudents.filter((student) => ['ready_for_exam_training', 'ready_for_guardian'].includes(student.recommendedNextStep)).map((student) => student.id);
  const reviewIds = classStudents.filter((student) => student.recommendedNextStep === 'needs_teacher_review').map((student) => student.id);

  const cards: TeacherActionCard[] = [
    {
      id: `${classId}-reteach-algebra`,
      type: 'reteach',
      title: 'Reteach partial fractions in Algebra Vault',
      summary: `${algebraWarmUpIds.length} students need Warm-Up evidence before Exam Training.`,
      regionId: 'algebra-forge',
      skillId: 'p3-algebra-partial-fractions',
      studentIds: algebraWarmUpIds,
      evidenceRefs: evidenceForStudents(algebraWarmUpIds),
      recommendedAction: 'Start class with one worked example, then assign a short Warm-Up using the canonical question image.',
    },
    {
      id: `${classId}-small-group-trig`,
      type: 'small_group',
      title: 'Small group for Trigonometry Spire entry',
      summary: `${trigSupportIds.length} students may need support starting this question type.`,
      regionId: 'trig-observatory',
      skillId: 'p3-trig-equations',
      studentIds: trigSupportIds,
      evidenceRefs: evidenceForStudents(trigSupportIds),
      recommendedAction: 'Use Field Guide language first, then one Quick Check before moving to Warm-Up.',
    },
    {
      id: `${classId}-exam-ready-integral`,
      type: 'ready_for_exam_practice',
      title: 'Move ready students into Exam Training',
      summary: `${examReadyIds.length} students have enough recent activity to try a Paper 3-style set.`,
      studentIds: examReadyIds,
      evidenceRefs: evidenceForStudents(examReadyIds),
      recommendedAction: 'Assign Exam Training and ask students to compare their work with the mark scheme after submission.',
    },
    {
      id: `${classId}-review-vectors`,
      type: 'teacher_review',
      title: 'Check thin or unclear Vectors Gate evidence',
      summary: `${reviewIds.length} student has activity that needs teacher review before a confident next step.`,
      regionId: 'vector-workshop',
      skillId: 'p3-vectors-lines',
      studentIds: reviewIds,
      evidenceRefs: evidenceForStudents(reviewIds),
      recommendedAction: 'Look at the latest reveal/submission behavior and assign one more Warm-Up if evidence remains thin.',
    },
  ];

  return cards.filter((card) => card.studentIds.length > 0 || card.type === 'ready_for_exam_practice');
}

export async function listTeacherClasses(): Promise<TeacherClass[]> {
  return classes.filter((item) => !item.archivedAt);
}

export async function getTeacherClassDashboard(classId: string): Promise<TeacherClassDashboard> {
  const teacherClass = classes.find((item) => item.id === classId) ?? classes[0];
  return {
    class: teacherClass,
    lastUpdatedAt: now,
    actionCards: buildActionCards(teacherClass.id),
    regionSignals: buildRegionSignals(teacherClass.id),
    studentSummaries: students.filter((student) => student.classId === teacherClass.id),
  };
}

export async function getClassRegionSignals(classId: string): Promise<RegionLearningSignal[]> {
  return buildRegionSignals(classId);
}

export async function getStudentSummaries(classId: string): Promise<StudentSummary[]> {
  return students.filter((student) => student.classId === classId);
}

export async function getStudentEvidence(studentId: string): Promise<EvidenceReference[]> {
  return evidenceByStudent[studentId] ?? [];
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
