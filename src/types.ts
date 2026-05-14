import type { QuestionRouteEvidenceStatus } from './lib/questionRouteEvidence';

export type PaperFamily = 'p1' | 'p3' | 'p4' | 'p5' | string;

/**
 * Deprecated metadata only.
 * Difficulty labels are preserved for legacy exports/review context, but must not
 * drive routing, selection, mastery, Guardian access, or generation eligibility.
 */
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
  label: string;
  marksAvailable: number;
}

export interface AttemptPartScore {
  label: string;
  marksEarned: number;
  marksAvailable: number;
  markBreakdown?: AttemptMarkBreakdown;
}

export type IssueType =
  | 'question_image_missing'
  | 'mark_scheme_image_missing'
  | 'image_crop_wrong'
  | 'wrong_topic'
  | 'mark_scheme_mismatch'
  | 'unreadable_image'
  | 'duplicate_question'
  | 'app_bug'
  | 'other';

export interface StudentProfile {
  id: string;
  realName: string;
  classGroup: string;
  teacherName: string;
  avatarName: string;
  createdAt: string;
  updatedAt: string;
}

export type AvatarSlot = 'base' | 'hair' | 'face' | 'outfit' | 'cloak' | 'accessory' | 'aura' | 'companion' | 'frame';

export interface AvatarSettings {
  palette: 'ember' | 'aqua' | 'violet' | 'leaf';
  crest: 'star' | 'bolt' | 'compass' | 'orb';
  equipped?: Partial<Record<AvatarSlot, string>>;
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
  visualRequired?: boolean;
  hardFailed: boolean;
  reviewUsable: boolean;
  routingUsable: boolean;
  contentLabSupportUsable: boolean;
  statusLabel: string;
  reasonCodes: string[];
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
}

export interface QuestionTopicDistribution {
  topicId: string;
  fitPercent?: number;
  mappedRegionId?: string;
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
  masteryEligible: QuestionUseCaseEligibility;
  guardianEligible: QuestionUseCaseEligibility;
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
  unsafeForMastery: boolean;
  unsafeForGuardian: boolean;
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
  profileId: string;
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
  worldName?: string;
  regionName?: string;
  regionRankAtAttempt?: RegionRank;
}

export type LearningActivityType = 'quick_check' | 'warm_up';
export type LearningActivityOutcome = 'got_it' | 'partial' | 'missed';

export interface LearningActivityAttempt {
  id: string;
  profileId?: string;
  regionId: string;
  regionName?: string;
  activityType: LearningActivityType;
  activityId: string;
  sourceId?: string;
  topic?: string;
  skillTargetId?: string;
  prompt: string;
  learnerResponse: string;
  revealedEarly: boolean;
  outcome: LearningActivityOutcome;
  confidence: number;
  errorType?: MistakeType;
  createdAt: string;
  completedAt: string;
}

export interface IssueReport {
  id: string;
  profileId?: string;
  questionId: string;
  issueType: IssueType;
  note?: string;
  createdAt: string;
  worldName?: string;
  regionName?: string;
}

export interface TopicProfile {
  topic: string;
  attempts: number;
  totalMarksEarned: number;
  totalMarksAvailable: number;
  recentRatios: number[];
  masteryScore: number;
  rank: MasteryRank;
  updatedAt: string;
}

export type MasteryRank = 'none' | 'bronze' | 'silver' | 'gold' | 'mastery';

export type RegionRank = 'Dormant' | 'Discovered' | 'Bronze' | 'Silver' | 'Gold' | 'Mastered';

export type RegionLearningState =
  | 'locked'
  | 'available'
  | 'field_guide_started'
  | 'field_guide_completed'
  | 'training_in_progress'
  | 'guardian_unlocked'
  | 'guardian_attempted'
  | 'guardian_cleared'
  | 'mastered'
  | 'needs_review';

export type TrainingSessionIntent = 'warm_up' | 'core_practice' | 'weak_area_review' | 'challenge';

export type RegionVisualTreatment =
  | 'not_started'
  | 'available'
  | 'training'
  | 'guardian_unlocked'
  | 'guardian_cleared'
  | 'mastered'
  | 'needs_review';

export interface RegionLearningRecord {
  regionId: string;
  fieldGuideStartedAt?: string;
  fieldGuideCompletedAt?: string;
  guardianQuestionId?: string;
  guardianAttemptId?: string;
  guardianAttemptedAt?: string;
  guardianClearedAt?: string;
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
  totalMarksEarned: number;
  totalMarksAvailable: number;
  recentScoreRatio?: number;
  averageScoreRatio?: number;
  subtopicsTouched: number;
  rank: RegionRank;
  isActive: boolean;
}

export interface AvatarGear {
  title: string;
  gear: string[];
  nextUnlock?: string;
  nextUnlockRequirement?: string;
  restoredRegions: number;
  goldRegions: number;
  strongestRegionName?: string;
  strongestRegionRank?: RegionRank;
}

export interface AppSettings {
  activePaperFamily: PaperFamily;
}

export interface StoredProgress {
  schemaVersion: number;
  profile?: StudentProfile;
  avatar: AvatarSettings;
  attempts: Attempt[];
  learningActivityAttempts: LearningActivityAttempt[];
  topicProfiles: Record<string, TopicProfile>;
  issueReports: IssueReport[];
  regionLearning?: Record<string, RegionLearningRecord>;
  settings: AppSettings;
}
