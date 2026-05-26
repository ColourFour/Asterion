import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, CheckCircle2, FileSearch, HelpCircle, LayoutDashboard, Map, MessageCircle, RotateCcw, User } from 'lucide-react';
import type { Attempt, AttemptMarkBreakdown, AvatarSettings, IssueType, MistakeType, NormalizedQuestion, RegionDefinition, RegionProgress, RegionRank, StoredProgress, TrainingSessionIntent } from '../../types';
import { astralAssetDimensions, astralAssets } from '../../lib/astralAssets';
import type { AvatarLocation } from '../../lib/avatarLocation';
import { EXAM_TRAINING_PRACTICE_LABELS, knownExamTrainingSkillName, type ExamTrainingPracticeMode } from '../../lib/examTrainingDashboard';
import { createId } from '../../lib/progressStore';
import { TRAINING_SESSION_LABELS } from '../../lib/regionLearning';
import type { RegionLearningPageId } from '../../lib/regionRoutes';
import { trainingBlockersForQuestion } from '../../lib/questionTraining';
import { parseAttemptMarkBreakdown, parseAttemptPartScores, parseAttemptScore } from '../../lib/attemptScoring';
import { ImageStack, type ImageStackAvailability } from './ImageStack';
import { IssueReportButton } from './IssueReportButton';

const markCategories: Array<{ key: keyof AttemptMarkBreakdown; label: string; description: string }> = [
  { key: 'm', label: 'M', description: 'Method' },
  { key: 'b', label: 'B', description: 'Independent' },
  { key: 'a', label: 'A', description: 'Accuracy' },
];

const emptyMarkInputs: Record<keyof AttemptMarkBreakdown, string> = {
  m: '',
  b: '',
  a: '',
};

type PartMarkInputs = Record<string, Record<keyof AttemptMarkBreakdown, string>>;

function emptyPartMarkInputs(parts: NormalizedQuestion['parts']): PartMarkInputs {
  return Object.fromEntries((parts ?? []).map((part) => [part.label, { ...emptyMarkInputs }]));
}

const FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH = 8;
type SelectableMistakeType = Exclude<MistakeType, 'no_issue'>;

interface SavedAttemptFeedback {
  beforeRegionProgress?: RegionProgress;
  mistakeLabels: string[];
  savedAsFullScore: boolean;
  scoreEarned: number;
  scoreRatio?: number;
  scoreTotalLabel: string;
}

const studentTopicLabels: Record<string, string> = {
  '9709_p3_topic_algebra': 'Algebra',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'Logarithms and exponentials',
  '9709_p3_topic_trigonometry': 'Trigonometry',
  '9709_p3_topic_complex_numbers': 'Complex numbers',
  '9709_p3_topic_differentiation': 'Differentiation',
  '9709_p3_topic_integration': 'Integration',
  '9709_p3_topic_vectors': 'Vectors',
  '9709_p3_topic_numerical_solution_of_equations': 'Numerical methods',
  '9709_p3_topic_differential_equations': 'Differential equations',
  algebra: 'Algebra',
  logarithms_and_exponentials: 'Logarithms and exponentials',
  logarithms: 'Logarithms',
  trigonometry: 'Trigonometry',
  complex_numbers: 'Complex numbers',
  differentiation: 'Differentiation',
  integration: 'Integration',
  vectors: 'Vectors',
  numerical_methods: 'Numerical methods',
  differential_equations: 'Differential equations',
};

function studentTopicLabelFromRouteId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const normalized = id.trim();
  if (!normalized) return undefined;
  const exact = studentTopicLabels[normalized];
  if (exact) return exact;
  const [prefix, detail] = normalized.split('.');
  const topicPrefix = studentTopicLabels[prefix];
  if (detail) {
    return detail
      .replace(/_basic$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return topicPrefix;
}

const selectableMistakeTypes: SelectableMistakeType[] = [
  'did_not_know_method',
  'could_not_start',
  'algebra_error',
  'formula_issue',
  'misread_question',
  'diagram_or_modeling_issue',
  'rounding_accuracy',
  'slow_method',
  'ran_out_of_time',
  'lucky_or_unsure',
  'other',
];

const mistakeLabels: Record<SelectableMistakeType, string> = {
  did_not_know_method: 'I did not know the method',
  algebra_error: 'Algebra error',
  misread_question: 'Misread the question',
  formula_issue: 'Formula or identity issue',
  diagram_or_modeling_issue: 'Diagram or modelling issue',
  ran_out_of_time: 'Ran out of time',
  rounding_accuracy: 'Rounding or accuracy issue',
  could_not_start: 'Could not start',
  slow_method: 'Method worked but was slow',
  lucky_or_unsure: 'Lucky or unsure',
  other: 'Other',
};

function percentLabel(value: number | undefined): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : undefined;
}

interface PracticeViewProps {
  question?: NormalizedQuestion;
  progress: StoredProgress;
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
  avatarLocation: AvatarLocation;
  worldName?: string;
  selectedRegion?: RegionDefinition;
  selectedRegionRank?: RegionRank;
  regionLearningPhase?: 'training' | 'guardian';
  sessionIntent?: TrainingSessionIntent;
  sessionLabelOverride?: string;
  sessionReason?: string;
  currentPracticeMode?: ExamTrainingPracticeMode;
  guardianPassThreshold?: number;
  progressionBlockedReason?: string;
  onAttempt: (attempt: Attempt) => void;
  onIssue: (questionId: string, issueType: IssueType, note?: string) => void;
  onReturnToMap?: () => void;
  onReviewWeak?: () => void;
  onContinuePractice?: () => void;
  continuePracticeLabel?: string;
  onOpenRegionTool?: (page: RegionLearningPageId) => void;
  onOpenDashboard?: () => void;
  onSelectPracticeMode?: (mode: ExamTrainingPracticeMode) => void;
  onOpenProfile?: () => void;
}

export function PracticeView({
  question,
  progress,
  avatarName,
  avatar,
  regionProgress,
  avatarLocation,
  worldName,
  selectedRegion,
  selectedRegionRank,
  regionLearningPhase,
  sessionIntent,
  sessionLabelOverride,
  sessionReason,
  currentPracticeMode,
  guardianPassThreshold,
  progressionBlockedReason,
  onAttempt,
  onIssue,
  onReturnToMap,
  onContinuePractice,
  onOpenRegionTool,
  onOpenDashboard,
  onSelectPracticeMode,
  onOpenProfile,
}: PracticeViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [totalMarkInput, setTotalMarkInput] = useState('');
  const [markInputs, setMarkInputs] = useState<Record<keyof AttemptMarkBreakdown, string>>(emptyMarkInputs);
  const [partMarkInputs, setPartMarkInputs] = useState<PartMarkInputs>({});
  const [selectedMistakeTypes, setSelectedMistakeTypes] = useState<MistakeType[]>([]);
  const [fullScoreConfirmed, setFullScoreConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [markSchemeAvailability, setMarkSchemeAvailability] = useState<ImageStackAvailability>('pending');
  const [askTeacherOpen, setAskTeacherOpen] = useState(false);
  const [teacherQuestionDraft, setTeacherQuestionDraft] = useState('');
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [savedAttemptFeedback, setSavedAttemptFeedback] = useState<SavedAttemptFeedback | null>(null);

  useEffect(() => {
    setRevealed(false);
    setTotalMarkInput('');
    setMarkInputs(emptyMarkInputs);
    setPartMarkInputs(emptyPartMarkInputs(question?.parts));
    setSelectedMistakeTypes([]);
    setFullScoreConfirmed(false);
    setNote('');
    setAttemptSaved(false);
    setStartedAt(Date.now());
    setMarkSchemeAvailability(question?.markSchemeImageCandidates.length ? 'pending' : 'unavailable');
    setAskTeacherOpen(false);
    setTeacherQuestionDraft('');
    setRationaleOpen(false);
    setSavedAttemptFeedback(null);
  }, [question?.id, question?.markSchemeImageCandidates.length, question?.parts]);

  const maxMarks = question?.marksAvailable;
  const questionParts = question?.parts?.length ? question.parts : undefined;
  const hasQuestionMarkCaps = Boolean(question?.markBreakdown);
  const hasPartMarkCaps = Boolean(questionParts?.length && questionParts.every((part) => part.markBreakdown));
  const usesPartMarking = Boolean(questionParts?.length && hasPartMarkCaps);
  const usesCategoryMarking = Boolean(!questionParts?.length && hasQuestionMarkCaps);
  const usesTotalMarkFallback = !usesPartMarking && !usesCategoryMarking;
  const scoreValidation = useMemo(() => (
    usesPartMarking && questionParts?.length
      ? parseAttemptPartScores(partMarkInputs, questionParts, maxMarks)
      : usesCategoryMarking
        ? parseAttemptMarkBreakdown(markInputs, maxMarks, question?.markBreakdown)
        : parseAttemptScore(totalMarkInput, maxMarks)
  ), [markInputs, maxMarks, partMarkInputs, question?.markBreakdown, questionParts, totalMarkInput, usesCategoryMarking, usesPartMarking]);
  const trainingBlockers = useMemo(() => (question ? trainingBlockersForQuestion(question) : []), [question]);
  const questionIsTrainable = trainingBlockers.length === 0;
  const markSchemeIsAvailable = markSchemeAvailability === 'available';
  const canSaveScoredAttempt = questionIsTrainable && markSchemeIsAvailable && !progressionBlockedReason;
  const isFullScore = Boolean(
    scoreValidation.isValid
    && typeof scoreValidation.earned === 'number'
    && typeof maxMarks === 'number'
    && maxMarks > 0
    && scoreValidation.earned === maxMarks,
  );
  const fullScoreEvidenceNoteIsReady = note.trim().length >= FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH;
  const attemptReflectionIsReady = isFullScore
    ? fullScoreConfirmed && fullScoreEvidenceNoteIsReady
    : selectedMistakeTypes.length > 0;
  const canSubmit = Boolean(question && revealed && canSaveScoredAttempt && scoreValidation.isValid && attemptReflectionIsReady);
  const markSchemeNoticeTitle = progressionBlockedReason
    ? 'Region activity locked'
    : questionIsTrainable && markSchemeAvailability === 'pending' ? 'Mark scheme loading' : 'Mark scheme unavailable';
  const guardianPassed = regionLearningPhase === 'guardian'
    && typeof guardianPassThreshold === 'number'
    && typeof scoreValidation.scoreRatio === 'number'
    && scoreValidation.scoreRatio >= guardianPassThreshold;
  const activePracticeMode: ExamTrainingPracticeMode = currentPracticeMode
    ?? (sessionIntent === 'weak_area_review' ? 'weak' : sessionLabelOverride === EXAM_TRAINING_PRACTICE_LABELS.stretch ? 'stretch' : 'core');
  const activePracticeLabel = EXAM_TRAINING_PRACTICE_LABELS[activePracticeMode];
  const practiceModeCopy: Record<ExamTrainingPracticeMode, string> = {
    core: 'Balanced exam-style practice.',
    weak: 'Review from saved mistakes and lower scores.',
    stretch: 'Challenge-style practice.',
  };
  const practiceModeStyle = {
    '--practice-mode-accent': activePracticeMode === 'weak' ? '#d99518' : activePracticeMode === 'stretch' ? '#6d55c8' : '#2f8752',
    '--practice-mode-accent-strong': activePracticeMode === 'weak' ? '#a96708' : activePracticeMode === 'stretch' ? '#493384' : '#1d5d38',
    '--practice-mode-accent-soft': activePracticeMode === 'weak' ? '#fff2cc' : activePracticeMode === 'stretch' ? '#eee9ff' : '#e3f5ea',
  } as CSSProperties;
  const sessionLabel = regionLearningPhase === 'guardian'
    ? 'Region Guardian'
    : sessionLabelOverride
      ? sessionLabelOverride
      : sessionIntent
      ? TRAINING_SESSION_LABELS[sessionIntent]
      : activePracticeLabel;
  const maxMarkValue = typeof maxMarks === 'number' ? maxMarks : 10;
  const enteredMarkTotal = usesPartMarking ? Object.values(partMarkInputs).reduce((sum, partInput) => {
    return sum + markCategories.reduce((partSum, category) => {
      const value = Number(partInput[category.key]);
      return Number.isFinite(value) ? partSum + value : partSum;
    }, 0);
  }, 0) : usesCategoryMarking ? markCategories.reduce((sum, category) => {
    const value = Number(markInputs[category.key]);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0) : Number(totalMarkInput);

  useEffect(() => {
    if (!isFullScore) setFullScoreConfirmed(false);
  }, [isFullScore]);

  function clampMarkValue(value: string, upperLimit: number): string {
    if (value.trim() === '') return '';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return value;
    return String(Math.min(upperLimit, Math.max(0, numericValue)));
  }

  function updateMarkInput(key: keyof AttemptMarkBreakdown, value: string) {
    const categoryCap = question?.markBreakdown?.[key] ?? maxMarkValue;
    setMarkInputs((current) => ({ ...current, [key]: clampMarkValue(value, categoryCap) }));
  }

  function updatePartMarkInput(label: string, key: keyof AttemptMarkBreakdown, value: string) {
    const part = questionParts?.find((item) => item.label === label);
    const categoryCap = part?.markBreakdown?.[key] ?? part?.marksAvailable ?? maxMarkValue;
    setPartMarkInputs((current) => ({
      ...current,
      [label]: {
        ...(current[label] ?? emptyMarkInputs),
        [key]: clampMarkValue(value, categoryCap),
      },
    }));
  }

  function toggleMistakeType(type: SelectableMistakeType) {
    setSelectedMistakeTypes((current) => (
      current.includes(type)
        ? current.filter((selected) => selected !== type)
        : [...current, type]
    ));
  }

  function resetCurrentQuestionAttempt() {
    setRevealed(false);
    setTotalMarkInput('');
    setMarkInputs(emptyMarkInputs);
    setPartMarkInputs(emptyPartMarkInputs(question?.parts));
    setSelectedMistakeTypes([]);
    setFullScoreConfirmed(false);
    setNote('');
    setAttemptSaved(false);
    setStartedAt(Date.now());
    setAskTeacherOpen(false);
    setTeacherQuestionDraft('');
    setSavedAttemptFeedback(null);
  }

  function partMarkTotal(label: string): number {
    const partInput = partMarkInputs[label] ?? emptyMarkInputs;
    return markCategories.reduce((sum, category) => {
      const value = Number(partInput[category.key]);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }

  const scoreTotalLabel = `${typeof scoreValidation.earned === 'number' ? scoreValidation.earned : Number.isFinite(enteredMarkTotal) ? enteredMarkTotal : 0} / ${typeof maxMarks === 'number' ? maxMarks : '?'}`;
  const isGuardianPractice = regionLearningPhase === 'guardian';
  const isRegionTrainingPractice = Boolean(selectedRegion && !isGuardianPractice);
  const selectedRegionProgressSnapshot = selectedRegion
    ? regionProgress.find((item) => item.region.id === selectedRegion.id)
    : undefined;
  const hasSavedPracticeForCurrentScope = selectedRegion
    ? Boolean(selectedRegionProgressSnapshot?.attempts)
    : progress.attempts.length > 0;
  const whyThisQuestionLine = isGuardianPractice
    ? 'This is the Guardian check for this region, opened by your saved practice.'
    : activePracticeMode === 'core'
      ? 'Balanced exam practice: one steady question from the current Paper 3 pool.'
      : activePracticeMode === 'weak'
        ? hasSavedPracticeForCurrentScope
          ? 'Review practice: Asterion uses your saved work where it can, then gives a focused exam question.'
          : 'Starter review: save one attempt first, then Weak Area Review can use your mistake tags and marks.'
        : 'Challenge-style practice: this uses the exam-style pool while precise stretch selection is still limited.';
  const safeSkillLabel = knownExamTrainingSkillName(
    question?.routeEvidence?.primaryTopicId
      ?? question?.topicRouting?.primaryTopicId
      ?? question?.parts?.find((part) => part.skillRef)?.skillRef
      ?? question?.parts?.find((part) => part.primaryTopicId)?.primaryTopicId,
  ) ?? (isGuardianPractice ? 'Final region check' : 'Mixed skill practice');
  const globalPracticeTopicLabel = studentTopicLabelFromRouteId(
    question?.routeEvidence?.primaryTopicId
      ?? question?.topicRouting?.primaryTopicId
      ?? question?.parts?.find((part) => part.skillRef)?.skillRef
      ?? question?.parts?.find((part) => part.primaryTopicId)?.primaryTopicId,
  ) ?? question?.localSubtopic ?? question?.displaySubtopic ?? question?.localTopic ?? 'Mixed Paper 3 practice';
  const practiceFocusLabel = isGuardianPractice
    ? selectedRegion?.name ?? question?.displayTopic ?? 'Guardian challenge'
    : isRegionTrainingPractice
      ? selectedRegion?.name
      : globalPracticeTopicLabel;
  const practiceContextLabel = isGuardianPractice ? 'Guardian focus' : isRegionTrainingPractice ? 'Focus' : 'Target topic';
  const metaItems = [
    {
      label: 'Question',
      value: question?.questionNumber ? `Q${question.questionNumber}` : 'Current item',
    },
    {
      label: 'Exam',
      value: question?.paper ? `CAIE 9709 Paper 3 · ${question.paper}` : 'CAIE 9709 Paper 3',
    },
    {
      label: practiceContextLabel,
      value: practiceFocusLabel,
    },
    {
      label: isGuardianPractice ? 'Challenge' : 'Skill',
      value: safeSkillLabel,
    },
  ];
  const beforeRegionProgress = savedAttemptFeedback?.beforeRegionProgress;
  const afterRegionProgress = selectedRegionProgressSnapshot;
  const regionAttemptChanged = Boolean(
    beforeRegionProgress
    && afterRegionProgress
    && afterRegionProgress.attempts > beforeRegionProgress.attempts,
  );
  const regionRankChanged = Boolean(
    beforeRegionProgress
    && afterRegionProgress
    && afterRegionProgress.rank !== beforeRegionProgress.rank,
  );
  const regionProgressMessage = isGuardianPractice
    ? savedAttemptFeedback?.scoreRatio != null && typeof guardianPassThreshold === 'number' && savedAttemptFeedback.scoreRatio >= guardianPassThreshold
      ? `Guardian cleared. This saved score restores ${selectedRegion?.name ?? 'the region'}.`
      : `Guardian attempt saved. Score ${Math.round((guardianPassThreshold ?? 0.75) * 100)}% or higher next time to clear it.`
    : selectedRegion
      ? regionRankChanged
        ? `${selectedRegion.name} progress changed from ${beforeRegionProgress?.rank} to ${afterRegionProgress?.rank}.`
        : regionAttemptChanged
          ? `This attempt now counts toward ${selectedRegion.name} progress.`
          : 'Saved. This gives Asterion more information for your next recommendation.'
      : 'Saved. This gives Asterion more information for your next recommendation.';
  const guardianReadinessMessage = isGuardianPractice
    ? regionProgressMessage
    : selectedRegion
      ? regionAttemptChanged
        ? 'Guardian readiness will be checked again with this saved attempt.'
        : 'Guardian readiness did not visibly change yet.'
      : 'Guardian readiness is region-specific, so choose a region when you want to work toward a Guardian.';
  const nextRecommendedAction = savedAttemptFeedback?.scoreRatio != null && savedAttemptFeedback.scoreRatio >= 0.75
    ? activePracticeMode === 'stretch'
      ? 'Next: try another challenge-style question or return to the dashboard.'
      : 'Next: continue with another question, or try Stretch when you want a challenge.'
    : savedAttemptFeedback?.mistakeLabels.length
      ? 'Next: use Weak Area Review or try one guided Skill Practice step before Stretch.'
      : 'Next: do one more Core Practice question.';

  if (!question) {
    return (
      <section className="practice-card empty-state empty-wing">
        <strong>Closed academy wing</strong>
        <p>No questions are available for this region yet.</p>
        {onReturnToMap ? <button className="primary-button" type="button" onClick={onReturnToMap}>Return to P3 Astral Academy</button> : null}
      </section>
    );
  }

  return (
    <section className={`practice-card encounter-chamber exam-practice-page mode-${activePracticeMode}${regionLearningPhase === 'guardian' ? ' guardian-practice-page' : ''}`} style={practiceModeStyle}>
      <header className="exam-practice-header">
        <div className="exam-practice-brand">
          <span className="exam-practice-crest" aria-hidden="true"><FileSearch size={26} /></span>
          <div>
            <span className="mode-pill">Exam Training</span>
            <h2>{regionLearningPhase === 'guardian' ? 'Guardian Practice' : 'Exam Training'}</h2>
          </div>
        </div>
        <nav className="exam-practice-mode-nav" aria-label="Exam Training navigation">
          {onOpenDashboard ? (
            <button type="button" onClick={onOpenDashboard}>
              <LayoutDashboard size={18} aria-hidden="true" />
              Dashboard
            </button>
          ) : null}
          {(['core', 'weak', 'stretch'] as ExamTrainingPracticeMode[]).map((mode) => (
            <button
              type="button"
              key={mode}
              className={activePracticeMode === mode && regionLearningPhase !== 'guardian' ? 'active' : ''}
              aria-current={activePracticeMode === mode && regionLearningPhase !== 'guardian' ? 'page' : undefined}
              onClick={() => onSelectPracticeMode?.(mode)}
              disabled={!onSelectPracticeMode || regionLearningPhase === 'guardian'}
            >
              <strong>{EXAM_TRAINING_PRACTICE_LABELS[mode]}</strong>
              <small>{practiceModeCopy[mode]}</small>
            </button>
          ))}
          {onOpenProfile ? (
            <button type="button" onClick={onOpenProfile}>
              <User size={18} aria-hidden="true" />
              Profile
            </button>
          ) : onReturnToMap ? (
            <button type="button" onClick={onReturnToMap}>
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </button>
          ) : null}
        </nav>
      </header>

      <section className={`practice-mode-intro practice-mode-${activePracticeMode}${isGuardianPractice ? ' guardian-mode-intro' : ''}`} aria-label="Current practice mode">
        <div>
          <span>{isGuardianPractice ? 'Guardian Challenge' : activePracticeLabel}</span>
          <strong>{isGuardianPractice ? 'Final region check' : practiceModeCopy[activePracticeMode]}</strong>
        </div>
        <p>{whyThisQuestionLine}</p>
      </section>

      <section className="exam-practice-meta-strip" aria-label="Question details">
        {metaItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
        <button className="exam-practice-info-button" type="button" onClick={() => setRationaleOpen((open) => !open)} aria-expanded={rationaleOpen}>
          <HelpCircle size={16} aria-hidden="true" />
          Why this question?
        </button>
      </section>

      {sessionLabel || sessionReason ? (
        <details
          className={`session-rationale-panel exam-practice-rationale${regionLearningPhase === 'guardian' ? ' guardian-session' : ''}`}
          open={rationaleOpen}
          onToggle={(event) => setRationaleOpen(event.currentTarget.open)}
        >
          <summary>
            <HelpCircle size={16} aria-hidden="true" />
            How this question was chosen
          </summary>
          <div>
            <span>{regionLearningPhase === 'guardian' ? 'Guardian reason' : activePracticeLabel}</span>
            <strong>{sessionLabel ?? activePracticeLabel}</strong>
          </div>
          <p>{sessionReason ?? whyThisQuestionLine}</p>
          {regionLearningPhase === 'guardian' && typeof guardianPassThreshold === 'number' ? (
            <small>Clear threshold: {Math.round(guardianPassThreshold * 100)}% or higher on this saved attempt.</small>
          ) : null}
        </details>
      ) : null}

      <div className={`practice-workspace exam-practice-workspace${revealed ? ' is-revealed' : ''}`}>
        <section className="practice-panel question-panel exam-image-card">
          <div className="exam-card-heading">
            <div>
              <span>Question</span>
              <h3>Work from the question image</h3>
            </div>
            <small>{typeof maxMarks === 'number' ? `${maxMarks} marks` : 'Marks unavailable'}</small>
          </div>
          <div className="paper-window">
            <ImageStack candidateGroups={question.questionImageCandidates} label="Question" />
          </div>
          <details className="practice-support-details">
            <summary>Question support</summary>
            <IssueReportButton onReport={(issueType, reportNote) => onIssue(question.id, issueType, reportNote)} />
          </details>
        </section>

        {revealed ? (
          <section className="practice-panel mark-scheme-panel exam-image-card">
            <div className="exam-card-heading">
              <div>
                <span>Mark Scheme</span>
                <h3>Compare your working</h3>
              </div>
              <small>Use this image to decide each mark. Asterion does not auto-mark exam work.</small>
            </div>
            {questionParts?.length ? (
              <div className="mark-scheme-part-guide" aria-label="Mark scheme part guide">
                <strong>Part totals available</strong>
                <p>{hasPartMarkCaps ? 'Enter each part score below using the mark scheme.' : 'Enter the total mark below using the mark scheme.'}</p>
                <div>
                  {questionParts.map((part) => (
                    <span key={part.label}>Part {part.label}: {part.marksAvailable} mark{part.marksAvailable === 1 ? '' : 's'}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="paper-window mark-window">
              <ImageStack
                candidateGroups={question.markSchemeImageCandidates}
                label="Mark scheme"
                onAvailabilityChange={setMarkSchemeAvailability}
              />
            </div>
            {!canSaveScoredAttempt ? (
              <div className="mark-scheme-unavailable" role="status">
                <strong>{markSchemeNoticeTitle}</strong>
                <p>{progressionBlockedReason ?? 'The official mark scheme is unavailable or this record is paused for scoring. Asterion will not save marks, XP, mastery, or avatar progress for this question.'}</p>
                {progressionBlockedReason ? <small>Asterion will not save marks, XP, mastery, guardian clears, or avatar progress for this locked region.</small> : null}
                {trainingBlockers.length ? <small>This question is paused: {trainingBlockers.join('; ')}</small> : null}
                {markSchemeAvailability === 'pending' && questionIsTrainable ? <small>Loading the mark scheme. Saving unlocks only after it loads.</small> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {revealed ? (
          <form
            id={`${question.id}-self-mark-form`}
            className="attempt-form self-mark-panel practice-panel exam-self-mark-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (!progress.profile) return;
              if (!canSaveScoredAttempt) return;
              const score = usesPartMarking && questionParts?.length
                ? parseAttemptPartScores(partMarkInputs, questionParts, maxMarks)
                : usesCategoryMarking
                  ? parseAttemptMarkBreakdown(markInputs, maxMarks, question.markBreakdown)
                  : parseAttemptScore(totalMarkInput, maxMarks);
              if (!score.isValid || typeof score.earned !== 'number') return;
              const savedAsFullScore = typeof maxMarks === 'number' && maxMarks > 0 && score.earned === maxMarks;
              const savedMistakeTypes = savedAsFullScore ? [] : selectedMistakeTypes;
              if (savedAsFullScore && (!fullScoreConfirmed || note.trim().length < FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH)) return;
              if (!savedAsFullScore && savedMistakeTypes.length === 0) return;
              onAttempt({
                id: createId('attempt'),
                profileId: progress.profile.id,
                questionId: question.id,
                paperFamily: question.paperFamily,
                paper: question.paper,
                questionNumber: question.questionNumber,
                topicDisplayName: question.displayTopic,
                localTopic: question.localTopic,
                deepseekTopic: question.deepseek.topic,
                subtopic: question.displaySubtopic,
                marksEarned: score.earned,
                markBreakdown: score.markBreakdown,
                partScores: score.partScores,
                marksAvailable: maxMarks,
                scoreRatio: score.scoreRatio,
                mistakeType: savedMistakeTypes[0],
                mistakeTypes: savedMistakeTypes,
                fullScoreConfirmed: savedAsFullScore || undefined,
                note: note.trim(),
                timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
                markSchemeRevealed: revealed,
                attemptedAt: new Date().toISOString(),
                worldName,
                regionName: selectedRegion?.name,
                regionRankAtAttempt: selectedRegionRank,
              });
              setSavedAttemptFeedback({
                beforeRegionProgress: selectedRegionProgressSnapshot,
                mistakeLabels: savedMistakeTypes.map((type) => mistakeLabels[type as SelectableMistakeType] ?? type),
                savedAsFullScore: savedAsFullScore,
                scoreEarned: score.earned,
                scoreRatio: score.scoreRatio,
                scoreTotalLabel: `${score.earned} / ${typeof maxMarks === 'number' ? maxMarks : '?'}`,
              });
              setAttemptSaved(true);
            }}
          >
            <div className="exam-card-heading self-mark-heading">
              <div>
                <span>Self-mark</span>
                <h3>Enter marks from the mark scheme</h3>
              </div>
              <strong className="self-mark-total-pill">Total: {scoreTotalLabel}</strong>
            </div>
            <div className="self-mark-task-flow" aria-label="Self-marking task flow">
              <span className="active"><CheckCircle2 size={14} aria-hidden="true" /> Compare with scheme</span>
              <span className={scoreValidation.isValid ? 'active' : ''}>Enter marks</span>
              <span className={attemptReflectionIsReady ? 'active' : ''}>Reflect</span>
              <span className={attemptSaved ? 'active' : ''}>Save attempt</span>
            </div>
            <p className="self-mark-helper">
              Compare your working with the mark scheme, enter the marks you think you earned, then tag what went wrong. Mistake tags help Asterion choose the next task.
            </p>
            {usesPartMarking && questionParts?.length ? (
              <fieldset className={`mark-breakdown-fieldset part-mark-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your marks by part</legend>
                <p className="marking-helper">Enter numeric marks for each available M, B, and A total. Each input is capped by the mark total shown.</p>
                <div className="part-mark-grid exam-mark-row-grid">
                  {questionParts.map((part, index) => (
                    <div key={part.label} className="part-mark-box">
                      <div className="part-mark-box-header">
                        <span className="mark-code">{part.label}</span>
                        <span className="mark-description">Part {part.label} · {part.marksAvailable} mark{part.marksAvailable === 1 ? '' : 's'}</span>
                        <strong>{partMarkTotal(part.label)} / {part.marksAvailable}</strong>
                      </div>
                      <div className="part-mark-type-grid">
                        {markCategories.map((category) => (
                          <label key={`${part.label}-${category.key}`} className="exam-mark-row" htmlFor={`${question.id}-part-${index}-${category.key}-marks`}>
                            <span className={`mark-code mark-code-${category.key}`}>{category.label}{part.markBreakdown?.[category.key] === 1 ? '1' : ''}</span>
                            <span className="mark-description">{category.description} marks</span>
                            <span className="mark-cap-note">Max {part.markBreakdown?.[category.key] ?? part.marksAvailable}</span>
                            <input
                              id={`${question.id}-part-${index}-${category.key}-marks`}
                              type="number"
                              min="0"
                              max={part.markBreakdown?.[category.key] ?? part.marksAvailable}
                              step="1"
                              value={partMarkInputs[part.label]?.[category.key] ?? ''}
                              placeholder="0"
                              onChange={(event) => updatePartMarkInput(part.label, category.key, event.target.value)}
                              aria-invalid={Boolean(scoreValidation.error)}
                              aria-label={`Part ${part.label} ${category.label} marks`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mark-total-row">
                  <span>Total</span>
                  <strong>{scoreTotalLabel}</strong>
                </div>
                {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
              </fieldset>
            ) : usesCategoryMarking ? (
              <fieldset className={`mark-breakdown-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your marks</legend>
                <p className="marking-helper">Enter numeric M, B, and A totals from the official mark scheme.</p>
                <div className="mark-breakdown-grid exam-mark-row-grid">
                  {markCategories.map((category) => (
                    <label key={category.key} className="exam-mark-row" htmlFor={`${question.id}-${category.key}-marks`}>
                      <span className={`mark-code mark-code-${category.key}`}>{category.label}{question.markBreakdown?.[category.key] === 1 ? '1' : ''}</span>
                      <span className="mark-description">{category.description} marks</span>
                      <span className="mark-cap-note">Max {question.markBreakdown?.[category.key] ?? maxMarks}</span>
                      <input
                        id={`${question.id}-${category.key}-marks`}
                        type="number"
                        min="0"
                        max={question.markBreakdown?.[category.key] ?? maxMarks}
                        step="1"
                        value={markInputs[category.key]}
                        placeholder="0"
                        onChange={(event) => updateMarkInput(category.key, event.target.value)}
                        aria-invalid={Boolean(scoreValidation.error)}
                        aria-label={`${category.label} marks`}
                      />
                    </label>
                  ))}
                </div>
                <div className="mark-total-row">
                  <span>Total</span>
                  <strong>{scoreTotalLabel}</strong>
                </div>
                {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
              </fieldset>
            ) : (
              <fieldset className={`mark-breakdown-fieldset total-mark-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your mark</legend>
                <p className="marking-helper">Enter the total marks you earned from the official mark scheme.</p>
                <div className="mark-breakdown-grid mark-total-entry-grid">
                  <label className="exam-mark-row total-mark-row" htmlFor={`${question.id}-total-marks`}>
                    <span className="mark-code">Total</span>
                    <span className="mark-description">Score from mark scheme</span>
                    <span className="mark-cap-note">Max {maxMarks ?? '?'}</span>
                    <input
                      id={`${question.id}-total-marks`}
                      type="number"
                      min="0"
                      max={maxMarks}
                      step="1"
                      value={totalMarkInput}
                      placeholder="0"
                      onChange={(event) => setTotalMarkInput(clampMarkValue(event.target.value, maxMarkValue))}
                      aria-invalid={Boolean(scoreValidation.error)}
                      aria-label="Total marks"
                    />
                  </label>
                </div>
                <div className="mark-total-row">
                  <span>Total</span>
                  <strong>{scoreTotalLabel}</strong>
                </div>
                {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
              </fieldset>
            )}

            {isFullScore ? (
              <fieldset className={`full-score-check-panel${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Full-score check</legend>
                <div className="full-score-check-copy">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Full score selected.</strong>
                    <p>Reflection tags are skipped for perfect scores. To make this count for progress, confirm it against the official mark scheme and leave a short evidence note.</p>
                  </div>
                </div>
                <label className="full-score-check-label">
                  <input
                    type="checkbox"
                    checked={fullScoreConfirmed}
                    onChange={(event) => setFullScoreConfirmed(event.target.checked)}
                    required
                  />
                  <span>I checked each mark-scheme line and can explain where every mark was earned.</span>
                </label>
                {!fullScoreEvidenceNoteIsReady ? (
                  <small className="form-hint">Add a short evidence note below before saving a full-score attempt.</small>
                ) : null}
              </fieldset>
            ) : (
              <fieldset className="mistake-fieldset">
                <legend>Mistake tags</legend>
                <p className="mistake-helper">Choose all that apply. These tags help future training focus on the right kind of error.</p>
                <div className="mistake-choice-grid">
                  {selectableMistakeTypes.map((type) => (
                    <label key={type} className="mistake-choice">
                      <input
                        type="checkbox"
                        name="mistakeTypes"
                        value={type}
                        checked={selectedMistakeTypes.includes(type)}
                        onChange={() => toggleMistakeType(type)}
                      />
                      <span>{mistakeLabels[type]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <label>
              {isFullScore ? 'Full-score evidence note' : 'Optional note'}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                required={isFullScore}
                minLength={isFullScore ? FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH : undefined}
                placeholder={isFullScore ? 'Example: Matched M1 to log law, A1 to final value, and checked the domain.' : undefined}
              />
            </label>
            {!attemptSaved && onContinuePractice ? (
              <p className="next-question-save-gate" role="status">Save this attempt before the next question unlocks.</p>
            ) : null}
          </form>
        ) : null}
      </div>

      {askTeacherOpen ? (
        <section className="ask-teacher-panel" aria-label="Ask Teacher">
          <div>
            <span className="mode-pill">Ask Teacher</span>
            <h3>Teacher questions are coming soon.</h3>
            <p>This draft stays on this page for now. No message is sent.</p>
          </div>
          <label>
            What are you stuck on?
            <textarea
              value={teacherQuestionDraft}
              onChange={(event) => setTeacherQuestionDraft(event.target.value)}
              rows={3}
              placeholder="Example: I am unsure which line earns the M1 mark."
            />
          </label>
          <div className="ask-teacher-actions">
            <button type="button" onClick={() => setAskTeacherOpen(false)}>Close</button>
            <button type="button" disabled>Send to teacher</button>
          </div>
        </section>
      ) : null}

      {attemptSaved ? (
        <div className="post-attempt-panel progress-updated-panel">
          <div className="panel-title-bar">Attempt saved</div>
          <div className="progress-scene" aria-hidden="true">
            <img
              src={astralAssets.progressGarden}
              alt=""
              width={astralAssetDimensions.progressGarden.width}
              height={astralAssetDimensions.progressGarden.height}
              loading="lazy"
              decoding="async"
            />
          </div>
          <strong>{regionLearningPhase === 'guardian' ? (guardianPassed ? 'Guardian cleared' : 'Guardian attempt saved') : `Saved: ${savedAttemptFeedback?.scoreTotalLabel ?? scoreTotalLabel}`}</strong>
          <div className="post-attempt-feedback-grid" aria-label="Saved attempt feedback">
            <div>
              <span>Score</span>
              <strong>{savedAttemptFeedback?.scoreTotalLabel ?? scoreTotalLabel}{percentLabel(savedAttemptFeedback?.scoreRatio) ? ` (${percentLabel(savedAttemptFeedback?.scoreRatio)})` : ''}</strong>
            </div>
            <div>
              <span>Mistakes</span>
              <strong>{savedAttemptFeedback?.savedAsFullScore ? 'No mistakes tagged' : savedAttemptFeedback?.mistakeLabels.length ? savedAttemptFeedback.mistakeLabels.join(', ') : 'No tag saved'}</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{regionProgressMessage}</strong>
            </div>
            <div>
              <span>Guardian</span>
              <strong>{guardianReadinessMessage}</strong>
            </div>
          </div>
          <p className="post-attempt-next-step">{nextRecommendedAction}</p>
          <div className="practice-actions">
            {onContinuePractice ? <button className="primary-button" type="button" onClick={onContinuePractice}><RotateCcw size={16} /> Next</button> : null}
            <button type="button" onClick={resetCurrentQuestionAttempt}>Try Again</button>
            {onReturnToMap ? <button type="button" onClick={onReturnToMap}><Map size={16} /> Dashboard</button> : null}
          </div>
        </div>
      ) : null}

      <div className="exam-practice-bottom-bar" aria-label="Exam Training actions">
        <button type="button" onClick={onOpenDashboard ?? onReturnToMap}>
          <LayoutDashboard size={16} aria-hidden="true" />
          Dashboard
        </button>
        <button type="button" onClick={() => setAskTeacherOpen((open) => !open)}>
          <MessageCircle size={16} aria-hidden="true" />
          Ask Teacher
        </button>
        {revealed ? (
          <button type="button" onClick={() => setRevealed(false)}>Back to Question</button>
        ) : (
          <button className="primary-button reveal-button" type="button" onClick={() => setRevealed(true)}>
            Reveal Mark Scheme
          </button>
        )}
        <button
          className="primary-button"
          type="submit"
          form={`${question.id}-self-mark-form`}
          disabled={!revealed || !canSubmit || attemptSaved}
          title={revealed ? undefined : 'Reveal the mark scheme, enter marks, and reflect before saving.'}
        >
          Save Attempt {scoreValidation.isValid ? `(${scoreTotalLabel})` : ''}
        </button>
      </div>
    </section>
  );
}
