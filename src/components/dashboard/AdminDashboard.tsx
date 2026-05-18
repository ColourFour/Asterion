import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { listAdminAuditEvents, listAdminClasses, listAdminTeachers } from '../../lib/dashboardMockService';
import type { AdminAuditEvent, AdminTeacherSummary, TeacherClass } from '../../types';

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

export function AdminDashboard({ onNavigatePath }: AdminDashboardProps) {
  const [teachers, setTeachers] = useState<AdminTeacherSummary[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAdminTeachers(), listAdminClasses(), listAdminAuditEvents()]).then(([nextTeachers, nextClasses, nextAuditEvents]) => {
      if (cancelled) return;
      setTeachers(nextTeachers);
      setClasses(nextClasses);
      setAuditEvents(nextAuditEvents);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTeachers = useMemo(() => (
    normalizedQuery
      ? teachers.filter((teacher) => `${teacher.displayName} ${teacher.email}`.toLowerCase().includes(normalizedQuery))
      : teachers
  ), [normalizedQuery, teachers]);

  const filteredClasses = useMemo(() => (
    normalizedQuery
      ? classes.filter((teacherClass) => `${teacherClass.name} ${teacherClass.joinCode} ${teacherClass.teacherId}`.toLowerCase().includes(normalizedQuery))
      : classes
  ), [classes, normalizedQuery]);

  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell admin-dashboard">
        <header className="dashboard-topbar">
          <div>
            <span className="mode-pill">Asterion dashboard</span>
            <h1>Admin Console</h1>
            <p>Mock admin view for classroom support. Curriculum, topic routing, canonical content, and image paths are not editable here.</p>
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
            <p>Role: admin · destructive support actions are disabled in this v0.</p>
          </div>
        </section>

        <section className="dashboard-control-row">
          <label>
            Search support records
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Teacher, class, or join code" />
          </label>
        </section>

        <div className="admin-grid">
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">Teachers</span>
                <h2>Teacher list</h2>
              </div>
            </div>
            <div className="admin-list">
              {filteredTeachers.map((teacher) => (
                <article key={teacher.id}>
                  <strong>{teacher.displayName}</strong>
                  <span>{teacher.email}</span>
                  <small>{teacher.classCount} classes · active {formatTime(teacher.lastActivityAt)}</small>
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
            <div className="admin-list">
              {filteredClasses.map((teacherClass) => (
                <article key={teacherClass.id}>
                  <strong>{teacherClass.name}</strong>
                  <span>Join code {teacherClass.joinCode}</span>
                  <small>Teacher ID {teacherClass.teacherId} · created {formatTime(teacherClass.createdAt)}</small>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Disabled support actions</span>
              <h2>Repair tools planned for backend v1</h2>
            </div>
          </div>
          <div className="admin-action-row">
            <button type="button" disabled>Archive class</button>
            <button type="button" disabled>Reset join code</button>
            <button type="button" disabled>Move student</button>
            <button type="button" disabled>Repair progress snapshot</button>
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
            {auditEvents.map((event) => (
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
