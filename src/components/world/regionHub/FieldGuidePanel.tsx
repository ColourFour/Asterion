import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2 } from 'lucide-react';
import type { RegionFieldGuide } from '../../../data/regionFieldGuides';
import type { RegionTheme } from '../../../lib/regionThemes';
import type { TeachingSnippet, TeachingSnippetWorkedExample } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface FieldGuidePanelProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  theme: RegionTheme;
  teachingSnippets: TeachingSnippet[];
  maxInitialSnippets?: number;
  onCompleteFieldGuide: () => void;
  onBackToRegionHub?: () => void;
  onContinueToQuickChecks?: () => void;
}

function WorkedExampleCard({ example }: { example: TeachingSnippetWorkedExample }) {
  return (
    <article className="worked-example-card">
      <div className="worked-example-section worked-example-section-emphasis">
        <b>What the question is asking</b>
        <div className="worked-example-copy"><MathText text={example.prompt} /></div>
      </div>
      {example.questionType ? (
        <div className="worked-example-note"><b>Question type:</b> <MathText text={example.questionType} /></div>
      ) : null}
      {example.keyMethod ? (
        <div className="worked-example-note"><b>Key method:</b> <MathText text={example.keyMethod} /></div>
      ) : null}
      <div className="worked-example-section">
        <b>Step-by-step math</b>
        <ol>
          {example.steps.map((step) => <li key={step}><MathText text={step} /></li>)}
        </ol>
      </div>
      <div className="worked-example-note"><b>Answer:</b> <MathText text={example.answer} /></div>
      {example.examMove ? <div className="worked-example-note"><b>Exam move:</b> <MathText text={example.examMove} /></div> : null}
      {example.teachingNote ? <div className="worked-example-note"><b>Note:</b> <MathText text={example.teachingNote} /></div> : null}
    </article>
  );
}

export function FieldGuidePanel({
  fieldGuide: _fieldGuide,
  fieldGuideCompleted,
  theme: _theme,
  teachingSnippets,
  maxInitialSnippets: _maxInitialSnippets = 2,
  onCompleteFieldGuide,
  onBackToRegionHub,
  onContinueToQuickChecks,
}: FieldGuidePanelProps) {
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const snippetCount = teachingSnippets.length;
  const snippetSequenceKey = teachingSnippets.map((snippet) => snippet.snippetId).join('|');
  const safeActiveSnippetIndex = snippetCount ? Math.min(activeSnippetIndex, snippetCount - 1) : 0;
  const activeSnippet = snippetCount ? teachingSnippets[safeActiveSnippetIndex] : undefined;
  const isFirstSnippet = safeActiveSnippetIndex === 0;
  const isLastSnippet = safeActiveSnippetIndex === snippetCount - 1;

  useEffect(() => {
    setActiveSnippetIndex(0);
  }, [snippetSequenceKey]);

  function goToPreviousSnippet() {
    setActiveSnippetIndex(Math.max(0, safeActiveSnippetIndex - 1));
  }

  function goToNextSnippet() {
    setActiveSnippetIndex(Math.min(snippetCount - 1, safeActiveSnippetIndex + 1));
  }

  function continueToQuickChecks() {
    if (!fieldGuideCompleted) onCompleteFieldGuide();
    onContinueToQuickChecks?.();
  }

  return (
    <RegionActionCard
      eyebrow={activeSnippet ? `Snippet ${safeActiveSnippetIndex + 1} of ${snippetCount}` : 'Field Guide'}
      title={activeSnippet ? 'Teaching snippet' : 'Field Guide unavailable'}
      description={activeSnippet ? 'Study one teaching snippet, then move to the next.' : 'Field Guide content for this region is still being prepared.'}
      icon={<BookOpenCheck size={22} />}
      stateIcon={fieldGuideCompleted ? <CheckCircle2 size={22} aria-label="Field Guide complete" /> : undefined}
      className="field-guide-card"
    >
      {activeSnippet ? (
        <article className="teaching-snippet-card field-guide-snippet-card" aria-labelledby={`field-guide-snippet-${activeSnippet.snippetId}`}>
          <div className="field-guide-step-progress" aria-live="polite">
            <span>Snippet {safeActiveSnippetIndex + 1} of {snippetCount}</span>
            {activeSnippet.snippetType ? <span>{activeSnippet.snippetType.replace(/_/g, ' ')}</span> : null}
            {activeSnippet.estimatedTimeMinutes ? <span>{activeSnippet.estimatedTimeMinutes} min</span> : null}
          </div>

          <header className="field-guide-snippet-header">
            <h3 id={`field-guide-snippet-${activeSnippet.snippetId}`}>{activeSnippet.title}</h3>
            <p className="snippet-goal"><MathText text={activeSnippet.studentGoal} /></p>
          </header>

          {activeSnippet.prerequisites.length ? (
            <section className="snippet-lesson-section">
              <h4>Before this</h4>
              <ul>
                {activeSnippet.prerequisites.map((item) => <li key={item}><MathText text={item} /></li>)}
              </ul>
            </section>
          ) : null}

          <section className="snippet-lesson-section">
            <h4>Explanation</h4>
            <p><MathText text={activeSnippet.explanation ?? activeSnippet.body} /></p>
          </section>

          <section className="snippet-lesson-section">
            <h4>Micro steps</h4>
            <ol>
              {(activeSnippet.microSteps.length ? activeSnippet.microSteps : activeSnippet.steps).map((step) => (
                <li key={step}><MathText text={step} /></li>
              ))}
            </ol>
          </section>

          {activeSnippet.workedExamples.length ? (
            <section className="snippet-lesson-section">
              <h4>Worked example</h4>
              <div className="worked-example-grid">
                {activeSnippet.workedExamples.map((example) => (
                  <WorkedExampleCard example={example} key={example.id ?? example.prompt} />
                ))}
              </div>
            </section>
          ) : null}

          {activeSnippet.commonMistakes.length ? (
            <section className="snippet-lesson-section">
              <h4>Common mistakes</h4>
              <ul>
                {activeSnippet.commonMistakes.map((item) => <li key={item}><MathText text={item} /></li>)}
              </ul>
            </section>
          ) : null}

          <div className="snippet-insight-grid">
            <section className="snippet-insight">
              <h4>Exam move</h4>
              <p><MathText text={activeSnippet.examMove} /></p>
            </section>
            <section className="snippet-insight">
              <h4>Common trap</h4>
              <p><MathText text={activeSnippet.commonTrap} /></p>
            </section>
            {activeSnippet.guardianReadiness ? (
              <section className="snippet-insight">
                <h4>Guardian note</h4>
                <p><MathText text={activeSnippet.guardianReadiness.readinessNote} /></p>
              </section>
            ) : null}
          </div>
        </article>
      ) : (
        <p className="region-empty-state">Field Guide content for this region is still being prepared.</p>
      )}

      <div className="region-action-footer field-guide-step-actions">
        <button className="secondary-button" type="button" onClick={onBackToRegionHub}>
          Back to Region Hub
        </button>
        {activeSnippet && !isFirstSnippet ? (
          <button className="secondary-button" type="button" onClick={goToPreviousSnippet}>
            <ArrowLeft size={16} />
            Previous
          </button>
        ) : null}
        {activeSnippet && !isLastSnippet ? (
          <button className="primary-button" type="button" onClick={goToNextSnippet}>
            Next
            <ArrowRight size={16} />
          </button>
        ) : null}
        {activeSnippet && isLastSnippet ? (
          <button className="primary-button" type="button" onClick={continueToQuickChecks}>
            Continue to Quick Checks
            <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </RegionActionCard>
  );
}
