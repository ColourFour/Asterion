import { useState } from 'react';
import type { GeneratedPracticeItem } from '../../../lib/generatedPractice';
import { MathText } from '../../shared/MathText';

interface WarmUpPracticePanelProps {
  practiceItems: GeneratedPracticeItem[];
}

interface WarmUpPracticeCardProps {
  item: GeneratedPracticeItem;
}

function WarmUpPracticeCard({ item }: WarmUpPracticeCardProps) {
  const [solutionVisible, setSolutionVisible] = useState(false);
  const solutionId = `warm-up-solution-${item.practiceId}`;
  const familyParts = item.generatorFamily.split('.');
  const practiceLabel = familyParts[familyParts.length - 1]?.replace(/_/g, ' ') ?? 'Warm-up';

  return (
    <article className="warm-up-practice-card">
      <div className="warm-up-practice-heading">
        <strong>{practiceLabel}</strong>
        <span>{item.difficultyBand}</span>
      </div>
      <p><MathText text={item.prompt} /></p>
      <button
        className="warm-up-reveal-button"
        type="button"
        aria-expanded={solutionVisible}
        aria-controls={solutionId}
        onClick={() => setSolutionVisible((visible) => !visible)}
      >
        {solutionVisible ? 'Hide solution' : 'Reveal solution'}
      </button>
      {solutionVisible ? (
        <div className="warm-up-solution" id={solutionId}>
          <strong>Answer</strong>
          <p><MathText text={item.answer} /></p>
          <strong>Worked solution</strong>
          <ol>
            {item.workedSolution.map((step) => (
              <li key={step}><MathText text={step} /></li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}

export function WarmUpPracticePanel({ practiceItems }: WarmUpPracticePanelProps) {
  if (practiceItems.length === 0) return null;

  return (
    <section>
      <h4>Warm-up Practice</h4>
      <div className="warm-up-practice-grid">
        {practiceItems.map((item) => (
          <WarmUpPracticeCard item={item} key={item.practiceId} />
        ))}
      </div>
    </section>
  );
}
