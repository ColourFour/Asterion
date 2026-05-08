import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import type { RegionFieldGuide } from '../../../data/regionFieldGuides';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';

interface FieldGuidePanelProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  teachingSnippets: TeachingSnippet[];
  onCompleteFieldGuide: () => void;
}

export function FieldGuidePanel({ fieldGuide, fieldGuideCompleted, teachingSnippets, onCompleteFieldGuide }: FieldGuidePanelProps) {
  return (
    <article className="region-loop-card field-guide-card">
      <div className="region-loop-card-title">
        <BookOpenCheck size={22} />
        <div>
          <span>Phase 1</span>
          <h3>Field Guide</h3>
        </div>
        {fieldGuideCompleted ? <CheckCircle2 className="card-state-icon" size={22} aria-label="Field Guide complete" /> : null}
      </div>

      <section>
        <h4>What this topic is</h4>
        <p><MathText text={fieldGuide.topic} /></p>
      </section>

      {teachingSnippets.length ? (
        <section>
          <h4>Teaching snippets</h4>
          <div className="teaching-snippet-grid">
            {teachingSnippets.map((snippet) => (
              <article className="teaching-snippet-card" key={snippet.snippetId}>
                <div className="teaching-snippet-heading">
                  <strong>{snippet.title}</strong>
                  {snippet.snippetType ? <span>{snippet.snippetType.replace(/_/g, ' ')}</span> : null}
                  {snippet.estimatedTimeMinutes ? <small>{snippet.estimatedTimeMinutes} min</small> : null}
                </div>
                <p><MathText text={snippet.studentGoal} /></p>
                <p><MathText text={snippet.body} /></p>
                {snippet.prerequisites.length ? (
                  <div className="snippet-mini-section">
                    <b>Before this:</b>
                    <ul>{snippet.prerequisites.slice(0, 2).map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
                  </div>
                ) : null}
                <div className="snippet-mini-section">
                  <b>Micro steps:</b>
                  <ul>
                    {(snippet.microSteps.length ? snippet.microSteps : snippet.steps).slice(0, 4).map((step) => <li key={step}><MathText text={step} /></li>)}
                  </ul>
                </div>
                {snippet.commonMistakes.length ? (
                  <div className="snippet-mini-section">
                    <b>Common mistakes:</b>
                    <ul>{snippet.commonMistakes.slice(0, 3).map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
                  </div>
                ) : null}
                <small><b>Exam move:</b> <MathText text={snippet.examMove} /></small>
                <small><b>Trap:</b> <MathText text={snippet.commonTrap} /></small>
                {snippet.guardianReadiness ? <small><b>Guardian:</b> <MathText text={snippet.guardianReadiness.readinessNote} /></small> : null}
                {snippet.quickCheck ? (
                  <details className="quick-check-reveal">
                    <summary>Quick check</summary>
                    <p><MathText text={snippet.quickCheck.prompt} /></p>
                    <div>
                      <strong>Answer</strong>
                      <p><MathText text={snippet.quickCheck.answer} /></p>
                      <small><MathText text={snippet.quickCheck.explanation} /></small>
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h4>What to recognize</h4>
        <ul>{fieldGuide.whatToRecognize.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
      </section>

      <section>
        <h4>Common exam moves</h4>
        <ul>{fieldGuide.commonExamMoves.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
      </section>

      <section>
        <h4>Common traps</h4>
        <ul>{fieldGuide.commonTraps.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
      </section>

      <section>
        <h4>Worked-example cards</h4>
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
      </section>

      <section>
        <h4>Before training, make sure you can...</h4>
        <ul className="readiness-list">{fieldGuide.readinessChecklist.map((item) => <li key={item}><MathText text={item} /></li>)}</ul>
      </section>

      <button className="primary-button" type="button" disabled={fieldGuideCompleted} onClick={onCompleteFieldGuide}>
        {fieldGuideCompleted ? 'Field Guide complete' : 'Mark Field Guide complete'}
      </button>
    </article>
  );
}
