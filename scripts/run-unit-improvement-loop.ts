import { readdirSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { UNIT_IMPROVEMENT_FIXES, UNIT_IMPROVEMENT_TOPIC_PRIORITY, normalizeUnitImprovementTopicToken } from '../src/data/unitImprovementAgents';
import {
  buildCycleSummary,
  buildExamAuditReport,
  buildFixPlanReport,
  buildStudentFrustrationReport,
  renderCorrectionMarkdown,
  renderCycleSummaryMarkdown,
  renderExamAuditMarkdown,
  renderFixPlanMarkdown,
  renderStudentFrustrationMarkdown,
  type UnitImprovementExamTrainingSnapshot,
  type UnitImprovementFixResult,
  type UnitImprovementFixStatus,
  type UnitImprovementTopicRef,
  type UnitImprovementTopicSnapshot,
} from '../src/data/unitImprovementReports';
import { P3_SKILL_CONTRACT, P3_SKILL_IDS, type P3SkillContractEntry } from '../src/data/p3SkillContract';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic } from '../src/data/fieldGuideTopics';
import type { LearnStep } from '../src/data/learnModeLessons';
import { getSkillCheckItemsForRegion } from '../src/data/skillCheckItems';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';
import { filterTrainableQuestionsForRegion } from '../src/lib/questionTraining';
import { STUDY_TOPICS, type StudyTopic } from '../src/lib/topicStudy';
import { P3_COURSE_MAP } from '../src/lib/worldMap';
import type { NormalizedQuestion, RegionDefinition } from '../src/types';

interface LoopOptions {
  cycles: number;
  startCycle: number;
  topicTokens: string[];
}

interface LoopResult {
  cycleCount: number;
  startCycle: number;
  endCycle: number;
  topics: UnitImprovementTopicRef[];
  reports: string[];
  changedFiles: string[];
  appliedFixes: string[];
  auditWarnings: string[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const reportRoot = path.join(repoRoot, 'reports', 'unit-improvement');
const topicByRegionId = new Map(STUDY_TOPICS.map((topic) => [topic.regionId, topic]));
const p3SkillIds = new Set<string>(P3_SKILL_IDS);
let dynamicImportVersion = 0;

type AuthoredLearnStepLoader = {
  importPath: string;
  exportName: string;
};

const authoredLearnStepLoaders: Record<string, AuthoredLearnStepLoader> = {
  algebra: {
    importPath: '../src/data/algebraLearnSteps.ts',
    exportName: 'getAuthoredAlgebraLearnSteps',
  },
  'logarithmic-and-exponential-functions': {
    importPath: '../src/data/logarithmicExponentialLearnSteps.ts',
    exportName: 'getAuthoredLogExpLearnSteps',
  },
  trigonometry: {
    importPath: '../src/data/trigonometryLearnSteps.ts',
    exportName: 'getAuthoredTrigonometryLearnSteps',
  },
  differentiation: {
    importPath: '../src/data/differentiationLearnSteps.ts',
    exportName: 'getAuthoredDifferentiationLearnSteps',
  },
  integration: {
    importPath: '../src/data/integrationLearnSteps.ts',
    exportName: 'getAuthoredIntegrationLearnSteps',
  },
  'numerical-solution-of-equations': {
    importPath: '../src/data/iterationLearnSteps.ts',
    exportName: 'getAuthoredIterationLearnSteps',
  },
  'differential-equations': {
    importPath: '../src/data/differentialEquationsLearnSteps.ts',
    exportName: 'getAuthoredDifferentialEquationsLearnSteps',
  },
  'complex-numbers': {
    importPath: '../src/data/complexNumbersLearnSteps.ts',
    exportName: 'getAuthoredComplexNumbersLearnSteps',
  },
  vectors: {
    importPath: '../src/data/vectorsLearnSteps.ts',
    exportName: 'getAuthoredVectorsLearnSteps',
  },
};

function parseArgs(argv: string[]): LoopOptions {
  let cycles = 1;
  let startCycle: number | undefined;
  let shouldContinue = false;
  let topicValue = 'all';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    if (arg === '--cycles') {
      cycles = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--cycles=')) {
      cycles = Number(arg.slice('--cycles='.length));
      continue;
    }
    if (arg === '--topics') {
      topicValue = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--topics=')) {
      topicValue = arg.slice('--topics='.length);
      continue;
    }
    if (arg === '--start-cycle') {
      startCycle = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--start-cycle=')) {
      startCycle = Number(arg.slice('--start-cycle='.length));
      continue;
    }
    if (arg === '--continue') {
      shouldContinue = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(cycles) || cycles < 1) {
    throw new Error('--cycles must be a positive integer.');
  }
  const resolvedStartCycle = shouldContinue ? nextCycleNumber() : startCycle ?? 1;
  if (!Number.isInteger(resolvedStartCycle) || resolvedStartCycle < 1) {
    throw new Error('--start-cycle must be a positive integer.');
  }

  return {
    cycles,
    startCycle: resolvedStartCycle,
    topicTokens: topicValue.split(',').map((token) => token.trim()).filter(Boolean),
  };
}

function printHelp(): void {
  console.log(`Asterion P3 unit improvement loop

Usage:
  npm run improve:units
  node scripts/run-unit-improvement-loop.mjs --cycles 3 --topics all
  node scripts/run-unit-improvement-loop.mjs --cycles 1 --topics vectors
  node scripts/run-unit-improvement-loop.mjs --cycles 4 --topics all --start-cycle 2
  node scripts/run-unit-improvement-loop.mjs --cycles 4 --topics all --continue

Options:
  --cycles <n>    Number of local improvement cycles to run. Default: 1.
  --topics <list> Comma-separated topic slugs or aliases, or "all". Default: all.
  --start-cycle <n> Number to use for the first generated cycle directory. Default: 1.
  --continue     Start after the highest existing reports/unit-improvement/cycle-* directory.
`);
}

function nextCycleNumber(): number {
  try {
    const entries = readdirSync(reportRoot, { withFileTypes: true });
    const existing = entries.flatMap((entry) => {
      if (!entry.isDirectory()) return [];
      const match = /^cycle-(\d+)$/.exec(entry.name);
      return match ? [Number(match[1])] : [];
    });
    return Math.max(0, ...existing) + 1;
  } catch {
    return 1;
  }
}

function topicRef(topic: StudyTopic): UnitImprovementTopicRef {
  return {
    regionId: topic.regionId,
    slug: topic.slug,
    name: topic.name,
  };
}

function selectedTopics(topicTokens: string[]): StudyTopic[] {
  if (!topicTokens.length || topicTokens.some((token) => token.toLowerCase() === 'all')) {
    return UNIT_IMPROVEMENT_TOPIC_PRIORITY.map((regionId) => topicByRegionId.get(regionId)).filter((topic): topic is StudyTopic => Boolean(topic));
  }

  const topics = topicTokens.map((token) => {
    const regionId = normalizeUnitImprovementTopicToken(token);
    const topic = topicByRegionId.get(regionId);
    if (!topic) {
      const valid = UNIT_IMPROVEMENT_TOPIC_PRIORITY.join(', ');
      throw new Error(`Unknown P3 topic "${token}". Use one of: ${valid}`);
    }
    return topic;
  });

  const seen = new Set<string>();
  return topics.filter((topic) => {
    if (seen.has(topic.regionId)) return false;
    seen.add(topic.regionId);
    return true;
  });
}

async function freshLearnStepsForRegion(regionId: string | undefined, fieldGuideTopics: FieldGuideTopic[]): Promise<LearnStep[]> {
  const loader = regionId ? authoredLearnStepLoaders[regionId] : undefined;
  const version = `${Date.now()}-${dynamicImportVersion += 1}`;
  if (!loader) {
    const moduleUrl = pathToFileURL(path.join(repoRoot, 'src', 'data', 'learnModeLessons.ts'));
    moduleUrl.search = `unit-improvement=${version}`;
    const module = await import(moduleUrl.href);
    return module.getLearnStepsForRegion(regionId);
  }

  const moduleUrl = pathToFileURL(path.resolve(scriptDir, loader.importPath));
  moduleUrl.search = `unit-improvement=${version}`;
  const module = await import(moduleUrl.href) as Record<string, unknown>;
  const load = module[loader.exportName];
  if (typeof load !== 'function') {
    throw new Error(`Missing ${loader.exportName} export in ${loader.importPath}.`);
  }
  return (load as (topics: FieldGuideTopic[]) => LearnStep[])(fieldGuideTopics);
}

async function readJsonIfExists(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
}

async function loadQuestions(): Promise<NormalizedQuestion[]> {
  const dataRoot = path.join(repoRoot, 'public', 'assets', 'exam-bank-data');
  const main = await readJsonIfExists(path.join(dataRoot, 'asterion_question_bank_v1.json'));
  const routing = await readJsonIfExists(path.join(dataRoot, 'question_bank.topic_routing.v1.json'));
  return normalizeQuestionBankWithDiagnostics(main, {}, routing, {
    contentSourceKind: 'projected-bank',
  }).questions;
}

function regionForTopic(topic: StudyTopic): RegionDefinition | undefined {
  return P3_COURSE_MAP.regions.find((region) => region.id === topic.regionId);
}

function visibleGameTermsForSnapshot(text: string): string[] {
  const terms = ['guardian', 'xp', 'rank', 'avatar', 'quest', 'boss', 'level-up', 'level up'];
  return terms.filter((term) => new RegExp(`\\b${term.replace(' ', '\\s+')}\\b`, 'i').test(text));
}

function contractSnapshot(topic: StudyTopic) {
  const rows: P3SkillContractEntry[] = P3_SKILL_CONTRACT.filter((skill) => skill.officialTopic === topic.name);
  return {
    officialTopic: topic.name,
    skillIds: rows.map((skill) => skill.id),
    readyCount: rows.filter((skill) => skill.readiness === 'ready').length,
    draftCount: rows.filter((skill) => skill.readiness === 'draft').length,
    reviewOnlyCount: rows.filter((skill) => skill.readiness === 'review-only').length,
    missingCount: rows.filter((skill) => skill.readiness === 'missing').length,
  };
}

function examTrainingSnapshot(topic: StudyTopic, questions: NormalizedQuestion[]): UnitImprovementExamTrainingSnapshot {
  const region = regionForTopic(topic);
  if (!region) {
    return {
      trainableQuestionCount: 0,
      imagePairQuestionCount: 0,
      sampleQuestionIds: [],
    };
  }
  const trainableQuestions = filterTrainableQuestionsForRegion(questions, region);
  const withImagePairs = trainableQuestions.filter((question) => (
    (question.questionImageCandidates.length > 0 || question.questionImageUrls.length > 0)
    && (question.markSchemeImageCandidates.length > 0 || question.markSchemeImageUrls.length > 0)
  ));
  return {
    trainableQuestionCount: trainableQuestions.length,
    imagePairQuestionCount: withImagePairs.length,
    sampleQuestionIds: trainableQuestions.slice(0, 5).map((question) => question.id),
  };
}

async function collectSnapshot(topic: StudyTopic, questions: NormalizedQuestion[]): Promise<UnitImprovementTopicSnapshot> {
  const fieldGuideTopics = getFieldGuideTopicsForRegion(topic.regionId);
  const learnSteps = await freshLearnStepsForRegion(topic.regionId, fieldGuideTopics);
  const skillChecks = getSkillCheckItemsForRegion(topic.regionId);
  const unsupportedLearnSkillIds = Array.from(new Set(learnSteps.flatMap((step) => [
    step.primaryCheck?.skillId,
    step.similarCheck?.skillId,
  ]).filter((skillId): skillId is string => Boolean(skillId && !p3SkillIds.has(skillId)))));
  const unsupportedSkillCheckSkillIds = Array.from(new Set(skillChecks
    .map((item) => item.skillId)
    .filter((skillId) => skillId && !p3SkillIds.has(skillId))));

  const scannedText = [
    ...fieldGuideTopics.flatMap((topicItem) => [
      topicItem.title,
      topicItem.purpose,
      topicItem.description,
      topicItem.supportNote ?? '',
      ...topicItem.examples.flatMap((example) => [
        example.prompt,
        example.lesson?.studentAction ?? '',
        example.lesson?.examTransfer ?? '',
        ...example.takeaway,
      ]),
    ]),
    ...learnSteps.flatMap((step) => [step.title, step.stem, step.prompt, step.explanation, step.examTransfer]),
    ...skillChecks.map((item) => item.prompt),
  ].join('\n');

  return {
    topic: topicRef(topic),
    fieldGuideTopics: fieldGuideTopics.map((topicItem) => ({
      id: topicItem.id,
      title: topicItem.title,
      purpose: topicItem.purpose,
      skillIds: [...topicItem.skillIds],
      exampleCount: topicItem.examples.length,
      examplesWithProblemFirstLesson: topicItem.examples.filter((example) => Boolean(example.lesson)).length,
      examplesWithTryWorkedRoute: topicItem.examples.filter((example) => Boolean(example.tryWorkedLines?.length)).length,
      examplesWithCommonMistake: topicItem.examples.filter((example) => (
        example.takeaway.some((line) => /^Common (?:mistake|trap):/i.test(line.trim()))
      )).length,
    })),
    learnSteps: learnSteps.map((step) => ({
      id: step.id,
      title: step.title,
      stem: step.stem,
      prompt: step.prompt,
      explanation: step.explanation,
      examTransfer: step.examTransfer,
      primarySkillId: step.primaryCheck?.skillId,
      similarSkillId: step.similarCheck?.skillId,
      primaryInputType: step.primaryCheck?.inputType,
      primaryCheckable: step.primaryCheck?.checkable === true,
      hasHint: Boolean(step.hint?.trim()),
      hasRepairStep: Boolean(step.primaryCheck?.repairStep?.trim()),
    })),
    skillChecks: skillChecks.map((item) => ({
      itemId: item.itemId,
      prompt: item.prompt,
      skillId: item.skillId,
      inputType: item.inputType,
      validationMode: item.validationMode,
      checkable: item.checkable === true,
      hasRepairStep: Boolean(item.repairStep?.trim()),
      hasWorkedRoute: item.workedRoute.length > 0,
    })),
    contract: contractSnapshot(topic),
    examTraining: examTrainingSnapshot(topic, questions),
    unsupportedLearnSkillIds,
    unsupportedSkillCheckSkillIds,
    visibleGameTerms: visibleGameTermsForSnapshot(scannedText),
  };
}

async function applyFix(fix: typeof UNIT_IMPROVEMENT_FIXES[number]): Promise<UnitImprovementFixResult> {
  const absolutePath = path.join(repoRoot, fix.filePath);
  let source: string;
  try {
    source = await readFile(absolutePath, 'utf8');
  } catch (error) {
    return fixResult(fix, 'failed', `Could not read file: ${error instanceof Error ? error.message : String(error)}`, false);
  }

  if (!source.includes(fix.before)) {
    if (source.includes(fix.after)) {
      return fixResult(fix, 'already-present', 'The target wording is already present.', false);
    }
    return fixResult(fix, 'not-found', 'The exact pre-change text was not found; no source edit was made.', false);
  }

  const occurrenceCount = source.split(fix.before).length - 1;
  const nextSource = source.split(fix.before).join(fix.after);
  await writeFile(absolutePath, nextSource, 'utf8');
  return fixResult(fix, 'applied', `Applied the exact declared source replacement to ${occurrenceCount} occurrence(s).`, true);
}

function fixResult(
  fix: typeof UNIT_IMPROVEMENT_FIXES[number],
  status: UnitImprovementFixStatus,
  message: string,
  fileChanged: boolean,
): UnitImprovementFixResult {
  return { fix, status, message, fileChanged };
}

async function applyTopicFixes(topic: StudyTopic, cycle: number): Promise<UnitImprovementFixResult[]> {
  const fixes = UNIT_IMPROVEMENT_FIXES.filter((fix) => (
    fix.topicRegionId === topic.regionId
    && (fix.cycle === undefined || fix.cycle === cycle)
  ));
  const results: UnitImprovementFixResult[] = [];
  for (const fix of fixes) {
    results.push(await applyFix(fix));
  }
  return results;
}

function cycleDir(cycle: number): string {
  return path.join(reportRoot, `cycle-${String(cycle).padStart(3, '0')}`);
}

async function writeReport(filePath: string, markdown: string, reports: string[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, markdown, 'utf8');
  reports.push(path.relative(repoRoot, filePath));
}

async function runLoop(options: LoopOptions): Promise<LoopResult> {
  const topics = selectedTopics(options.topicTokens);
  const questions = await loadQuestions();
  const allReports: string[] = [];
  const changedFiles = new Set<string>();
  const appliedFixes: string[] = [];
  const auditWarnings: string[] = [];

  let completedCycles = 0;
  let lastCycle = options.startCycle - 1;
  for (let offset = 0; offset < options.cycles; offset += 1) {
    const cycle = options.startCycle + offset;
    lastCycle = cycle;
    const studentReports = [];
    const fixPlans = [];
    const audits = [];

    for (const topic of topics) {
      const topicDir = path.join(cycleDir(cycle), topic.slug);
      const studentSnapshot = await collectSnapshot(topic, questions);
      const studentReport = buildStudentFrustrationReport(studentSnapshot, cycle);
      studentReports.push(studentReport);
      await writeReport(path.join(topicDir, 'student-frustrations.md'), renderStudentFrustrationMarkdown(studentReport), allReports);

      const fixResults = await applyTopicFixes(topic, cycle);
      for (const result of fixResults) {
        if (result.fileChanged) changedFiles.add(result.fix.filePath);
        if (result.status === 'applied' || result.status === 'already-present') {
          appliedFixes.push(`${topic.name}: ${result.fix.title} (${result.status})`);
        }
      }

      const fixPlan = buildFixPlanReport({
        topic: topicRef(topic),
        cycle,
        studentReport,
        fixResults,
      });
      fixPlans.push(fixPlan);
      await writeReport(path.join(topicDir, 'fix-plan.md'), renderFixPlanMarkdown(fixPlan), allReports);

      const auditSnapshot = await collectSnapshot(topic, questions);
      const audit = buildExamAuditReport({
        snapshot: auditSnapshot,
        cycle,
        fixResults,
      });
      audits.push(audit);
      if (!audit.approved) {
        auditWarnings.push(`${topic.name}: ${audit.requiredCorrections.filter((item) => item !== 'None required for this cycle.').join('; ')}`);
      }
      await writeReport(path.join(topicDir, 'exam-audit.md'), renderExamAuditMarkdown(audit), allReports);
      if (!audit.approved) {
        await writeReport(path.join(topicDir, 'follow-up-corrections.md'), renderCorrectionMarkdown(audit), allReports);
      } else {
        await rm(path.join(topicDir, 'follow-up-corrections.md'), { force: true });
      }
    }

    const summary = buildCycleSummary({
      cycle,
      studentReports,
      fixPlans,
      audits,
    });
    await writeReport(path.join(cycleDir(cycle), 'summary.md'), renderCycleSummaryMarkdown(summary), allReports);
    completedCycles += 1;
    const failedAudits = audits.filter((audit) => !audit.approved);
    if (failedAudits.length) {
      throw new Error(`Unit improvement loop stopped after cycle ${cycle} because the Exam Auditor did not approve: ${failedAudits.map((audit) => audit.topic.name).join(', ')}`);
    }
  }

  return {
    cycleCount: completedCycles,
    startCycle: options.startCycle,
    endCycle: lastCycle,
    topics: topics.map(topicRef),
    reports: allReports,
    changedFiles: Array.from(changedFiles),
    appliedFixes,
    auditWarnings,
  };
}

function printResult(result: LoopResult): void {
  console.log(`Unit improvement loop complete.
Cycles run: ${result.cycleCount}
Cycle range: ${result.startCycle}-${result.endCycle}
Topics reviewed: ${result.topics.map((topic) => topic.name).join(', ')}
Reports created: ${result.reports.length}
Files changed by fixer: ${result.changedFiles.length ? result.changedFiles.join(', ') : 'none'}
Fixes applied/present: ${result.appliedFixes.length ? result.appliedFixes.join('; ') : 'none'}
Audit warnings: ${result.auditWarnings.length ? result.auditWarnings.join('; ') : 'none'}`);
}

try {
  const result = await runLoop(parseArgs(process.argv.slice(2)));
  printResult(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
