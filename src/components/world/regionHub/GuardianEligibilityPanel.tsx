import { CheckCircle2, Circle, Lock, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import type { NormalizedQuestion } from '../../../types';
import type { RegionLearningSummary } from '../../../lib/regionLearning';
import { RegionActionCard } from './RegionActionCard';
import { questionSummary } from './regionHubPanelUtils';

interface GuardianEligibilityPanelProps {
  guardianCleared: boolean;
  guardianQuestion?: NormalizedQuestion;
  regionName: string;
  summary: RegionLearningSummary;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
}

export function GuardianEligibilityPanel({
  guardianCleared,
  guardianQuestion,
  regionName,
  summary,
  onChallengeGuardian,
}: GuardianEligibilityPanelProps) {
  const completed = summary.guardianEligibility.requirements.filter((requirement) => requirement.completed);
  const missing = summary.guardianEligibility.requirements.filter((requirement) => !requirement.completed);

  return (
    <RegionActionCard
      eyebrow="Step 5 · Guardian evidence"
      title="Guardian Challenge"
      description="An exam-image challenge unlocked by saved practice evidence."
      icon={<ShieldCheck size={22} />}
      stateIcon={summary.guardianEligibility.eligible ? <Sparkles size={22} aria-label="Guardian unlocked" /> : <Lock size={22} aria-label="Guardian locked" />}
      className="guardian-card"
    >
      {guardianCleared ? (
        <div className="guardian-cleared-banner">
          <Trophy size={22} />
          <div>
            <strong>Region restored</strong>
            <span>Guardian cleared from saved practice evidence. {regionName} restoration sigil unlocked.</span>
          </div>
        </div>
      ) : summary.guardianEligibility.eligible && guardianQuestion ? (
        <>
          <p>The Guardian is ready. This challenge uses a practice question with an available mark scheme.</p>
          <div className="guardian-question-preview">
            <span>Selected guardian question</span>
            <strong>{questionSummary(guardianQuestion)}</strong>
          </div>
          <button className="primary-button" type="button" onClick={() => onChallengeGuardian(guardianQuestion)}>
            Challenge the Guardian
          </button>
        </>
      ) : (
        <>
          <p className="guardian-encouragement">Guardian not ready yet. Complete the missing evidence below and it will unlock automatically.</p>
          <div className="guardian-checklists">
            <details className="guardian-requirement-group" open>
              <summary>Still needed</summary>
              <ul className="guardian-requirements missing-requirements">
                {missing.map((requirement) => (
                  <li key={requirement.id}><Lock size={16} /> {requirement.detail}</li>
                ))}
              </ul>
            </details>
            <details className="guardian-requirement-group">
              <summary>Completed evidence</summary>
              <ul className="guardian-requirements completed-requirements">
                {completed.map((requirement) => (
                  <li key={requirement.id}><CheckCircle2 size={16} /> {requirement.detail}</li>
                ))}
                {completed.length === 0 ? <li><Circle size={16} /> No guardian requirements completed yet.</li> : null}
              </ul>
            </details>
          </div>
          <div className="guardian-next-unlock">
            <Target size={18} />
            <span>{summary.nextAction.explanation}</span>
          </div>
        </>
      )}
    </RegionActionCard>
  );
}
