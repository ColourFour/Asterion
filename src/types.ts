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
  markSchemeText?: string;
  markPoints?: QuestionMarkPoint[];
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
  routeEvidenceStatus?: QuestionRouteEvidenceStatus;
  mappingReviewed?: boolean;
  reviewStatus?: string;
  evidenceUsed?: string[];
  reasonCodes?: string[];
}

export interface QuestionMarkPoint {
  id: string;
  label: string;
  markCode?: string;
  source: 'mark_scheme_text' | 'mark_events';
  confidence?: number;
  reviewStatus?: string;
}

export interface AttemptPartScore {
  partId?: string;
  subpartId?: string;
  label: string;
  attempted?: boolean;
  marksEarned: number;
  marksAvailable: number;
  markBreakdown?: AttemptMarkBreakdown;
  markPointIds?: string[];
  markPointIdsAvailable?: string[];
  markPointLabels?: Record<string, string>;
  markPointsAvailable?: number;
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
}

export type ExamAttemptSuspicionFlag =
  | 'full_marks_without_mark_points'
  | 'very_high_score_low_time'
  | 'repeated_perfect_self_marking'
  | 'answer_revealed_before_marking'
  | 'confidence_score_mismatch';

export type ExamAttemptEvidenceKind = 'weak_self_marked_exam';

export type ExamAttemptConfidence = 'low' | 'medium' | 'high';

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
  selfMarked?: boolean;
  evidenceKind?: ExamAttemptEvidenceKind;
  evidenceLabel?: string;
  masteryEligible?: boolean;
  masteryGate?: 'skill_check_required' | 'skill_check_passed';
  trustLabel?: string;
  suspicionFlags?: ExamAttemptSuspicionFlag[];
  confidentMode?: boolean;
  confidenceRating?: ExamAttemptConfidence;
  answerRevealedBeforeMarking?: boolean;
  markPointsTicked?: number;
  markPointsAvailable?: number;
  coarseSelfMarking?: boolean;
  timingReliable?: boolean;
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
  answerFormatHint?: string;
  answerPlaceholder?: string;
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
  answerFormatHint?: string;
  answerPlaceholder?: string;
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
  activityType?: 'quick_check' | 'warm_up' | 'learn_mode';
  activityId?: string;
  stepId?: string;
  variant?: 'primary' | 'similar';
  topic?: string;
  prompt?: string;
  submittedAnswer?: string;
  isCorrect?: boolean;
  usedHint?: boolean;
  revealedAnswer?: boolean;
  strongEvidence?: boolean;
  mistakeTags?: string[];
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

export type StudentAttemptHistorySource = 'checked_practice' | 'learn_mode';

export interface StudentAttemptHistoryRecord {
  id: string;
  source: StudentAttemptHistorySource;
  course: 'p3';
  questionId: string;
  questionTitle?: string;
  topic?: string;
  regionId?: string;
  skillId?: string;
  response: string;
  responseDisplay?: string;
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
  timestamp: string;
  attemptNumber: number;
  retryHref?: string;
  relatedAttemptId?: string;
}

export interface StudentAttemptHistory {
  schemaVersion: 1;
  records: StudentAttemptHistoryRecord[];
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

export type P3ProgressionPathId = 'MINIMUM_SURVIVAL' | 'A_STAR';

export type P3PathStatus = 'IN_PROGRESS' | 'COMPLETE';

export type P3PathErrorType = 'concept' | 'algebra' | 'method' | 'misread' | 'time' | 'careless';

export type P3ErrorLogErrorType =
  | 'CONCEPT_ERROR'
  | 'ALGEBRA_ERROR'
  | 'NOTATION_ERROR'
  | 'METHOD_ERROR'
  | 'CALCULATOR_ERROR'
  | 'TIME_ERROR'
  | 'CARELESS_ERROR';

export type P3ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type KnowledgeErrorType =
  | 'conceptual_gap'
  | 'procedural_gap'
  | 'algebraic_execution_error'
  | 'representation_error'
  | 'mis_selection_of_method'
  | 'careless_slip'
  | 'time_pressure_degradation';

export type KnowledgeEvidenceSeverity = 'low' | 'medium' | 'high';

export type KnowledgeSkillCategory = 'unknown' | 'fragile' | 'developing' | 'stable' | 'secure';

export type KnowledgeStabilityFlag = 'new_evidence' | 'fragile' | 'volatile' | 'recovering' | 'stable_understanding';

export type KnowledgeEvidenceOutcome = 'success' | 'failure';

export type KnowledgeEvidenceSource =
  | 'checked_practice'
  | 'exam_training'
  | 'mini_check'
  | 'exam_strip'
  | 'mock'
  | 'redo'
  | 'manual';

export type KnowledgeSkillNodeSource =
  | 'reviewed_skill_map'
  | 'skill_check'
  | 'topic_route'
  | 'exam_part'
  | 'fallback_region';

export type KnowledgeInterventionAction =
  | 'micro_reteach'
  | 'similar_question'
  | 'drill_set'
  | 'delayed_retest'
  | 'transfer_challenge';

export type KnowledgeRetestTiming = 'immediate' | 'delayed';

export type KnowledgeFollowUpItemType =
  | 'micro_reteach'
  | 'similar_question'
  | 'drill_set'
  | 'delayed_retest'
  | 'transfer_challenge';

export type KnowledgeDifficultyRelation = 'isomorphic' | 'harder' | 'cross_skill';

export interface KnowledgeSkillNode {
  id: string;
  label?: string;
  course?: string;
  topicId?: string;
  regionId?: string;
  source: KnowledgeSkillNodeSource;
}

export interface KnowledgeMisconceptionSignature {
  tag: string;
  skillNodeId: string;
  description: string;
  errorType: KnowledgeErrorType;
  evidenceCount: number;
  questionIds: string[];
  representationIds: string[];
  lastSeenAt: string;
  stable: boolean;
}

export interface KnowledgeSkillState {
  skillNode: KnowledgeSkillNode;
  score: number;
  category: KnowledgeSkillCategory;
  confidence: number;
  stabilityFlag: KnowledgeStabilityFlag;
  evidenceCount: number;
  successStreak: number;
  failureStreak: number;
  lastOutcome?: KnowledgeEvidenceOutcome;
  lastUpdated: string;
  lastAttemptId?: string;
  lastQuestionId?: string;
  errorTypeCounts: Partial<Record<KnowledgeErrorType, number>>;
}

export interface KnowledgeSkillStateGraph {
  schemaVersion: 1;
  updatedAt: string;
  skills: Record<string, KnowledgeSkillState>;
  misconceptions: Record<string, KnowledgeMisconceptionSignature>;
}

export interface KnowledgeSkillStateUpdate {
  id: string;
  attemptId: string;
  questionId: string;
  skillNodeId: string;
  previousScore: number;
  newScore: number;
  previousCategory: KnowledgeSkillCategory;
  newCategory: KnowledgeSkillCategory;
  confidence: number;
  stabilityFlag: KnowledgeStabilityFlag;
  outcome: KnowledgeEvidenceOutcome;
  evidenceStrength: number;
  timestamp: string;
}

export interface KnowledgeErrorObject {
  id: string;
  attemptId: string;
  questionId: string;
  markPointId?: string;
  markPointLabel?: string;
  skillNodeIds: string[];
  primarySkillNodeId: string;
  errorType: KnowledgeErrorType;
  severity: KnowledgeEvidenceSeverity;
  repeat: boolean;
  misconceptionTag?: string;
  evidenceStrength: number;
  evidenceSource: KnowledgeEvidenceSource;
  marksLost: number;
  timestamp: string;
  representation?: string;
  deviationFromCanonical?: string;
}

export interface KnowledgeInterventionPlan {
  id: string;
  attemptId: string;
  skillNodeId: string;
  action: KnowledgeInterventionAction;
  rationale: string;
  stateChange: {
    previousScore: number;
    newScore: number;
    category: KnowledgeSkillCategory;
    stabilityFlag: KnowledgeStabilityFlag;
  };
  sourceErrorIds: string[];
  createdAt: string;
}

export interface KnowledgeSchedulingInstruction {
  id: string;
  interventionId: string;
  attemptId: string;
  skillNodeId: string;
  retestTiming: KnowledgeRetestTiming;
  followUpItemType: KnowledgeFollowUpItemType;
  difficultyRelation: KnowledgeDifficultyRelation;
  dueAt: string;
  reason: string;
  createdAt: string;
}

export type P3TopicMarkKey =
  | 'algebra'
  | 'logs_exp'
  | 'trigonometry'
  | 'differentiation'
  | 'integration'
  | 'vectors'
  | 'complex_numbers'
  | 'differential_equations'
  | 'numerical_methods';

export interface P3ErrorLogEntry {
  id: string;
  student_id: string;
  unit: string;
  topic: string;
  question_id: string;
  error_type: P3ErrorLogErrorType;
  timestamp: number;
  severity: P3ErrorSeverity;
  original_score_lost: number;
  redo_available_at: number;
  redo_completed: boolean;
  redo_success: boolean;
}

export interface P3TopicAssessmentScore {
  score_lost: number;
  questions: number;
}

export interface P3TopicAssessmentBreakdown {
  assessment_id: string;
  unit: string;
  topic_scores: Record<P3TopicMarkKey, P3TopicAssessmentScore>;
  total_score: number;
  total_marks_lost: number;
}

export interface P3TopicPerformanceStats {
  score_lost: number;
  questions: number;
  attempts: number;
  marks_available: number;
  marks_earned: number;
  redo_marks_repaired: number;
  stability_score: number;
  history: Array<{
    assessment_id: string;
    timestamp: number;
    score_lost: number;
    questions: number;
    source: 'checked_practice' | 'exam_training' | 'mini_check' | 'exam_strip' | 'mock' | 'redo';
  }>;
}

export interface P3StudentAnalyticsState {
  error_log: P3ErrorLogEntry[];
  topic_performance: Record<string, P3TopicPerformanceStats>;
  weak_topics: string[];
  redo_queue: P3PathRedoQueueItem[];
  error_distribution: Partial<Record<P3ErrorLogErrorType, number>>;
  priority_repair_topics: string[];
  topic_assessments?: P3TopicAssessmentBreakdown[];
  knowledge_state_graph: KnowledgeSkillStateGraph;
  knowledge_state_updates: KnowledgeSkillStateUpdate[];
  knowledge_errors: KnowledgeErrorObject[];
  knowledge_interventions: KnowledgeInterventionPlan[];
  knowledge_schedules: KnowledgeSchedulingInstruction[];
}

export interface P3PathUnitCompletion {
  learn_complete: boolean;
  checked_practice_complete: boolean;
  exam_questions_completed: number;
  exam_strips_completed: number;
  checked_practice_required?: number;
  checked_practice_completed?: number;
  exam_strips_required?: number;
}

export interface P3PathRedoQueueItem {
  id?: string;
  error_log_id?: string;
  question_id: string;
  error_type: P3PathErrorType;
  error_type_detail?: P3ErrorLogErrorType;
  unit?: string;
  topic?: string;
  original_score_lost?: number;
  missed_at?: string;
  redo_available_at?: string;
  redo_completed_at?: string;
  redo_success?: boolean;
  status: 'pending' | 'completed' | 'improved' | 'corrected_full_solution';
}

export interface P3PathWeeklySubmissionRecord {
  id: string;
  kind: 'csv' | 'screenshot' | 'form';
  submitted_at: string;
  covered_unit_ids: string[];
}

export interface P3PathMockRecord {
  id: string;
  kind: 'mixed_paper' | 'teacher_selected_mock' | 'full_paper_3';
  duration_minutes: number;
  timed: boolean;
  completed_at?: string;
}

export interface P3ProgressionStudentState {
  assigned_path: P3ProgressionPathId;
  unit_completion: Record<string, P3PathUnitCompletion>;
  weekly_submissions: number;
  error_log_entries: number;
  redo_queue: P3PathRedoQueueItem[];
  mock_count: number;
  path_status: P3PathStatus;
  missed_question_count?: number;
  mock_records?: P3PathMockRecord[];
  weekly_submission_records?: P3PathWeeklySubmissionRecord[];
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
  attemptHistory?: StudentAttemptHistory;
  exportProfile?: ProgressExportProfile;
  regionLearning?: Record<string, RegionLearningRecord>;
  error_log?: P3ErrorLogEntry[];
  topic_performance?: Record<string, P3TopicPerformanceStats>;
  weak_topics?: string[];
  redo_queue?: P3PathRedoQueueItem[];
  error_distribution?: Partial<Record<P3ErrorLogErrorType, number>>;
  priority_repair_topics?: string[];
  topic_assessments?: P3TopicAssessmentBreakdown[];
  knowledge_state_graph?: KnowledgeSkillStateGraph;
  knowledge_state_updates?: KnowledgeSkillStateUpdate[];
  knowledge_errors?: KnowledgeErrorObject[];
  knowledge_interventions?: KnowledgeInterventionPlan[];
  knowledge_schedules?: KnowledgeSchedulingInstruction[];
}

export interface ProgressExportProfile {
  studentName?: string;
  classGroup?: string;
  teacherEmail?: string;
  reportingPeriod?: string;
  lastSubmissionId?: string;
  lastSubmissionTimestamp?: string;
}
