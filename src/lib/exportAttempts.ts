import type { Attempt, IssueReport, StoredProgress, StudentProfile } from '../types';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildExportJson(progress: StoredProgress) {
  return {
    exportedAt: new Date().toISOString(),
    profile: progress.profile,
    avatar: progress.avatar,
    attempts: progress.attempts,
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

export function buildAttemptsCsv(progress: StoredProgress): string {
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
    'marks available',
    'score percentage',
    'mistake type',
    'note',
    'time spent seconds',
    'mark scheme revealed',
    'attempt timestamp',
    'issue reports',
  ];

  const profile: Partial<StudentProfile> = progress.profile ?? {};
  const rows = progress.attempts.map((attempt: Attempt) => [
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
    attempt.marksAvailable,
    typeof attempt.scoreRatio === 'number' ? Math.round(attempt.scoreRatio * 100) : '',
    attempt.mistakeType,
    attempt.note,
    attempt.timeSpentSeconds,
    attempt.markSchemeRevealed,
    attempt.attemptedAt,
    reportsForQuestion(progress.issueReports, attempt.questionId),
  ]);

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
