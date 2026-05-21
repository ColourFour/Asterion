import type { ReactNode } from 'react';
import type { AsterionRole } from '../../types';
import { hasSupabaseRole, roleSummary, useSupabaseRoleContext, type SupabaseRoleContext, type SupabaseRoleServiceOptions } from '../../lib/supabaseRoleService';
import { SupabaseAuthPanel } from './SupabaseAuthPanel';

type DashboardRole = Extract<AsterionRole, 'admin' | 'teacher'>;

interface RoleGateProps {
  requiredRole: DashboardRole;
  roleServiceOptions?: SupabaseRoleServiceOptions;
  onNavigatePath: (path: string) => void;
  children: (context: SupabaseRoleContext) => ReactNode;
}

function roleLabel(role: DashboardRole): string {
  return role === 'admin' ? 'admin' : 'teacher';
}

function roleRouteLabel(role: DashboardRole): string {
  return role === 'admin' ? 'admin console' : 'teacher dashboard';
}

function missingRoleMessage(role: DashboardRole): string {
  return role === 'admin'
    ? 'Admin access was not found for this account. Use the bootstrapped admin account or complete admin setup.'
    : 'Teacher access was not found for this account. Ask the Asterion admin to add this email as a teacher, or use an active admin account.';
}

function DashboardAccessNav({
  context,
  onNavigatePath,
}: {
  context?: SupabaseRoleContext;
  onNavigatePath: (path: string) => void;
}) {
  const canUseTeacher = hasSupabaseRole(context, 'teacher');
  const canUseAdmin = hasSupabaseRole(context, 'admin');

  return (
    <nav className="dashboard-nav" aria-label="Dashboard navigation">
      {canUseTeacher ? <button type="button" onClick={() => onNavigatePath('/teacher')}>Teacher</button> : null}
      {canUseAdmin ? <button type="button" onClick={() => onNavigatePath('/admin')}>Admin</button> : null}
      <button type="button" onClick={() => onNavigatePath('/')}>Student app</button>
    </nav>
  );
}

function DashboardAccessState({
  title,
  message,
  detail,
  context,
  showAuthPanel,
  onNavigatePath,
}: {
  title: string;
  message: string;
  detail?: string;
  context?: SupabaseRoleContext;
  showAuthPanel?: boolean;
  onNavigatePath: (path: string) => void;
}) {
  return (
    <main className="app-shell app-view-dashboard">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div>
            <span className="mode-pill">Hosted dashboard access</span>
            <h1>{title}</h1>
            <p>{message}</p>
          </div>
          <DashboardAccessNav context={context} onNavigatePath={onNavigatePath} />
        </header>
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">Dashboard data source</span>
              <h2>Supabase classroom setup data</h2>
            </div>
          </div>
          <p>{context ? `Signed in as ${context.user.email ?? context.user.id}.` : 'Supabase session required.'}</p>
          {context ? <p>Active hosted roles: {roleSummary(context)}.</p> : null}
          {detail ? <p className="dashboard-muted">{detail}</p> : null}
        </section>
        {showAuthPanel ? (
          <SupabaseAuthPanel
            className="dashboard-auth-panel"
            title="Supabase dashboard session"
            signedOutMessage="Request a magic link for the email attached to your Asterion classroom role."
          />
        ) : null}
      </section>
    </main>
  );
}

export function RoleGate({ requiredRole, roleServiceOptions, onNavigatePath, children }: RoleGateProps) {
  const roleState = useSupabaseRoleContext(roleServiceOptions);
  const routeLabel = roleRouteLabel(requiredRole);
  const requiredRoleLabel = roleLabel(requiredRole);

  if (roleState.status === 'loading') {
    return (
      <DashboardAccessState
        title="Checking dashboard access"
        message={`Loading your Supabase session and hosted role context before opening the ${routeLabel}.`}
        onNavigatePath={onNavigatePath}
      />
    );
  }

  if (roleState.status === 'signed-out') {
    return (
      <DashboardAccessState
        title="Supabase sign-in required"
        message={`The ${routeLabel} requires a signed-in Supabase session and an active ${requiredRoleLabel} role.`}
        detail="Mock data is not shown in Supabase dashboard mode."
        showAuthPanel
        onNavigatePath={onNavigatePath}
      />
    );
  }

  if (roleState.status === 'error') {
    const configurationIssue = roleState.error.toLowerCase().includes('configuration');
    return (
      <DashboardAccessState
        title={configurationIssue ? 'Supabase dashboard not configured' : 'Dashboard access unavailable'}
        message={roleState.error}
        detail={roleState.detail}
        onNavigatePath={onNavigatePath}
      />
    );
  }

  if (!hasSupabaseRole(roleState.context, requiredRole)) {
    return (
      <DashboardAccessState
        title={`${requiredRoleLabel[0].toUpperCase()}${requiredRoleLabel.slice(1)} access required`}
        message={missingRoleMessage(requiredRole)}
        context={roleState.context}
        showAuthPanel
        onNavigatePath={onNavigatePath}
      />
    );
  }

  return (
    <>
      {roleState.context.warnings.map((warning) => (
        <div key={warning} className="classroom-sync-warning" role="status">
          {warning}
        </div>
      ))}
      {children(roleState.context)}
    </>
  );
}
