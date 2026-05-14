import { useEffect, useMemo, useState } from 'react';
import type { NormalizedQuestion, QuestionBankDiagnostics, RegionProgress } from '../../types';
import { auditQuestionAssetAvailabilityWithChecker, buildDataHealthSummary, type AssetAvailabilityAudit } from '../../lib/dataHealth';
import { isP3Question } from '../../lib/worldMap';

interface DataHealthPanelProps {
  questions: NormalizedQuestion[];
  regionProgress: RegionProgress[];
  diagnostics?: QuestionBankDiagnostics;
}

export function DataHealthPanel({ questions, regionProgress, diagnostics }: DataHealthPanelProps) {
  const [open, setOpen] = useState(false);
  const [assetAudit, setAssetAudit] = useState<AssetAvailabilityAudit>();
  const [assetAuditStatus, setAssetAuditStatus] = useState<'idle' | 'checking' | 'complete' | 'failed'>('idle');
  const p3Questions = useMemo(() => questions.filter(isP3Question), [questions]);
  const summary = useMemo(() => buildDataHealthSummary(questions, regionProgress, diagnostics, assetAudit), [questions, regionProgress, diagnostics, assetAudit]);

  useEffect(() => {
    setAssetAudit(undefined);
    setAssetAuditStatus('idle');
  }, [questions]);

  useEffect(() => {
    let cancelled = false;
    if (!open || assetAudit) return undefined;

    setAssetAuditStatus('checking');
    auditQuestionAssetAvailabilityWithChecker(p3Questions, browserCandidateExists)
      .then((audit) => {
        if (cancelled) return;
        setAssetAudit(audit);
        setAssetAuditStatus('complete');
      })
      .catch(() => {
        if (cancelled) return;
        setAssetAuditStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [assetAudit, open, p3Questions]);

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
            <Metric label="Trainable P3 questions" value={summary.trainableP3Questions} />
            <Metric label="P3 blocked from practice" value={summary.p3QuestionsBlockedFromPractice} />
            <Metric label="P3 with question image metadata" value={summary.p3QuestionsWithQuestionImageMetadata} />
            <Metric label="P3 with mark scheme metadata" value={summary.p3QuestionsWithMarkSchemeImageMetadata} />
            <Metric label="Asset availability check" value={assetAuditStatus} />
            <Metric label="P3 question image groups available" value={formatAvailability(summary.p3QuestionImageGroupsAvailable, summary.p3QuestionImageGroupsChecked)} />
            <Metric label="P3 mark-scheme groups available" value={formatAvailability(summary.p3MarkSchemeImageGroupsAvailable, summary.p3MarkSchemeImageGroupsChecked)} />
            <Metric label="Routing file" value={summary.routingUrl ?? 'n/a'} />
            <Metric label="Routing schema" value={summary.routingSchemaName ?? 'n/a'} />
            <Metric label="Routing records" value={summary.routingRecordCount ?? 'n/a'} />
            <Metric label="Routing mapped" value={summary.routingMappedCount ?? 'n/a'} />
            <Metric label="Review-usable text" value={summary.reviewUsableTextCount} />
            <Metric label="Hard-failed text" value={summary.hardFailedTextCount} />
            <Metric label="Unmatched P3" value={summary.unmatchedP3Questions} />
            <Metric label="Image root mode" value={summary.imageRootMode} />
            <Metric label="Raw-bank fallback records" value={summary.rawBankFallbackCount} />
            <Metric label="Raw-bank debug records" value={summary.rawBankDebugCount} />
            <Metric label="Generation eligible" value={`${summary.generationEligibleCounts.true}/${summary.totalP3Questions}`} />
            <Metric label="Generation blocked" value={summary.generationEligibleCounts.false} />
          </div>

          {summary.mainAppearsPlaceholder ? (
            <p className="health-warning">The loaded main question bank appears empty or placeholder. Check public/assets/exam-bank-data/asterion_question_bank_v1.json and the raw-bank fallback.</p>
          ) : null}
          {summary.routingAppearsPlaceholder ? (
            <p className="health-warning">Topic routing appears empty or missing. The app will continue with compatibility label matching.</p>
          ) : null}
          {assetAuditStatus === 'failed' ? (
            <p className="health-warning">Asset availability check failed in this browser. Metadata checks are still shown, but actual image availability was not verified.</p>
          ) : null}
          {assetAudit?.missingMarkSchemeImageGroups ? (
            <p className="health-warning">{assetAudit.missingMarkSchemeImageGroups} P3 mark-scheme candidate group(s) did not resolve to a public asset. Blocked records must stay out of practice until canonical assets are fixed.</p>
          ) : null}
          {summary.rawBankFallbackCount || summary.rawBankDebugCount ? (
            <p className="health-warning">Raw-bank fallback/debug records are loaded. They must remain visible for diagnostics and blocked from mastery, Guardian access, and Content Lab generation.</p>
          ) : null}

          <HealthCountMap title="Route evidence status counts" counts={summary.routeEvidenceStatusCounts} />
          <HealthEligibilityBuckets counts={summary.eligibilityBucketCounts} />
          <HealthCountMap title="Blocker reason-code counts" counts={summary.blockerReasonCodeCounts} />
          <HealthCountMap title="Content source counts" counts={summary.contentSourceCounts} />
          <HealthCountMap title="Fallback-display-only counts by region" counts={summary.fallbackDisplayOnlyCountsByRegion} />
          <HealthCountMap title="Generation blocker reason counts" counts={summary.generationBlockerReasonCounts} />

          <h3>Trainable P3 questions by region</h3>
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
          <HealthExamples title="Missing asset availability examples" items={summary.missingAssetAvailabilityExamples.map((item) => `${item.id} (${item.paper ?? 'paper n/a'} ${item.questionNumber ? `Q${item.questionNumber}` : 'Q n/a'}): missing ${item.missing}; checked ${item.candidates.join(', ') || 'no candidates'}`)} />
          <HealthExamples title="Practice-blocked examples" items={summary.practiceBlockedExamples.map((item) => `${item.id}: ${item.blockers.join('; ')} (${item.labels || 'no labels'})`)} />
          <HealthExamples title="Raw-bank fallback/debug warnings" items={summary.rawBankWarningExamples} />
        </div>
      ) : null}
    </section>
  );
}

async function browserCandidateExists(candidate: string): Promise<boolean> {
  try {
    const response = await fetch(candidate, { method: 'HEAD', cache: 'no-store' });
    if (response.ok) return true;
    if (response.status !== 405) return false;

    const fallback = await fetch(candidate, { method: 'GET', cache: 'no-store' });
    return fallback.ok;
  } catch {
    return false;
  }
}

function formatAvailability(available: number | undefined, checked: number | undefined): string {
  if (available == null || checked == null) return 'not checked';
  return `${available}/${checked}`;
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

function HealthCountMap({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  return (
    <div>
      <h3>{title}</h3>
      {entries.length ? (
        <div className="health-list">
          {entries.map(([key, count]) => <span key={key}>{key}: {count}</span>)}
        </div>
      ) : <p>None.</p>}
    </div>
  );
}

function HealthEligibilityBuckets({ counts }: { counts: Record<string, { eligible: number; blocked: number; missing: number }> }) {
  return (
    <div>
      <h3>Eligibility bucket counts</h3>
      <div className="health-list">
        {Object.entries(counts).map(([key, bucket]) => (
          <span key={key}>{key}: eligible {bucket.eligible}, blocked {bucket.blocked}, missing {bucket.missing}</span>
        ))}
      </div>
    </div>
  );
}
