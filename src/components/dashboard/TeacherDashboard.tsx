import { ArrowLeft, ClipboardList, ExternalLink, Search, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  getStudentEvidence,
  getTeacherClassDashboard,
  groupStudentsByNextStep,
  listTeacherClasses,
} from '../../lib/dashboardMockService';
import type { EvidenceReference, RecommendedNextStep, StudentSummary, TeacherActionCard, TeacherClass, TeacherClassDashboard } from '../../types';
import {
  actionTypeLabels,
  activityLabels,
  evidenceActionLabels,
  nextStepLabels,
  outcomeLabels,
  readinessLabels,
} from './dashboardLabels';

interface TeacherDashboardProps {
  classId?: string;
  detailMode?: boolean;
  onNavigatePath: (path: string) => void;
}

const orderedNextSteps: RecommendedNextStep[] = [
  'needs_field_guide',
  'needs_quick_check',
  'needs_warm_up',
  'ready_for_exam_training',
  'needs_teacher_review',
  'ready_for_guardian',
];

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function studentNames(students: StudentSummary[], studentIds: string[]): string {
  const names = studentIds
    .map((studentId) => students.find((student) => student.id === studentId)?.displayName)
    .filter(Boolean);
  return names.length ? names.join(', ') : 'No students assigned';
}

function EvidenceList({ evidence }: { evidence: EvidenceReference[] }) {
  if (!evidence.length) {
    return <p className="dashboard-muted">Evidence is thin; assign one more Warm-Up before making a stronger recommendation.</p>;
  }

  return (
    <div className="evidence-card-list">
      {evidence.slice(0, 4).map((item) => (
        <article key={`${item.questionId}-${item.createdAt}`} className="evidence-card">
          <strong>{activityLabels[item.activityType]} · {item.questionId}</strong>
          <span>{evidenceActionLabels[item.action]} · {outcomeLabels[item.outcome]} · {formatTime(item.createdAt)}</span>
          <span>{item.skillId ? `Skill signal: ${item.skillId}` : 'Region signal only'} · Region: {item.regionId}</span>
        </article>
      ))}
    </div>
  );
}

function ActionCard({ card, students }: { card: TeacherActionCard; students: StudentSummary[] }) {
  return (
    <article className={`teacher-action-card action-${card.type}`}>
      <span className="dashboard-kicker">{actionTypeLabels[card.type]}</span>
      <h3>{card.title}</h3>
      <p>{card.summary}</p>
      <p><strong>Students:</strong> {studentNames(students, card.studentIds)}</p>
      <p><strong>Recommended action:</strong> {card.recommendedAction}</p>
      <EvidenceList evidence={card.evidenceRefs} />
    </article>
  );
}

function StudentDetailPanel({ student, onClose }: { student: StudentSummary; onClose: () => void }) {
  const [evidence, setEvidence] = useState<EvidenceReference[]>([]);

  useEffect(() => {
    let cancelled = false;
    getStudentEvidence(student.id).then((items) => {
      if (!cancelled) setEvidence(items);
    });
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  return (
    <aside className="student-detail-panel" aria-label={`${student.displayName} evidence preview`}>
      <div>
        <span className="dashboard-kicker">Student preview</span>
        <h3>{student.displayName}</h3>
      </div>
      <button type="button" className="quiet-button" onClick={onClose}>Close</button>
      <dl className="student-detail-facts">
        <div><dt>Current region</dt><dd>{student.currentRegionId}</dd></div>
        <div><dt>Recent activity</dt><dd>{formatTime(student.lastActivityAt)}</dd></div>
        <div><dt>Evidence count</dt><dd>{student.evidenceCount}</dd></div>
        <div><dt>Suggested next step</dt><dd>{nextStepLabels[student.recommendedNextStep]}</dd></div>
      </dl>
      <p className="dashboard-muted">Recommendation is based on activity type, question/region/skill signals, and whether work was submitted, completed, or revealed for review.</p>
      <EvidenceList evidence={evidence} />
    </aside>
  );
}

function ClassDetail({ dashboard }: { dashboard: TeacherClassDashboard }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary>();
  const grouped = useMemo(() => groupStudentsByNextStep(dashboard.studentSummaries), [dashboard.studentSummaries]);

  return (
    <section className="dashboard-section class-detail-section">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Class detail</span>
          <h2>{dashboard.class.name}</h2>
          <p>Join code {dashboard.class.joinCode} · evidence updated {formatTime(dashboard.lastUpdatedAt)}</p>
        </div>
      </div>

      <div className="region-readiness-list">
        {dashboard.regionSignals.map((signal) => (
          <article key={signal.regionId} className="region-signal-card">
            <strong>{signal.regionName}</strong>
            <span>{readinessLabels[signal.readinessState]}</span>
            <small>{signal.evidenceCount} evidence references · {signal.studentsNeedingTeacherReview.length} need teacher review</small>
          </article>
        ))}
      </div>

      <div className="next-step-groups">
        {orderedNextSteps.map((step) => (
          <section key={step} className="next-step-group">
            <h3>{nextStepLabels[step]}</h3>
            {grouped[step].length ? (
              <div className="student-chip-list">
                {grouped[step].map((student) => (
                  <button key={student.id} type="button" className="student-chip" onClick={() => setSelectedStudent(student)}>
                    <span>{student.displayName}</span>
                    <small>{student.evidenceCount} evidence refs</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="dashboard-muted">No students in this group right now.</p>
            )}
          </section>
        ))}
      </div>

      {selectedStudent ? <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(undefined)} /> : null}
    </section>
  );
}

export function TeacherDashboard({ classId, detailMode = false, onNavigatePath }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [dashboard, setDashboard] = useState<TeacherClassDashboard>();

  useEffect(() => {
    let cancelled = false;
    listTeacherClasses().then((items) => {
      if (cancelled) return;
      setClasses(items);
      const selectedClassId = classId ?? items[0]?.id;
      if (selectedClassId) {
        getTeacherClassDashboard(selectedClassId).then((nextDashboard) => {
          if (!cancelled) setDashboard(nextDashboard);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const groupedActions = useMemo(() => ({
    reteach: dashboard?.actionCards.filter((card) => card.type === 'reteach') ?? [],
    small_group: dashboard?.actionCards.filter((card) => card.type === 'small_group' || card.type === 'teacher_review') ?? [],
    ready_for_exam_practice: dashboard?.actionCards.filter((card) => card.type === 'ready_for_exam_practice') ?? [],
  }), [dashboard]);

  const needsEvidenceOrReview = dashboard?.studentSummaries.filter((student) => student.evidenceCount < 4 || student.recommendedNextStep === 'needs_teacher_review') ?? [];

  if (!dashboard) {
    return (
      <main className="app-shell app-view-dashboard">
        <section className="dashboard-shell">
          <p>Loading teacher dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell teacher-dashboard">
        <header className="dashboard-topbar">
          <div>
            <span className="mode-pill">Asterion dashboard</span>
            <h1>Teacher Planning</h1>
            <p>Mock classroom signals for planning. Canonical question and mark-scheme images remain the student source of truth.</p>
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button type="button" className="active" onClick={() => onNavigatePath('/teacher')}>Teacher</button>
            <button type="button" onClick={() => onNavigatePath('/admin')}>Admin</button>
            <button type="button" onClick={() => onNavigatePath('/')}>Student app</button>
          </nav>
        </header>

        <section className="dashboard-control-row">
          <label>
            Class
            <select value={dashboard.class.id} onChange={(event) => onNavigatePath(`/teacher/classes/${event.target.value}`)}>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="last-updated-indicator">
            <ClipboardList size={18} />
            <span>Last updated {formatTime(dashboard.lastUpdatedAt)}</span>
          </div>
          {!detailMode ? (
            <button type="button" className="primary-button" onClick={() => onNavigatePath(`/teacher/classes/${dashboard.class.id}`)}>
              <ExternalLink size={16} /> Open class detail
            </button>
          ) : (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath('/teacher')}>
              <ArrowLeft size={16} /> Back to teacher home
            </button>
          )}
        </section>

        <section className="dashboard-priority-row">
          <article className="dashboard-section attention-section">
            <div>
              <span className="dashboard-kicker">Recommended next move</span>
              <h2>What should I do with this class next?</h2>
              <h3>{groupedActions.reteach[0]?.title ?? 'Start with the next clean evidence point'}</h3>
              <p>{groupedActions.reteach[0]?.recommendedAction ?? 'Evidence is thin; assign one more Warm-Up before making a stronger recommendation.'}</p>
            </div>
          </article>

          <article className="dashboard-section class-summary-card">
            <span className="dashboard-kicker">Class summary</span>
            <strong>{dashboard.studentSummaries.length}</strong>
            <span>students in {dashboard.class.name}</span>
            <small>Join code {dashboard.class.joinCode}</small>
          </article>
        </section>

        <section className="dashboard-section dashboard-class-overview">
          <div>
            <span className="dashboard-kicker">Selected class</span>
            <h2>Planning evidence snapshot</h2>
            <p>{dashboard.class.name} has {dashboard.studentSummaries.length} students and {dashboard.regionSignals.length} region signal groups in the current mock dashboard.</p>
          </div>
        </section>

        <div className="teacher-action-groups">
          <section>
            <h2>Reteach now</h2>
            {groupedActions.reteach.map((card) => <ActionCard key={card.id} card={card} students={dashboard.studentSummaries} />)}
          </section>
          <section>
            <h2>Small groups</h2>
            {groupedActions.small_group.map((card) => <ActionCard key={card.id} card={card} students={dashboard.studentSummaries} />)}
          </section>
          <section>
            <h2>Ready for exam practice</h2>
            {groupedActions.ready_for_exam_practice.map((card) => <ActionCard key={card.id} card={card} students={dashboard.studentSummaries} />)}
          </section>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Region readiness</span>
              <h2>Region signals</h2>
            </div>
          </div>
          <div className="region-readiness-list">
            {dashboard.regionSignals.map((signal) => (
              <article key={signal.regionId} className="region-signal-card">
                <strong>{signal.regionName}</strong>
                <span>{readinessLabels[signal.readinessState]}</span>
                <small>
                  {signal.studentsNeedingWarmUp.length} need Warm-Up · {signal.studentsReadyForExamTraining.length} ready for Exam Training
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Evidence and review</span>
              <h2>Students needing evidence / teacher review</h2>
            </div>
            <Search size={20} aria-hidden="true" />
          </div>
          <div className="student-chip-list">
            {needsEvidenceOrReview.map((student) => (
              <span key={student.id} className="student-chip readonly-chip">
                <UsersRound size={15} />
                <span>{student.displayName}</span>
                <small>{nextStepLabels[student.recommendedNextStep]}</small>
              </span>
            ))}
          </div>
        </section>

        {detailMode ? <ClassDetail dashboard={dashboard} /> : null}
      </section>
    </main>
  );
}
