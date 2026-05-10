import { CheckCircle2, Target } from 'lucide-react';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface QuickChecksPanelProps {
  teachingSnippets: TeachingSnippet[];
  maxInitialItems?: number;
}

export function QuickChecksPanel({ teachingSnippets, maxInitialItems = 2 }: QuickChecksPanelProps) {
  const examplesById = new Map(
    teachingSnippets.flatMap((snippet) => (
      snippet.workedExamples.flatMap((example) => (
        example.id
          ? [[example.id, { example }] as const]
          : []
      ))
    )),
  );
  const checks = teachingSnippets.flatMap((snippet) => (
    snippet.quickCheck
      ? [{
        snippetId: snippet.snippetId,
        title: snippet.title,
        check: snippet.quickCheck,
        linkedExample: snippet.quickCheck.exampleModelId ? examplesById.get(snippet.quickCheck.exampleModelId) : undefined,
      }]
      : []
  ));
  const visibleChecks = checks.slice(0, maxInitialItems);
  const hiddenCheckCount = Math.max(0, checks.length - visibleChecks.length);

  return (
    <RegionActionCard
      eyebrow="Step 2"
      title="Quick Checks"
      description="Two short self-checks before you move into practice."
      icon={<Target size={22} />}
      stateIcon={checks.length ? <CheckCircle2 size={22} aria-label={`${checks.length} quick checks available`} /> : undefined}
      className="quick-check-card"
    >
      {visibleChecks.length ? (
        <>
          <div className="quick-check-list">
            {visibleChecks.map(({ snippetId, title, check, linkedExample }) => (
              <details className="quick-check-reveal" key={snippetId}>
                <summary>Quick check: {title}</summary>
                <p><MathText text={check.prompt} /></p>
                {linkedExample ? (
                  <small className="quick-check-example-link">
                    Linked example: <MathText text={linkedExample.example.prompt} />
                  </small>
                ) : null}
                <div>
                  <strong>Answer</strong>
                  <p><MathText text={check.answer} /></p>
                  <small><MathText text={check.explanation} /></small>
                </div>
              </details>
            ))}
          </div>
          {hiddenCheckCount ? <small className="region-card-note">{hiddenCheckCount} more reviewed quick check{hiddenCheckCount === 1 ? '' : 's'} available.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">No reviewed quick checks are published for this region yet. Use the Field Guide and exam practice route.</p>
      )}
    </RegionActionCard>
  );
}
