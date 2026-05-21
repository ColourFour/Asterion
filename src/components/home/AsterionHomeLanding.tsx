interface AsterionHomeLandingProps {
  onStudentEntry: () => void;
  onTeacherEntry: () => void;
  onAdminEntry: () => void;
}

function AsterionMark() {
  return (
    <div className="asterion-emblem" role="img" aria-label="Golden Asterion A emblem" data-testid="asterion-emblem">
      <span className="emblem-orbit" aria-hidden="true">
        <span className="emblem-orbit-star" />
      </span>
      <svg className="asterion-emblem-mark" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="emblemGlowHome" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#fff7be" />
            <stop offset="48%" stopColor="#efb536" />
            <stop offset="100%" stopColor="#7c4510" />
          </radialGradient>
          <linearGradient id="emblemGoldHome" x1="64" x2="174" y1="54" y2="184" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff2a8" />
            <stop offset="54%" stopColor="#f0b638" />
            <stop offset="100%" stopColor="#a76018" />
          </linearGradient>
        </defs>
        <circle className="emblem-aura" cx="120" cy="120" r="94" />
        <circle className="emblem-ring" cx="120" cy="120" r="78" />
        <path className="emblem-cross-orbit" d="M44 132c35-43 72-65 111-66 26-1 49 8 69 28" />
        <path className="emblem-cross-orbit" d="M38 152c38 21 78 27 121 17 25-6 46-19 63-39" />
        <text className="emblem-letter" x="120" y="158" textAnchor="middle">A</text>
      </svg>
    </div>
  );
}

export function AsterionHomeLanding({ onStudentEntry, onTeacherEntry, onAdminEntry }: AsterionHomeLandingProps) {
  return (
    <main className="app-shell home-landing-shell">
      <section className="home-landing-panel" aria-labelledby="home-landing-title">
        <div className="home-landing-copy">
          <span className="mode-pill">CAIE 9709 · Paper 3 Astral Academy</span>
          <h1 id="home-landing-title">Asterion</h1>
          <p>Image-first Paper 3 practice, classroom roster access, and teacher progress views in one academy entry point.</p>
        </div>

        <AsterionMark />

        <div className="home-entry-card" aria-label="Asterion entry actions">
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
        </div>
      </section>
    </main>
  );
}
