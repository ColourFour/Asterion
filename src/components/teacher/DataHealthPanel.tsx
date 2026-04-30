import { useMemo, useState } from 'react';
import type { NormalizedQuestion, QuestionBankDiagnostics, RegionProgress } from '../../types';
import { buildDataHealthSummary } from '../../lib/dataHealth';

interface DataHealthPanelProps {
  questions: NormalizedQuestion[];
  regionProgress: RegionProgress[];
  diagnostics?: QuestionBankDiagnostics;
}

export function DataHealthPanel({ questions, regionProgress, diagnostics }: DataHealthPanelProps) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => buildDataHealthSummary(questions, regionProgress, diagnostics), [questions, regionProgress, diagnostics]);

  return (
    <section className="data-health-panel">
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'} data health
      </button>
      {open ? (
        <div className="data-health-body">
          <div className="health-grid">
            <Metric label="Main file" value={summary.mainUrl ?? 'n/a'} />
            <Metric label="Main schema" value={summary.mainSchemaName ?? 'n/a'} />
            <Metric label="Main record_count" value={summary.mainRecordCount ?? 'n/a'} />
            <Metric label="Main questions.length" value={summary.mainQuestionsLength} />
            <Metric label="Total questions" value={summary.totalQuestionsLoaded} />
            <Metric label="P3 questions" value={summary.totalP3Questions} />
            <Metric label="P3 with question image metadata" value={summary.p3QuestionsWithQuestionImageMetadata} />
            <Metric label="P3 with mark scheme metadata" value={summary.p3QuestionsWithMarkSchemeImageMetadata} />
            <Metric label="Sidecar file" value={summary.sidecarUrl ?? 'n/a'} />
            <Metric label="Sidecar schema" value={summary.sidecarSchemaName ?? 'n/a'} />
            <Metric label="Sidecar enrichments" value={summary.sidecarEnrichmentCount} />
            <Metric label="Sidecar merged" value={summary.sidecarMergeCount} />
            <Metric label="Sidecar errors" value={summary.sidecarErrorCount} />
            <Metric label="Unmatched P3" value={summary.unmatchedP3Questions} />
            <Metric label="Image root mode" value={summary.imageRootMode} />
          </div>

          {summary.mainAppearsPlaceholder ? (
            <p className="health-warning">question_bank.json appears empty or placeholder. Copy the populated extraction JSON to public/data/question_bank.json.</p>
          ) : null}
          {summary.sidecarAppearsPlaceholder ? (
            <p className="health-warning">DeepSeek sidecar appears empty or missing. The app will continue with local labels.</p>
          ) : null}

          <h3>P3 questions by region</h3>
          <div className="health-list">
            {Object.entries(summary.p3QuestionsByRegion).map(([region, count]) => <span key={region}>{region}: {count}</span>)}
          </div>

          <HealthExamples title="Unmatched label examples" items={summary.unmatchedLabelExamples} />
          <HealthExamples title="Sample raw question image paths" items={summary.rawQuestionPathExamples} />
          <HealthExamples title="Sample candidate question image URLs" items={summary.candidateQuestionUrlExamples} />
          <HealthExamples title="Sample raw mark-scheme paths" items={summary.rawMarkSchemePathExamples} />
          <HealthExamples title="Sample candidate mark-scheme URLs" items={summary.candidateMarkSchemeUrlExamples} />
          <HealthExamples title="Resolved image examples" items={summary.resolvedImageExamples.map((item) => `${item.id}: ${item.question ?? 'no question'} | ${item.markScheme ?? 'no mark scheme'}`)} />
          <HealthExamples title="Missing image path examples" items={summary.missingImagePathExamples.map((item) => `${item.id}: missing ${item.missing} (${item.labels || 'no labels'})`)} />
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function HealthExamples({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : <p>None.</p>}
    </div>
  );
}
