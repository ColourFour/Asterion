import { Download, Trash2 } from 'lucide-react';
import type { StoredProgress } from '../../types';
import { buildAttemptsCsv, buildExportJson, downloadTextFile } from '../../lib/exportAttempts';

interface TeacherExportProps {
  progress: StoredProgress;
  onClear: () => void;
}

export function TeacherExport({ progress, onClear }: TeacherExportProps) {
  return (
    <section className="teacher-panel">
      <h2>Teacher/export view</h2>
      <div className="export-grid">
        <button type="button" onClick={() => downloadTextFile('asterion-export.json', JSON.stringify(buildExportJson(progress), null, 2), 'application/json')}>
          <Download size={16} /> JSON export
        </button>
        <button type="button" onClick={() => downloadTextFile('asterion-attempts.csv', buildAttemptsCsv(progress), 'text/csv')}>
          <Download size={16} /> CSV export
        </button>
        <button className="danger-button" type="button" onClick={onClear}>
          <Trash2 size={16} /> Clear local data
        </button>
      </div>
      <p>{progress.attempts.length} attempts · {progress.issueReports.length} issue reports saved locally</p>
    </section>
  );
}
