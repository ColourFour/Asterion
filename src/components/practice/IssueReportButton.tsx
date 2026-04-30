import { useState } from 'react';
import type { IssueType } from '../../types';

const issueTypes: IssueType[] = [
  'question_image_missing',
  'mark_scheme_image_missing',
  'image_crop_wrong',
  'wrong_topic',
  'wrong_difficulty',
  'mark_scheme_mismatch',
  'unreadable_image',
  'duplicate_question',
  'app_bug',
  'other',
];

interface IssueReportButtonProps {
  onReport: (issueType: IssueType, note?: string) => void;
}

export function IssueReportButton({ onReport }: IssueReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('image_crop_wrong');
  const [note, setNote] = useState('');

  if (!open) {
    return <button className="quiet-button" type="button" onClick={() => setOpen(true)}>Report issue</button>;
  }

  return (
    <div className="issue-box">
      <select value={issueType} onChange={(event) => setIssueType(event.target.value as IssueType)}>
        {issueTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
      </select>
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" />
      <button type="button" onClick={() => { onReport(issueType, note); setOpen(false); setNote(''); }}>Save</button>
    </div>
  );
}
