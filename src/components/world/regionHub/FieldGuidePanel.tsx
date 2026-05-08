import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import type { RegionFieldGuide } from '../../../data/regionFieldGuides';

interface FieldGuidePanelProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  onCompleteFieldGuide: () => void;
}

export function FieldGuidePanel({ fieldGuide, fieldGuideCompleted, onCompleteFieldGuide }: FieldGuidePanelProps) {
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
        <p>{fieldGuide.topic}</p>
      </section>

      <section>
        <h4>What to recognize</h4>
        <ul>{fieldGuide.whatToRecognize.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section>
        <h4>Common exam moves</h4>
        <ul>{fieldGuide.commonExamMoves.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section>
        <h4>Common traps</h4>
        <ul>{fieldGuide.commonTraps.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section>
        <h4>Worked-example cards</h4>
        <div className="worked-example-grid">
          {fieldGuide.workedExamples.map((example) => (
            <div className="worked-example-card" key={example.title}>
              <strong>{example.title}</strong>
              <span>{example.focus}</span>
              {example.setup ? <small>{example.setup}</small> : null}
              {example.keyMove ? <small><b>Move:</b> {example.keyMove}</small> : null}
              {example.check ? <small><b>Check:</b> {example.check}</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4>Before training, make sure you can...</h4>
        <ul className="readiness-list">{fieldGuide.readinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <button className="primary-button" type="button" disabled={fieldGuideCompleted} onClick={onCompleteFieldGuide}>
        {fieldGuideCompleted ? 'Field Guide complete' : 'Mark Field Guide complete'}
      </button>
    </article>
  );
}
