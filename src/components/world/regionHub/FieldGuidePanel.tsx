import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic } from '../../../data/fieldGuideTopics';
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
  onContinueToQuickChecks?: (topic?: FieldGuideTopic) => void;
  onCurrentTopicChange?: (topic?: FieldGuideTopic) => void;
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
          <p className="worked-example-next-action">Next action: try the linked Skill Check item without looking back at the final answer.</p>
        ) : null}
      </div>
    </article>
  );
}

function firstAvailable(items: string[]): string | undefined {
  return items.find((item) => item.trim());
}

function FieldGuideTopicCard({
  topic,
  onSelect,
}: {
  topic: FieldGuideTopic;
  onSelect: (topicId: string) => void;
}) {
  return (
    <button
      type="button"
      className="field-guide-topic-card"
      data-topic-id={topic.id}
      data-skill-ids={topic.skillIds.join(' ')}
      onClick={() => onSelect(topic.id)}
    >
      <span className="field-guide-topic-card-heading">
        <span className="field-guide-topic-marker" aria-hidden="true">{topic.marker}</span>
        <span>
          <strong>{topic.title}</strong>
          <span>{topic.purpose}</span>
        </span>
      </span>
      <span className="field-guide-topic-example" aria-label={`${topic.title} example preview`}>
        <span>Example</span>
        <span className="field-guide-topic-example-math">
          <MathText text={topic.preview} />
        </span>
      </span>
      <span className="field-guide-topic-affordance">
        Start topic
        <ChevronRight size={17} aria-hidden="true" />
      </span>
    </button>
  );
}

function FieldGuideTopicChoice({
  regionName,
  topics,
  onSelectTopic,
  onBackToRegionHub,
}: {
  regionName: string;
  topics: FieldGuideTopic[];
  onSelectTopic: (topicId: string) => void;
  onBackToRegionHub?: () => void;
}) {
  return (
    <div className="field-guide-topic-choice">
      <header className="field-guide-topic-choice-header">
        <div>
          <span className="field-guide-topic-kicker">Pass 1</span>
          <h3>Choose the Topic</h3>
          <p>Choose a topic to learn.</p>
        </div>
        <button className="secondary-button field-guide-back-button" type="button" onClick={onBackToRegionHub}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Region Hub
        </button>
      </header>

      <div className="field-guide-topic-grid" aria-label={`${regionName} Field Guide topics`}>
        {topics.map((topic) => (
          <FieldGuideTopicCard key={topic.id} topic={topic} onSelect={onSelectTopic} />
        ))}
      </div>

      <aside className="field-guide-topic-note" aria-label="Field Guide note">
        <span className="field-guide-topic-marker" aria-hidden="true">*</span>
        <p>Each topic uses one worked example, one pattern, and one guided try.</p>
      </aside>
    </div>
  );
}

function FieldGuideTopicLesson({
  topic,
  topicIndex,
  topicCount,
  exampleIndex,
  onBackToTopics,
  onNext,
  onPracticeTopic,
}: {
  topic: FieldGuideTopic;
  topicIndex: number;
  topicCount: number;
  exampleIndex: number;
  onBackToTopics: () => void;
  onNext: () => void;
  onPracticeTopic: () => void;
}) {
  const example = topic.examples[exampleIndex] ?? topic.examples[0];
  const hasMoreExamples = exampleIndex < topic.examples.length - 1;
  const nextLabel = hasMoreExamples ? 'Next Example' : topicIndex < topicCount - 1 ? 'Next Topic' : 'Go to Skill Check';

  if (!example) {
    return (
      <div className="field-guide-topic-lesson">
        <div className="field-guide-lesson-toolbar">
          <button className="secondary-button field-guide-back-button" type="button" onClick={onBackToTopics}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Topics
          </button>
        </div>
        <p className="region-empty-state">This Field Guide topic is still being prepared.</p>
      </div>
    );
  }

  return (
    <div className="field-guide-topic-lesson">
      <div className="field-guide-lesson-toolbar">
        <button className="secondary-button field-guide-back-button" type="button" onClick={onBackToTopics}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Topics
        </button>
        <span>Topic {topicIndex + 1} of {topicCount}</span>
      </div>

      <section className="field-guide-lesson-hero" aria-labelledby={`field-guide-topic-${topic.id}`}>
        <div>
          <span className="field-guide-topic-kicker">Current topic</span>
          <h3 id={`field-guide-topic-${topic.id}`}>{topic.title}</h3>
          <p>{topic.description}</p>
          {topic.supportNote ? (
            <p className="field-guide-support-note"><MathText text={topic.supportNote} /></p>
          ) : null}
        </div>
        <span className="field-guide-topic-marker field-guide-topic-marker-large" aria-hidden="true">{topic.marker}</span>
      </section>

      <div className="field-guide-lesson-grid">
        <article className="field-guide-lesson-card field-guide-example-card">
          <span className="field-guide-card-label">Example {exampleIndex + 1}</span>
          <h4>{example.title}</h4>
          <p className="field-guide-example-prompt"><MathText text={example.prompt} /></p>
          <ol className="field-guide-worked-lines">
            {example.workedLines.map((line, index) => (
              <li key={`${topic.id}-worked-${index}`}>
                <MathText text={line} />
              </li>
            ))}
          </ol>
        </article>

        <article className="field-guide-lesson-card field-guide-pattern-card">
          <span className="field-guide-card-label">Method pattern</span>
          <h4>{example.patternTitle}</h4>
          <div className="field-guide-pattern-stack">
            {example.patternRows.map((row, index) => (
              <div className="field-guide-pattern-row" key={`${topic.id}-pattern-${index}`}>
                <span><MathText text={row.from} /></span>
                <small><MathText text={row.move} /></small>
                <span><MathText text={row.to} /></span>
              </div>
            ))}
          </div>
        </article>

        <article className="field-guide-lesson-card field-guide-try-card">
          <span className="field-guide-card-label">Try one together</span>
          <p className="field-guide-example-prompt"><MathText text={example.tryPrompt} /></p>
          {example.tryWorkedLines?.length ? (
            <ol className="field-guide-worked-lines field-guide-try-worked-lines" aria-label="Try one together worked route">
              {example.tryWorkedLines.map((line, index) => (
                <li key={`${topic.id}-try-worked-${index}`}>
                  <MathText text={line} />
                </li>
              ))}
            </ol>
          ) : (
            <div className="field-guide-try-scaffold" aria-label="Guided work spaces">
              {example.tryScaffold.map((slot) => (
                <span key={`${topic.id}-try-${slot}`}>{slot}</span>
              ))}
            </div>
          )}
          {example.tryResult ? (
            <div className="field-guide-result-box field-guide-try-result-box">
              <span>Answer</span>
              <MathText text={example.tryResult} />
            </div>
          ) : null}
        </article>

        <article className="field-guide-lesson-card field-guide-takeaway-card">
          <span className="field-guide-card-label">Key takeaway</span>
          <ul>
            {example.takeaway.map((item) => (
              <li key={`${topic.id}-takeaway-${item}`}>
                <MathText text={item} />
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="region-action-footer field-guide-step-actions">
        <button className="primary-button field-guide-practice-cta" type="button" onClick={onPracticeTopic}>
          Practice this skill
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button className="secondary-button" type="button" onClick={onBackToTopics}>
          Back to Topics
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          {nextLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function FieldGuidePanel({
  fieldGuide: _fieldGuide,
  fieldGuideCompleted,
  region,
  theme,
  teachingSnippets,
  maxInitialSnippets: _maxInitialSnippets = 2,
  onCompleteFieldGuide,
  onBackToRegionHub,
  onContinueToQuickChecks,
  onCurrentTopicChange,
}: FieldGuidePanelProps) {
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [activeTopicExampleIndex, setActiveTopicExampleIndex] = useState(0);
  const snippetCount = teachingSnippets.length;
  const snippetSequenceKey = teachingSnippets.map((snippet) => snippet.snippetId).join('|');
  const topicFlowTopics = getFieldGuideTopicsForRegion(region?.id);
  const hasTopicFlow = topicFlowTopics.length > 0;
  const selectedTopicIndex = topicFlowTopics.findIndex((topic) => topic.id === selectedTopicId);
  const selectedTopic = selectedTopicIndex >= 0 ? topicFlowTopics[selectedTopicIndex] : undefined;
  const regionName = region?.name ?? theme.title;
  const safeActiveSnippetIndex = snippetCount ? Math.min(activeSnippetIndex, snippetCount - 1) : 0;
  const activeSnippet = snippetCount ? teachingSnippets[safeActiveSnippetIndex] : undefined;
  const isFirstSnippet = safeActiveSnippetIndex === 0;
  const isLastSnippet = safeActiveSnippetIndex === snippetCount - 1;
  const workedExample = activeSnippet?.workedExamples[0];
  const supportingStep = activeSnippet ? firstAvailable(activeSnippet.microSteps.length ? activeSnippet.microSteps : activeSnippet.steps) : undefined;
  const warning = activeSnippet ? firstAvailable(activeSnippet.commonMistakes) ?? activeSnippet.commonTrap : undefined;
  const nextAction = activeSnippet
    ? isLastSnippet
      ? 'Go to Skill Check when this idea is clear.'
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

  useEffect(() => {
    setSelectedTopicId(undefined);
    setActiveTopicExampleIndex(0);
    onCurrentTopicChange?.(undefined);
  }, [region?.id]);

  function goToPreviousSnippet() {
    setActiveSnippetIndex(Math.max(0, safeActiveSnippetIndex - 1));
  }

  function goToNextSnippet() {
    setActiveSnippetIndex(Math.min(snippetCount - 1, safeActiveSnippetIndex + 1));
  }

  function continueToQuickChecks() {
    if (!fieldGuideCompleted) onCompleteFieldGuide();
    onContinueToQuickChecks?.(selectedTopic);
  }

  function selectTopic(topicId: string) {
    setSelectedTopicId(topicId);
    setActiveTopicExampleIndex(0);
    onCurrentTopicChange?.(topicFlowTopics.find((topic) => topic.id === topicId));
  }

  function goBackToTopics() {
    setSelectedTopicId(undefined);
    setActiveTopicExampleIndex(0);
    onCurrentTopicChange?.(undefined);
  }

  function goToNextTopicStep() {
    if (!hasTopicFlow || !selectedTopic) return;
    if (activeTopicExampleIndex < selectedTopic.examples.length - 1) {
      setActiveTopicExampleIndex(activeTopicExampleIndex + 1);
      return;
    }

    if (selectedTopicIndex < topicFlowTopics.length - 1) {
      const nextTopic = topicFlowTopics[selectedTopicIndex + 1];
      if (nextTopic) selectTopic(nextTopic.id);
      return;
    }

    continueToQuickChecks();
  }

  if (hasTopicFlow) {
    return (
      <RegionActionCard
        eyebrow={selectedTopic ? `Topic ${selectedTopicIndex + 1} of ${topicFlowTopics.length}` : 'Field Guide'}
        title={`Field Guide / ${regionName}`}
        description={selectedTopic ? `Examples first: ${selectedTopic.title}.` : 'Choose a topic to learn.'}
        icon={<BookOpenCheck size={22} />}
        stateIcon={fieldGuideCompleted ? <CheckCircle2 size={22} aria-label="Field Guide complete" /> : undefined}
        className="field-guide-card field-guide-topic-flow-card"
      >
        {selectedTopic ? (
          <FieldGuideTopicLesson
            topic={selectedTopic}
            topicIndex={selectedTopicIndex}
            topicCount={topicFlowTopics.length}
            exampleIndex={activeTopicExampleIndex}
            onBackToTopics={goBackToTopics}
            onNext={goToNextTopicStep}
            onPracticeTopic={continueToQuickChecks}
          />
        ) : (
          <FieldGuideTopicChoice
            regionName={regionName}
            topics={topicFlowTopics}
            onSelectTopic={selectTopic}
            onBackToRegionHub={onBackToRegionHub}
          />
        )}
      </RegionActionCard>
    );
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
            Go to Skill Check
            <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </RegionActionCard>
  );
}
