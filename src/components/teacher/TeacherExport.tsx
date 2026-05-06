import { Download, Trash2 } from 'lucide-react';
import type { AvatarGear, NormalizedQuestion, QuestionBankDiagnostics, RegionProgress, StoredProgress } from '../../types';
import { calculateAcademySummary } from '../../lib/academyProgress';
import { buildAttemptsCsv, buildExportJson, downloadTextFile } from '../../lib/exportAttempts';
import { DataHealthPanel } from './DataHealthPanel';

interface TeacherExportProps {
  progress: StoredProgress;
  avatarGear?: AvatarGear;
  questions: NormalizedQuestion[];
  regionProgress: RegionProgress[];
  diagnostics?: QuestionBankDiagnostics;
  onClear: () => void;
}

export function TeacherExport({ progress, avatarGear, questions, regionProgress, diagnostics, onClear }: TeacherExportProps) {
  const summary = calculateAcademySummary(regionProgress);
  const recentAttempts = progress.attempts.slice(-8).reverse();

  return (
    <section className="teacher-panel">
      <h2>Teacher/export view</h2>
      <div className="export-grid">
        <button type="button" onClick={() => downloadTextFile('asterion-export.json', JSON.stringify(buildExportJson(progress, avatarGear, regionProgress), null, 2), 'application/json')}>
          <Download size={16} /> JSON export
        </button>
        <button type="button" onClick={() => downloadTextFile('asterion-attempts.csv', buildAttemptsCsv(progress, avatarGear), 'text/csv')}>
          <Download size={16} /> CSV export
        </button>
        <button className="danger-button" type="button" onClick={onClear}>
          <Trash2 size={16} /> Clear local data
        </button>
      </div>
      <p>{progress.attempts.length} attempts · {progress.issueReports.length} issue reports saved locally · {summary.title}</p>

      <div className="teacher-summary" aria-label="Teacher progress summary">
        <div><span>Evidence XP</span><strong>{summary.totalXp}</strong></div>
        <div><span>Restored regions</span><strong>{summary.restoredRegions}/{summary.activeRegions}</strong></div>
        <div><span>Marks evidence</span><strong>{summary.totalMarksEarned}/{summary.totalMarksAvailable || 0}</strong></div>
        <div><span>Estimated average</span><strong>{typeof summary.averageScoreRatio === 'number' ? `${Math.round(summary.averageScoreRatio * 100)}%` : 'n/a'}</strong></div>
      </div>

      <h3>Region evidence</h3>
      <table className="region-evidence-table">
        <thead>
          <tr>
            <th>Region</th>
            <th>Rank</th>
            <th>Attempts</th>
            <th>Average</th>
            <th>Subtopics</th>
          </tr>
        </thead>
        <tbody>
          {regionProgress.map((item) => (
            <tr key={item.region.id}>
              <td>{item.region.name}</td>
              <td>{item.rank}</td>
              <td>{item.attempts}</td>
              <td>{typeof item.averageScoreRatio === 'number' ? `${Math.round(item.averageScoreRatio * 100)}%` : 'n/a'}</td>
              <td>{item.subtopicsTouched}/{item.region.subtopics.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Recent attempt evidence</h3>
      {recentAttempts.length ? (
        <div className="attempt-evidence-list">
          {recentAttempts.map((attempt) => (
            <article key={attempt.id}>
              <strong>{attempt.regionName ?? attempt.topicDisplayName} · {attempt.paper ?? attempt.paperFamily.toUpperCase()} {attempt.questionNumber ? `Q${attempt.questionNumber}` : ''}</strong>
              <span>{attempt.marksEarned}/{attempt.marksAvailable ?? 'n/a'} marks · {attempt.mistakeType.replace(/_/g, ' ')} · {new Date(attempt.attemptedAt).toLocaleString()}</span>
              {attempt.note ? <span>Note: {attempt.note}</span> : null}
            </article>
          ))}
        </div>
      ) : (
        <p>No attempts yet. Complete a region encounter to create teacher-readable evidence.</p>
      )}

      <DataHealthPanel questions={questions} regionProgress={regionProgress} diagnostics={diagnostics} />
    </section>
  );
}
