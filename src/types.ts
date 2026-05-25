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
  avatarId?: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  classClaim?: StudentClaimState;
  createdAt: string;
  updatedAt: string;
}

export type AsterionRole = 'admin' | 'teacher' | 'student';

export type AdminTeacherStatus = 'active' | 'inactive' | 'pending' | 'archived' | 'disabled';
export type AdminClassStatus = 'active' | 'archived';
export type RosterStudentStatus = 'active' | 'claimed' | 'unclaimed' | 'archived';
export type ClassRegionAccessMode = 'open' | 'field_guide_only';
export type StudentClaimStatus =
  | 'unclaimed'
  | 'claimed'
  | 'invalid_class_code'
  | 'roster_name_not_found'
  | 'ambiguous_roster_name'
  | 'already_claimed'
  | 'archived'
  | 'reserved_for_other_user'
  | 'staff_account_cannot_claim_student_slot'
  | 'unauthenticated'
  | 'unauthorized'
  | 'claim_unavailable';

export interface AdminTeacherRecord {
  id: string;
  name: string;
  email: string;
  assignedClassIds: string[];
  status: AdminTeacherStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRegionAccess {
  regionId: string;
  regionName: string;
  access: ClassRegionAccessMode;
  openedAt?: string;
  lockedAt?: string;
  updatedByRole: Extract<AsterionRole, 'admin' | 'teacher'>;
  updatedAt: string;
}

export interface ClassCodeRecord {
  id: string;
  classId: string;
  code: string;
  status: 'active' | 'retired';
  createdAt: string;
  retiredAt?: string;
}

export interface ClassRosterStudent {
  id: string;
  classId: string;
  displayName: string;
  status: RosterStudentStatus;
  claimedAt?: string;
  archivedAt?: string;
  optionalEmail?: string;
  optionalDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminClassRecord {
  id: string;
  name: string;
  teacherId: string;
  focus: 'CAIE 9709 P3';
  academicYearTerm: string;
  status: AdminClassStatus;
  classCode: ClassCodeRecord;
  rosterStudentIds: string[];
  regionAccess: ClassRegionAccess[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface TeacherClassRoster {
  classId: string;
  className: string;
  teacherId: string;
  classCode: ClassCodeRecord;
  students: ClassRosterStudent[];
}

export interface StudentClaimState {
  status: StudentClaimStatus;
  classId?: string;
  className?: string;
  classCode?: string;
  teacherId?: string;
  teacherName?: string;
  rosterStudentId?: string;
  displayName?: string;
  message: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  teacherId: string;
  joinCode: string;
  focus?: 'CAIE 9709 P3';
  academicYearTerm?: string;
  archivedAt?: string;
  createdAt: string;
}

export type RecommendedNextStep =
  | 'needs_field_guide'
  | 'needs_quick_check'
  | 'needs_warm_up'
  | 'ready_for_exam_training'
  | 'needs_teacher_review'
  | 'ready_for_guardian';

export type RegionReadinessState =
  | 'needs_field_guide'
  | 'needs_quick_check'
  | 'needs_warm_up'
  | 'ready_for_exam_training'
  | 'needs_teacher_review'
  | 'ready_for_guardian'
  | 'mixed';

export interface StudentSummary {
  id: string;
  displayName: string;
  classId: string;
  currentRegionId: string;
  lastActivityAt: string;
  evidenceCount: number;
  recommendedNextStep: RecommendedNextStep;
}

export interface RegionLearningSignal {
  regionId: string;
  regionName: string;
  readinessState: RegionReadinessState;
  studentsNeedingFieldGuide: string[];
  studentsNeedingQuickCheck: string[];
  studentsNeedingWarmUp: string[];
  studentsReadyForExamTraining: string[];
  studentsNeedingTeacherReview: string[];
  evidenceCount: number;
}

export type TeacherRegionStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_help'
  | 'improving'
  | 'secure'
  | 'no_recent_evidence';

export interface ClassProgressSummary {
  studentCount: number;
  overallProgressPercent: number;
  averageMasteryPercent: number;
  activeStudentCount: number;
  inactiveStudentCount: number;
  studentsNeedingHelpCount: number;
  guardianEligibleCount: number;
  totalAttempts: number;
  openRegionCount?: number;
  lockedRegionCount?: number;
  excludedLockedRegionCount?: number;
}

export interface RegionProgressSummary {
  regionId: string;
  regionName: string;
  access?: ClassRegionAccessMode;
  accessLabel?: string;
  excludedFromClassProgress?: boolean;
  averageProgressPercent: number;
  averageMasteryPercent: number;
  studentsNeedingHelpCount: number;
  studentsSecureCount: number;
  noRecentEvidenceCount: number;
  guardianEligibleCount: number;
  status: TeacherRegionStatus;
}

export interface StudentRegionProgressCell {
  regionId: string;
  regionName: string;
  access?: ClassRegionAccessMode;
  accessLabel?: string;
  excludedFromClassProgress?: boolean;
  progressPercent: number;
  masteryPercent: number;
  status: TeacherRegionStatus;
  attemptsCount: number;
  averageSelfMarkPercent?: number;
  guardianEligible: boolean;
  lastEvidenceAt?: string;
  warning?: string;
}

export interface StudentProgressRow {
  id: string;
  displayName: string;
  classId: string;
  overallProgressPercent: number;
  currentFocusRegionId: string;
  currentFocusRegionName: string;
  regionCells: StudentRegionProgressCell[];
  lastActivityAt?: string;
  lastActivityLabel: string;
  attemptsCount: number;
  repeatedLowSelfMarkCount: number;
  guardianEligibleRegionCount: number;
  notes: string[];
  warnings: string[];
}

export type FocusThisWeekType =
  | 'weakest_region'
  | 'most_students_needing_help'
  | 'inactive_students'
  | 'repeated_low_scores'
  | 'low_guardian_eligibility';

export interface FocusThisWeekItem {
  id: string;
  type: FocusThisWeekType;
  title: string;
  summary: string;
  regionId?: string;
  regionName?: string;
  studentIds: string[];
  suggestedAction: string;
  priority: number;
}

export interface WeeklyClassSummary {
  className: string;
  dateRange: string;
  classOverallProgressPercent: number;
  topFocusRegions: Array<{ regionId: string; regionName: string; reason: string }>;
  studentsNeedingAttention: Array<{ studentId: string; displayName: string; reason: string }>;
  studentsDoingWell: Array<{ studentId: string; displayName: string; reason: string }>;
  suggestedTeacherActions: string[];
  exportDownloadText: string;
}

export interface TeacherExportRow {
  className: string;
  classCode: string;
  teacherName: string;
  studentName: string;
  rosterStatus: string;
  overallProgressPercent: number;
  currentFocusRegion: string;
  lastActivity: string;
  attemptsCount: number;
  guardianEligibilitySummary: string;
  notesWarnings: string;
  [field: string]: string | number;
}

export type TeacherActionCardType =
  | 'reteach'
  | 'small_group'
  | 'ready_for_exam_practice'
  | 'needs_evidence'
  | 'teacher_review';

export type EvidenceActivityType = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_training' | 'guardian';
export type EvidenceAction = 'started' | 'submitted' | 'revealed' | 'completed' | 'skipped';
export type EvidenceOutcome = 'correct' | 'incorrect' | 'partial' | 'self_review' | 'unknown';

export interface EvidenceReference {
  questionId: string;
  regionId: string;
  skillId?: string;
  activityType: EvidenceActivityType;
  action: EvidenceAction;
  outcome: EvidenceOutcome;
  createdAt: string;
}

export interface TeacherActionCard {
  id: string;
  type: TeacherActionCardType;
  title: string;
  summary: string;
  regionId?: string;
  skillId?: string;
  studentIds: string[];
  evidenceRefs: EvidenceReference[];
  recommendedAction: string;
}

export interface TeacherClassDashboard {
  class: TeacherClass;
  lastUpdatedAt: string;
  progressSummary: ClassProgressSummary;
  regionSummaries: RegionProgressSummary[];
  studentRows: StudentProgressRow[];
  focusThisWeek: FocusThisWeekItem[];
  weeklySummary: WeeklyClassSummary;
  exportRows: TeacherExportRow[];
  actionCards: TeacherActionCard[];
  regionSignals: RegionLearningSignal[];
  studentSummaries: StudentSummary[];
  roster: TeacherClassRoster;
  classCode: ClassCodeRecord;
  regionAccess: ClassRegionAccess[];
}

export interface AdminTeacherSummary {
  id: string;
  displayName: string;
  email: string;
  classCount: number;
  lastActivityAt: string;
  status?: AdminTeacherStatus;
}

export interface AdminAuditEvent {
  id: string;
  actorRole: Extract<AsterionRole, 'admin'>;
  actorName: string;
  action: string;
  targetType: 'teacher' | 'class' | 'student_progress_snapshot' | 'system';
  targetLabel: string;
  createdAt: string;
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
  masteryEligible: QuestionUseCaseEligibility;
  guardianEligible: QuestionUseCaseEligibility;
  generationEligible: QuestionUseCaseEligibility;
  textOnlyEligible: QuestionUseCaseEligibility;
}

export type MasteryEvidenceReadinessStatus =
  | 'precise_skill_evidence'
  | 'broad_region_evidence_only'
  | 'practice_only_insufficient_part_mapping'
  | 'rejected_unsafe_route'
  | 'rejected_ambiguous_without_part_mapping';

export interface QuestionMasteryReadiness {
  status: MasteryEvidenceReadinessStatus;
  reasonCodes: string[];
  requiresPartMapping: boolean;
  acceptedPartLabels?: string[];
  rejectedPartLabels?: string[];
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
  masteryReadiness?: QuestionMasteryReadiness;
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
  masteryEligible?: boolean;
  masteryEvidenceReadiness?: MasteryEvidenceReadinessStatus;
  masteryEvidenceReasonCodes?: string[];
  guardianEligible?: boolean;
  validatedRegionId?: string;
  displayRegionId?: string;
  worldName?: string;
  regionName?: string;
  regionRankAtAttempt?: RegionRank;
}

export type LearningActivityType = 'quick_check' | 'warm_up';
export type LearningActivityOutcome = 'got_it' | 'partial' | 'missed';

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
  cleanCurrentEvidenceItems?: number;
  distinctQuestionIds?: string[];
  distinctEvidenceTargets?: string[];
  masteryReasonCodes?: string[];
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
