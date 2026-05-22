import type { ReactNode } from 'react';
import { AsterionMark } from './AsterionMark';

interface AsterionEntryShellProps {
  eyebrow: string;
  title?: string;
  description: string;
  children: ReactNode;
  cardLabel: string;
  className?: string;
  copyId?: string;
}

export function AsterionEntryShell({
  eyebrow,
  title = 'Asterion',
  description,
  children,
  cardLabel,
  className,
  copyId = 'asterion-entry-title',
}: AsterionEntryShellProps) {
  const shellClassName = ['app-shell home-landing-shell asterion-entry-shell', className].filter(Boolean).join(' ');

  return (
    <main className={shellClassName}>
      <section className="home-landing-panel" aria-labelledby={copyId}>
        <div className="home-landing-copy">
          <span className="mode-pill">{eyebrow}</span>
          <h1 id={copyId}>{title}</h1>
          <p>{description}</p>
        </div>

        <AsterionMark />

        <div className="home-entry-card" aria-label={cardLabel}>
          {children}
        </div>
      </section>
    </main>
  );
}
