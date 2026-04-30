import { Download, Trash2 } from 'lucide-react';
import type { AvatarGear, NormalizedQuestion, QuestionBankDiagnostics, RegionProgress, StoredProgress } from '../../types';
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
  return (
    <section className="teacher-panel">
      <h2>Teacher/export view</h2>
      <div className="export-grid">
        <button type="button" onClick={() => downloadTextFile('asterion-export.json', JSON.stringify(buildExportJson(progress, avatarGear), null, 2), 'application/json')}>
          <Download size={16} /> JSON export
        </button>
        <button type="button" onClick={() => downloadTextFile('asterion-attempts.csv', buildAttemptsCsv(progress, avatarGear), 'text/csv')}>
          <Download size={16} /> CSV export
        </button>
        <button className="danger-button" type="button" onClick={onClear}>
          <Trash2 size={16} /> Clear local data
        </button>
      </div>
      <p>{progress.attempts.length} attempts · {progress.issueReports.length} issue reports saved locally</p>
      <DataHealthPanel questions={questions} regionProgress={regionProgress} diagnostics={diagnostics} />
    </section>
  );
}
