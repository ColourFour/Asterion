import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, ChevronRight } from 'lucide-react';
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

interface AlgebraFieldGuideExample {
  title: string;
  prompt: string;
  workedLines: string[];
  patternTitle: string;
  patternRows: { from: string; move: string; to: string }[];
  tryPrompt: string;
  tryScaffold: string[];
  takeaway: string[];
  result: string;
}

interface AlgebraFieldGuideTopic {
  id: string;
  marker: string;
  title: string;
  purpose: string;
  preview: string;
  description: string;
  examples: AlgebraFieldGuideExample[];
}

const ALGEBRA_FIELD_GUIDE_TOPICS: AlgebraFieldGuideTopic[] = [
  {
    id: 'polynomial-division',
    marker: '/',
    title: 'Polynomial Division',
    purpose: 'Divide a polynomial by a linear factor and read the quotient and remainder.',
    preview: '$$ \\frac{2x^3+3x^2-x+5}{x-2} $$',
    description: 'Use long division one leading term at a time.',
    examples: [
      {
        title: 'Divide by a linear factor',
        prompt: 'Divide $2x^3+3x^2-x+5$ by $x-2$.',
        workedLines: [
          '$2x^3 \\div x = 2x^2$, so subtract $2x^3-4x^2$.',
          'Bring down to get $7x^2-x+5$.',
          '$7x^2 \\div x = 7x$, so subtract $7x^2-14x$.',
          'Bring down to get $13x+5$.',
          '$13x \\div x = 13$, so subtract $13x-26$.',
        ],
        patternTitle: 'Leading term / leading term',
        patternRows: [
          { from: '$2x^3$', move: '$\\div x$', to: '$2x^2$' },
          { from: '$7x^2$', move: '$\\div x$', to: '$7x$' },
          { from: '$13x$', move: '$\\div x$', to: '$13$' },
        ],
        tryPrompt: 'Divide $x^3-4x^2+x-2$ by $x-1$.',
        tryScaffold: ['First quotient term', 'Subtract', 'Bring down', 'Remainder'],
        takeaway: [
          'Keep dividing the leading terms.',
          'Subtract the full multiplied divisor.',
          'Stop when the degree is lower than the divisor.',
        ],
        result: '$$ 2x^2+7x+13+\\frac{31}{x-2} $$',
      },
    ],
  },
  {
    id: 'modulus-remainders',
    marker: 'mod',
    title: 'Modulus / Remainders',
    purpose: 'Find a remainder quickly using substitution or modulus language.',
    preview: '$$ 17\\bmod 5=2 $$',
    description: 'Use the value that makes the divisor zero.',
    examples: [
      {
        title: 'Use the remainder theorem',
        prompt: 'For $f(x)=x^3-4x+3$, find the remainder when divided by $x-1$.',
        workedLines: [
          'The divisor is $x-1$, so use $x=1$.',
          'Compute $f(1)=1^3-4(1)+3$.',
          'Simplify: $1-4+3=0$.',
          'The remainder is $0$, so $x-1$ is a factor.',
        ],
        patternTitle: 'Divisor tells the input',
        patternRows: [
          { from: '$x-a$', move: 'use', to: '$f(a)$' },
          { from: '$x+2$', move: 'use', to: '$f(-2)$' },
          { from: 'remainder $0$', move: 'means', to: 'factor' },
        ],
        tryPrompt: 'For $g(x)=2x^3+x-5$, find the remainder on division by $x-2$.',
        tryScaffold: ['Choose input', 'Substitute', 'Simplify', 'State remainder'],
        takeaway: [
          'For $x-a$, substitute $a$.',
          'A zero remainder means the divisor is a factor.',
          'Use the sign from the root, not from the printed term.',
        ],
        result: '$$ 0 $$',
      },
    ],
  },
  {
    id: 'partial-fractions',
    marker: 'f',
    title: 'Partial Fractions',
    purpose: 'Break a rational expression into simpler fractions.',
    preview: '$$ \\frac{2x+3}{(x-1)(x+2)} $$',
    description: 'Choose the form from the denominator, then solve the constants.',
    examples: [
      {
        title: 'Set up distinct linear factors',
        prompt: 'Decompose $\\frac{5x+1}{(x-1)(x+2)}$.',
        workedLines: [
          'Use $\\frac{5x+1}{(x-1)(x+2)}=\\frac{A}{x-1}+\\frac{B}{x+2}$.',
          'Clear denominators: $5x+1=A(x+2)+B(x-1)$.',
          'Set $x=1$: $6=3A$, so $A=2$.',
          'Set $x=-2$: $-9=-3B$, so $B=3$.',
        ],
        patternTitle: 'Denominator shape',
        patternRows: [
          { from: '$(x-a)(x-b)$', move: 'becomes', to: '$\\frac{A}{x-a}+\\frac{B}{x-b}$' },
          { from: 'clear denominators', move: 'then', to: 'substitute roots' },
          { from: 'one root', move: 'finds', to: 'one constant' },
        ],
        tryPrompt: 'Decompose $\\frac{3x+5}{(x+1)(x+2)}$.',
        tryScaffold: ['Write form', 'Clear denominators', 'Use x = -1', 'Use x = -2'],
        takeaway: [
          'Let the denominator choose the partial-fraction form.',
          'Clear denominators before substituting.',
          'Roots of factors isolate constants cleanly.',
        ],
        result: '$$ \\frac{2}{x-1}+\\frac{3}{x+2} $$',
      },
    ],
  },
  {
    id: 'binomial-expansions',
    marker: '(x)^n',
    title: 'Binomial Expansions',
    purpose: 'Expand expressions using binomial coefficients and state validity when needed.',
    preview: '$$ (x+2)^3 $$',
    description: 'Build the first terms in order and keep the validity condition visible.',
    examples: [
      {
        title: 'First three terms with validity',
        prompt: 'Write the first three terms of $(1+2x)^{-1/2}$ and state the validity range.',
        workedLines: [
          'Use $(1+u)^n=1+nu+\\frac{n(n-1)}{2}u^2+\\cdots$.',
          'Here $u=2x$ and $n=-\\frac12$.',
          'The linear term is $-\\frac12(2x)=-x$.',
          'The quadratic term is $\\frac{(-\\frac12)(-\\frac32)}{2}(2x)^2=\\frac32x^2$.',
          'Validity comes from $|2x|<1$, so $|x|<\\frac12$.',
        ],
        patternTitle: 'Term builder',
        patternRows: [
          { from: '$1$', move: 'constant', to: '$1$' },
          { from: '$nu$', move: 'linear', to: '$-x$' },
          { from: '$\\frac{n(n-1)}{2}u^2$', move: 'quadratic', to: '$\\frac32x^2$' },
        ],
        tryPrompt: 'Find the first three terms of $(1+3x)^2$.',
        tryScaffold: ['Identify u', 'Constant term', 'Linear term', 'Quadratic term'],
        takeaway: [
          'Substitute $u$ before simplifying terms.',
          'Write terms in increasing powers of $x$.',
          'For rational powers, carry the validity condition.',
        ],
        result: '$$ 1-x+\\frac32x^2,\\quad |x|<\\frac12 $$',
      },
    ],
  },
];

function isAlgebraFieldGuideRegion(region?: RegionDefinition): boolean {
  return region?.id === 'algebra-forge';
}

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

function FieldGuideTopicCard({
  topic,
  onSelect,
}: {
  topic: AlgebraFieldGuideTopic;
  onSelect: (topicId: string) => void;
}) {
  return (
    <button
      type="button"
      className="field-guide-topic-card"
      data-topic-id={topic.id}
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
        <MathText text={topic.preview} />
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
  topics: AlgebraFieldGuideTopic[];
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
}: {
  topic: AlgebraFieldGuideTopic;
  topicIndex: number;
  topicCount: number;
  exampleIndex: number;
  onBackToTopics: () => void;
  onNext: () => void;
}) {
  const example = topic.examples[exampleIndex] ?? topic.examples[0];
  const hasMoreExamples = exampleIndex < topic.examples.length - 1;
  const nextLabel = hasMoreExamples ? 'Next Example' : topicIndex < topicCount - 1 ? 'Next Topic' : 'Continue to Quick Checks';

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
          <span className="field-guide-card-label">Visual pattern</span>
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
          <div className="field-guide-try-scaffold" aria-label="Guided work spaces">
            {example.tryScaffold.map((slot) => (
              <span key={`${topic.id}-try-${slot}`}>{slot}</span>
            ))}
          </div>
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
          <div className="field-guide-result-box">
            <span>Result</span>
            <MathText text={example.result} />
          </div>
        </article>
      </div>

      <div className="region-action-footer field-guide-step-actions">
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
}: FieldGuidePanelProps) {
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const [selectedAlgebraTopicId, setSelectedAlgebraTopicId] = useState<string | undefined>();
  const [activeAlgebraExampleIndex, setActiveAlgebraExampleIndex] = useState(0);
  const snippetCount = teachingSnippets.length;
  const snippetSequenceKey = teachingSnippets.map((snippet) => snippet.snippetId).join('|');
  const algebraTopics = isAlgebraFieldGuideRegion(region) ? ALGEBRA_FIELD_GUIDE_TOPICS : undefined;
  const selectedAlgebraTopicIndex = algebraTopics?.findIndex((topic) => topic.id === selectedAlgebraTopicId) ?? -1;
  const selectedAlgebraTopic = selectedAlgebraTopicIndex >= 0 ? algebraTopics?.[selectedAlgebraTopicIndex] : undefined;
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

  useEffect(() => {
    setSelectedAlgebraTopicId(undefined);
    setActiveAlgebraExampleIndex(0);
  }, [region?.id]);

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

  function selectAlgebraTopic(topicId: string) {
    setSelectedAlgebraTopicId(topicId);
    setActiveAlgebraExampleIndex(0);
  }

  function goBackToAlgebraTopics() {
    setSelectedAlgebraTopicId(undefined);
    setActiveAlgebraExampleIndex(0);
  }

  function goToNextAlgebraStep() {
    if (!algebraTopics || !selectedAlgebraTopic) return;
    if (activeAlgebraExampleIndex < selectedAlgebraTopic.examples.length - 1) {
      setActiveAlgebraExampleIndex(activeAlgebraExampleIndex + 1);
      return;
    }

    if (selectedAlgebraTopicIndex < algebraTopics.length - 1) {
      const nextTopic = algebraTopics[selectedAlgebraTopicIndex + 1];
      if (nextTopic) selectAlgebraTopic(nextTopic.id);
      return;
    }

    continueToQuickChecks();
  }

  if (algebraTopics) {
    return (
      <RegionActionCard
        eyebrow={selectedAlgebraTopic ? `Topic ${selectedAlgebraTopicIndex + 1} of ${algebraTopics.length}` : 'Field Guide'}
        title={`Field Guide / ${regionName}`}
        description={selectedAlgebraTopic ? `Examples first: ${selectedAlgebraTopic.title}.` : 'Choose a topic to learn.'}
        icon={<BookOpenCheck size={22} />}
        stateIcon={fieldGuideCompleted ? <CheckCircle2 size={22} aria-label="Field Guide complete" /> : undefined}
        className="field-guide-card field-guide-topic-flow-card"
      >
        {selectedAlgebraTopic ? (
          <FieldGuideTopicLesson
            topic={selectedAlgebraTopic}
            topicIndex={selectedAlgebraTopicIndex}
            topicCount={algebraTopics.length}
            exampleIndex={activeAlgebraExampleIndex}
            onBackToTopics={goBackToAlgebraTopics}
            onNext={goToNextAlgebraStep}
          />
        ) : (
          <FieldGuideTopicChoice
            regionName={regionName}
            topics={algebraTopics}
            onSelectTopic={selectAlgebraTopic}
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
            Continue to Quick Checks
            <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </RegionActionCard>
  );
}
