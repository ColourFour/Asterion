import { AsterionEntryShell } from '../shared/AsterionEntryShell';

interface AsterionHomeLandingProps {
  onStudentEntry: () => void;
  onTeacherEntry: () => void;
  onAdminEntry: () => void;
  showStaffEntries?: boolean;
}

export function AsterionHomeLanding({ onStudentEntry, onTeacherEntry, onAdminEntry, showStaffEntries = true }: AsterionHomeLandingProps) {
  return (
    <AsterionEntryShell
      eyebrow="CAIE 9709 · Paper 3 Astral Academy"
      description={showStaffEntries
        ? 'Image-first Paper 3 practice, classroom roster access, and teacher progress views in one academy entry point.'
        : 'Image-first Paper 3 practice starts by claiming your class roster slot.'}
      cardLabel="Asterion entry actions"
      copyId="home-landing-title"
    >
      <button type="button" className="primary-button home-primary-entry" onClick={onStudentEntry}>
        Student entry
        <span>Sign in and claim your teacher-created roster slot.</span>
      </button>
      {showStaffEntries ? (
        <div className="home-staff-entry-grid">
          <button type="button" className="quiet-button" onClick={onTeacherEntry}>
            Teacher login
          </button>
          <button type="button" className="quiet-button" onClick={onAdminEntry}>
            Admin login
          </button>
        </div>
      ) : null}
    </AsterionEntryShell>
  );
}
