import { ArrowLeft, Download, ExternalLink, Mail, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  generateTeacherCsvExport,
  getTeacherClassDashboard,
  labelForTeacherRegionStatus,
  listTeacherClasses,
} from '../../lib/dashboardMockService';
import type { FocusThisWeekItem, StudentProgressRow, StudentRegionProgressCell, TeacherClass, TeacherClassDashboard } from '../../types';

interface TeacherDashboardProps {
  classId?: string;
  detailMode?: boolean;
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
  const csv = generateTeacherCsvExport(dashboard.exportRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dashboard.class.name.toLowerCase().replace(/\s+/g, '-')}-teacher-progress.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function RegionStatusCell({ cell }: { cell: StudentRegionProgressCell }) {
  return (
    <td className={`teacher-register-region status-${cell.status}`}>
      <strong>{cell.progressPercent}%</strong>
      <span>{labelForTeacherRegionStatus(cell.status)}</span>
      {cell.warning ? <small>{cell.warning}</small> : <small>{cell.attemptsCount} attempts</small>}
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

function ClassRegister({ dashboard }: { dashboard: TeacherClassDashboard }) {
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
                <th key={region.regionId} scope="col">{region.regionName}</th>
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
                  <span>{row.attemptsCount} attempts</span>
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

function ClassFirstDashboard({ dashboard }: { dashboard: TeacherClassDashboard }) {
  const summary = dashboard.progressSummary;
  return (
    <>
      <section className="class-snapshot-grid" aria-label="Overall progress summary">
        <article className="snapshot-card primary-snapshot">
          <span>Overall progress</span>
          <strong>{summary.overallProgressPercent}%</strong>
          <small>{summary.activeStudentCount} active · {summary.inactiveStudentCount} inactive</small>
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
          <span>Guardian-ready</span>
          <strong>{summary.guardianEligibleCount}</strong>
          <small>students with any ready region</small>
        </article>
      </section>

      <section className="region-progress-strip" aria-label="P3 region progress">
        {dashboard.regionSummaries.map((region) => (
          <article key={region.regionId} className={`region-progress-card status-${region.status}`}>
            <span>{region.regionName}</span>
            <strong>{region.averageProgressPercent}%</strong>
            <small>{labelForTeacherRegionStatus(region.status)}</small>
            <em>{region.studentsNeedingHelpCount} need help · {region.guardianEligibleCount} ready</em>
          </article>
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

      <ClassRegister dashboard={dashboard} />
    </>
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

  const selectedClassId = dashboard?.class.id ?? classId ?? classes[0]?.id;
  const classRows = useMemo(() => dashboard?.studentRows ?? [], [dashboard]);

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
        <header className="dashboard-topbar teacher-class-header">
          <div>
            <span className="mode-pill">Teacher class dashboard</span>
            <h1>{dashboard.class.name}</h1>
            <p>Last updated {formatTime(dashboard.lastUpdatedAt)} · {classRows.length} students · mock local planning data</p>
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
          {!detailMode ? (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath(`/teacher/classes/${dashboard.class.id}`)}>
              <ExternalLink size={16} /> Open class page
            </button>
          ) : (
            <button type="button" className="quiet-button" onClick={() => onNavigatePath('/teacher')}>
              <ArrowLeft size={16} /> Back to teacher home
            </button>
          )}
        </section>

        <ClassFirstDashboard dashboard={dashboard} />
      </section>
    </main>
  );
}
