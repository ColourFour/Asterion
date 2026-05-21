import { ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SupabaseAuthPanel } from '../auth/SupabaseAuthPanel';
import { dashboardDataService, isDashboardDataServiceError, type DashboardServiceSource } from '../../lib/dashboardDataService';
import type { SupabaseAuthStatus } from '../../lib/supabaseAuth';
import { hasSupabaseRole, roleSummary, type SupabaseRoleContext } from '../../lib/supabaseRoleService';
import type { AdminAuditEvent, AdminClassRecord, AdminTeacherRecord } from '../../types';
import { DashboardShell, type DashboardNavItem, type DashboardTabItem } from './DashboardShell';
import { SupabaseDiagnosticPanel } from './SupabaseDiagnosticPanel';

interface AdminDashboardProps {
  hostedRoleContext?: SupabaseRoleContext;
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
  hostedRoleContext,
  onAuthStatusChange,
}: {
  issue: DashboardLoadIssue;
  onNavigatePath: (path: string) => void;
  source: DashboardServiceSource;
  hostedRoleContext?: SupabaseRoleContext;
  onAuthStatusChange: (status: SupabaseAuthStatus) => void;
}) {
  const showTeacherNav = source.kind === 'mock' || hasSupabaseRole(hostedRoleContext, 'teacher');
  const navItems: DashboardNavItem[] = [
    ...(showTeacherNav ? [{ label: 'Teacher', onClick: () => onNavigatePath('/teacher') }] : []),
    { label: 'Admin', active: true, onClick: () => onNavigatePath('/admin') },
    { label: 'Student app', onClick: () => onNavigatePath('/') },
  ];

  return (
    <main className="app-shell app-view-dashboard">
      <DashboardShell className="admin-dashboard" kicker="Asterion dashboard" title={issue.title} description={issue.message} navItems={navItems}>
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
            title="Sign in for Supabase admin reads"
            signedOutMessage="Request a magic link for the email attached to your Asterion Supabase role."
            onStatusChange={onAuthStatusChange}
          />
        ) : null}
        <SupabaseDiagnosticPanel />
      </DashboardShell>
    </main>
  );
}

function organizationLabel(context: SupabaseRoleContext | undefined): string {
  if (!context) return 'Demo organization';
  const adminOrganizationIds = context.roles
    .filter((role) => role.role === 'admin' && role.status === 'active')
    .map((role) => role.organizationId);
  const labels = adminOrganizationIds.map((organizationId) => {
    const organization = context.organizations.find((item) => item.id === organizationId);
    return organization?.name ?? organizationId;
  });
  return labels.length ? labels.join(', ') : context.organizationIds.join(', ') || 'Hosted organization';
}

function primaryAdminOrganizationId(context: SupabaseRoleContext | undefined): string | undefined {
  const adminOrganizationIds = context?.roles
    .filter((role) => role.role === 'admin' && role.status === 'active')
    .map((role) => role.organizationId) ?? [];
  return adminOrganizationIds.length === 1 ? adminOrganizationIds[0] : undefined;
}

function teacherStatusLabel(status: AdminTeacherRecord['status']): string {
  if (status === 'pending') return 'Pending sign-in';
  if (status === 'inactive') return 'Inactive';
  if (status === 'archived') return 'Archived';
  if (status === 'disabled') return 'Disabled';
  return 'Teacher access active';
}

function teacherCanOwnClass(status: AdminTeacherRecord['status']): boolean {
  return status === 'active' || status === 'pending';
}

export function AdminDashboard({ hostedRoleContext, onNavigatePath }: AdminDashboardProps) {
  const source = dashboardDataService.source;
  const readOnly = source.readOnly;
  const showTeacherNav = source.kind === 'mock' || hasSupabaseRole(hostedRoleContext, 'teacher');
  const adminOrganizationLabel = organizationLabel(hostedRoleContext);
  const adminOrganizationId = primaryAdminOrganizationId(hostedRoleContext);
  const [teachers, setTeachers] = useState<AdminTeacherRecord[]>([]);
  const [classes, setClasses] = useState<AdminClassRecord[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [loadIssue, setLoadIssue] = useState<DashboardLoadIssue>();
  const [query, setQuery] = useState('');
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [classForm, setClassForm] = useState({ name: '', teacherId: '', academicYearTerm: '2026 Term 2', code: '' });
  const [actionIssue, setActionIssue] = useState<string>();
  const [actionMessage, setActionMessage] = useState<string>();
  const [authStatus, setAuthStatus] = useState<SupabaseAuthStatus>(source.kind === 'supabase' ? 'loading' : 'signed-out');

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
      setClassForm((current) => ({ ...current, teacherId: current.teacherId || nextTeachers.find((teacher) => teacherCanOwnClass(teacher.status))?.id || '' }));
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
        setLoadIssue(undefined);
        setClassForm((current) => ({ ...current, teacherId: current.teacherId || nextTeachers.find((teacher) => teacherCanOwnClass(teacher.status))?.id || '' }));
      } catch (error) {
        if (!cancelled) setLoadIssue(issueForDashboardError(error));
      }
    }
    loadAdminRecords();
    return () => {
      cancelled = true;
    };
  }, [source.kind, authStatus]);

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
  const firstRunEmpty = source.kind === 'supabase' && teachers.length === 0 && classes.length === 0;
  const navItems: DashboardNavItem[] = [
    ...(showTeacherNav ? [{ label: 'Teacher', onClick: () => onNavigatePath('/teacher') }] : []),
    { label: 'Admin', active: true, onClick: () => onNavigatePath('/admin') },
    { label: 'Student app', onClick: () => onNavigatePath('/') },
  ];
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const adminTabs: DashboardTabItem[] = [
    { label: 'Overview', active: true, onClick: () => scrollToSection('admin-overview') },
    { label: 'Teachers', onClick: () => scrollToSection('admin-teachers') },
    { label: 'Classes', onClick: () => scrollToSection('admin-classes') },
    { label: 'Region access', onClick: () => scrollToSection('admin-region-access') },
    { label: 'Diagnostics', onClick: () => scrollToSection('admin-diagnostics') },
  ];

  async function handleAddTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) return;
    try {
      setActionIssue(undefined);
      setActionMessage(undefined);
      const teacher = await dashboardDataService.addAdminTeacher({ name: teacherForm.name, email: teacherForm.email, organizationId: adminOrganizationId });
      setActionMessage(teacher.status === 'pending'
        ? 'Teacher added as pending. They can sign in with this email to activate access.'
        : 'Teacher access active.');
      setTeacherForm({ name: '', email: '' });
      await refreshAdminRecords();
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Teacher could not be added.');
    }
  }

  async function handleAddClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    if (!classForm.name.trim() || !classForm.teacherId) return;
    try {
      setActionIssue(undefined);
      setActionMessage(undefined);
      await dashboardDataService.addAdminClass(classForm);
      setClassForm((current) => ({ name: '', teacherId: current.teacherId, academicYearTerm: current.academicYearTerm, code: '' }));
      await refreshAdminRecords();
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Class could not be created.');
    }
  }

  async function toggleRegion(classId: string, regionId: string, open: boolean) {
    if (readOnly) return;
    try {
      setActionIssue(undefined);
      setActionMessage(undefined);
      await dashboardDataService.setClassRegionAccess({ actorRole: 'admin', classId, regionId, access: open ? 'open' : 'field_guide_only' });
      await refreshAdminRecords();
    } catch (error) {
      setActionIssue(isDashboardDataServiceError(error) ? error.safeMessage : error instanceof Error ? error.message : 'Region access could not be updated.');
    }
  }

  if (loadIssue) {
    return <DashboardBlockedState issue={loadIssue} onNavigatePath={onNavigatePath} source={source} hostedRoleContext={hostedRoleContext} onAuthStatusChange={setAuthStatus} />;
  }

  return (
    <main className="app-shell app-view-dashboard">
      <DashboardShell
        className="admin-dashboard"
        kicker="Asterion dashboard"
        title="Admin Console"
        description={<>{source.label}{readOnly ? ' · read-only' : ''}. Curriculum, topic routing, canonical content, and image paths are not editable here.</>}
        detail={source.detail}
        navItems={navItems}
        tabs={adminTabs}
      >

        {source.kind === 'supabase' ? (
          <SupabaseAuthPanel
            className="dashboard-auth-panel"
            title="Supabase admin session"
            signedOutMessage="Sign in to refresh authorized admin rows."
            onStatusChange={setAuthStatus}
          />
        ) : null}

        <section id="admin-overview" className="dashboard-section admin-identity">
          <ShieldCheck size={22} />
          <div>
            <span className="dashboard-kicker">{hostedRoleContext ? 'Signed-in hosted admin' : 'Demo admin identity'}</span>
            <h2>{hostedRoleContext?.user.email ?? 'Support Admin'}</h2>
            <p>Organization: {adminOrganizationLabel} · role: {hostedRoleContext ? roleSummary(hostedRoleContext) : 'admin'} · destructive support actions are disabled in this v0. {readOnly ? 'Supabase writes are disabled.' : ''}</p>
          </div>
        </section>

        <section className="admin-overview-grid" aria-label="Admin overview">
          <article className="snapshot-card primary-snapshot">
            <span>Teachers</span>
            <strong>{teachers.length}</strong>
            <small>{teachers.filter((teacher) => teacher.status === 'active').length} active · {teachers.filter((teacher) => teacher.status === 'pending').length} pending</small>
          </article>
          <article className="snapshot-card">
            <span>Classes</span>
            <strong>{classes.length}</strong>
            <small>{classes.filter((teacherClass) => teacherClass.status === 'active').length} active class records</small>
          </article>
          <article className="snapshot-card">
            <span>Roster slots</span>
            <strong>{classes.reduce((total, teacherClass) => total + teacherClass.rosterStudentIds.length, 0)}</strong>
            <small>across visible classes</small>
          </article>
          <article className="snapshot-card">
            <span>Locked regions</span>
            <strong>{classes.reduce((total, teacherClass) => total + teacherClass.regionAccess.filter((access) => access.access !== 'open').length, 0)}</strong>
            <small>still visible in exports and progress views</small>
          </article>
        </section>

        {firstRunEmpty ? (
          <section className="dashboard-section dashboard-empty-state" aria-label="First-run admin setup">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">First-run setup</span>
                <h2>{adminOrganizationLabel}</h2>
              </div>
            </div>
            <p>No teachers or classes exist for this organization yet. Your active admin role is enough to open the admin shell; classroom rows will appear after you attach a teacher and create a class.</p>
            {readOnly ? (
              <p className="dashboard-muted">Teacher setup is disabled because this dashboard data source is read-only.</p>
            ) : (
              <p className="dashboard-muted">Use Add teacher below. In Supabase mode this calls public.admin_add_teacher_by_email(...) and remains limited by hosted roles plus RLS.</p>
            )}
          </section>
        ) : null}

        <section className="dashboard-control-row">
          <label>
            Search support records
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Teacher, class, or join code" />
          </label>
        </section>

        <div id="admin-diagnostics">
          <SupabaseDiagnosticPanel />
        </div>

        {actionIssue ? (
          <section className="dashboard-section dashboard-error-state" role="alert">
            <strong>Action failed</strong>
            <p>{actionIssue}</p>
          </section>
        ) : null}
        {actionMessage ? (
          <section className="dashboard-section" role="status">
            <strong>{actionMessage}</strong>
          </section>
        ) : null}

        <div className="admin-grid">
          <section id="admin-teachers" className="dashboard-section">
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
                {source.kind === 'supabase' ? <small className="dashboard-muted">Teacher added as pending. They can sign in with this email to activate access.</small> : null}
              </form>
            )}
            <div className="admin-list">
              {filteredTeachers.map((teacher) => (
                <article key={teacher.id}>
                  <strong>{teacher.name}</strong>
                  <span>{teacher.email}</span>
                  <small>{classes.filter((item) => item.teacherId === teacher.id && item.status === 'active').length} assigned classes · {teacherStatusLabel(teacher.status)} · updated {formatTime(teacher.updatedAt)}</small>
                </article>
              ))}
            </div>
          </section>

          <section id="admin-classes" className="dashboard-section">
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
                  {teachers.filter((teacher) => teacherCanOwnClass(teacher.status)).map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.status === 'pending' ? ' (pending sign-in)' : ''}</option>
                  ))}
                </select>
                <input value={classForm.academicYearTerm} onChange={(event) => setClassForm({ ...classForm, academicYearTerm: event.target.value })} placeholder="Academic year/term" />
                <input value={classForm.code} onChange={(event) => setClassForm({ ...classForm, code: event.target.value })} placeholder="Class code (optional)" />
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
                  {showTeacherNav ? (
                    <button type="button" className="quiet-button compact-button" onClick={() => onNavigatePath(`/teacher/classes/${teacherClass.id}`)}>Inspect class data</button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <section id="admin-region-access" className="dashboard-section">
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
                <span>{source.kind === 'supabase' ? 'The Supabase dashboard adapter does not read audit events in this pass.' : 'No mock audit events are available.'}</span>
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
      </DashboardShell>
    </main>
  );
}
