import { ArrowLeft, Download, ExternalLink, Mail, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { dashboardDataService, isDashboardDataServiceError, type DashboardServiceSource } from '../../lib/dashboardDataService';
import type { ClassRosterStudent, FocusThisWeekItem, StudentProgressRow, StudentRegionProgressCell, TeacherClass, TeacherClassDashboard } from '../../types';

interface TeacherDashboardProps {
  classId?: string;
  page?: 'home' | 'class' | 'roster' | 'region';
  regionId?: string;
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
}: {
  issue: DashboardLoadIssue;
  onNavigatePath: (path: string) => void;
  source: DashboardServiceSource;
}) {
  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell teacher-dashboard">
        <header className="dashboard-topbar teacher-class-header">
          <div>
            <span className="mode-pill">Teacher class dashboard</span>
            <h1>{issue.title}</h1>
            <p>{issue.message}</p>
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button type="button" className="active" onClick={() => onNavigatePath('/teacher')}>Teacher</button>
            <button type="button" onClick={() => onNavigatePath('/admin')}>Admin</button>
            <button type="button" onClick={() => onNavigatePath('/')}>Student app</button>
          </nav>
        </header>
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Dashboard data source</span>
              <h2>{source.label}</h2>
            </div>
            <strong className="diagnostic-status diagnostic-idle">{source.readOnly ? 'Read-only' : 'Mock'}</strong>
          </div>
          {source.detail ? <p>{source.detail}</p> : null}
          {issue.detail ? <p className="dashboard-muted">{issue.detail}</p> : null}
        </section>
      </section>
    </main>
  );
}

function RegionStatusCell({ cell }: { cell: StudentRegionProgressCell }) {
  const locked = cell.excludedFromClassProgress;
  return (
    <td className={`teacher-register-region status-${cell.status}${locked ? ' region-locked-cell' : ''}`}>
      <strong>{cell.progressPercent}%</strong>
      <span>{locked ? 'Not opened for class' : dashboardDataService.labelForTeacherRegionStatus(cell.status)}</span>
      {locked && cell.attemptsCount > 0 ? <small>existing progress visible</small> : cell.warning ? <small>{cell.warning}</small> : <small>{cell.attemptsCount} attempts</small>}
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
          <small>from mock class evidence</small>
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
  return (
    <section className="dashboard-section roster-management-section" aria-label="Roster management">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-kicker">Roster</span>
          <h2>Class code and student roster</h2>
        </div>
        <strong className="class-code-badge">{dashboard.classCode.code}</strong>
      </div>
      <p className="dashboard-muted">Students enter this class code, then claim one existing teacher-created roster name. Optional details such as email can be added after joining.</p>
      {readOnly ? (
        <p className="dashboard-muted">Supabase dashboard mode is read-only. Roster add, archive, and claim reset actions are disabled in this build.</p>
      ) : (
        <>
          <p className="dashboard-muted">Use Reset claim only if a student claimed the wrong slot or needs to rejoin.</p>
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
                  ) : readOnly ? (
                    <span className="dashboard-muted">Read-only</span>
                  ) : student.status === 'claimed' ? (
                    <div className="roster-action-stack">
                      <button type="button" className="quiet-button compact-button" onClick={() => onResetClaim(student.id)}>Reset claim</button>
                      <button type="button" className="quiet-button compact-button" onClick={() => onArchiveStudent(student.id)}>Archive</button>
                    </div>
                  ) : (
                    <button type="button" className="quiet-button compact-button" onClick={() => onArchiveStudent(student.id)}>Archive</button>
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

export function TeacherDashboard({ classId, page = 'home', regionId, onNavigatePath }: TeacherDashboardProps) {
  const source = dashboardDataService.source;
  const readOnly = source.readOnly;
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [dashboard, setDashboard] = useState<TeacherClassDashboard>();
  const [loadIssue, setLoadIssue] = useState<DashboardLoadIssue>();
  const [newStudentName, setNewStudentName] = useState('');

  async function refreshDashboard(nextClassId = dashboard?.class.id ?? classId ?? classes[0]?.id) {
    if (!nextClassId) return;
    try {
      const nextDashboard = await dashboardDataService.getTeacherClassDashboard(nextClassId);
      setDashboard(nextDashboard);
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
          setLoadIssue({
            title: 'No classes visible',
            message: 'No teacher classes are visible to the current dashboard data source.',
            detail: source.kind === 'supabase' ? 'Check the signed-in Supabase user and row-level security class scope.' : undefined,
          });
          return;
        }
        const nextDashboard = await dashboardDataService.getTeacherClassDashboard(selectedClassId);
        if (!cancelled) setDashboard(nextDashboard);
      } catch (error) {
        if (!cancelled) setLoadIssue(issueForDashboardError(error));
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [classId, source.kind]);

  const selectedClassId = dashboard?.class.id ?? classId ?? classes[0]?.id;
  const classRows = useMemo(() => dashboard?.studentRows ?? [], [dashboard]);

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!dashboard || !newStudentName.trim()) return;
    await dashboardDataService.addRosterStudent(dashboard.class.teacherId, dashboard.class.id, newStudentName);
    setNewStudentName('');
    await refreshDashboard(dashboard.class.id);
  }

  async function handleArchiveStudent(studentId: string) {
    if (readOnly) return;
    if (!dashboard) return;
    await dashboardDataService.archiveRosterStudent(dashboard.class.teacherId, dashboard.class.id, studentId);
    await refreshDashboard(dashboard.class.id);
  }

  async function handleResetClaim(studentId: string) {
    if (readOnly) return;
    if (!dashboard) return;
    await dashboardDataService.resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: dashboard.class.teacherId,
      classId: dashboard.class.id,
      rosterStudentId: studentId,
    });
    await refreshDashboard(dashboard.class.id);
  }

  async function handleRegionAccess(regionId: string, open: boolean) {
    if (readOnly) return;
    if (!dashboard) return;
    await dashboardDataService.setClassRegionAccess({
      actorRole: 'teacher',
      actorTeacherId: dashboard.class.teacherId,
      classId: dashboard.class.id,
      regionId,
      access: open ? 'open' : 'field_guide_only',
    });
    await refreshDashboard(dashboard.class.id);
  }

  function openRegion(regionId: string) {
    if (!dashboard) return;
    onNavigatePath(`/teacher/classes/${dashboard.class.id}/regions/${regionId}`);
  }

  if (loadIssue) {
    return <DashboardBlockedState issue={loadIssue} onNavigatePath={onNavigatePath} source={source} />;
  }

  if (!dashboard) {
    return (
      <main className="app-shell app-view-dashboard">
        <section className="dashboard-shell">
          <p>Loading teacher dashboard from {source.label}...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell teacher-dashboard">
        <header className="dashboard-topbar teacher-class-header">
          <div>
            <span className="mode-pill">Teacher class dashboard</span>
            <h1>{dashboard.class.name}</h1>
            <p>Last updated {formatTime(dashboard.lastUpdatedAt)} · class code {dashboard.classCode.code} · {classRows.length} claimed students · {source.label}{readOnly ? ' · read-only' : ''}</p>
            {source.detail ? <p className="dashboard-muted">{source.detail}</p> : null}
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button type="button" className="active" onClick={() => onNavigatePath('/teacher')}>Teacher</button>
            <button type="button" onClick={() => onNavigatePath('/admin')}>Admin</button>
            <button type="button" onClick={() => onNavigatePath('/')}>Student app</button>
          </nav>
        </header>

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
          {page === 'home' ? (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath(`/teacher/classes/${dashboard.class.id}`)}>
              <ExternalLink size={16} /> Open class page
            </button>
          ) : (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath('/teacher')}>
              <ArrowLeft size={16} /> Back to teacher home
            </button>
          )}
          {page !== 'roster' ? (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath(`/teacher/classes/${dashboard.class.id}/roster`)}>
              <UsersRound size={16} /> Class code and roster
            </button>
          ) : null}
        </section>

        {page === 'roster' ? (
          <RosterManagementPage
            dashboard={dashboard}
            newStudentName={newStudentName}
            onNewStudentNameChange={setNewStudentName}
            onAddStudent={handleAddStudent}
            onArchiveStudent={handleArchiveStudent}
            onResetClaim={handleResetClaim}
            readOnly={readOnly}
          />
        ) : null}

        {page === 'region' ? <RegionProgressPage dashboard={dashboard} regionId={regionId} /> : null}

        {page !== 'roster' && page !== 'region' ? (
          <>
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
                    <input type="checkbox" checked={access.access === 'open'} disabled={readOnly} onChange={(event) => handleRegionAccess(access.regionId, event.target.checked)} />
                    <span>{access.regionName}</span>
                    <small>{dashboardDataService.labelForClassRegionAccess(access.access)}{dashboardDataService.canUseRegionActivity(access.access, 'quick_check') ? '' : ' · Quick Check, Warm-Up, Exam Practice, Guardian, and mastery blocked'}{readOnly ? ' · read-only' : ''}</small>
                  </label>
                ))}
              </div>
            </section>

            <ClassFirstDashboard dashboard={dashboard} onOpenRegion={openRegion} />
          </>
        ) : null}
      </section>
    </main>
  );
}
