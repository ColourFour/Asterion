import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock3,
  Images,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
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
  regionName: string;
  summary: RegionLearningSummary;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  onNavigatePage?: (page: RegionLearningPageId) => void;
}

function requirementIcon(requirement: GuardianRequirement) {
  if (requirement.id === 'field_guide') return <BookOpenCheck size={20} aria-hidden="true" />;
  if (requirement.id === 'skill_checklist') return <CheckCircle2 size={20} aria-hidden="true" />;
  if (requirement.id === 'attempt_count') return <Images size={20} aria-hidden="true" />;
  if (requirement.id === 'recent_high_score') return <Target size={20} aria-hidden="true" />;
  if (requirement.id === 'subtopic_spread') return <Layers3 size={20} aria-hidden="true" />;
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
  if (summary.guardianEligibility.eligible && guardianQuestion) {
    return {
      label: 'Enter the Guardian Challenge',
      helper: 'You have done enough region practice to try the Guardian trial.',
      launch: true,
    };
  }

  if (summary.guardianEligibility.eligible && summary.guardianEligibility.guardianChallengeAvailable) {
    return {
      label: 'Guardian challenge is open',
      helper: 'The region checklist is ready. The Guardian trial is open above.',
      disabled: true,
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

  if (
    firstMissing?.id === 'attempt_count'
    || firstMissing?.id === 'recent_high_score'
    || firstMissing?.id === 'subtopic_spread'
  ) {
    return {
      label: firstMissing.id === 'attempt_count' ? 'Save one exam attempt' : 'Review saved exam practice',
      page: 'exam-training',
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

  if (firstMissing?.id === 'guardian_asset' || firstMissing?.id === 'guardian_challenge_set') {
    return {
      label: 'Guardian assets pending',
      disabled: true,
      helper: firstMissing.detail,
    };
  }

  return {
    label: 'Review readiness',
    disabled: true,
    helper: summary.nextAction.explanation,
  };
}

export function GuardianEligibilityPanel({
  guardianCleared,
  guardianQuestion,
  regionName,
  summary,
  onChallengeGuardian,
  onNavigatePage,
}: GuardianEligibilityPanelProps) {
  const completed = summary.guardianEligibility.requirements.filter((requirement) => requirement.completed);
  const missing = summary.guardianEligibility.requirements.filter((requirement) => !requirement.completed);
  const action = nextGuardianAction(summary, guardianQuestion);

  return (
    <RegionActionCard
      eyebrow="Step 3 · Guardian"
      title="Guardian Challenge"
      description="A later region challenge that opens when the region checklist is ready."
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
              <span>Guardian cleared from saved practice. {regionName} restoration sigil unlocked.</span>
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
      ) : summary.guardianEligibility.eligible && (guardianQuestion || summary.guardianEligibility.guardianChallengeAvailable) ? (
        <>
          <div className="guardian-ready-banner">
            <Sparkles size={22} aria-hidden="true" />
            <div>
              <strong>Guardian ready</strong>
              <span>
                {summary.guardianEligibility.guardianChallengeAvailable
                  ? 'The region checklist is ready. The Guardian trial is open above.'
                  : 'The vault opens now. Enter the difficult exam-style challenge when you are ready.'}
              </span>
            </div>
          </div>
          {guardianQuestion ? (
            <button className="primary-button guardian-primary-action" type="button" onClick={() => onChallengeGuardian(guardianQuestion)}>
              <Sparkles size={18} aria-hidden="true" />
              {action.label}
            </button>
          ) : null}
          <details className="guardian-evidence-detail">
            <summary>What opened the Guardian?</summary>
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
            {guardianQuestion ? (
              <div className="guardian-question-preview">
                <span>Launch target</span>
                <strong>{questionSummary(guardianQuestion)}</strong>
              </div>
            ) : null}
          </details>
        </>
      ) : (
        <>
          <p className="guardian-encouragement">
            {summary.guardianEligibility.skillChecklistCompletion
              ? 'The Guardian opens when the region checklist is ready.'
              : 'The Guardian opens after enough saved region practice.'}
          </p>
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
            <summary>What is already done?</summary>
            <ul className="guardian-requirements completed-requirements">
              {completed.map((requirement) => (
                <li key={requirement.id}><CheckCircle2 size={16} /> {requirement.detail}</li>
              ))}
              {completed.length === 0 ? <li><Circle size={16} /> Start with the Field Guide, then save practice attempts.</li> : null}
            </ul>
            {missing.length ? (
              <ul className="guardian-requirements missing-requirements">
                {missing.map((requirement) => (
                  <li key={requirement.id}><Lock size={16} /> {requirement.detail}</li>
                ))}
              </ul>
            ) : null}
          </details>
        </>
      )}
    </RegionActionCard>
  );
}
