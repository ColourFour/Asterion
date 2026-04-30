export type PaperFamily = 'p1' | 'p3' | 'p4' | 'p5' | string;

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

export type IssueType =
  | 'question_image_missing'
  | 'mark_scheme_image_missing'
  | 'image_crop_wrong'
  | 'wrong_topic'
  | 'wrong_difficulty'
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

export interface AvatarSettings {
  palette: 'ember' | 'aqua' | 'violet' | 'leaf';
  crest: 'star' | 'bolt' | 'compass' | 'orb';
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

export interface NormalizedQuestion {
  id: string;
  paperFamily: PaperFamily;
  paper?: string;
  questionNumber?: string;
  localTopic?: string;
  localSubtopic?: string;
  localDifficulty?: Difficulty;
  deepseek: DeepSeekMetadata;
  displayTopic: string;
  displaySubtopic?: string;
  displayDifficulty?: Difficulty;
  marksAvailable?: number;
  questionImageRawPaths: string[];
  markSchemeImageRawPaths: string[];
  questionImagePaths: string[];
  markSchemeImagePaths: string[];
  questionImageUrls: string[];
  markSchemeImageUrls: string[];
  questionImageCandidates: string[][];
  markSchemeImageCandidates: string[][];
  raw: {
    local: unknown;
    deepseek?: unknown;
  };
}

export interface QuestionBankDiagnostics {
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
  marksAvailable?: number;
  scoreRatio?: number;
  mistakeType: MistakeType;
  note?: string;
  timeSpentSeconds: number;
  markSchemeRevealed: boolean;
  attemptedAt: string;
  worldName?: string;
  regionName?: string;
  regionRankAtAttempt?: RegionRank;
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
}

export interface AppSettings {
  activePaperFamily: PaperFamily;
}

export interface StoredProgress {
  profile?: StudentProfile;
  avatar: AvatarSettings;
  attempts: Attempt[];
  topicProfiles: Record<string, TopicProfile>;
  issueReports: IssueReport[];
  settings: AppSettings;
}
