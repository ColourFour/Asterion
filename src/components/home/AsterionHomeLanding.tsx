import { AsterionEntryShell } from '../shared/AsterionEntryShell';

interface AsterionHomeLandingProps {
  onStudentEntry: () => void;
  onTeacherEntry: () => void;
  onAdminEntry: () => void;
}

export function AsterionHomeLanding({ onStudentEntry, onTeacherEntry, onAdminEntry }: AsterionHomeLandingProps) {
  return (
    <AsterionEntryShell
      eyebrow="CAIE 9709 · Paper 3 Astral Academy"
      description="Image-first Paper 3 practice, classroom roster access, and teacher progress views in one academy entry point."
      cardLabel="Asterion entry actions"
      copyId="home-landing-title"
    >
      <button type="button" className="primary-button home-primary-entry" onClick={onStudentEntry}>
        Student entry
        <span>Sign in and claim your teacher-created roster slot.</span>
      </button>
      <div className="home-staff-entry-grid">
        <button type="button" className="quiet-button" onClick={onTeacherEntry}>
          Teacher login
        </button>
        <button type="button" className="quiet-button" onClick={onAdminEntry}>
          Admin login
        </button>
      </div>
    </AsterionEntryShell>
  );
}
