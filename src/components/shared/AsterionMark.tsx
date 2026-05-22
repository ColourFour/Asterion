export function AsterionMark() {
  return (
    <div className="asterion-emblem" role="img" aria-label="Golden Asterion A emblem" data-testid="asterion-emblem">
      <span className="emblem-orbit" aria-hidden="true">
        <span className="emblem-orbit-star" />
      </span>
      <svg className="asterion-emblem-mark" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="emblemGlowShared" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#fff7be" />
            <stop offset="48%" stopColor="#efb536" />
            <stop offset="100%" stopColor="#7c4510" />
          </radialGradient>
          <linearGradient id="emblemGoldShared" x1="64" x2="174" y1="54" y2="184" gradientUnits="userSpaceOnUse">
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
