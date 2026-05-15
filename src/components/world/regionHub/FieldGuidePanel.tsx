import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2 } from 'lucide-react';
import type { RegionFieldGuide } from '../../../data/regionFieldGuides';
import { findVisualSupportSource } from '../../../data/visualSupportSources';
import type { RegionTheme } from '../../../lib/regionThemes';
import type { TeachingSnippet, TeachingSnippetWorkedExample } from '../../../lib/teachingSnippets';
import type { RegionDefinition } from '../../../types';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';
import { VisualSupportCard } from './VisualSupportCard';

interface FieldGuidePanelProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  region?: RegionDefinition;
  theme: RegionTheme;
  teachingSnippets: TeachingSnippet[];
  maxInitialSnippets?: number;
  onCompleteFieldGuide: () => void;
  onBackToRegionHub?: () => void;
  onContinueToQuickChecks?: () => void;
}

type WorkedExampleStage = 'setup' | 'method' | 'answer';

function WorkedExampleCard({ example }: { example: TeachingSnippetWorkedExample }) {
  const [stage, setStage] = useState<WorkedExampleStage>('setup');
  const methodRevealed = stage === 'method' || stage === 'answer';
  const answerRevealed = stage === 'answer';
  const methodId = `worked-example-method-${example.id ?? 'active'}`;
  const answerId = `worked-example-answer-${example.id ?? 'active'}`;

  useEffect(() => {
    setStage('setup');
  }, [example.id, example.prompt]);

  return (
    <article className="worked-example-card">
      <div className="worked-example-section worked-example-section-emphasis">
        <b>What the question is asking</b>
        <div className="worked-example-copy"><MathText text={example.prompt} /></div>
      </div>
      {example.questionType ? (
        <div className="worked-example-note"><b>Question type:</b> <MathText text={example.questionType} /></div>
      ) : null}

      {methodRevealed ? (
        <div className="worked-example-method" id={methodId}>
          {example.keyMethod ? (
            <div className="worked-example-note"><b>Key method:</b> <MathText text={example.keyMethod} /></div>
          ) : null}
          <div className="worked-example-section worked-example-method-steps">
            <b>Method steps</b>
            <ol className="worked-example-stage-list" aria-label="Segmented method steps">
              {example.steps.map((step, index) => (
                <li className="worked-example-stage" key={`${index}-${step}`}>
                  <span className="worked-example-stage-index">Stage {index + 1}</span>
                  <div><MathText text={step} /></div>
                </li>
              ))}
            </ol>
          </div>
          {example.examMove ? <div className="worked-example-note"><b>Exam move:</b> <MathText text={example.examMove} /></div> : null}
          {example.teachingNote ? <div className="worked-example-note"><b>Method note:</b> <MathText text={example.teachingNote} /></div> : null}
        </div>
      ) : null}

      {answerRevealed ? (
        <div className="worked-example-section worked-example-answer" id={answerId}>
          <b>Final answer</b>
          <div className="worked-example-copy"><MathText text={example.answer} /></div>
        </div>
      ) : null}

      <div className="worked-example-disclosure">
        {!methodRevealed ? (
          <button
            type="button"
            className="secondary-button"
            aria-controls={methodId}
            aria-expanded="false"
            onClick={() => setStage('method')}
          >
            Reveal method
          </button>
        ) : null}
        {methodRevealed && !answerRevealed ? (
          <button
            type="button"
            className="primary-button"
            aria-controls={answerId}
            aria-expanded="false"
            onClick={() => setStage('answer')}
          >
            Show final answer
          </button>
        ) : null}
        {answerRevealed ? (
          <p className="worked-example-next-action">Next action: try the linked Quick Check without looking back at the final answer.</p>
        ) : null}
      </div>
    </article>
  );
}

function firstAvailable(items: string[]): string | undefined {
  return items.find((item) => item.trim());
}

export function FieldGuidePanel({
  fieldGuide: _fieldGuide,
  fieldGuideCompleted,
  region,
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
  const workedExample = activeSnippet?.workedExamples[0];
  const supportingStep = activeSnippet ? firstAvailable(activeSnippet.microSteps.length ? activeSnippet.microSteps : activeSnippet.steps) : undefined;
  const warning = activeSnippet ? firstAvailable(activeSnippet.commonMistakes) ?? activeSnippet.commonTrap : undefined;
  const nextAction = activeSnippet
    ? isLastSnippet
      ? 'Continue to Quick Checks when this idea is clear.'
      : 'Use Next when this idea is clear.'
    : undefined;
  const visualSupport = activeSnippet ? findVisualSupportSource({
    pageType: 'field-guide',
    regionId: region?.id ?? activeSnippet.regionIds[0],
    topicIds: activeSnippet.topics,
    skillIds: activeSnippet.relatedSkillTargetIds,
  }) : undefined;

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
          </header>

          <section className="snippet-lesson-section snippet-lesson-section-key">
            <h4>Key idea</h4>
            <p className="snippet-goal"><MathText text={activeSnippet.studentGoal} /></p>
          </section>

          <section className="snippet-lesson-section">
            <h4>Small explanation</h4>
            <p><MathText text={activeSnippet.explanation ?? activeSnippet.body} /></p>
            {visualSupport ? <VisualSupportCard source={visualSupport} /> : null}
          </section>

          {workedExample ? (
            <section className="snippet-lesson-section">
              <h4>Worked move</h4>
              <WorkedExampleCard key={`${activeSnippet.snippetId}-${workedExample.id ?? workedExample.prompt}`} example={workedExample} />
            </section>
          ) : supportingStep ? (
            <section className="snippet-lesson-section">
              <h4>Worked move</h4>
              <p><MathText text={supportingStep} /></p>
            </section>
          ) : null}

          {warning ? (
            <section className="snippet-lesson-section">
              <h4>Watch for</h4>
              <p><MathText text={warning} /></p>
            </section>
          ) : null}

          <section className="snippet-lesson-section snippet-next-action">
            <h4>Next action</h4>
            <p><MathText text={nextAction ?? 'Move to the next learning step.'} /></p>
          </section>
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
