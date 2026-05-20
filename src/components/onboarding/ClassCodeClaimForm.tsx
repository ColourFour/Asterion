import { useMemo, useState, type FormEvent } from 'react';
import { SupabaseAuthPanel } from '../auth/SupabaseAuthPanel';
import { resolveRuntimeConfig } from '../../lib/appConfig';
import type { SupabaseAuthStatus } from '../../lib/supabaseAuth';
import { claimStudentRosterSlot } from '../../lib/studentClassClaimService';
import type { StudentClaimState } from '../../types';

interface ClassCodeClaimFormProps {
  onClaimed: (claim: StudentClaimState) => void;
}

export function ClassCodeClaimForm({ onClaimed }: ClassCodeClaimFormProps) {
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const hostedClaimMode = runtimeConfig.studentClassClaimSource === 'supabase';
  const [classCode, setClassCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [optionalEmail, setOptionalEmail] = useState('');
  const [claimState, setClaimState] = useState<StudentClaimState>();
  const [submitting, setSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<SupabaseAuthStatus>(hostedClaimMode ? 'loading' : 'signed-out');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hostedClaimMode && authStatus !== 'signed-in') {
      setClaimState({
        status: 'unauthenticated',
        message: 'Sign in with Supabase before claiming a hosted roster slot.',
      });
      return;
    }
    setSubmitting(true);
    const nextClaim = await claimStudentRosterSlot({
      classCode,
      displayName,
      optionalEmail: optionalEmail.trim() || undefined,
    });
    setClaimState(nextClaim);
    setSubmitting(false);
    if (nextClaim.status === 'claimed') {
      onClaimed(nextClaim);
    }
  }

  return (
    <form className="profile-form class-code-claim-form" onSubmit={handleSubmit} aria-label="Claim class roster slot">
      <div className="claim-form-heading">
        <span className="mode-pill">Class access required</span>
        <h2>Join your teacher's class</h2>
        <p>Enter the class code your teacher gave you. Next you will name your character, then open the P3 world map.</p>
        <p className="claim-form-note">This starts a local browser profile, not a cross-device gradebook.</p>
      </div>

      {hostedClaimMode ? (
        <SupabaseAuthPanel
          className="class-code-auth-panel"
          title="Sign in before hosted roster claim"
          signedOutMessage="Hosted class claiming uses Supabase Auth. Request a magic link, then return here to claim your existing roster name."
          onStatusChange={setAuthStatus}
        />
      ) : null}

      {runtimeConfig.studentClassClaimNotice ? <p className="claim-state-message">{runtimeConfig.studentClassClaimNotice}</p> : null}

      <label>
        Class code
        <input value={classCode} onChange={(event) => setClassCode(event.target.value.toUpperCase())} placeholder="AST-P3A" required />
      </label>

      <label>
        Roster name
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name as your teacher entered it" required />
      </label>

      <label>
        Email, optional
        <input type="email" value={optionalEmail} onChange={(event) => setOptionalEmail(event.target.value)} placeholder="Add later if preferred" />
      </label>

      {claimState ? (
        <p className={`claim-state-message claim-${claimState.status}`} role="status">
          {claimState.message}
        </p>
      ) : (
        <p className="claim-state-message">If your name is missing, ask your teacher. You cannot add yourself.</p>
      )}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Checking roster...' : hostedClaimMode && authStatus !== 'signed-in' ? 'Sign in to claim roster slot' : 'Claim roster slot'}
      </button>
    </form>
  );
}
