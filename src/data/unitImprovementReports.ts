import type { UnitImprovementSourceReplacement } from './unitImprovementAgents';

export type UnitImprovementSeverity = 'high' | 'medium' | 'low';
export type UnitImprovementAuditStatus = 'Pass' | 'Needs Work';

export interface UnitImprovementTopicRef {
  regionId: string;
  slug: string;
  name: string;
}

export interface UnitImprovementLearnStepSnapshot {
  id: string;
  title: string;
  stem: string;
  prompt: string;
  explanation: string;
  examTransfer: string;
  primarySkillId?: string;
  similarSkillId?: string;
  primaryInputType?: string;
  primaryCheckable: boolean;
  hasHint: boolean;
  hasRepairStep: boolean;
}

export interface UnitImprovementSkillCheckSnapshot {
  itemId: string;
  prompt: string;
  skillId: string;
  inputType: string;
  validationMode: string;
  checkable: boolean;
  hasRepairStep: boolean;
  hasWorkedRoute: boolean;
}

export interface UnitImprovementFieldGuideSnapshot {
  id: string;
  title: string;
  purpose: string;
  skillIds: string[];
  exampleCount: number;
  examplesWithProblemFirstLesson: number;
  examplesWithTryWorkedRoute: number;
  examplesWithCommonMistake: number;
}

export interface UnitImprovementContractSnapshot {
  officialTopic: string;
  skillIds: string[];
  readyCount: number;
  draftCount: number;
  reviewOnlyCount: number;
  missingCount: number;
}

export interface UnitImprovementExamTrainingSnapshot {
  trainableQuestionCount: number;
  imagePairQuestionCount: number;
  sampleQuestionIds: string[];
}

export interface UnitImprovementTopicSnapshot {
  topic: UnitImprovementTopicRef;
  fieldGuideTopics: UnitImprovementFieldGuideSnapshot[];
  learnSteps: UnitImprovementLearnStepSnapshot[];
  skillChecks: UnitImprovementSkillCheckSnapshot[];
  contract: UnitImprovementContractSnapshot;
  examTraining: UnitImprovementExamTrainingSnapshot;
  unsupportedLearnSkillIds: string[];
  unsupportedSkillCheckSkillIds: string[];
  visibleGameTerms: string[];
}

export interface UnitImprovementFinding {
  title: string;
  location: string;
  impact: string;
  whyThisAnnoysStudent: string;
  suggestedDirection: string;
  severity: UnitImprovementSeverity;
}

export interface StudentFrustrationReport {
  topic: UnitImprovementTopicRef;
  cycle: number;
  frustrations: UnitImprovementFinding[];
  confusionPoints: UnitImprovementFinding[];
  boringSections: UnitImprovementFinding[];
  missingFeedback: UnitImprovementFinding[];
  quitPoints: UnitImprovementFinding[];
  bestExistingParts: string[];
  priorityFixes: string[];
}

export type UnitImprovementFixStatus = 'applied' | 'already-present' | 'not-found' | 'failed';

export interface UnitImprovementFixResult {
  fix: UnitImprovementSourceReplacement;
  status: UnitImprovementFixStatus;
  message: string;
  fileChanged: boolean;
}

export interface FixPlanReport {
  topic: UnitImprovementTopicRef;
  cycle: number;
  highestPriorityProblems: string[];
  fixesToImplementNow: UnitImprovementFixResult[];
  fixesDeferred: string[];
  filesChanged: string[];
  risk: string[];
}

export interface ExamAuditReport {
  topic: UnitImprovementTopicRef;
  cycle: number;
  alignmentStatus: UnitImprovementAuditStatus;
  syllabusFit: string[];
  examReadiness: string[];
  questionQuality: string[];
  skillCheckIntegrity: string[];
  problemsIntroducedByFixer: string[];
  requiredCorrections: string[];
  approved: boolean;
}

export interface UnitImprovementCycleSummary {
  cycle: number;
  topicsReviewed: UnitImprovementTopicRef[];
  commonFrustrations: string[];
  fixesImplemented: string[];
  auditFailures: string[];
  remainingProblems: string[];
  recommendedNextCycleFocus: string[];
}

function truncate(value: string, maxLength = 180): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 3)}...` : cleaned;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function countBy<T>(values: T[], predicate: (value: T) => boolean): number {
  return values.filter(predicate).length;
}

function finding(input: Omit<UnitImprovementFinding, 'severity'> & { severity?: UnitImprovementSeverity }): UnitImprovementFinding {
  return {
    severity: input.severity ?? 'medium',
    title: input.title,
    location: input.location,
    impact: input.impact,
    whyThisAnnoysStudent: input.whyThisAnnoysStudent,
    suggestedDirection: input.suggestedDirection,
  };
}

export function buildStudentFrustrationReport(
  snapshot: UnitImprovementTopicSnapshot,
  cycle: number,
): StudentFrustrationReport {
  const firstStep = snapshot.learnSteps[0];
  const multipleChoiceCount = countBy(snapshot.skillChecks, (item) => item.inputType === 'multiple_choice' || item.inputType === 'checkbox');
  const missingRepairCount = countBy(snapshot.skillChecks, (item) => !item.hasRepairStep);
  const missingTryWorkedCount = snapshot.fieldGuideTopics.reduce(
    (sum, topic) => sum + Math.max(0, topic.exampleCount - topic.examplesWithTryWorkedRoute),
    0,
  );
  const commonMistakeCount = snapshot.fieldGuideTopics.reduce((sum, topic) => sum + topic.examplesWithCommonMistake, 0);
  const totalExamples = snapshot.fieldGuideTopics.reduce((sum, topic) => sum + topic.exampleCount, 0);

  const frustrations: UnitImprovementFinding[] = [];
  if (firstStep) {
    frustrations.push(finding({
      title: 'The first task still feels like a method jump',
      location: `Learn Mode / ${firstStep.title}`,
      impact: 'A reluctant student can try to pattern-match the answer without knowing what exam move the step is training.',
      whyThisAnnoysStudent: `The first prompt says "${truncate(firstStep.prompt)}" after a stem about "${truncate(firstStep.stem, 120)}". I want the page to tell me the exact first action and why it is worth doing before I commit to algebra.`,
      suggestedDirection: 'Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.',
      severity: 'high',
    }));
  }
  if (snapshot.learnSteps.length > 10) {
    frustrations.push(finding({
      title: 'The unit feels long before I know what is essential',
      location: 'Learn Mode sequence',
      impact: `${snapshot.learnSteps.length} checked steps can feel like a wall of tasks rather than a short route to exam readiness.`,
      whyThisAnnoysStudent: 'I do not dislike every step, but I need to know which steps are core exam moves and which are support moves. Otherwise I feel trapped in a checklist.',
      suggestedDirection: 'Use tighter step titles, exam-transfer copy, or deferred cleanup to show the shortest route through the unit.',
      severity: 'medium',
    }));
  }
  if (snapshot.examTraining.trainableQuestionCount === 0) {
    frustrations.push(finding({
      title: 'No real exam handoff is visible',
      location: 'Exam Training',
      impact: 'The unit can feel like isolated practice rather than preparation for CAIE-style questions.',
      whyThisAnnoysStudent: 'If I cannot see at least one real image-first exam question after the lesson, I do not trust that this helps with the paper.',
      suggestedDirection: 'Map reviewed trainable exam questions before claiming this unit has complete exam training.',
      severity: 'high',
    }));
  } else if (snapshot.examTraining.trainableQuestionCount < 3) {
    frustrations.push(finding({
      title: 'Exam Training looks thin',
      location: 'Exam Training',
      impact: `Only ${snapshot.examTraining.trainableQuestionCount} trainable question(s) are visible for this unit.`,
      whyThisAnnoysStudent: 'One or two examples can show the idea, but they do not convince me I can recognize the skill in different exam wording.',
      suggestedDirection: 'Keep the image-first loop, but mark this as a next-cycle mapping and review task.',
      severity: 'medium',
    }));
  }
  if (snapshot.unsupportedLearnSkillIds.length) {
    frustrations.push(finding({
      title: 'Some skill labels do not look connected to the official P3 contract',
      location: 'Learn Mode data',
      impact: 'The student-facing path may be good locally, but the audit trail is harder to trust.',
      whyThisAnnoysStudent: `I see local or legacy skill IDs such as ${snapshot.unsupportedLearnSkillIds.slice(0, 4).join(', ')}. I cannot tell whether these are part of the reviewed P3 contract or just old labels.`,
      suggestedDirection: 'Do not silently route progress through legacy IDs; schedule a contract-alignment pass.',
      severity: 'medium',
    }));
  }

  const confusionPoints: UnitImprovementFinding[] = [];
  if (snapshot.contract.draftCount + snapshot.contract.reviewOnlyCount + snapshot.contract.missingCount > 0) {
    confusionPoints.push(finding({
      title: 'Need-to-Know status mixes ready and draft skills',
      location: 'Need-to-Know checklist',
      impact: 'Students may assume every skill has equal review depth.',
      whyThisAnnoysStudent: `This topic has ${snapshot.contract.readyCount} ready skill(s), ${snapshot.contract.draftCount} draft skill(s), ${snapshot.contract.reviewOnlyCount} review-only skill(s), and ${snapshot.contract.missingCount} missing skill(s). I need the unit to be honest about what is fully ready.`,
      suggestedDirection: 'Keep draft/review-only labels visible and avoid using them as mastery proof.',
      severity: 'medium',
    }));
  }
  if (snapshot.fieldGuideTopics.some((topic) => topic.examplesWithProblemFirstLesson < topic.exampleCount)) {
    confusionPoints.push(finding({
      title: 'Some Field Guide examples fall back to generic lesson structure',
      location: 'Field Guide',
      impact: 'A fallback lesson can be technically complete while still feeling less intentional.',
      whyThisAnnoysStudent: 'When the page falls back to the example prompt instead of a specific problem-first lesson, I feel like I am reading notes rather than being coached through the first move.',
      suggestedDirection: 'Add authored problem-first lesson fields to the weakest Field Guide sections in a later content pass.',
      severity: 'medium',
    }));
  }

  const boringSections: UnitImprovementFinding[] = [];
  if (multipleChoiceCount > snapshot.skillChecks.length / 2) {
    boringSections.push(finding({
      title: 'Too much of the Skill Check can be answered by recognition',
      location: 'Skill Check',
      impact: `${multipleChoiceCount}/${snapshot.skillChecks.length} deterministic checks use multiple-choice or checkbox input.`,
      whyThisAnnoysStudent: 'Multiple-choice is useful, but if most checks are selection tasks I can pass by recognizing the option instead of doing exam-like working.',
      suggestedDirection: 'Future cycles should add typed deterministic variants where answer forms are stable.',
      severity: 'medium',
    }));
  }

  const missingFeedback: UnitImprovementFinding[] = [];
  if (missingRepairCount > 0) {
    missingFeedback.push(finding({
      title: 'Some wrong answers do not have a targeted repair step',
      location: 'Skill Check feedback',
      impact: `${missingRepairCount} check(s) lack a repair step.`,
      whyThisAnnoysStudent: 'If I get a check wrong and only see the answer, I still do not know what to change next time.',
      suggestedDirection: 'Add repair prompts that name the first wrong move, not just the final method.',
      severity: 'high',
    }));
  }
  if (missingTryWorkedCount > 0) {
    missingFeedback.push(finding({
      title: 'Some try-one prompts have no worked route to compare against',
      location: 'Field Guide / Try similar',
      impact: `${missingTryWorkedCount} try-one example(s) lack an authored worked route.`,
      whyThisAnnoysStudent: 'I can try the similar problem, but if the route is not available I cannot tell whether my method is fixable or just lucky.',
      suggestedDirection: 'Add compact worked routes for the try-one checks before adding more examples.',
      severity: 'medium',
    }));
  }
  if (totalExamples > 0 && commonMistakeCount < Math.ceil(totalExamples / 3)) {
    missingFeedback.push(finding({
      title: 'Common mistake warnings are sparse',
      location: 'Field Guide examples',
      impact: `${commonMistakeCount}/${totalExamples} examples include a visible common-mistake takeaway.`,
      whyThisAnnoysStudent: 'I usually lose marks through predictable traps. I want the page to warn me before I make the mistake, not only after a wrong answer.',
      suggestedDirection: 'Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.',
      severity: 'medium',
    }));
  }

  const quitPoints: UnitImprovementFinding[] = [];
  if (snapshot.learnSteps.length > 12) {
    quitPoints.push(finding({
      title: 'The student may quit halfway through the lesson sequence',
      location: 'Learn Mode progression',
      impact: 'Long deterministic sequences are valuable, but the page needs visible momentum and exam payoff.',
      whyThisAnnoysStudent: 'If I am already reluctant, I will stop when every card feels equally important and there is no visible shortcut to exam practice.',
      suggestedDirection: 'In later cycles, split dense sections into core and repair-only steps without weakening deterministic checks.',
      severity: 'medium',
    }));
  }
  if (snapshot.visibleGameTerms.length) {
    quitPoints.push(finding({
      title: 'Retired game language would make the unit feel less serious',
      location: 'Visible copy scan',
      impact: `Found game-like terms: ${snapshot.visibleGameTerms.join(', ')}.`,
      whyThisAnnoysStudent: 'I am here to pass an exam. If the page sounds like a game shell, I trust the maths less.',
      suggestedDirection: 'Remove visible game terms from student-facing copy.',
      severity: 'high',
    }));
  }

  const bestExistingParts = [
    `${snapshot.learnSteps.length} Learn Mode step(s) with deterministic primary checks.`,
    `${snapshot.skillChecks.filter((item) => item.checkable).length} checkable Skill Check item(s).`,
    `${snapshot.learnSteps.filter((step) => step.examTransfer.trim()).length} Learn step(s) include explicit exam-transfer copy.`,
    `${snapshot.examTraining.imagePairQuestionCount} trainable exam question(s) have question and mark-scheme image pairs.`,
  ];

  const priorityFixes = unique([
    ...frustrations,
    ...confusionPoints,
    ...missingFeedback,
  ].sort((a, b) => severityRank(a.severity) - severityRank(b.severity)).slice(0, 5).map((item) => item.suggestedDirection));

  return {
    topic: snapshot.topic,
    cycle,
    frustrations,
    confusionPoints,
    boringSections,
    missingFeedback,
    quitPoints,
    bestExistingParts,
    priorityFixes,
  };
}

function severityRank(severity: UnitImprovementSeverity): number {
  if (severity === 'high') return 0;
  if (severity === 'medium') return 1;
  return 2;
}

export function buildFixPlanReport(input: {
  topic: UnitImprovementTopicRef;
  cycle: number;
  studentReport: StudentFrustrationReport;
  fixResults: UnitImprovementFixResult[];
}): FixPlanReport {
  const highestPriorityProblems = input.studentReport.priorityFixes.slice(0, 4);
  const filesChanged = unique(input.fixResults.filter((result) => result.fileChanged).map((result) => result.fix.filePath));
  const fixesDeferred = unique([
    ...input.studentReport.frustrations,
    ...input.studentReport.confusionPoints,
    ...input.studentReport.boringSections,
    ...input.studentReport.missingFeedback,
  ]
    .filter((findingItem) => !input.fixResults.some((result) => (
      result.fix.reason.toLowerCase().includes(findingItem.title.toLowerCase())
      || findingItem.suggestedDirection.toLowerCase().includes(result.fix.title.toLowerCase())
    )))
    .slice(0, 6)
    .map((findingItem) => `${findingItem.title}: ${findingItem.suggestedDirection}`));

  return {
    topic: input.topic,
    cycle: input.cycle,
    highestPriorityProblems,
    fixesToImplementNow: input.fixResults,
    fixesDeferred,
    filesChanged,
    risk: input.fixResults.length
      ? unique(input.fixResults.map((result) => result.fix.risk))
      : ['No source fix was declared for this topic in the current loop. Reports only.'],
  };
}

export function buildExamAuditReport(input: {
  snapshot: UnitImprovementTopicSnapshot;
  cycle: number;
  fixResults: UnitImprovementFixResult[];
}): ExamAuditReport {
  const { snapshot } = input;
  const requiredCorrections: string[] = [];
  const syllabusFit: string[] = [];
  const examReadiness: string[] = [];
  const questionQuality: string[] = [];
  const skillCheckIntegrity: string[] = [];
  const problemsIntroducedByFixer: string[] = [];

  if (!snapshot.contract.skillIds.length) {
    requiredCorrections.push('No P3 skill-contract entries were found for this official topic.');
  } else {
    syllabusFit.push(`Uses official topic "${snapshot.contract.officialTopic}" with ${snapshot.contract.skillIds.length} contract skill(s).`);
  }

  if (snapshot.unsupportedLearnSkillIds.length) {
    requiredCorrections.push(`Learn Mode uses non-contract skill IDs: ${snapshot.unsupportedLearnSkillIds.join(', ')}.`);
  }
  if (snapshot.unsupportedSkillCheckSkillIds.length) {
    requiredCorrections.push(`Skill Check uses non-contract skill IDs: ${snapshot.unsupportedSkillCheckSkillIds.join(', ')}.`);
  }

  if (snapshot.visibleGameTerms.length) {
    requiredCorrections.push(`Visible copy includes retired game-like terms: ${snapshot.visibleGameTerms.join(', ')}.`);
  } else {
    syllabusFit.push('No retired visible game terms were detected in the inspected unit text.');
  }

  if (snapshot.learnSteps.length === 0) {
    requiredCorrections.push('No Learn Mode steps are available for this unit.');
  } else if (snapshot.learnSteps.some((step) => !step.examTransfer.trim())) {
    requiredCorrections.push('At least one Learn Mode step lacks exam-transfer copy.');
  } else {
    examReadiness.push(`${snapshot.learnSteps.length} Learn Mode step(s) retain explicit exam-transfer text.`);
  }

  if (snapshot.examTraining.trainableQuestionCount === 0) {
    requiredCorrections.push('No reviewed trainable exam questions are available for this unit.');
  } else {
    examReadiness.push(`${snapshot.examTraining.trainableQuestionCount} reviewed trainable exam question(s) are available for topic Exam Training.`);
  }

  if (snapshot.examTraining.imagePairQuestionCount < snapshot.examTraining.trainableQuestionCount) {
    requiredCorrections.push('Some trainable exam questions lack a question/mark-scheme image pair.');
  } else {
    questionQuality.push('Trainable Exam Training questions keep question and mark-scheme image pairs.');
  }

  if (snapshot.skillChecks.length === 0) {
    requiredCorrections.push('No Skill Check items are available for this unit.');
  } else if (snapshot.skillChecks.some((item) => item.validationMode !== 'deterministic' || !item.checkable)) {
    requiredCorrections.push('At least one Skill Check item is not deterministic and checkable.');
  } else {
    skillCheckIntegrity.push(`${snapshot.skillChecks.length} Skill Check item(s) remain deterministic and checkable.`);
  }

  const failedFixes = input.fixResults.filter((result) => result.status === 'failed' || result.status === 'not-found');
  if (failedFixes.length) {
    problemsIntroducedByFixer.push(...failedFixes.map((result) => `${result.fix.id}: ${result.message}`));
  }
  const changedUnsafeFiles = input.fixResults
    .filter((result) => result.fileChanged)
    .map((result) => result.fix.filePath)
    .filter((filePath) => !filePath.startsWith('src/data/'));
  if (changedUnsafeFiles.length) {
    requiredCorrections.push(`Fixer changed files outside src/data/: ${unique(changedUnsafeFiles).join(', ')}.`);
  }

  if (!problemsIntroducedByFixer.length) {
    problemsIntroducedByFixer.push('None detected by this deterministic audit.');
  }
  if (!requiredCorrections.length) {
    requiredCorrections.push('None required for this cycle.');
  }

  const approved = requiredCorrections.length === 1 && requiredCorrections[0] === 'None required for this cycle.';
  return {
    topic: snapshot.topic,
    cycle: input.cycle,
    alignmentStatus: approved ? 'Pass' : 'Needs Work',
    syllabusFit,
    examReadiness,
    questionQuality,
    skillCheckIntegrity,
    problemsIntroducedByFixer,
    requiredCorrections,
    approved,
  };
}

function renderFindingList(findings: UnitImprovementFinding[]): string {
  if (!findings.length) return 'No major issues detected by this pass.\n';
  return findings.map((item, index) => `### ${index + 1}. ${item.title}
Location: ${item.location}

Impact: ${item.impact}

Why this annoys the student: ${item.whyThisAnnoysStudent}

Suggested direction: ${item.suggestedDirection}
`).join('\n');
}

function renderBullets(items: string[]): string {
  if (!items.length) return '- None.\n';
  return items.map((item) => `- ${item}`).join('\n') + '\n';
}

export function renderStudentFrustrationMarkdown(report: StudentFrustrationReport): string {
  return `# Student Frustration Report — ${report.topic.name} — Cycle ${report.cycle}

## Student Persona
Reluctant student.
Does not especially like maths.
Only taking P3 because it is required.
Wants to know exactly what to do, why it matters, and how it helps with the exam.

## Frustrations
${renderFindingList(report.frustrations)}
## Confusion Points
${renderFindingList(report.confusionPoints)}
## Boring / Low-Motivation Sections
${renderFindingList(report.boringSections)}
## Missing Feedback
${renderFindingList(report.missingFeedback)}
## Places Where the Student Would Quit
${renderFindingList(report.quitPoints)}
## Best Existing Parts
${renderBullets(report.bestExistingParts)}
## Priority Fixes
${renderBullets(report.priorityFixes)}
`;
}

export function renderFixPlanMarkdown(report: FixPlanReport): string {
  const fixRows = report.fixesToImplementNow.length
    ? report.fixesToImplementNow.map((result) => [
      `- ${result.fix.title}`,
      `  Status: ${result.status}. ${result.message}`,
      `  File: ${result.fix.filePath}`,
      `  Risk: ${result.fix.risk}`,
    ].join('\n')).join('\n')
    : '- No source fixes declared for this topic in this cycle.';

  return `# Fix Plan — ${report.topic.name} — Cycle ${report.cycle}

## Highest Priority Problems
${renderBullets(report.highestPriorityProblems)}
## Fixes To Implement Now
${fixRows}

## Fixes Deferred
${renderBullets(report.fixesDeferred)}
## Files Changed
${renderBullets(report.filesChanged)}
## Risk
${renderBullets(report.risk)}
`;
}

export function renderExamAuditMarkdown(report: ExamAuditReport): string {
  return `# Exam Audit — ${report.topic.name} — Cycle ${report.cycle}

## CAIE 9709 P3 Alignment
${report.alignmentStatus}

## Syllabus Fit
${renderBullets(report.syllabusFit)}
## Exam Readiness
${renderBullets(report.examReadiness)}
## Question Quality
${renderBullets(report.questionQuality)}
## Skill Check Integrity
${renderBullets(report.skillCheckIntegrity)}
## Problems Introduced By Fixer Agent
${renderBullets(report.problemsIntroducedByFixer)}
## Required Corrections
${renderBullets(report.requiredCorrections)}
## Approved For Current Cycle?
${report.approved ? 'Yes' : 'No'}
`;
}

export function renderCorrectionMarkdown(report: ExamAuditReport): string {
  return `# Follow-Up Correction Report — ${report.topic.name} — Cycle ${report.cycle}

The Exam Auditor did not approve this topic for the current cycle. The loop stops here and does not recurse.

## Required Corrections Before A Later Cycle
${renderBullets(report.requiredCorrections.filter((item) => item !== 'None required for this cycle.'))}
## Suggested Handling
- Create a reviewed implementation packet for these corrections before changing curriculum routing or question evidence.
- Keep deterministic Skill Check behavior intact.
- Do not treat self-marked exam work as mastery evidence.
`;
}

export function buildCycleSummary(input: {
  cycle: number;
  studentReports: StudentFrustrationReport[];
  fixPlans: FixPlanReport[];
  audits: ExamAuditReport[];
}): UnitImprovementCycleSummary {
  const frustrationTitles = input.studentReports.flatMap((report) => report.frustrations.map((item) => item.title));
  const commonFrustrations = unique(frustrationTitles).slice(0, 8);
  const fixesImplemented = input.fixPlans.flatMap((plan) => (
    plan.fixesToImplementNow
      .filter((result) => result.status === 'applied' || result.status === 'already-present')
      .map((result) => `${plan.topic.name}: ${result.fix.title} (${result.status})`)
  ));
  const auditFailures = input.audits
    .filter((audit) => !audit.approved)
    .map((audit) => `${audit.topic.name}: ${audit.requiredCorrections.filter((item) => item !== 'None required for this cycle.').join('; ')}`);
  const remainingProblems = unique([
    ...input.fixPlans.flatMap((plan) => plan.fixesDeferred),
    ...auditFailures,
  ]).slice(0, 12);
  const recommendedNextCycleFocus = unique([
    auditFailures.length ? 'Resolve audit failures before adding new content breadth.' : '',
    'Add typed deterministic variants where selection-heavy checks dominate.',
    'Add common-mistake warnings only where they are directly supported by the skill contract.',
    'Improve exam-question mapping for units with thin trainable question counts.',
  ]);

  return {
    cycle: input.cycle,
    topicsReviewed: input.studentReports.map((report) => report.topic),
    commonFrustrations,
    fixesImplemented,
    auditFailures,
    remainingProblems,
    recommendedNextCycleFocus,
  };
}

export function renderCycleSummaryMarkdown(summary: UnitImprovementCycleSummary): string {
  return `# Unit Improvement Cycle ${summary.cycle} Summary

## Topics Reviewed
${renderBullets(summary.topicsReviewed.map((topic) => topic.name))}
## Most Common Student Frustrations
${renderBullets(summary.commonFrustrations)}
## Fixes Implemented
${renderBullets(summary.fixesImplemented)}
## Audit Failures
${renderBullets(summary.auditFailures)}
## Remaining Problems
${renderBullets(summary.remainingProblems)}
## Recommended Next Cycle Focus
${renderBullets(summary.recommendedNextCycleFocus)}
`;
}
