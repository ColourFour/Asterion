import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock3,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { NormalizedQuestion } from '../../../types';
import type { GuardianRequirement, RegionLearningSummary } from '../../../lib/regionLearning';
import type { RegionLearningPageId } from '../../../lib/regionRoutes';
import { RegionActionCard } from './RegionActionCard';
import { questionSummary } from './regionHubPanelUtils';

interface GuardianEligibilityPanelProps {
  guardianCleared: boolean;
  guardianQuestion?: NormalizedQuestion;
  guardianAccessLockedReason?: string;
  guardianStartLockedReason?: string;
  regionName: string;
  summary: RegionLearningSummary;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  onNavigatePage?: (page: RegionLearningPageId) => void;
}

function requirementIcon(requirement: GuardianRequirement) {
  if (requirement.id === 'field_guide') return <BookOpenCheck size={20} aria-hidden="true" />;
  if (requirement.id === 'skill_checklist') return <CheckCircle2 size={20} aria-hidden="true" />;
  return <ShieldCheck size={20} aria-hidden="true" />;
}

function requirementProgressLabel(requirement: GuardianRequirement): string {
  if (requirement.progress?.label) return requirement.progress.label;
  if (requirement.progress) return `${requirement.progress.current} / ${requirement.progress.target}`;
  return requirement.completed ? 'Done' : 'Locked';
}

function nextGuardianAction(summary: RegionLearningSummary, guardianQuestion?: NormalizedQuestion): {
  label: string;
  page?: RegionLearningPageId;
  disabled?: boolean;
  helper: string;
  launch?: boolean;
} {
  if (summary.guardianEligibility.eligible && summary.guardianEligibility.guardianChallengeAvailable) {
    return {
      label: 'Guardian challenge is open',
      helper: 'The Field Guide and Skill Check are complete. The Guardian trial is open above.',
      disabled: true,
    };
  }

  if (summary.guardianEligibility.eligible && guardianQuestion) {
    return {
      label: 'Enter the Guardian Challenge',
      helper: 'The Field Guide and Skill Check are complete.',
      launch: true,
    };
  }

  const firstMissing = summary.guardianEligibility.requirements.find((requirement) => !requirement.completed);

  if (firstMissing?.id === 'field_guide') {
    return {
      label: 'Start with the Field Guide',
      page: 'field-guide',
      helper: firstMissing.nextAction ?? firstMissing.detail,
    };
  }

  if (firstMissing?.id === 'skill_checklist') {
    return {
      label: 'Open Skill Check',
      page: 'skill-practice',
      helper: firstMissing.nextAction ?? firstMissing.detail,
    };
  }

  if (summary.guardianEligibility.eligible) {
    return {
      label: 'Guardian content pending',
      disabled: true,
      helper: 'Unlock requirements are complete. Guardian challenge content is still being prepared for this region.',
    };
  }

  return {
    label: 'Review readiness',
    disabled: true,
    helper: summary.nextAction.explanation,
  };
}

function SkillCheckTopicBreakdown({ summary }: { summary: RegionLearningSummary }) {
  const completion = summary.guardianEligibility.skillChecklistCompletion;
  if (!completion?.topicProgress.length) return null;

  return (
    <div className="guardian-topic-breakdown" aria-label="Skill Check topic completion">
      {completion.topicProgress.map((topic) => (
        <span className={topic.completed ? 'is-complete' : 'is-pending'} key={topic.topicId}>
          <CheckCircle2 size={14} aria-hidden="true" />
          {topic.title}
        </span>
      ))}
    </div>
  );
}

export function GuardianEligibilityPanel({
  guardianCleared,
  guardianQuestion,
  guardianAccessLockedReason,
  guardianStartLockedReason,
  regionName,
  summary,
  onChallengeGuardian,
  onNavigatePage,
}: GuardianEligibilityPanelProps) {
  const completed = summary.guardianEligibility.requirements.filter((requirement) => requirement.completed);
  const missing = summary.guardianEligibility.requirements.filter((requirement) => !requirement.completed);
  const action = guardianAccessLockedReason && summary.guardianEligibility.eligible
    ? {
      label: 'Guardian locked by class settings',
      disabled: true,
      helper: guardianStartLockedReason ?? guardianAccessLockedReason,
    }
    : nextGuardianAction(summary, guardianQuestion);
  const readyButClassLocked = Boolean(guardianAccessLockedReason && summary.guardianEligibility.eligible);

  return (
    <RegionActionCard
      eyebrow="Step 3 · Guardian"
      title="Guardian Challenge"
      description="A later region challenge that opens when Field Guide and Skill Check are complete."
      icon={<ShieldCheck size={22} />}
      stateIcon={summary.guardianEligibility.eligible ? <Sparkles size={22} aria-label="Guardian unlocked" /> : <Lock size={22} aria-label="Guardian locked" />}
      className="guardian-card guardian-readiness-card"
    >
      {guardianCleared ? (
        <>
          <div className="guardian-cleared-banner">
            <Trophy size={22} />
            <div>
              <strong>Region restored</strong>
              <span>Guardian cleared. {regionName} restoration sigil unlocked.</span>
            </div>
          </div>
          <div className="guardian-requirement-grid" aria-label="Guardian requirements">
            {summary.guardianEligibility.requirements.map((requirement) => (
              <article className="guardian-requirement-card is-complete" key={requirement.id}>
                <span className="guardian-requirement-icon">{requirementIcon(requirement)}</span>
                <div>
                  <strong>{requirement.label}</strong>
                  <span>{requirementProgressLabel(requirement)}</span>
                </div>
                <CheckCircle2 size={18} aria-label="Requirement complete" />
              </article>
            ))}
          </div>
        </>
      ) : summary.guardianEligibility.eligible && (guardianQuestion || summary.guardianEligibility.guardianChallengeAvailable || guardianAccessLockedReason) ? (
        <>
          <div className={readyButClassLocked ? 'guardian-ready-banner is-locked' : 'guardian-ready-banner'}>
            {readyButClassLocked ? <Lock size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
            <div>
              <strong>{readyButClassLocked ? 'Guardian ready, locked by class settings' : 'Guardian ready'}</strong>
              <span>
                {guardianAccessLockedReason
                  ? guardianAccessLockedReason
                  : summary.guardianEligibility.guardianChallengeAvailable
                  ? 'Field Guide and Skill Check are complete. The Guardian trial is open above.'
                  : 'The vault opens now. Enter the difficult exam-style challenge when you are ready.'}
              </span>
            </div>
          </div>
          {guardianQuestion && !summary.guardianEligibility.guardianChallengeAvailable ? (
            <button
              className="primary-button guardian-primary-action"
              type="button"
              disabled={Boolean(guardianAccessLockedReason)}
              onClick={() => {
                if (!guardianAccessLockedReason) onChallengeGuardian(guardianQuestion);
              }}
            >
              <Sparkles size={18} aria-hidden="true" />
              {guardianAccessLockedReason ? 'Guardian locked by class settings' : action.label}
            </button>
          ) : null}
          <details className="guardian-evidence-detail">
            <summary>What counts?</summary>
            <div className="guardian-requirement-grid" aria-label="Guardian requirements">
              {summary.guardianEligibility.requirements.map((requirement) => (
                <article className="guardian-requirement-card is-complete" key={requirement.id}>
                  <span className="guardian-requirement-icon">{requirementIcon(requirement)}</span>
                  <div>
                    <strong>{requirement.label}</strong>
                    <span>{requirementProgressLabel(requirement)}</span>
                    <small>{requirement.detail}</small>
                  </div>
                  <CheckCircle2 size={18} aria-label="Requirement complete" />
                </article>
              ))}
            </div>
            {guardianQuestion && !summary.guardianEligibility.guardianChallengeAvailable ? (
              <div className="guardian-question-preview">
                <span>Launch target</span>
                <strong>{questionSummary(guardianQuestion)}</strong>
              </div>
            ) : null}
            <SkillCheckTopicBreakdown summary={summary} />
          </details>
        </>
      ) : (
        <>
          <p className="guardian-encouragement">
            The Guardian opens when Field Guide and Skill Check are complete.
          </p>
          {guardianAccessLockedReason ? (
            <div className="guardian-ready-banner is-locked">
              <Lock size={22} aria-hidden="true" />
              <div>
                <strong>Guardian also locked by class settings</strong>
                <span>{guardianAccessLockedReason}</span>
              </div>
            </div>
          ) : null}
          <div className="guardian-requirement-grid" aria-label="Guardian requirements">
            {summary.guardianEligibility.requirements.map((requirement) => (
              <article className={`guardian-requirement-card${requirement.completed ? ' is-complete' : ' is-locked'}`} key={requirement.id}>
                <span className="guardian-requirement-icon">{requirementIcon(requirement)}</span>
                <div>
                  <strong>{requirement.label}</strong>
                  <span>{requirementProgressLabel(requirement)}</span>
                  <small>{requirement.detail}</small>
                </div>
                {requirement.completed ? <CheckCircle2 size={18} aria-label="Requirement complete" /> : <Lock size={18} aria-label="Requirement locked" />}
              </article>
            ))}
          </div>
          <div className="guardian-next-unlock guardian-next-action">
            <Clock3 size={18} aria-hidden="true" />
            <div>
              <strong>Next step</strong>
              <span>{action.helper}</span>
            </div>
            <button
              type="button"
              className="guardian-next-action-button"
              data-guardian-next-action={action.page ?? 'none'}
              disabled={action.disabled}
              onClick={() => {
                if (action.launch && guardianQuestion) {
                  onChallengeGuardian(guardianQuestion);
                } else if (action.page) {
                  onNavigatePage?.(action.page);
                }
              }}
            >
              {action.label}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <details className="guardian-evidence-detail">
            <summary>What counts?</summary>
            <ul className="guardian-requirements completed-requirements">
              {completed.map((requirement) => (
                <li key={requirement.id}><CheckCircle2 size={16} /> {requirement.detail}</li>
              ))}
              {completed.length === 0 ? <li><Circle size={16} /> Start with the Field Guide, then complete Skill Check topics.</li> : null}
            </ul>
            {missing.length ? (
              <ul className="guardian-requirements missing-requirements">
                {missing.map((requirement) => (
                  <li key={requirement.id}><Lock size={16} /> {requirement.detail}</li>
                ))}
              </ul>
            ) : null}
            <SkillCheckTopicBreakdown summary={summary} />
          </details>
        </>
      )}
    </RegionActionCard>
  );
}
