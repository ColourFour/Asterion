import { AlertTriangle, BookOpenCheck, CheckCircle2, Dumbbell, Lock, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import type { NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import { TRAINING_SESSION_LABELS, type RegionLearningSummary } from '../../lib/regionLearning';

interface RegionHubProps {
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  summary: RegionLearningSummary;
  onCompleteFieldGuide: () => void;
  onStartTraining: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  onReturnToMap: () => void;
}

const trainingIntents: TrainingSessionIntent[] = ['warm_up', 'core_practice', 'weak_area_review', 'challenge'];

const stateLabels: Record<string, string> = {
  locked: 'Locked',
  available: 'Field Guide ready',
  field_guide_started: 'Field Guide started',
  field_guide_completed: 'Field Guide complete',
  training_in_progress: 'Training in progress',
  guardian_unlocked: 'Guardian unlocked',
  guardian_attempted: 'Guardian attempted',
  guardian_cleared: 'Guardian cleared',
  mastered: 'Mastered',
  needs_review: 'Needs review',
};

function percent(value: number | undefined): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a';
}

function questionSummary(question: NormalizedQuestion): string {
  return [
    question.paper,
    question.questionNumber ? `Q${question.questionNumber}` : undefined,
    question.displayDifficulty,
    typeof question.marksAvailable === 'number' ? `${question.marksAvailable} marks` : undefined,
  ].filter(Boolean).join(' · ');
}

export function RegionHub({
  regionProgress,
  fieldGuide,
  fieldGuideCompleted,
  summary,
  onCompleteFieldGuide,
  onStartTraining,
  onChallengeGuardian,
  onReturnToMap,
}: RegionHubProps) {
  const { region } = regionProgress;
  const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
  const guardianQuestion = summary.guardianEligibility.guardianQuestion;
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';

  return (
    <section className={`region-hub region-${region.id} learning-${summary.visualTreatment}`} aria-labelledby="region-hub-title">
      <header className="section-page-header region-hub-header">
        <div>
          <span className="mode-pill">Region Learning Loop</span>
          <h2 id="region-hub-title">{region.name}</h2>
          <p>{region.description}</p>
        </div>
        <button type="button" onClick={onReturnToMap}>Return to map</button>
      </header>

      <div className="region-hub-status">
        <div>
          <span>Current state</span>
          <strong>{stateLabels[summary.state] ?? summary.state}</strong>
        </div>
        <div>
          <span>Next action</span>
          <strong>{summary.nextAction.label}</strong>
          <p>{summary.nextAction.explanation}</p>
        </div>
        <div>
          <span>Evidence</span>
          <strong>{regionProgress.attempts} attempts · {percent(regionProgress.averageScoreRatio)} average</strong>
          <p>{regionProgress.subtopicsTouched}/{region.subtopics.length} listed subtopics touched.</p>
        </div>
      </div>

      <div className="region-hub-grid">
        <article className="region-loop-card field-guide-card">
          <div className="region-loop-card-title">
            <BookOpenCheck size={22} />
            <div>
              <span>Phase 1</span>
              <h3>Field Guide</h3>
            </div>
            {fieldGuideCompleted ? <CheckCircle2 className="card-state-icon" size={22} aria-label="Field Guide complete" /> : null}
          </div>

          <section>
            <h4>What this topic is</h4>
            <p>{fieldGuide.topic}</p>
          </section>

          <section>
            <h4>What to recognize</h4>
            <ul>{fieldGuide.whatToRecognize.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <h4>Common exam moves</h4>
            <ul>{fieldGuide.commonExamMoves.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <h4>Common traps</h4>
            <ul>{fieldGuide.commonTraps.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <h4>Worked-example placeholders</h4>
            <div className="worked-example-grid">
              {fieldGuide.workedExamples.map((example) => (
                <div className="worked-example-card" key={example.title}>
                  <strong>{example.title}</strong>
                  <span>{example.focus}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4>Before you practice, make sure you can...</h4>
            <ul className="readiness-list">{fieldGuide.readinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <button className="primary-button" type="button" disabled={fieldGuideCompleted} onClick={onCompleteFieldGuide}>
            {fieldGuideCompleted ? 'Field Guide complete' : 'Mark Field Guide complete'}
          </button>
        </article>

        <article className="region-loop-card training-card">
          <div className="region-loop-card-title">
            <Dumbbell size={22} />
            <div>
              <span>Phase 2</span>
              <h3>Training Grounds</h3>
            </div>
          </div>
          <p>{summary.trainingSession.reason}</p>
          <div className="recommended-session">
            <Target size={18} />
            <div>
              <span>Recommended session</span>
              <strong>{summary.trainingSession.label}</strong>
            </div>
          </div>
          <div className="training-intent-grid" aria-label="Training session choices">
            {trainingIntents.map((intent) => (
              <button
                key={intent}
                className={intent === summary.trainingSession.intent ? 'recommended-intent' : ''}
                type="button"
                disabled={!canTrain}
                onClick={() => onStartTraining(intent)}
              >
                {TRAINING_SESSION_LABELS[intent]}
              </button>
            ))}
          </div>
          {!canTrain ? (
            <div className="guardian-missing-list" role="status">
              <AlertTriangle size={18} />
              <span>No trainable question and mark-scheme image pairs are loaded for this region yet.</span>
            </div>
          ) : null}
        </article>

        <article className="region-loop-card guardian-card">
          <div className="region-loop-card-title">
            <ShieldCheck size={22} />
            <div>
              <span>Phase 3</span>
              <h3>Region Guardian</h3>
            </div>
            {summary.guardianEligibility.eligible ? <Sparkles className="card-state-icon" size={22} aria-label="Guardian unlocked" /> : <Lock className="card-state-icon" size={22} aria-label="Guardian locked" />}
          </div>

          {guardianCleared ? (
            <div className="guardian-cleared-banner">
              <Trophy size={22} />
              <div>
                <strong>Guardian cleared</strong>
                <span>Reward placeholder unlocked: {region.name} restoration sigil.</span>
              </div>
            </div>
          ) : summary.guardianEligibility.eligible && guardianQuestion ? (
            <>
              <p>Your saved local evidence meets the guardian gate. This challenge uses a trainable question with an available mark scheme.</p>
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
              <p>The guardian stays locked until the evidence below is saved locally.</p>
              <ul className="guardian-requirements">
                {summary.guardianEligibility.missingRequirements.map((requirement) => (
                  <li key={requirement}><Lock size={16} /> {requirement}</li>
                ))}
              </ul>
            </>
          )}
        </article>

        <aside className="region-reward-preview" aria-label="Mastery and reward preview">
          <Trophy size={22} />
          <div>
            <span>Mastery / reward preview</span>
            <strong>{region.name} restoration sigil</strong>
            <p>Field Guide completion unlocks no marks or XP. Rewards appear only after saved practice evidence and a cleared guardian.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
