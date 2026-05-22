import { useMemo, useState, type FormEvent } from 'react';
import { resolveRuntimeConfig } from '../../lib/appConfig';
import { claimStudentRosterSlot } from '../../lib/studentClassClaimService';
import type { StudentClaimState } from '../../types';

interface ClassCodeClaimFormProps {
  onClaimed: (claim: StudentClaimState) => void;
}

export function ClassCodeClaimForm({ onClaimed }: ClassCodeClaimFormProps) {
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const hostedClaimMode = runtimeConfig.studentClassClaimSource === 'supabase';
  const hostedClaimConfigBlocked = hostedClaimMode && !runtimeConfig.supabaseConfigured;
  const claimHelperId = 'class-code-claim-helper';
  const claimStatusId = 'class-code-claim-status';
  const [classCode, setClassCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [claimState, setClaimState] = useState<StudentClaimState>();
  const [submitting, setSubmitting] = useState(false);
  const describedBy = claimState ? claimStatusId : claimHelperId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hostedClaimConfigBlocked) {
      setClaimState({
        status: 'claim_unavailable',
        message: runtimeConfig.studentClassClaimNotice ?? 'Classroom entry is unavailable. Tell your teacher.',
      });
      return;
    }
    setSubmitting(true);
    const nextClaim = await claimStudentRosterSlot({
      classCode,
      displayName,
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
        <p>{hostedClaimMode ? 'Enter the class code and roster name your teacher gave you.' : 'Enter the class code your teacher gave you. Next you will name your character, then open the P3 world map.'}</p>
        <p className="claim-form-note">{hostedClaimMode ? 'Your teacher must add your roster name first. You cannot add yourself to a class.' : 'Use the class code and roster name provided by your teacher.'}</p>
      </div>

      {hostedClaimConfigBlocked ? (
        <p className="form-error" role="alert">
          {runtimeConfig.studentClassClaimNotice ?? 'Classroom entry is unavailable. Tell your teacher.'}
        </p>
      ) : null}

      {runtimeConfig.studentClassClaimNotice ? <p className="claim-state-message">{runtimeConfig.studentClassClaimNotice}</p> : null}

      <label>
        Class code
        <input
          aria-describedby={describedBy}
          value={classCode}
          onChange={(event) => setClassCode(event.target.value.toUpperCase())}
          placeholder="AST-P3A"
          required
        />
      </label>

      <label>
        Roster name
        <input
          aria-describedby={describedBy}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name as your teacher entered it"
          required
        />
      </label>

      {claimState ? (
        <p className={`claim-state-message claim-${claimState.status}`} id={claimStatusId} role="status">
          {claimState.message}
        </p>
      ) : (
        <p className="claim-state-message" id={claimHelperId}>If your name is missing, ask your teacher. You cannot add yourself.</p>
      )}

      <button className="primary-button" type="submit" disabled={submitting || hostedClaimConfigBlocked}>
        {hostedClaimConfigBlocked ? 'Classroom unavailable' : submitting ? 'Checking roster...' : hostedClaimMode ? 'Enter class' : 'Claim roster slot'}
      </button>
    </form>
  );
}
