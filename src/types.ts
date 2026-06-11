import type { QuestionRouteEvidenceStatus } from './lib/questionRouteEvidence';

export type PaperFamily = 'p1' | 'p3' | 'p4' | 'p5' | string;

// Legacy export metadata only. Do not use difficulty for routing or selection.
export type Difficulty = 'foundation' | 'core' | 'stretch' | 'challenge' | string;

export type MistakeType =
  | 'no_issue'
  | 'did_not_know_method'
  | 'algebra_error'
  | 'misread_question'
  | 'formula_issue'
  | 'diagram_or_modeling_issue'
  | 'ran_out_of_time'
  | 'rounding_accuracy'
  | 'could_not_start'
  | 'slow_method'
  | 'lucky_or_unsure'
  | 'other';

export interface AttemptMarkBreakdown {
  m: number;
  b: number;
  a: number;
}

export interface QuestionPartMark {
  partId?: string;
  subpartId?: string;
  label: string;
  marksAvailable: number;
  markBreakdown?: AttemptMarkBreakdown;
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
  routeEvidenceStatus?: QuestionRouteEvidenceStatus;
  mappingReviewed?: boolean;
  reviewStatus?: string;
  evidenceUsed?: string[];
  reasonCodes?: string[];
}

export interface AttemptPartScore {
  partId?: string;
  subpartId?: string;
  label: string;
  marksEarned: number;
  marksAvailable: number;
  markBreakdown?: AttemptMarkBreakdown;
}

export interface DeepSeekMetadata {
  topic?: string;
  normalizedTopic?: string;
  subtopic?: string;
  difficulty?: Difficulty;
  normalizedDifficulty?: Difficulty;
  confidence?: number;
  confidenceLabel?: string;
  reconciliationStatus?: string;
  finalReviewRequired?: boolean;
  reviewFlags?: string[];
  validation?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}

export interface QuestionTextQuality {
  questionText?: string;
  markSchemeText?: string;
  questionTextTrust?: string;
  questionTextRole?: string;
  textOnlyDisplayAllowed?: boolean;
  contentLabGenerationAllowed?: boolean;
  visualRequired?: boolean;
  hardFailed: boolean;
  reviewUsable: boolean;
  routingUsable: boolean;
  contentLabSupportUsable: boolean;
  statusLabel: string;
  reasonCodes: string[];
  generationBlockerReasonCodes?: string[];
}

export interface QuestionTopicRouting {
  primaryTopicId?: string;
  confidence?: string;
  reviewRequired?: boolean;
  reviewReasons?: string[];
  reviewBlockerReasonCodes?: string[];
  routeApproved?: boolean;
  evidenceUsed?: string[];
  routingSource?: string;
  recordSource?: 'topic-routing-sidecar' | 'source-record';
  paperFamily?: PaperFamily;
  evidenceStatus?: QuestionRouteEvidenceStatus;
  mappedRegionId?: string;
  topicDistribution?: QuestionTopicDistribution[];
  partMappings?: QuestionPartRouteMapping[];
}

export interface QuestionTopicDistribution {
  topicId: string;
  fitPercent?: number;
  mappedRegionId?: string;
}

export interface QuestionPartRouteMapping {
  partId?: string;
  subpartId?: string;
  label?: string;
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
  routeEvidenceStatus?: QuestionRouteEvidenceStatus;
  mappingReviewed?: boolean;
  reviewStatus?: string;
  evidenceUsed?: string[];
  reasonCodes?: string[];
}

export interface QuestionRouteEvidence {
  status: QuestionRouteEvidenceStatus;
  source: 'topic-routing' | 'fallback-label' | 'preserved-status' | 'paper-family' | 'none';
  regionId?: string;
  regionName?: string;
  validatedRegionId?: string;
  validatedRegionName?: string;
  displayRegionId?: string;
  displayRegionName?: string;
  primaryTopicId?: string;
  reasonCodes: string[];
  evidenceUsed?: string[];
  reviewReasons?: string[];
  matchedLabels?: string[];
  candidateRegionIds?: string[];
}

export interface QuestionUseCaseEligibility {
  eligible: boolean;
  reasonCodes: string[];
}

export interface QuestionEligibility {
  regionDisplayEligible: QuestionUseCaseEligibility;
  practiceEligible: QuestionUseCaseEligibility;
  generationEligible: QuestionUseCaseEligibility;
  textOnlyEligible: QuestionUseCaseEligibility;
}

export type QuestionContentSourceKind =
  | 'projected-bank'
  | 'raw-bank-fallback'
  | 'raw-bank-debug'
  | 'unknown';

export interface QuestionContentSource {
  kind: QuestionContentSourceKind;
  unsafeForGeneration: boolean;
  reasonCodes: string[];
}

export interface NormalizedQuestion {
  id: string;
  paperFamily: PaperFamily;
  paper?: string;
  questionNumber?: string;
  localTopic?: string;
  localSubtopic?: string;
  localDifficulty?: Difficulty;
  deepseek: DeepSeekMetadata;
  topicRouting?: QuestionTopicRouting;
  routeEvidence?: QuestionRouteEvidence;
  eligibility?: QuestionEligibility;
  contentSource?: QuestionContentSource;
  textQuality?: QuestionTextQuality;
  displayTopic: string;
  displaySubtopic?: string;
  displayDifficulty?: Difficulty;
  marksAvailable?: number;
  markBreakdown?: AttemptMarkBreakdown;
  parts?: QuestionPartMark[];
  questionImageRawPaths: string[];
  markSchemeImageRawPaths: string[];
  questionImagePaths: string[];
  markSchemeImagePaths: string[];
  questionImageUrls: string[];
  markSchemeImageUrls: string[];
  questionImageCandidates: string[][];
  markSchemeImageCandidates: string[][];
  trainingStatus?: string;
  trainingBlockers?: string[];
  raw: {
    local: unknown;
    deepseek?: unknown;
  };
}

export interface QuestionBankDiagnostics {
  mainContentSource?: QuestionContentSourceKind;
  mainUrl?: string;
  mainSchemaName?: string;
  mainSchemaVersion?: string | number;
  mainRecordCount?: number;
  mainQuestionsLength: number;
  mainAppearsPlaceholder: boolean;
  sidecarUrl?: string;
  sidecarSchemaName?: string;
  sidecarSchemaVersion?: string | number;
  sidecarRecordCount?: number;
  sidecarAppearsPlaceholder: boolean;
  loadedQuestionCount: number;
  normalizedQuestionCount: number;
  sidecarEnrichmentCount: number;
  sidecarMergeCount: number;
  sidecarErrorCount: number;
  routingUrl?: string;
  routingSchemaName?: string;
  routingSchemaVersion?: string | number;
  routingRecordCount?: number;
  routingMappedCount?: number;
  routingAppearsPlaceholder?: boolean;
}

export interface Attempt {
  id: string;
  questionId: string;
  paperFamily: PaperFamily;
  paper?: string;
  questionNumber?: string;
  topicDisplayName: string;
  localTopic?: string;
  deepseekTopic?: string;
  subtopic?: string;
  difficulty?: Difficulty;
  marksEarned: number;
  markBreakdown?: AttemptMarkBreakdown;
  partScores?: AttemptPartScore[];
  marksAvailable?: number;
  scoreRatio?: number;
  mistakeType?: MistakeType;
  mistakeTypes?: MistakeType[];
  fullScoreConfirmed?: boolean;
  note?: string;
  timeSpentSeconds: number;
  markSchemeRevealed: boolean;
  attemptedAt: string;
  validatedRegionId?: string;
  displayRegionId?: string;
  regionName?: string;
}

export type QuickCheckAnswerType =
  | 'single_value'
  | 'ordered_cards'
  | 'choice'
  | 'multi_choice'
  | 'two_value';

export interface QuickCheckOption {
  id: string;
  label: string;
}

export interface QuickCheckTwoValueField {
  id: string;
  label: string;
  expectedAnswer: string | string[];
  displayPrefix?: string;
  displaySuffix?: string;
  tolerance?: number;
}

export interface QuickCheckContract {
  prompt: string;
  answerType: QuickCheckAnswerType;
  expectedAnswer?: string | string[];
  expectedOrder?: string[];
  expectedChoices?: string[];
  options?: QuickCheckOption[];
  orderedCards?: QuickCheckOption[];
  fields?: QuickCheckTwoValueField[];
  displayPrefix?: string;
  displaySuffix?: string;
  tolerance?: number;
  hint?: string;
  workedFirstStep?: string;
  explanation?: string;
}

export interface QuickCheckResponse {
  value?: string;
  values?: Record<string, string>;
  selectedChoiceId?: string;
  selectedChoiceIds?: string[];
  orderedIds?: string[];
}

export type QuickCheckCheckStatus = 'empty' | 'correct' | 'incorrect';

export interface QuickCheckCheckResult {
  status: QuickCheckCheckStatus;
  message: string;
  hint?: string;
}

export interface LearningActivityAttempt {
  id: string;
  regionId: string;
  activityType?: 'quick_check' | 'warm_up';
  activityId?: string;
  topic?: string;
  prompt?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface SkillCheckAttemptRecord {
  attemptId: string;
  course: 'p3';
  topic: string;
  skillId: string;
  checkId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  usedHint: boolean;
  revealedAnswer: boolean;
  revealedRepairStep: boolean;
  mistakeTags: string[];
  timestamp: string;
  regionId?: string;
}

export interface TopicCompletionRecord {
  topicId: string;
  subtopicId?: string;
  title?: string;
  completedAt: string;
  source: 'field_guide' | 'quick_check' | 'warm_up' | 'legacy_region_completion';
  activityId?: string;
  attemptId?: string;
}

export interface RegionLearningRecord {
  regionId: string;
  fieldGuideStartedAt?: string;
  fieldGuideCompletedAt?: string;
  fieldGuideTopicCompletions?: Record<string, TopicCompletionRecord>;
  updatedAt: string;
}

export interface WorldDefinition {
  id: string;
  name: string;
  paperFamily: PaperFamily;
  regions: RegionDefinition[];
}

export interface RegionDefinition {
  id: string;
  name: string;
  description: string;
  subtopics: string[];
  activeByDefault: boolean;
  matchTerms: string[];
}

export interface RegionProgress {
  region: RegionDefinition;
  availableQuestions: number;
  attempts: number;
  totalMarksEarned?: number;
  totalMarksAvailable?: number;
  recentScoreRatio?: number;
  averageScoreRatio?: number;
  subtopicsTouched?: number;
  isActive?: boolean;
}

export interface StoredProgress {
  schemaVersion?: number;
  attempts: Attempt[];
  learningActivityAttempts: LearningActivityAttempt[];
  skillCheckAttempts?: SkillCheckAttemptRecord[];
  regionLearning?: Record<string, RegionLearningRecord>;
}
