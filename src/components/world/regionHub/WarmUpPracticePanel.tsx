import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { GeneratedPracticeItem } from '../../../lib/generatedPractice';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface WarmUpPracticePanelProps {
  practiceItems: GeneratedPracticeItem[];
  maxInitialItems?: number;
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

export function WarmUpPracticePanel({ practiceItems, maxInitialItems = 2 }: WarmUpPracticePanelProps) {
  const visiblePractice = practiceItems.slice(0, maxInitialItems);
  const hiddenPracticeCount = Math.max(0, practiceItems.length - visiblePractice.length);

  return (
    <RegionActionCard
      eyebrow="Step 3"
      title="Warm-up Practice"
      description="A small reviewed set with revealable worked solutions."
      icon={<Sparkles size={22} />}
      className="warm-up-card"
    >
      {visiblePractice.length ? (
        <>
          <p className="section-helper warm-up-set-note">Try one prompt first. Reveal the solution only after you have a route.</p>
          <div className="warm-up-practice-grid">
            {visiblePractice.map((item) => (
              <WarmUpPracticeCard item={item} key={item.practiceId} />
            ))}
          </div>
          {hiddenPracticeCount ? <small className="region-card-note">Showing {visiblePractice.length} of {practiceItems.length} reviewed warm-ups.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">Warm-ups for this region are being prepared. Start with the Field Guide or jump into Exam Training.</p>
      )}
    </RegionActionCard>
  );
}
