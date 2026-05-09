import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import type { RegionFieldGuide } from '../../../data/regionFieldGuides';
import type { RegionTheme } from '../../../lib/regionThemes';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';
import { RegionGuideCallout } from './RegionGuideCallout';

interface FieldGuidePanelProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  theme: RegionTheme;
  teachingSnippets: TeachingSnippet[];
  onCompleteFieldGuide: () => void;
}

export function FieldGuidePanel({ fieldGuide, fieldGuideCompleted, theme, teachingSnippets, onCompleteFieldGuide }: FieldGuidePanelProps) {
  const visibleSnippets = teachingSnippets.slice(0, 3);
  const hiddenSnippetCount = Math.max(0, teachingSnippets.length - visibleSnippets.length);

  return (
    <RegionActionCard
      eyebrow="Step 1"
      title="Field Guide"
      description="Learn the core idea and the exam moves that protect marks."
      icon={<BookOpenCheck size={22} />}
      stateIcon={fieldGuideCompleted ? <CheckCircle2 size={22} aria-label="Field Guide complete" /> : undefined}
      className="field-guide-card"
    >
      <RegionGuideCallout theme={theme} />

      <section>
        <h4>What this topic is</h4>
        <p><MathText text={fieldGuide.topic} /></p>
      </section>

      {visibleSnippets.length ? (
        <section>
          <h4>Teaching snippets</h4>
          <div className="teaching-snippet-grid">
            {visibleSnippets.map((snippet) => (
              <article className="teaching-snippet-card" key={snippet.snippetId}>
                <div className="teaching-snippet-heading">
                  <strong>{snippet.title}</strong>
                  {snippet.snippetType ? <span>{snippet.snippetType.replace(/_/g, ' ')}</span> : null}
                  {snippet.estimatedTimeMinutes ? <small>{snippet.estimatedTimeMinutes} min</small> : null}
                </div>
                <p><MathText text={snippet.studentGoal} /></p>
                <p><MathText text={snippet.body} /></p>
                <div className="snippet-mini-section">
                  <b>Micro steps:</b>
                  <ul>
                    {(snippet.microSteps.length ? snippet.microSteps : snippet.steps).slice(0, 3).map((step) => <li key={step}><MathText text={step} /></li>)}
                  </ul>
                </div>
                {snippet.commonMistakes.length ? (
                  <details className="snippet-detail-reveal">
                    <summary>Common mistakes</summary>
                    <ul>{snippet.commonMistakes.slice(0, 3).map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
                  </details>
                ) : null}
                <small><b>Exam move:</b> <MathText text={snippet.examMove} /></small>
                <small><b>Trap:</b> <MathText text={snippet.commonTrap} /></small>
                {snippet.guardianReadiness ? <small><b>Guardian:</b> <MathText text={snippet.guardianReadiness.readinessNote} /></small> : null}
              </article>
            ))}
          </div>
          {hiddenSnippetCount ? <small className="region-card-note">{hiddenSnippetCount} more reviewed snippet{hiddenSnippetCount === 1 ? '' : 's'} available for this region.</small> : null}
        </section>
      ) : null}

      <div className="guide-reference-grid">
        <details open>
          <summary>What to recognize</summary>
          <ul>{fieldGuide.whatToRecognize.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
        </details>
        <details>
          <summary>Common exam moves</summary>
          <ul>{fieldGuide.commonExamMoves.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
        </details>
        <details>
          <summary>Common traps</summary>
          <ul>{fieldGuide.commonTraps.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
        </details>
        <details>
          <summary>Worked-example cards</summary>
          <div className="worked-example-grid">
            {fieldGuide.workedExamples.map((example) => (
              <div className="worked-example-card" key={example.title}>
                <strong>{example.title}</strong>
                <span><MathText text={example.focus} /></span>
                {example.setup ? <small><MathText text={example.setup} /></small> : null}
                {example.keyMove ? <small><b>Move:</b> <MathText text={example.keyMove} /></small> : null}
                {example.check ? <small><b>Check:</b> <MathText text={example.check} /></small> : null}
              </div>
            ))}
          </div>
        </details>
        <details>
          <summary>Before training, make sure you can...</summary>
          <ul className="readiness-list">{fieldGuide.readinessChecklist.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
        </details>
      </div>

      <button className="primary-button" type="button" disabled={fieldGuideCompleted} onClick={onCompleteFieldGuide}>
        {fieldGuideCompleted ? 'Field Guide complete' : 'Mark Field Guide complete'}
      </button>
    </RegionActionCard>
  );
}
