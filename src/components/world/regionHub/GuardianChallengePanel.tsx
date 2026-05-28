import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Lock, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import type { GuardianChallengeItem } from '../../../data/guardianChallengeItems';
import { guardianChallengeContractForItem } from '../../../data/guardianChallengeItems';
import type { GuardianChallenge } from '../../../data/guardianChallenges';
import { checkGuardianChallengeAnswer } from '../../../lib/guardianChallengeValidation';
import type { QuickCheckCheckResult, QuickCheckResponse } from '../../../types';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';
import { initialResponseFor, QuickCheckFeedback, QuickCheckInput } from './QuickChecksPanel';

interface GuardianChallengePanelProps {
  challenge?: GuardianChallenge;
  challengeItems?: GuardianChallengeItem[];
  guardianCleared?: boolean;
  isUnlocked: boolean;
  lockedReason?: string;
  onSaveGuardianClear?: () => void;
  regionName: string;
}

const EMPTY_GUARDIAN_ITEMS: GuardianChallengeItem[] = [];

function GuardianArtwork({ challenge, regionName }: { challenge: GuardianChallenge; regionName: string }) {
  if (challenge.guardianAssetPath) {
    return (
      <figure className="guardian-placeholder-figure guardian-artwork-frame">
        <img src={challenge.guardianAssetPath} alt={`${regionName} Guardian artwork`} loading="lazy" />
      </figure>
    );
  }

  return (
    <div className="guardian-placeholder-missing-art" role="status">
      Guardian artwork is not available for this region yet.
    </div>
  );
}

function initialResponsesForItems(items: GuardianChallengeItem[]): Record<string, QuickCheckResponse> {
  return Object.fromEntries(items.map((item) => [item.itemId, initialResponseFor(guardianChallengeContractForItem(item))]));
}

function GuardianItemCard({
  item,
  result,
  response,
  setResponse,
  onCheck,
}: {
  item: GuardianChallengeItem;
  result?: QuickCheckCheckResult;
  response: QuickCheckResponse;
  setResponse: (response: QuickCheckResponse) => void;
  onCheck: () => void;
}) {
  const contract = guardianChallengeContractForItem(item);
  const correct = result?.status === 'correct';

  return (
    <article className={`guardian-item-card${correct ? ' is-cleared' : ''}`}>
      <header>
        <span className="guardian-item-topic">{item.fieldGuideTopicId.replace(/_/g, ' ')}</span>
        <h5>{item.title}</h5>
      </header>
      <p><MathText text={item.prompt} interactiveGlossary={false} /></p>
      <QuickCheckInput contract={contract} response={response} setResponse={setResponse} />
      <div className="guardian-item-actions">
        <button className="primary-button guardian-check-button" type="button" onClick={onCheck}>
          {correct ? <CheckCircle2 size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
          {correct ? 'Cleared' : 'Check answer'}
        </button>
      </div>
      {result ? <QuickCheckFeedback result={result} /> : null}
      {result && result.status !== 'empty' ? (
        <details className="guardian-item-explanation" open={result.status === 'correct'}>
          <summary>{result.status === 'correct' ? 'Final route' : 'Review the route'}</summary>
          <ol>
            {item.explanation.map((line) => <li key={line}><MathText text={line} interactiveGlossary={false} /></li>)}
          </ol>
        </details>
      ) : null}
    </article>
  );
}

export function GuardianChallengePanel({
  challenge,
  challengeItems = EMPTY_GUARDIAN_ITEMS,
  guardianCleared = false,
  isUnlocked,
  lockedReason,
  onSaveGuardianClear,
  regionName,
}: GuardianChallengePanelProps) {
  const hasChallengeSet = challengeItems.length > 0;
  const initialResponses = useMemo(() => initialResponsesForItems(challengeItems), [challengeItems]);
  const [responses, setResponses] = useState<Record<string, QuickCheckResponse>>(() => initialResponses);
  const [results, setResults] = useState<Record<string, QuickCheckCheckResult | undefined>>({});
  const [saveRequested, setSaveRequested] = useState(false);

  useEffect(() => {
    setResponses(initialResponses);
    setResults({});
    setSaveRequested(false);
  }, [initialResponses]);

  if (!challenge) {
    return (
      <RegionActionCard
        eyebrow="Step 3 · Guardian"
        title="Guardian Challenge"
        description="Guardian artwork will appear here when this region has artwork available."
        icon={<ShieldCheck size={22} />}
        className="guardian-card guardian-placeholder-card"
      >
        <p className="guardian-placeholder-warning">
          Guardian artwork is not available for this region yet. This does not affect practice.
        </p>
      </RegionActionCard>
    );
  }

  const status = guardianCleared ? 'cleared' : isUnlocked ? 'ready' : 'locked';
  const clearedItemCount = challengeItems.filter((item) => results[item.itemId]?.status === 'correct').length;
  const allItemsCleared = hasChallengeSet && clearedItemCount === challengeItems.length;
  const guardianClearSaved = guardianCleared || saveRequested;
  const statusCopy = {
    locked: {
      eyebrow: 'Step 3 · Final gate locked',
      description: lockedReason ?? `${regionName} is sealed. Complete the Field Guide and Skill Check to open the Guardian trial.`,
      label: 'Vault locked',
      title: `${regionName} is sealed`,
      body: lockedReason ?? 'The challenge opens when Field Guide and Skill Check are complete.',
      anticipation: 'The Guardian is waiting.',
      icon: <Lock size={22} aria-label="Guardian locked" />,
    },
    ready: {
      eyebrow: 'Step 3 · Guardian ready',
      description: hasChallengeSet ? `${regionName} is open. Clear one Guardian item for each Skill Check topic.` : `${regionName} is open. The Guardian trial is ready.`,
      label: 'Guardian ready',
      title: 'The gate is open',
      body: hasChallengeSet ? 'Answer each bounded final-answer check to clear the first Guardian slice.' : 'Enter the final region challenge when you are ready.',
      anticipation: 'Clear the region’s Guardian trial.',
      icon: <Sparkles size={22} aria-label="Guardian ready" />,
    },
    cleared: {
      eyebrow: 'Step 3 · Guardian cleared',
      description: `${regionName} has been restored by a saved Guardian clear.`,
      label: 'Region restored',
      title: 'Guardian trial cleared',
      body: 'The region is restored. Keep your evidence strong with later review.',
      anticipation: 'Guardian crest earned.',
      icon: <Sparkles size={22} aria-label="Guardian cleared" />,
    },
  }[status];

  return (
    <RegionActionCard
      eyebrow={statusCopy.eyebrow}
      title="Guardian Challenge"
      description={statusCopy.description}
      icon={<ShieldCheck size={22} />}
      stateIcon={statusCopy.icon}
      className={`guardian-card guardian-placeholder-card guardian-boss-card guardian-${status}-card`}
    >
      <section className="guardian-boss-hero" aria-label={`${regionName} Guardian gate`}>
        <div className="guardian-boss-copy">
          <span className="guardian-boss-kicker">{statusCopy.label}</span>
          <h4>{statusCopy.title}</h4>
          <p>{statusCopy.body}</p>
          <div className="guardian-locked-state" role="status">
            {status === 'locked' ? <Lock size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
            <div>
              <strong>{statusCopy.anticipation}</strong>
              <span>{status === 'locked' ? lockedReason ?? 'Finish the Field Guide and Skill Check first; the challenge prompt stays hidden until then.' : hasChallengeSet ? `${clearedItemCount}/${challengeItems.length} Guardian seals cleared.` : 'The unlock details stay below so you know why this opened.'}</span>
            </div>
          </div>
        </div>
        <div className="guardian-boss-art">
          <GuardianArtwork challenge={challenge} regionName={regionName} />
          <span className="guardian-boss-lock" aria-hidden="true">
            {status === 'locked' ? <Lock size={38} /> : <ShieldCheck size={38} />}
          </span>
        </div>
      </section>
      {hasChallengeSet && isUnlocked ? (
        <section className="guardian-item-set" aria-label={`${regionName} Guardian challenge items`}>
          <header className="guardian-item-set-header">
            <div>
              <span className="guardian-boss-kicker">Text Guardian Trial</span>
              <h4>{allItemsCleared ? 'Guardian cleared' : 'Clear every topic seal'}</h4>
              <p>{allItemsCleared ? `${regionName} is cleared for this attempt. Retry any item whenever you want to practise.` : 'Each item asks for a bounded final answer. Clear each one when you are ready.'}</p>
            </div>
            <button
              className="secondary-button guardian-reset-button"
              type="button"
              onClick={() => {
                setResponses(initialResponsesForItems(challengeItems));
                setResults({});
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Retry set
            </button>
          </header>
          <div className="guardian-item-progress" role="status" aria-live="polite">
            <span>{guardianClearSaved ? 'Guardian progress saved' : `${clearedItemCount} / ${challengeItems.length} cleared`}</span>
            <div aria-hidden="true">
              {challengeItems.map((item) => (
                <i className={results[item.itemId]?.status === 'correct' ? 'is-cleared' : ''} key={item.itemId} />
              ))}
            </div>
          </div>
          {allItemsCleared ? (
            <div className="guardian-save-clear-panel" role="status">
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <strong>{guardianClearSaved ? 'Guardian progress saved' : 'Guardian trial complete'}</strong>
                <span>{guardianClearSaved ? `${regionName} is recorded as restored.` : 'Save this clear so the Region Hub can mark this region complete.'}</span>
              </div>
              <button
                className="primary-button guardian-save-clear-button next-step-glow"
                type="button"
                disabled={guardianClearSaved || !onSaveGuardianClear}
                onClick={() => {
                  onSaveGuardianClear?.();
                  setSaveRequested(true);
                }}
              >
                <ShieldCheck size={18} aria-hidden="true" />
                {guardianClearSaved ? 'Saved' : 'Save Guardian progress'}
              </button>
            </div>
          ) : null}
          <div className="guardian-item-grid">
            {challengeItems.map((item) => (
              <GuardianItemCard
                item={item}
                key={item.itemId}
                response={responses[item.itemId] ?? initialResponseFor(guardianChallengeContractForItem(item))}
                result={results[item.itemId]}
                setResponse={(response) => {
                  setResponses((current) => ({ ...current, [item.itemId]: response }));
                  setResults((current) => ({ ...current, [item.itemId]: undefined }));
                }}
                onCheck={() => {
                  const result = checkGuardianChallengeAnswer(item, responses[item.itemId] ?? initialResponseFor(guardianChallengeContractForItem(item)));
                  setResults((current) => ({ ...current, [item.itemId]: result }));
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </RegionActionCard>
  );
}
