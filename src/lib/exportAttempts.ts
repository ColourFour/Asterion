import type { Attempt, AvatarGear, IssueReport, RegionProgress, StoredProgress, StudentProfile } from '../types';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildExportJson(progress: StoredProgress, avatarGear?: AvatarGear, regionProgress?: RegionProgress[]) {
  return {
    exportedAt: new Date().toISOString(),
    profile: progress.profile,
    avatar: progress.avatar,
    avatarGear,
    regionProgress,
    regionLearning: progress.regionLearning ?? {},
    attempts: progress.attempts,
    learningActivityAttempts: progress.learningActivityAttempts,
    topicProfiles: progress.topicProfiles,
    issueReports: progress.issueReports,
    settings: progress.settings,
  };
}

function reportsForQuestion(reports: IssueReport[], questionId: string): string {
  return reports
    .filter((report) => report.questionId === questionId)
    .map((report) => `${report.issueType}${report.note ? `: ${report.note}` : ''}`)
    .join('; ');
}

function mistakeTagsForAttempt(attempt: Attempt): string[] {
  if (attempt.mistakeTypes?.length) return attempt.mistakeTypes;
  if (attempt.mistakeType && attempt.mistakeType !== 'no_issue') return [attempt.mistakeType];
  return [];
}

export function buildAttemptsCsv(progress: StoredProgress, avatarGear?: AvatarGear): string {
  const headers = [
    'student name',
    'class/group',
    'teacher name',
    'avatar/character name',
    'session timestamp',
    'question_id',
    'paper_family',
    'paper',
    'question_number',
    'topic display name',
    'raw local topic',
    'DeepSeek topic',
    'subtopic',
    'difficulty',
    'marks earned',
    'M marks',
    'B marks',
    'A marks',
    'marks available',
    'score percentage',
    'mistake type',
    'mistake tags',
    'full score checked',
    'note',
    'time spent seconds',
    'mark scheme revealed',
    'attempt timestamp',
    'world_name',
    'region_name',
    'region_rank_at_attempt',
    'avatar_title',
    'avatar_gear',
    'issue reports',
  ];

  const profile: Partial<StudentProfile> = progress.profile ?? {};
  const rows = progress.attempts.map((attempt: Attempt) => {
    const mistakeTags = mistakeTagsForAttempt(attempt);
    return [
      profile.realName,
      profile.classGroup,
      profile.teacherName,
      profile.avatarName,
      new Date().toISOString(),
      attempt.questionId,
      attempt.paperFamily,
      attempt.paper,
      attempt.questionNumber,
      attempt.topicDisplayName,
      attempt.localTopic,
      attempt.deepseekTopic,
      attempt.subtopic,
      attempt.difficulty,
      attempt.marksEarned,
      attempt.markBreakdown?.m,
      attempt.markBreakdown?.b,
      attempt.markBreakdown?.a,
      attempt.marksAvailable,
      typeof attempt.scoreRatio === 'number' ? Math.round(attempt.scoreRatio * 100) : '',
      mistakeTags[0] ?? '',
      mistakeTags.join('; '),
      attempt.fullScoreConfirmed ? 'yes' : '',
      attempt.note,
      attempt.timeSpentSeconds,
      attempt.markSchemeRevealed,
      attempt.attemptedAt,
      attempt.worldName,
      attempt.regionName,
      attempt.regionRankAtAttempt,
      avatarGear?.title,
      avatarGear?.gear.join('; '),
      reportsForQuestion(progress.issueReports, attempt.questionId),
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
