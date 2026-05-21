import { useEffect, useState } from 'react';
import { useSupabaseAuthSession, type SupabaseAuthHookOptions, type SupabaseAuthStatus } from '../../lib/supabaseAuth';

interface SupabaseAuthPanelProps {
  className?: string;
  title?: string;
  signedOutMessage?: string;
  onStatusChange?: (status: SupabaseAuthStatus) => void;
  hookOptions?: SupabaseAuthHookOptions;
}

export function SupabaseAuthPanel({
  className,
  title = 'Supabase sign-in',
  signedOutMessage = 'Use your email to request a magic link.',
  onStatusChange,
  hookOptions,
}: SupabaseAuthPanelProps) {
  const auth = useSupabaseAuthSession(hookOptions);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionMessage, setActionMessage] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.status !== 'loading') onStatusChange?.(auth.status);
  }, [auth.status, onStatusChange]);

  async function handleSignIn() {
    setSubmitting(true);
    setActionError(undefined);
    setActionMessage(undefined);
    const result = await auth.signInWithOtp(email);
    setSubmitting(false);
    if (!result.ok) {
      setActionError(result.error ?? 'Supabase magic-link sign-in failed.');
      return;
    }
    setActionMessage('Check your email for the Asterion sign-in link.');
  }

  async function handlePasswordSignIn() {
    setSubmitting(true);
    setActionError(undefined);
    setActionMessage(undefined);
    const result = await auth.signInWithPassword(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setActionError(result.error ?? 'Supabase password sign-in failed.');
      return;
    }
    setPassword('');
    setActionMessage('Signed in with Supabase Auth.');
  }

  async function handleChangePassword() {
    setSubmitting(true);
    setActionError(undefined);
    setActionMessage(undefined);
    const result = await auth.updatePassword(newPassword);
    setSubmitting(false);
    if (!result.ok) {
      setActionError(result.error ?? 'Supabase password update failed.');
      return;
    }
    setNewPassword('');
    setActionMessage('Password updated.');
  }

  async function handleSignOut() {
    setSubmitting(true);
    setActionError(undefined);
    setActionMessage(undefined);
    const result = await auth.signOut();
    setSubmitting(false);
    if (!result.ok) {
      setActionError(result.error ?? 'Supabase sign-out failed.');
    }
  }

  return (
    <section className={`supabase-auth-panel ${className ?? ''}`.trim()} aria-label="Supabase authentication">
      <div className="supabase-auth-heading">
        <span className="dashboard-kicker">Authentication</span>
        <h2>{title}</h2>
      </div>

      {auth.status === 'loading' ? <p className="dashboard-muted">Checking Supabase session...</p> : null}

      {auth.status === 'error' ? (
        <p className="form-error" role="alert">{auth.error ?? 'Supabase Auth is unavailable.'}</p>
      ) : null}

      {auth.status === 'signed-in' ? (
        <div className="supabase-auth-signed-in">
          <p>
            Signed in as <strong>{auth.user?.email ?? auth.user?.id}</strong>.
          </p>
          <p className="dashboard-muted">Sign-in only authenticates the browser session. Teacher/admin access still depends on Supabase user_roles and RLS.</p>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>
          <button type="button" className="quiet-button" onClick={handleChangePassword} disabled={submitting}>
            {submitting ? 'Updating password...' : 'Change password'}
          </button>
          <button type="button" className="quiet-button" onClick={handleSignOut} disabled={submitting}>
            {submitting ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      ) : null}

      {auth.status === 'signed-out' ? (
        <div className="supabase-auth-form">
          <p className="dashboard-muted">{signedOutMessage}</p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Temporary or current password"
              autoComplete="current-password"
            />
          </label>
          <button type="button" className="primary-button" onClick={handlePasswordSignIn} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in with password'}
          </button>
          <button type="button" className="primary-button" onClick={handleSignIn} disabled={submitting}>
            {submitting ? 'Sending link...' : 'Send magic link'}
          </button>
          <p className="dashboard-muted">Sign-in does not guarantee teacher or admin access. Supabase user_roles and RLS decide what data is visible.</p>
        </div>
      ) : null}

      {actionMessage ? <p className="claim-state-message claim-claimed" role="status">{actionMessage}</p> : null}
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
    </section>
  );
}
