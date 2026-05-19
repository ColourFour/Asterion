import { ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { dashboardDataService, isDashboardDataServiceError, type DashboardServiceSource } from '../../lib/dashboardDataService';
import type { AdminAuditEvent, AdminClassRecord, AdminTeacherRecord } from '../../types';
import { SupabaseDiagnosticPanel } from './SupabaseDiagnosticPanel';

interface AdminDashboardProps {
  onNavigatePath: (path: string) => void;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
        message: 'This admin dashboard is configured for Supabase-backed classroom data, but there is no authenticated Supabase session.',
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
      detail: 'The admin dashboard did not fall back to mock data for this Supabase read.',
    };
  }

  return {
    title: 'Dashboard data unavailable',
    message: error instanceof Error ? error.message : 'The admin dashboard could not load.',
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
      <section className="dashboard-shell admin-dashboard">
        <header className="dashboard-topbar">
          <div>
            <span className="mode-pill">Asterion dashboard</span>
            <h1>{issue.title}</h1>
            <p>{issue.message}</p>
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button type="button" onClick={() => onNavigatePath('/teacher')}>Teacher</button>
            <button type="button" className="active" onClick={() => onNavigatePath('/admin')}>Admin</button>
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
        <SupabaseDiagnosticPanel />
      </section>
    </main>
  );
}

export function AdminDashboard({ onNavigatePath }: AdminDashboardProps) {
  const source = dashboardDataService.source;
  const readOnly = source.readOnly;
  const [teachers, setTeachers] = useState<AdminTeacherRecord[]>([]);
  const [classes, setClasses] = useState<AdminClassRecord[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [loadIssue, setLoadIssue] = useState<DashboardLoadIssue>();
  const [query, setQuery] = useState('');
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [classForm, setClassForm] = useState({ name: '', teacherId: '', academicYearTerm: '2026 Term 2', code: '' });

  async function refreshAdminRecords() {
    try {
      const [nextTeachers, nextClasses, nextAuditEvents] = await Promise.all([
        dashboardDataService.listAdminTeacherRecords(),
        dashboardDataService.listAdminClassRecords(),
        dashboardDataService.listAdminAuditEvents(),
      ]);
      setTeachers(nextTeachers);
      setClasses(nextClasses);
      setAuditEvents(nextAuditEvents);
      setLoadIssue(undefined);
      setClassForm((current) => ({ ...current, teacherId: current.teacherId || nextTeachers.find((teacher) => teacher.status === 'active')?.id || '' }));
    } catch (error) {
      setLoadIssue(issueForDashboardError(error));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadAdminRecords() {
      try {
        setLoadIssue(undefined);
        const [nextTeachers, nextClasses, nextAuditEvents] = await Promise.all([
          dashboardDataService.listAdminTeacherRecords(),
          dashboardDataService.listAdminClassRecords(),
          dashboardDataService.listAdminAuditEvents(),
        ]);
        if (cancelled) return;
        setTeachers(nextTeachers);
        setClasses(nextClasses);
        setAuditEvents(nextAuditEvents);
        setClassForm((current) => ({ ...current, teacherId: current.teacherId || nextTeachers.find((teacher) => teacher.status === 'active')?.id || '' }));
      } catch (error) {
        if (!cancelled) setLoadIssue(issueForDashboardError(error));
      }
    }
    loadAdminRecords();
    return () => {
      cancelled = true;
    };
  }, [source.kind]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTeachers = useMemo(() => (
    normalizedQuery
      ? teachers.filter((teacher) => `${teacher.name} ${teacher.email}`.toLowerCase().includes(normalizedQuery))
      : teachers
  ), [normalizedQuery, teachers]);

  const filteredClasses = useMemo(() => (
    normalizedQuery
      ? classes.filter((teacherClass) => `${teacherClass.name} ${teacherClass.classCode.code} ${teacherClass.teacherId}`.toLowerCase().includes(normalizedQuery))
      : classes
  ), [classes, normalizedQuery]);

  const teacherNameById = useMemo(() => Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers]);

  async function handleAddTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) return;
    await dashboardDataService.addAdminTeacher({ name: teacherForm.name, email: teacherForm.email });
    setTeacherForm({ name: '', email: '' });
    await refreshAdminRecords();
  }

  async function handleAddClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!classForm.name.trim() || !classForm.teacherId || !classForm.code.trim()) return;
    await dashboardDataService.addAdminClass(classForm);
    setClassForm((current) => ({ name: '', teacherId: current.teacherId, academicYearTerm: current.academicYearTerm, code: '' }));
    await refreshAdminRecords();
  }

  async function toggleRegion(classId: string, regionId: string, open: boolean) {
    if (readOnly) return;
    await dashboardDataService.setClassRegionAccess({ actorRole: 'admin', classId, regionId, access: open ? 'open' : 'field_guide_only' });
    await refreshAdminRecords();
  }

  if (loadIssue) {
    return <DashboardBlockedState issue={loadIssue} onNavigatePath={onNavigatePath} source={source} />;
  }

  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell admin-dashboard">
        <header className="dashboard-topbar">
          <div>
            <span className="mode-pill">Asterion dashboard</span>
            <h1>Admin Console</h1>
            <p>{source.label}{readOnly ? ' · read-only' : ''}. Curriculum, topic routing, canonical content, and image paths are not editable here.</p>
            {source.detail ? <p className="dashboard-muted">{source.detail}</p> : null}
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <button type="button" onClick={() => onNavigatePath('/teacher')}>Teacher</button>
            <button type="button" className="active" onClick={() => onNavigatePath('/admin')}>Admin</button>
            <button type="button" onClick={() => onNavigatePath('/')}>Student app</button>
          </nav>
        </header>

        <section className="dashboard-section admin-identity">
          <ShieldCheck size={22} />
          <div>
            <span className="dashboard-kicker">Signed-in admin placeholder</span>
            <h2>Support Admin</h2>
            <p>Role: admin · destructive support actions are disabled in this v0. {readOnly ? 'Supabase writes are disabled.' : ''}</p>
          </div>
        </section>

        <section className="dashboard-control-row">
          <label>
            Search support records
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Teacher, class, or join code" />
          </label>
        </section>

        <SupabaseDiagnosticPanel />

        <div className="admin-grid">
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">Teachers</span>
                <h2>Teacher list</h2>
              </div>
            </div>
            {readOnly ? (
              <p className="dashboard-muted">Teacher creation is disabled in read-only Supabase dashboard mode.</p>
            ) : (
              <form className="dashboard-inline-form" onSubmit={handleAddTeacher} aria-label="Add teacher">
                <input value={teacherForm.name} onChange={(event) => setTeacherForm({ ...teacherForm, name: event.target.value })} placeholder="Teacher name" />
                <input value={teacherForm.email} onChange={(event) => setTeacherForm({ ...teacherForm, email: event.target.value })} placeholder="teacher@example.school" />
                <button type="submit" className="primary-button">Add teacher</button>
              </form>
            )}
            <div className="admin-list">
              {filteredTeachers.map((teacher) => (
                <article key={teacher.id}>
                  <strong>{teacher.name}</strong>
                  <span>{teacher.email}</span>
                  <small>{classes.filter((item) => item.teacherId === teacher.id && item.status === 'active').length} assigned classes · {teacher.status} · updated {formatTime(teacher.updatedAt)}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">Classes</span>
                <h2>Class list</h2>
              </div>
            </div>
            {readOnly ? (
              <p className="dashboard-muted">Class creation is disabled in read-only Supabase dashboard mode.</p>
            ) : (
              <form className="dashboard-inline-form" onSubmit={handleAddClass} aria-label="Add class">
                <input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class name" />
                <select value={classForm.teacherId} onChange={(event) => setClassForm({ ...classForm, teacherId: event.target.value })}>
                  {teachers.filter((teacher) => teacher.status === 'active').map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
                <input value={classForm.academicYearTerm} onChange={(event) => setClassForm({ ...classForm, academicYearTerm: event.target.value })} placeholder="Academic year/term" />
                <input value={classForm.code} onChange={(event) => setClassForm({ ...classForm, code: event.target.value })} placeholder="Class code" />
                <button type="submit" className="primary-button">Add class</button>
              </form>
            )}
            <div className="admin-list">
              {filteredClasses.map((teacherClass) => (
                <article key={teacherClass.id}>
                  <strong>{teacherClass.name}</strong>
                  <span>Class code {teacherClass.classCode.code} · {teacherClass.focus}</span>
                  <small>{teacherNameById[teacherClass.teacherId] ?? teacherClass.teacherId} · {teacherClass.academicYearTerm} · {teacherClass.status} · {teacherClass.rosterStudentIds.length} roster entries</small>
                  <small>{teacherClass.regionAccess.filter((access) => access.access === 'open').length} open · {teacherClass.regionAccess.filter((access) => access.access !== 'open').length} locked/not taught yet</small>
                  <button type="button" className="quiet-button compact-button" onClick={() => onNavigatePath(`/teacher/classes/${teacherClass.id}`)}>Inspect class data</button>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Region access</span>
              <h2>Admin view and override</h2>
            </div>
          </div>
          <div className="admin-region-access-list">
            {filteredClasses.map((teacherClass) => (
              <article key={`${teacherClass.id}-regions`} className="dashboard-nested-panel">
                <div>
                  <strong>{teacherClass.name}</strong>
                  <span>{teacherNameById[teacherClass.teacherId] ?? teacherClass.teacherId}</span>
                </div>
                <div className="region-access-grid">
                  {teacherClass.regionAccess.map((access) => (
                    <label key={`${teacherClass.id}-${access.regionId}`} className={access.access === 'open' ? 'access-open' : 'access-locked'}>
                      <input type="checkbox" checked={access.access === 'open'} disabled={readOnly} onChange={(event) => toggleRegion(teacherClass.id, access.regionId, event.target.checked)} />
                      <span>{access.regionName}</span>
                      <small>{dashboardDataService.labelForClassRegionAccess(access.access)}{readOnly ? ' · read-only' : ''}</small>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Audit trail</span>
              <h2>Recent admin audit events</h2>
            </div>
          </div>
          <div className="admin-list audit-list">
            {auditEvents.length === 0 ? (
              <article>
                <strong>No audit events shown</strong>
                <span>{source.kind === 'supabase' ? 'The read-only Supabase adapter does not read audit events in this pass.' : 'No mock audit events are available.'}</span>
              </article>
            ) : auditEvents.map((event) => (
              <article key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.targetType}: {event.targetLabel}</span>
                <small>{event.actorName} · {formatTime(event.createdAt)}</small>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
