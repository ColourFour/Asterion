import { ArrowLeft, Copy, Download, Mail, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SupabaseAuthPanel } from '../auth/SupabaseAuthPanel';
import { dashboardDataService, isDashboardDataServiceError, type DashboardServiceSource } from '../../lib/dashboardDataService';
import type { SupabaseAuthStatus } from '../../lib/supabaseAuth';
import { hasSupabaseRole, type SupabaseRoleContext } from '../../lib/supabaseRoleService';
import { listTeacherQuestionsForClass, TEACHER_QUESTION_QUEUE_UPDATED_EVENT, type TeacherQuestion } from '../../lib/teacherQuestionQueue';
import type { ClassRosterStudent, FocusThisWeekItem, StudentProgressRow, StudentRegionProgressCell, TeacherClass, TeacherClassDashboard } from '../../types';
import { DashboardShell, type DashboardNavItem, type DashboardTabItem } from './DashboardShell';

interface TeacherDashboardProps {
  classId?: string;
  page?: 'home' | 'class' | 'roster' | 'region';
  regionId?: string;
  hostedRoleContext?: SupabaseRoleContext;
  onNavigatePath: (path: string) => void;
}

function formatTime(value: string | undefined): string {
  if (!value) return 'No recent activity';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(value: string | undefined): string {
  if (!value) return 'No recent activity';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function studentNames(rows: StudentProgressRow[], studentIds: string[]): string {
  const names = studentIds
    .map((studentId) => rows.find((row) => row.id === studentId)?.displayName)
    .filter(Boolean);
  return names.length ? names.slice(0, 6).join(', ') : 'No students currently flagged';
}

function exportCsv(dashboard: TeacherClassDashboard) {
  const csv = dashboardDataService.generateTeacherCsvExport(dashboard.exportRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dashboard.class.name.toLowerCase().replace(/\s+/g, '-')}-teacher-progress.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface DashboardLoadIssue {
  title: string;
  message: string;
  detail?: string;
}

function issueForDashboardError(error: unknown): DashboardLoadIssue {
  if (isDashboardDataServiceError(error)) {
    if (error.code === 'auth_required') {
      return {
        title: 'Supabase sign-in required',
        message: 'This dashboard is configured for Supabase-backed classroom data, but there is no authenticated Supabase session.',
        detail: 'Mock data is not shown in Supabase dashboard mode.',
      };
    }
    if (error.code === 'config_missing' || error.code === 'config_invalid' || error.code === 'supabase_unavailable') {
      return {
        title: 'Supabase dashboard not configured',
        message: error.safeMessage,
        detail: 'Normal student practice remains local and available.',
      };
    }
    return {
      title: 'Dashboard data unavailable',
      message: error.safeMessage,
      detail: 'The dashboard did not fall back to mock data for this Supabase read.',
    };
  }

  return {
    title: 'Dashboard data unavailable',
    message: error instanceof Error ? error.message : 'The dashboard could not load.',
  };
}

function DashboardBlockedState({
  issue,
  onNavigatePath,
  source,
  hostedRoleContext,
  onAuthStatusChange,
}: {
  issue: DashboardLoadIssue;
  onNavigatePath: (path: string) => void;
  source: DashboardServiceSource;
  hostedRoleContext?: SupabaseRoleContext;
  onAuthStatusChange: (status: SupabaseAuthStatus) => void;
}) {
  const showAdminNav = source.kind === 'mock' || hasSupabaseRole(hostedRoleContext, 'admin');
  const navItems: DashboardNavItem[] = [
    { label: 'Teacher', active: true, onClick: () => onNavigatePath('/teacher') },
    ...(showAdminNav ? [{ label: 'Admin', onClick: () => onNavigatePath('/admin') }] : []),
    { label: 'Student app', onClick: () => onNavigatePath('/') },
  ];

  return (
    <main className="app-shell app-view-dashboard">
      <DashboardShell className="teacher-dashboard" kicker="Teacher class dashboard" title={issue.title} description={issue.message} navItems={navItems}>
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Dashboard data source</span>
              <h2>{source.label}</h2>
            </div>
            <strong className="diagnostic-status diagnostic-idle">{source.kind === 'supabase' ? 'Hosted setup' : source.readOnly ? 'Read-only' : 'Mock'}</strong>
          </div>
          {source.detail ? <p>{source.detail}</p> : null}
          {issue.detail ? <p className="dashboard-muted">{issue.detail}</p> : null}
        </section>
        {source.kind === 'supabase' ? (
          <SupabaseAuthPanel
            className="dashboard-auth-panel"
            title="Sign in for Supabase dashboard reads"
            signedOutMessage="Request a magic link for the email attached to your Asterion Supabase role."
            onStatusChange={onAuthStatusChange}
          />
        ) : null}
      </DashboardShell>
    </main>
  );
}

function RegionStatusCell({ cell }: { cell: StudentRegionProgressCell }) {
  const locked = cell.excludedFromClassProgress;
  const checklist = cell.checklist;
  return (
    <td className={`teacher-register-region status-${cell.status}${locked ? ' region-locked-cell' : ''}`}>
      <strong>{cell.progressPercent}%</strong>
      <span>{locked ? 'Not opened for class' : dashboardDataService.labelForTeacherRegionStatus(cell.status)}</span>
      {checklist ? (
        <small>
          FG {checklist.fieldGuideCompleted}/{checklist.fieldGuideTotal} · SC {checklist.skillCheckCompleted}/{checklist.skillCheckTotal} · Guardian {checklist.guardianStatus}
        </small>
      ) : locked && cell.attemptsCount > 0 ? <small>existing progress visible</small> : cell.warning ? <small>{cell.warning}</small> : <small>{cell.attemptsCount} attempts</small>}
    </td>
  );
}

function FocusCard({ item, rows }: { item: FocusThisWeekItem; rows: StudentProgressRow[] }) {
  return (
    <article className="focus-card">
      <strong>{item.title}</strong>
      <p>{item.summary}</p>
      <span>{studentNames(rows, item.studentIds)}</span>
      <small>{item.suggestedAction}</small>
    </article>
  );
}

function WeeklySummaryPreview({ dashboard }: { dashboard: TeacherClassDashboard }) {
  const summary = dashboard.weeklySummary;
  return (
    <section className="dashboard-section weekly-summary-preview" aria-label="Weekly email summary preview">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Weekly email preview</span>
          <h2>{summary.className} · {summary.dateRange}</h2>
        </div>
        <Mail size={20} aria-hidden="true" />
      </div>
      <div className="weekly-summary-grid">
        <div>
          <strong>{summary.classOverallProgressPercent}%</strong>
          <span>class progress</span>
        </div>
        <div>
          <strong>{summary.studentsNeedingAttention.length}</strong>
          <span>students needing attention</span>
        </div>
        <div>
          <strong>{summary.studentsDoingWell.length}</strong>
          <span>students doing well</span>
        </div>
      </div>
      <p><strong>Teacher actions:</strong> {summary.suggestedTeacherActions.slice(0, 2).join(' ')}</p>
      <p className="dashboard-muted">{summary.exportDownloadText}; real email sending waits for backend integration.</p>
    </section>
  );
}

function ClassRegister({ dashboard, onOpenRegion }: { dashboard: TeacherClassDashboard; onOpenRegion: (regionId: string) => void }) {
  return (
    <section className="dashboard-section teacher-register-section" aria-label="Student progress register">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Student list</span>
          <h2>Class progress register</h2>
        </div>
        <UsersRound size={20} aria-hidden="true" />
      </div>
      <div className="teacher-register-scroll">
        <table className="teacher-register-table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Overall</th>
              <th scope="col">Focus</th>
              {dashboard.regionSummaries.map((region) => (
                <th key={region.regionId} scope="col">
                  <button type="button" className="table-link-button" onClick={() => onOpenRegion(region.regionId)}>
                    {region.regionName}
                  </button>
                </th>
              ))}
              <th scope="col">Last activity</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.studentRows.map((row) => (
              <tr key={row.id} className={row.warnings.length ? 'student-row-warning' : undefined}>
                <th scope="row">
                  <strong>{row.displayName}</strong>
                  {row.warnings[0] ? <span>{row.warnings[0]}</span> : <span>{row.notes[0]}</span>}
                </th>
                <td className="teacher-register-overall">
                  <strong>{row.overallProgressPercent}%</strong>
                  <span>{row.attemptsCount} attempts · locked excluded</span>
                </td>
                <td className="teacher-register-focus">{row.currentFocusRegionName}</td>
                {row.regionCells.map((cell) => <RegionStatusCell key={`${row.id}-${cell.regionId}`} cell={cell} />)}
                <td>{formatDate(row.lastActivityAt)}</td>
                <td><button type="button" className="quiet-button compact-button">View details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function rosterStatusLabel(student: ClassRosterStudent): string {
  if (student.status === 'claimed') return 'Claimed';
  if (student.status === 'unclaimed') return 'Unclaimed';
  if (student.status === 'archived') return 'Archived';
  return 'Active';
}

function TeacherProgressScopeNote() {
  return (
    <section className="dashboard-section dashboard-scope-note" aria-label="Teacher progress scope note">
      <strong>Practice feedback, not official grades</strong>
      <p>Teacher summaries use hosted classroom events and student self-mark entries. Raw working, notes, and full local practice state stay on each student's browser.</p>
    </section>
  );
}

function TeacherClassCards({
  classes,
  activeClassId,
  dashboard,
  onNavigatePath,
}: {
  classes: TeacherClass[];
  activeClassId?: string;
  dashboard?: TeacherClassDashboard;
  onNavigatePath: (path: string) => void;
}) {
  if (classes.length === 0) {
    return (
      <section className="dashboard-section dashboard-empty-state" aria-label="Teacher classes">
        <div>
          <span className="dashboard-kicker">Classes</span>
          <h2>No classes yet</h2>
          <p>Create a class to start roster setup, region access, and teacher progress views.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section teacher-classes-section" aria-label="Teacher classes">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Classes</span>
          <h2>Your classes</h2>
        </div>
      </div>
      <div className="teacher-class-card-grid">
        {classes.map((teacherClass) => {
          const selected = teacherClass.id === activeClassId;
          const summary = selected ? dashboard?.progressSummary : undefined;
          return (
            <article key={teacherClass.id} className={`teacher-class-card${selected ? ' active' : ''}`}>
              <div>
                <strong>{teacherClass.name}</strong>
                <span>{teacherClass.academicYearTerm} · {teacherClass.focus}</span>
              </div>
              <dl>
                <div>
                  <dt>Students</dt>
                  <dd>{summary?.activeStudentCount ?? 'Open class'}</dd>
                </div>
                <div>
                  <dt>Open regions</dt>
                  <dd>{summary?.openRegionCount ?? 'Open class'}</dd>
                </div>
                <div>
                  <dt>Class code</dt>
                  <dd>{selected ? dashboard?.classCode.code ?? 'Open class' : 'Open class'}</dd>
                </div>
              </dl>
              <div className="dashboard-card-actions">
                <button type="button" className="primary-button compact-button" onClick={() => onNavigatePath(`/teacher/classes/${teacherClass.id}`)}>
                  View students
                </button>
                <button type="button" className="quiet-button compact-button" onClick={() => onNavigatePath(`/teacher/classes/${teacherClass.id}/roster`)}>
                  Roster
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CreateTeacherClassSection({
  classForm,
  onClassFormChange,
  onCreateClass,
  readOnly,
  teacherProfileId,
  adminOperatorProfileMissing,
}: {
  classForm: { name: string; academicYearTerm: string; code: string };
  onClassFormChange: (value: { name: string; academicYearTerm: string; code: string }) => void;
  onCreateClass: (event: FormEvent<HTMLFormElement>) => void;
  readOnly: boolean;
  teacherProfileId: string;
  adminOperatorProfileMissing: boolean;
}) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Class setup</span>
          <h2>Create another pilot class</h2>
        </div>
      </div>
      {readOnly ? (
        <p className="dashboard-muted">Class creation is disabled for this dashboard data source.</p>
      ) : adminOperatorProfileMissing ? (
        <p className="dashboard-muted">Admin teacher-operator profile is missing. Run the admin bootstrap/repair migration.</p>
      ) : !teacherProfileId ? (
        <p className="dashboard-muted">No active hosted teacher profile is attached to this signed-in account.</p>
      ) : null}
      <form className="dashboard-inline-form" onSubmit={onCreateClass} aria-label="Create teacher class">
        <input value={classForm.name} onChange={(event) => onClassFormChange({ ...classForm, name: event.target.value })} placeholder="Class name" disabled={readOnly || !teacherProfileId} />
        <input value={classForm.academicYearTerm} onChange={(event) => onClassFormChange({ ...classForm, academicYearTerm: event.target.value })} placeholder="Academic year/term" disabled={readOnly || !teacherProfileId} />
        <input value={classForm.code} onChange={(event) => onClassFormChange({ ...classForm, code: event.target.value })} placeholder="Class code (optional)" disabled={readOnly || !teacherProfileId} />
        <button type="submit" className="primary-button" disabled={readOnly || !teacherProfileId}>Create class</button>
      </form>
      <p className="dashboard-muted">New classes receive all nine canonical regions as Field Guide only.</p>
    </section>
  );
}

function TeacherClassActions({
  classes,
  dashboard,
  page,
  selectedClassId,
  onNavigatePath,
}: {
  classes: TeacherClass[];
  dashboard: TeacherClassDashboard;
  page: 'class' | 'roster' | 'region';
  selectedClassId?: string;
  onNavigatePath: (path: string) => void;
}) {
  return (
    <section className="dashboard-control-row teacher-class-actions">
      <label>
        Class
        <select value={selectedClassId} onChange={(event) => onNavigatePath(`/teacher/classes/${event.target.value}`)}>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <button type="button" className="primary-button" onClick={() => exportCsv(dashboard)}>
        <Download size={16} /> Export CSV
      </button>
      <button type="button" className="quiet-button" onClick={() => onNavigatePath('/teacher')}>
        <ArrowLeft size={16} /> Back to teacher home
      </button>
      {page !== 'roster' ? (
        <button type="button" className="quiet-button" onClick={() => onNavigatePath(`/teacher/classes/${dashboard.class.id}/roster`)}>
          <UsersRound size={16} /> Class code and roster
        </button>
      ) : null}
    </section>
  );
}

function ClassRegionAccessSection({
  dashboard,
  readOnly,
  onRegionAccessChange,
}: {
  dashboard: TeacherClassDashboard;
  readOnly: boolean;
  onRegionAccessChange: (regionId: string, open: boolean) => void;
}) {
  return (
    <section className="dashboard-section class-region-access-section" aria-label="Class region access">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Region access</span>
          <h2>Open or lock P3 regions for this class</h2>
        </div>
      </div>
      <div className="region-access-grid">
        {dashboard.regionAccess.map((access) => (
          <label key={access.regionId} className={access.access === 'open' ? 'access-open' : 'access-locked'}>
            <input type="checkbox" checked={access.access === 'open'} disabled={readOnly} onChange={(event) => onRegionAccessChange(access.regionId, event.target.checked)} />
            <span>{access.regionName}</span>
            <small>{dashboardDataService.labelForClassRegionAccess(access.access)}{dashboardDataService.canUseRegionActivity(access.access, 'quick_check') ? '' : ' · Skill Check, Exam Practice, Guardian, and mastery blocked'}{readOnly ? ' · read-only' : ''}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

function StudentQuestionsPanel({ questions }: { questions: TeacherQuestion[] }) {
  return (
    <section className="dashboard-section teacher-question-queue" aria-label="Exam Training questions from students">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Exam Training</span>
          <h2>Student Questions</h2>
        </div>
        <strong className="diagnostic-status diagnostic-idle">{questions.length} open</strong>
      </div>
      {questions.length ? (
        <div className="teacher-question-list">
          {questions.map((question) => {
            const context = [
              question.practiceMode,
              question.regionName ?? question.regionId,
              question.topic,
              question.paper && question.questionNumber ? `${question.paper} Q${question.questionNumber}` : question.questionLabel,
            ].filter(Boolean).join(' · ');
            return (
              <article className="teacher-question-card" key={question.id}>
                <div className="teacher-question-card-header">
                  <div>
                    <strong>{question.studentDisplayName ?? question.studentId ?? 'Student'}</strong>
                    <span>{formatTime(question.createdAt)}</span>
                  </div>
                  <span className="teacher-question-status">{question.status}</span>
                </div>
                <p>{question.message}</p>
                <small>{context || question.questionId}</small>
                {question.solutionRevealed ? <em>Solution had been revealed when sent.</em> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="dashboard-muted">No Exam Training questions have been sent for this class in this browser yet.</p>
      )}
    </section>
  );
}

function ClassFirstDashboard({ dashboard, onOpenRegion }: { dashboard: TeacherClassDashboard; onOpenRegion: (regionId: string) => void }) {
  const summary = dashboard.progressSummary;
  return (
    <>
      <section className="class-snapshot-grid" aria-label="Overall progress summary">
        <article className="snapshot-card primary-snapshot">
          <span>Overall progress</span>
          <strong>{summary.overallProgressPercent}%</strong>
          <small>{summary.activeStudentCount} active · {summary.inactiveStudentCount} inactive · locked excluded</small>
        </article>
        <article className="snapshot-card">
          <span>Average mastery</span>
          <strong>{summary.averageMasteryPercent}%</strong>
          <small>from class activity summaries</small>
        </article>
        <article className="snapshot-card">
          <span>Need attention</span>
          <strong>{summary.studentsNeedingHelpCount}</strong>
          <small>students flagged for support</small>
        </article>
        <article className="snapshot-card">
          <span>Open regions</span>
          <strong>{summary.openRegionCount ?? 0}</strong>
          <small>{summary.lockedRegionCount ?? 0} locked / not taught yet</small>
        </article>
        <article className="snapshot-card">
          <span>Guardian-ready</span>
          <strong>{summary.guardianEligibleCount}</strong>
          <small>students with any ready region</small>
        </article>
      </section>

      <section className="region-progress-strip" aria-label="P3 region progress">
        {dashboard.regionSummaries.map((region) => (
          <button
            key={region.regionId}
            type="button"
            className={`region-progress-card region-progress-button status-${region.status}${region.excludedFromClassProgress ? ' access-locked' : ''}`}
            onClick={() => onOpenRegion(region.regionId)}
          >
            <span>{region.regionName}</span>
            <strong>{region.excludedFromClassProgress ? 'Locked' : `${region.averageProgressPercent}%`}</strong>
            <small>{region.excludedFromClassProgress ? 'Locked / not taught yet' : dashboardDataService.labelForTeacherRegionStatus(region.status)}</small>
            <em>{region.excludedFromClassProgress ? 'Field Guide only · excluded from class progress' : `${region.studentsNeedingHelpCount} need help · ${region.guardianEligibleCount} ready`}</em>
          </button>
        ))}
      </section>

      <div className="teacher-main-grid">
        <section className="dashboard-section focus-this-week" aria-label="Focus this week">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Focus this week</span>
              <h2>Top priorities</h2>
            </div>
          </div>
          <div className="focus-card-list">
            {dashboard.focusThisWeek.map((item) => <FocusCard key={item.id} item={item} rows={dashboard.studentRows} />)}
          </div>
        </section>
        <WeeklySummaryPreview dashboard={dashboard} />
      </div>

      <ClassRegister dashboard={dashboard} onOpenRegion={onOpenRegion} />
    </>
  );
}

function RosterManagementPage({
  dashboard,
  newStudentName,
  onNewStudentNameChange,
  onAddStudent,
  onArchiveStudent,
  onResetClaim,
  readOnly,
}: {
  dashboard: TeacherClassDashboard;
  newStudentName: string;
  onNewStudentNameChange: (value: string) => void;
  onAddStudent: (event: FormEvent<HTMLFormElement>) => void;
  onArchiveStudent: (studentId: string) => void;
  onResetClaim: (studentId: string) => void;
  readOnly: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState<string>();

  async function copyClaimText(text: string, status: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(status);
    } catch {
      setCopyStatus('Copy failed. Select the class code or roster row and copy it manually.');
    }
  }

  function claimPacketFor(student: ClassRosterStudent): string {
    return [
      `Roster name: ${student.displayName}`,
      `Class code: ${dashboard.classCode.code}`,
      'Open Asterion, sign in, then enter this roster name and class code.',
    ].join('\n');
  }

  function handleResetClaim(studentId: string, displayName: string) {
    const confirmed = window.confirm(`Reset ${displayName}'s class claim? They will need to claim this roster slot again. This does not restore browser-local progress cleared from a device.`);
    if (confirmed) onResetClaim(studentId);
  }

  function handleArchive(studentId: string, displayName: string) {
    const confirmed = window.confirm(`Archive ${displayName}'s roster slot? They will not be able to claim this row, and any existing claim will be cleared. Use Reset claim instead if the student only needs to rejoin.`);
    if (confirmed) onArchiveStudent(studentId);
  }

  return (
    <section className="dashboard-section roster-management-section" aria-label="Roster management">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Roster</span>
          <h2>Class code and student roster</h2>
        </div>
        <div className="class-code-copy-group">
          <strong className="class-code-badge">{dashboard.classCode.code}</strong>
          <button
            type="button"
            className="quiet-button compact-button"
            onClick={() => copyClaimText(dashboard.classCode.code, 'Class code copied.')}
          >
            <Copy size={14} aria-hidden="true" /> Copy class code
          </button>
        </div>
      </div>
      <p className="dashboard-muted">Students enter this class code, then claim one existing teacher-created roster name. Optional details such as email can be added after joining.</p>
      {copyStatus ? <p className="dashboard-muted" role="status">{copyStatus}</p> : null}
      {readOnly ? (
        <p className="dashboard-muted">Roster add, archive, and claim reset actions are disabled in this build.</p>
      ) : (
        <>
          <p className="dashboard-muted">Use Reset claim only if a student claimed the wrong slot or needs to rejoin. It does not recover progress from another browser or cleared site data.</p>
          <form className="dashboard-inline-form" onSubmit={onAddStudent} aria-label="Add roster student">
            <input value={newStudentName} onChange={(event) => onNewStudentNameChange(event.target.value)} placeholder="Student name" />
            <button type="submit" className="primary-button">Add student</button>
          </form>
        </>
      )}
      <div className="roster-table-wrap">
        <table className="teacher-register-table compact-roster-table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Roster status</th>
              <th scope="col">Optional details</th>
              <th scope="col">Claim copy</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.roster.students.map((student) => (
              <tr key={student.id} className={student.status === 'archived' ? 'archived-row' : undefined}>
                <th scope="row">{student.displayName}</th>
                <td>{rosterStatusLabel(student)}</td>
                <td>{student.optionalEmail ?? 'Student can add later'}</td>
                <td>
                  {student.status === 'archived' ? (
                    <span className="dashboard-muted">Archived</span>
                  ) : (
                    <button
                      type="button"
                      className="quiet-button compact-button"
                      onClick={() => copyClaimText(claimPacketFor(student), `Claim info copied for ${student.displayName}.`)}
                    >
                      <Copy size={14} aria-hidden="true" /> Copy claim info
                    </button>
                  )}
                </td>
                <td>
                  {student.status === 'archived' ? (
                    <span className="dashboard-muted">Archived</span>
                  ) : readOnly ? (
                    <span className="dashboard-muted">Read-only</span>
                  ) : student.status === 'claimed' ? (
                    <div className="roster-action-stack">
                      <button type="button" className="quiet-button compact-button" onClick={() => handleResetClaim(student.id, student.displayName)}>Reset claim</button>
                      <button type="button" className="quiet-button compact-button" onClick={() => handleArchive(student.id, student.displayName)}>Archive</button>
                    </div>
                  ) : (
                    <button type="button" className="quiet-button compact-button" onClick={() => handleArchive(student.id, student.displayName)}>Archive</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RegionProgressPage({ dashboard, regionId }: { dashboard: TeacherClassDashboard; regionId?: string }) {
  const region = dashboard.regionSummaries.find((item) => item.regionId === regionId) ?? dashboard.regionSummaries[0];
  const rows = dashboard.studentRows.map((row) => ({
    row,
    cell: row.regionCells.find((item) => item.regionId === region.regionId),
  })).filter((item): item is { row: StudentProgressRow; cell: StudentRegionProgressCell } => Boolean(item.cell));

  return (
    <section className="dashboard-section teacher-region-detail-section" aria-label="Region student progress">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Region progress</span>
          <h2>{region.regionName}</h2>
        </div>
      </div>
      <div className="teacher-region-detail-summary">
        <div><span>Average progress</span><strong>{region.excludedFromClassProgress ? 'Locked' : `${region.averageProgressPercent}%`}</strong></div>
        <div><span>Average mastery</span><strong>{region.excludedFromClassProgress ? 'Excluded' : `${region.averageMasteryPercent}%`}</strong></div>
        <div><span>Need help</span><strong>{region.studentsNeedingHelpCount}</strong></div>
        <div><span>Guardian-ready</span><strong>{region.guardianEligibleCount}</strong></div>
      </div>
      <div className="teacher-register-scroll">
        <table className="teacher-register-table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Progress</th>
              <th scope="col">Mastery</th>
              <th scope="col">Status</th>
              <th scope="col">Checklist</th>
              <th scope="col">Evidence</th>
              <th scope="col">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, cell }) => (
              <tr key={`${row.id}-${cell.regionId}`} className={cell.warning ? 'student-row-warning' : undefined}>
                <th scope="row">
                  <strong>{row.displayName}</strong>
                  <span>{cell.warning ?? row.notes[0]}</span>
                </th>
                <td className="teacher-register-overall"><strong>{cell.progressPercent}%</strong></td>
                <td className="teacher-register-overall"><strong>{cell.masteryPercent}%</strong></td>
                <td>{cell.excludedFromClassProgress ? 'Not opened for class' : dashboardDataService.labelForTeacherRegionStatus(cell.status)}</td>
                <td>
                  {cell.checklist ? (
                    <>
                      Field Guide {cell.checklist.fieldGuideCompleted}/{cell.checklist.fieldGuideTotal}
                      {' · '}
                      Skill Check {cell.checklist.skillCheckCompleted}/{cell.checklist.skillCheckTotal}
                      {' · '}
                      Guardian {cell.checklist.guardianStatus}
                    </>
                  ) : 'No checklist data'}
                </td>
                <td>{cell.attemptsCount} attempts{typeof cell.averageSelfMarkPercent === 'number' ? ` · ${cell.averageSelfMarkPercent}% self-mark` : ''}</td>
                <td>{formatDate(cell.lastEvidenceAt ?? row.lastActivityAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TeacherDashboard({ classId, page = 'home', regionId, hostedRoleContext, onNavigatePath }: TeacherDashboardProps) {
  const source = dashboardDataService.source;
  const readOnly = source.readOnly;
  const showAdminNav = source.kind === 'mock' || hasSupabaseRole(hostedRoleContext, 'admin');
  const adminOperatorMode = source.kind === 'supabase' && hasSupabaseRole(hostedRoleContext, 'admin');
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [dashboard, setDashboard] = useState<TeacherClassDashboard>();
  const [loadIssue, setLoadIssue] = useState<DashboardLoadIssue>();
  const [newStudentName, setNewStudentName] = useState('');
  const [classForm, setClassForm] = useState({ name: '', academicYearTerm: '2026 Term 2', code: '' });
  const [actionIssue, setActionIssue] = useState<string>();
  const [authStatus, setAuthStatus] = useState<SupabaseAuthStatus>(source.kind === 'supabase' ? 'loading' : 'signed-out');
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherQuestion[]>([]);
  const activeHostedTeacherProfileId = hostedRoleContext?.teacherProfiles.find((profile) => profile.status === 'active')?.id;
  const teacherProfileId = activeHostedTeacherProfileId ?? (source.kind === 'mock' ? dashboard?.class.teacherId ?? classes[0]?.teacherId ?? '' : '');
  const adminOperatorProfileMissing = adminOperatorMode && !activeHostedTeacherProfileId;

  async function refreshDashboard(nextClassId = dashboard?.class.id ?? classId ?? classes[0]?.id) {
    if (!nextClassId) return;
    try {
      const nextDashboard = await dashboardDataService.getTeacherClassDashboard(nextClassId);
      setDashboard(nextDashboard);
      setTeacherQuestions(listTeacherQuestionsForClass(nextDashboard.class.id));
      setLoadIssue(undefined);
    } catch (error) {
      setLoadIssue(issueForDashboardError(error));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        setLoadIssue(undefined);
        const items = await dashboardDataService.listTeacherClasses();
        if (cancelled) return;
        setClasses(items);
        const selectedClassId = classId ?? items[0]?.id;
        if (!selectedClassId) {
          setDashboard(undefined);
          return;
        }
        const nextDashboard = await dashboardDataService.getTeacherClassDashboard(selectedClassId);
        if (!cancelled) {
          setDashboard(nextDashboard);
          setTeacherQuestions(listTeacherQuestionsForClass(nextDashboard.class.id));
        }
      } catch (error) {
        if (!cancelled) setLoadIssue(issueForDashboardError(error));
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [classId, source.kind, authStatus]);

  useEffect(() => {
    function refreshTeacherQuestions() {
      const activeClassId = dashboard?.class.id ?? classId ?? classes[0]?.id;
      setTeacherQuestions(listTeacherQuestionsForClass(activeClassId));
    }
    refreshTeacherQuestions();
    window.addEventListener(TEACHER_QUESTION_QUEUE_UPDATED_EVENT, refreshTeacherQuestions);
    window.addEventListener('storage', refreshTeacherQuestions);
    return () => {
      window.removeEventListener(TEACHER_QUESTION_QUEUE_UPDATED_EVENT, refreshTeacherQuestions);
      window.removeEventListener('storage', refreshTeacherQuestions);
    };
  }, [classId, classes, dashboard?.class.id]);

  const selectedClassId = dashboard?.class.id ?? classId ?? classes[0]?.id;
  const classRows = useMemo(() => dashboard?.studentRows ?? [], [dashboard]);
  const dashboardNavItems: DashboardNavItem[] = [
    { label: 'Teacher', active: true, onClick: () => onNavigatePath('/teacher') },
    ...(showAdminNav ? [{ label: 'Admin', onClick: () => onNavigatePath('/admin') }] : []),
    { label: 'Student app', onClick: () => onNavigatePath('/') },
  ];
  const teacherTabs: DashboardTabItem[] = dashboard ? [
    { label: 'Classes', active: page === 'home', onClick: () => onNavigatePath('/teacher') },
    { label: 'Students', active: page === 'class' || page === 'region', onClick: () => onNavigatePath(`/teacher/classes/${dashboard.class.id}`) },
    { label: 'Resources / Controls', active: page === 'roster', onClick: () => onNavigatePath(`/teacher/classes/${dashboard.class.id}/roster`) },
  ] : [
    { label: 'Classes', active: true, onClick: () => onNavigatePath('/teacher') },
  ];

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!dashboard || !newStudentName.trim()) return;
    try {
      setActionIssue(undefined);
      await dashboardDataService.addRosterStudent(dashboard.class.teacherId, dashboard.class.id, newStudentName);
      setNewStudentName('');
      await refreshDashboard(dashboard.class.id);
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Roster student could not be added.');
    }
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !teacherProfileId || !classForm.name.trim()) return;
    try {
      setActionIssue(undefined);
      const created = await dashboardDataService.addAdminClass({
        name: classForm.name,
        teacherId: teacherProfileId,
        academicYearTerm: classForm.academicYearTerm,
        code: classForm.code,
      });
      setClassForm((current) => ({ name: '', academicYearTerm: current.academicYearTerm, code: '' }));
      const items = await dashboardDataService.listTeacherClasses();
      setClasses(items);
      await refreshDashboard(created.id);
      onNavigatePath(`/teacher/classes/${created.id}`);
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Class could not be created.');
    }
  }

  async function handleArchiveStudent(studentId: string) {
    if (readOnly) return;
    if (!dashboard) return;
    try {
      setActionIssue(undefined);
      await dashboardDataService.archiveRosterStudent(dashboard.class.teacherId, dashboard.class.id, studentId);
      await refreshDashboard(dashboard.class.id);
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Roster student could not be archived.');
    }
  }

  async function handleResetClaim(studentId: string) {
    if (readOnly) return;
    if (!dashboard) return;
    try {
      setActionIssue(undefined);
      await dashboardDataService.resetRosterClaim({
        actorRole: 'teacher',
        actorTeacherId: dashboard.class.teacherId,
        classId: dashboard.class.id,
        rosterStudentId: studentId,
      });
      await refreshDashboard(dashboard.class.id);
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Roster claim could not be reset.');
    }
  }

  async function handleRegionAccess(regionId: string, open: boolean) {
    if (readOnly) return;
    if (!dashboard) return;
    try {
      setActionIssue(undefined);
      await dashboardDataService.setClassRegionAccess({
        actorRole: 'teacher',
        actorTeacherId: dashboard.class.teacherId,
        classId: dashboard.class.id,
        regionId,
        access: open ? 'open' : 'field_guide_only',
      });
      await refreshDashboard(dashboard.class.id);
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Region access could not be updated.');
    }
  }

  function openRegion(regionId: string) {
    if (!dashboard) return;
    onNavigatePath(`/teacher/classes/${dashboard.class.id}/regions/${regionId}`);
  }

  if (loadIssue) {
    return <DashboardBlockedState issue={loadIssue} onNavigatePath={onNavigatePath} source={source} hostedRoleContext={hostedRoleContext} onAuthStatusChange={setAuthStatus} />;
  }

  if (!dashboard) {
    return (
      <main className="app-shell app-view-dashboard">
        <DashboardShell
          className="teacher-dashboard"
          kicker="Teacher class dashboard"
          title={classes.length === 0 ? 'Create a class' : 'Loading teacher dashboard'}
          description={<>{source.label}{readOnly ? ' · read-only' : ''}</>}
          navItems={dashboardNavItems}
          tabs={teacherTabs}
        >
          {source.kind === 'supabase' ? (
            <SupabaseAuthPanel
              className="dashboard-auth-panel"
              title="Supabase dashboard session"
              signedOutMessage="Sign in to create and refresh authorized dashboard rows."
              onStatusChange={setAuthStatus}
            />
          ) : null}
          {actionIssue ? (
            <section className="dashboard-section dashboard-error-state" role="alert">
              <strong>Action failed</strong>
              <p>{actionIssue}</p>
            </section>
          ) : null}
          {adminOperatorMode ? (
            <section className="dashboard-section dashboard-scope-note" aria-label="Admin operator mode">
              <strong>Admin operator mode</strong>
              <p>Admin operator mode: you can create and manage classes for setup/troubleshooting. Classes created here are owned by your admin operator teacher profile.</p>
            </section>
          ) : null}
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">Class setup</span>
                <h2>Start a pilot class</h2>
              </div>
            </div>
            {readOnly ? (
              <p className="dashboard-muted">Class creation is disabled for this dashboard data source.</p>
            ) : adminOperatorProfileMissing ? (
              <p className="dashboard-muted">Admin teacher-operator profile is missing. Run the admin bootstrap/repair migration.</p>
            ) : !teacherProfileId ? (
              <p className="dashboard-muted">No active hosted teacher profile is attached to this signed-in account.</p>
            ) : (
              <form className="dashboard-inline-form" onSubmit={handleCreateClass} aria-label="Create teacher class">
                <input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class name" />
                <input value={classForm.academicYearTerm} onChange={(event) => setClassForm({ ...classForm, academicYearTerm: event.target.value })} placeholder="Academic year/term" />
                <input value={classForm.code} onChange={(event) => setClassForm({ ...classForm, code: event.target.value })} placeholder="Class code (optional)" />
                <button type="submit" className="primary-button">Create class</button>
              </form>
            )}
            <p className="dashboard-muted">New classes start with all P3 regions set to Field Guide only. Open Algebra or any other region later through Region access.</p>
          </section>
        </DashboardShell>
      </main>
    );
  }

  return (
    <main className="app-shell app-view-dashboard">
      <DashboardShell
        className="teacher-dashboard"
        kicker="Teacher class dashboard"
        title={page === 'home' ? 'Teacher dashboard' : dashboard.class.name}
        description={page === 'home'
          ? <>Manage classes, rosters, region access, and progress views · {source.label}{readOnly ? ' · read-only' : ''}</>
          : <>Last updated {formatTime(dashboard.lastUpdatedAt)} · class code {dashboard.classCode.code} · {classRows.length} claimed students · {source.label}{readOnly ? ' · read-only' : ''}</>}
        detail={source.detail}
        navItems={dashboardNavItems}
        tabs={teacherTabs}
      >

        {source.kind === 'supabase' ? (
          <SupabaseAuthPanel
            className="dashboard-auth-panel"
            title="Supabase dashboard session"
            signedOutMessage="Sign in to refresh authorized dashboard rows."
            onStatusChange={setAuthStatus}
          />
        ) : null}

        {actionIssue ? (
          <section className="dashboard-section dashboard-error-state" role="alert">
            <strong>Action failed</strong>
            <p>{actionIssue}</p>
          </section>
        ) : null}

        {adminOperatorMode ? (
          <section className="dashboard-section dashboard-scope-note" aria-label="Admin operator mode">
            <strong>Admin operator mode</strong>
            <p>Admin operator mode: you can create and manage classes for setup/troubleshooting. Classes created here are owned by your admin operator teacher profile.</p>
          </section>
        ) : null}

        {page === 'home' ? (
          <>
            <TeacherClassCards classes={classes} activeClassId={selectedClassId} dashboard={dashboard} onNavigatePath={onNavigatePath} />
            <StudentQuestionsPanel questions={teacherQuestions} />
            <CreateTeacherClassSection
              classForm={classForm}
              onClassFormChange={setClassForm}
              onCreateClass={handleCreateClass}
              readOnly={readOnly}
              teacherProfileId={teacherProfileId}
              adminOperatorProfileMissing={adminOperatorProfileMissing}
            />
          </>
        ) : null}

        {page === 'roster' ? (
          <>
            <TeacherProgressScopeNote />
            <TeacherClassActions classes={classes} dashboard={dashboard} page={page} selectedClassId={selectedClassId} onNavigatePath={onNavigatePath} />
            <RosterManagementPage
              dashboard={dashboard}
              newStudentName={newStudentName}
              onNewStudentNameChange={setNewStudentName}
              onAddStudent={handleAddStudent}
              onArchiveStudent={handleArchiveStudent}
              onResetClaim={handleResetClaim}
              readOnly={readOnly}
            />
            <ClassRegionAccessSection dashboard={dashboard} readOnly={readOnly} onRegionAccessChange={handleRegionAccess} />
          </>
        ) : null}

        {page === 'region' ? (
          <>
            <TeacherProgressScopeNote />
            <TeacherClassActions classes={classes} dashboard={dashboard} page={page} selectedClassId={selectedClassId} onNavigatePath={onNavigatePath} />
            <RegionProgressPage dashboard={dashboard} regionId={regionId} />
          </>
        ) : null}

        {page === 'class' ? (
          <>
            <TeacherProgressScopeNote />
            <TeacherClassActions classes={classes} dashboard={dashboard} page={page} selectedClassId={selectedClassId} onNavigatePath={onNavigatePath} />
            <StudentQuestionsPanel questions={teacherQuestions} />
            <ClassFirstDashboard dashboard={dashboard} onOpenRegion={openRegion} />
          </>
        ) : null}
      </DashboardShell>
    </main>
  );
}
