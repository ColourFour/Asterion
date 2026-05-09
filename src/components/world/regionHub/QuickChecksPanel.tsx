import { CheckCircle2, Target } from 'lucide-react';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface QuickChecksPanelProps {
  teachingSnippets: TeachingSnippet[];
}

export function QuickChecksPanel({ teachingSnippets }: QuickChecksPanelProps) {
  const checks = teachingSnippets.flatMap((snippet) => (
    snippet.quickCheck
      ? [{
        snippetId: snippet.snippetId,
        title: snippet.title,
        check: snippet.quickCheck,
      }]
      : []
  ));

  return (
    <RegionActionCard
      eyebrow="Confidence stop"
      title="Quick Checks"
      description="Small revealable checks before you move into practice."
      icon={<Target size={22} />}
      stateIcon={checks.length ? <CheckCircle2 size={22} aria-label={`${checks.length} quick checks available`} /> : undefined}
      className="quick-check-card"
    >
      {checks.length ? (
        <div className="quick-check-list">
          {checks.map(({ snippetId, title, check }) => (
            <details className="quick-check-reveal" key={snippetId}>
              <summary>Quick check: {title}</summary>
              <p><MathText text={check.prompt} /></p>
              <div>
                <strong>Answer</strong>
                <p><MathText text={check.answer} /></p>
                <small><MathText text={check.explanation} /></small>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="region-empty-state">No reviewed quick checks are published for this region yet. Use the Field Guide and exam practice route.</p>
      )}
    </RegionActionCard>
  );
}
