// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { COURSES, P3_COURSE_ID, coursePath, getCourseBySlug } from '../src/data/courses';
import { P3_REGION_DEFINITIONS } from '../src/lib/p3SkillContract';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS } from '../src/lib/staticStudyRoutes';
import { STUDY_TOPICS } from '../src/lib/topicStudy';

const officialP3Topics = [
  'Algebra',
  'Logarithmic and Exponential Functions',
  'Trigonometry',
  'Differentiation',
  'Integration',
  'Numerical Solution of Equations',
  'Vectors',
  'Differential Equations',
  'Complex Numbers',
];

const MAX_PRIMARY_LEARNING_AREA_ELEMENTS = 7;

const KNOWN_OVERLOADED_STUDENT_PAGE_TYPES = [
  {
    label: 'need-to-know',
    routePattern: /^p3\/need-to-know\/index\.html$/,
    selector: '.contract-skill-card',
  },
  {
    label: 'worksheet',
    routePattern: /^p3\/topics\/[^/]+\/worksheet\/index\.html$/,
    selector: '.worksheet-question',
  },
];

function normalizeRoute(pagePath: string, href: string): string {
  const url = new URL(href, `https://asterion.test/${pagePath}`);
  let pathname = url.pathname.replace(/^\//, '');
  if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'index.html'.length);
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return `${pathname || 'index'}${url.hash}`;
}

function visibleText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function withDocument<T>(html: string, run: (document: Document) => T): T {
  const dom = new JSDOM(html);
  try {
    return run(dom.window.document);
  } finally {
    dom.window.close();
  }
}

function withStaticDocument<T>(path: string, run: (document: Document) => T): T {
  return withDocument(readFileSync(path, 'utf8'), run);
}

function primaryLearningAreaCount(document: Document): number {
  return document.querySelectorAll(
    [
      'main > section:not(.page-hero)',
      ':not(.learn-mode-hero)',
      ':not(.worksheet-hero)',
      ':not(.p3-dashboard-hero)',
      ':not(.p3-path-hero)',
    ].join(''),
  ).length;
}

describe('static P3 product contract', () => {
  it('makes P3 the only ready course path', () => {
    expect(COURSES.map((course) => course.id)).toEqual(['p1', 'p3', 'm1', 's1']);
    expect(COURSES.map(coursePath)).toEqual(['/p1', '/p3', '/m1', '/s1']);

    expect(getCourseBySlug(P3_COURSE_ID)?.status).toBe('ready');
    expect(getCourseBySlug(P3_COURSE_ID)?.statusLabel).toBe('Content available');

    for (const slug of ['p1', 'm1', 's1'] as const) {
      const course = getCourseBySlug(slug);
      expect(course?.status).toBe('coming-soon');
      expect(course?.statusLabel).toBe('Available later');
      expect(course?.topics).toEqual([]);
    }
  });

  it('uses official P3 topic wording throughout route metadata', () => {
    expect(STUDY_TOPICS.map((topic) => topic.name)).toEqual(officialP3Topics);
    expect(P3_REGION_DEFINITIONS.map((region) => region.name)).toEqual(officialP3Topics);
    expect(STUDY_TOPICS.map((topic) => topic.regionId)).toEqual([
      'algebra',
      'logarithmic-and-exponential-functions',
      'trigonometry',
      'differentiation',
      'integration',
      'numerical-solution-of-equations',
      'vectors',
      'differential-equations',
      'complex-numbers',
    ]);
  });

  it('declares only canonical P3 topic task routes', () => {
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/need-to-know/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/review/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('p3/content-qa/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/exam-training/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('p1/need-to-know/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('m1/content-qa/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('s1/content-qa/index.html');

    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/learn/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/skill-check/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/exam-training/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/worksheet/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain(`p3/topics/${topic.slug}/practice/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain(`p3/topics/${topic.slug}/index.html`);
    }

    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/topics/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('regions/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('topics/algebra/index.html');
  });

  it('uses the root page as the focused P3 starfield landing page', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const generatedHomePath = 'docs/index.html';
    const generatedP3Path = 'docs/p3/index.html';
    const generatedP3TopicsPath = 'docs/p3/topics/index.html';

    expect(generatorSource).toContain('CAIE 9709 Paper 3');
    expect(generatorSource).toContain('path-unit-grid');
    expect(generatorSource).toContain('Start diagnostic');
    expect(generatorSource).toContain('Default path: Diagnostic → Learn → Checked Practice → Exam Training.');
    expect(generatorSource).toContain('Already confident? Try Checked Practice');
    expect(generatorSource).toContain("htmlByPath.set('index.html', renderCourseSelectorPage())");
    expect(generatorSource).toContain('renderP3DashboardPage(data, course)');
    expect(generatorSource).toContain('data-p3-exam-review-gate');
    expect(generatorSource).toContain('data-flow-final-href');
    expect(generatorSource).toContain('Check Answer');
    expect(generatorSource).toContain('home-p3-landing');
    expect(generatorSource).toContain('Master CAIE 9709');
    expect(generatorSource).toContain('Already completed it? Start Algebra Learn');

    if (existsSync(generatedHomePath)) {
      const generatedHome = readFileSync(generatedHomePath, 'utf8');

      expect(generatedHome).toContain('home-p3-landing');
      expect(generatedHome).toContain('home-starfield');
      expect(generatedHome).toContain('Master CAIE 9709');
      expect(generatedHome).toContain('Pure Mathematics 3');
      expect(generatedHome).toContain('Learn what matters. Practice with purpose.');
      expect(generatedHome).toContain('Prepare for the exam with confidence.');
      expect(generatedHome).toContain('Start diagnostic');
      expect(generatedHome).toContain('Already completed it? Start Algebra Learn');
      expect(generatedHome).toContain('Diagnostic → Learn → Checked Practice → Exam Training');
      expect(generatedHome).toContain('Find your start');
      expect(generatedHome).toContain('Build understanding');
      expect(generatedHome).toContain('Check your skills');
      expect(generatedHome).toContain('Exam questions');
      withDocument(generatedHome, (homeDocument) => {
        expect(homeDocument.querySelectorAll('.home-p3-action-card')).toHaveLength(4);
        expect(homeDocument.querySelectorAll('.home-p3-topic-tile')).toHaveLength(9);
        expect(homeDocument.querySelector('[data-theme-toggle]')).toBeNull();
        expect(homeDocument.querySelector('a.home-p3-primary-cta')?.getAttribute('href')).toBe('p3/diagnostic/');
        expect(homeDocument.querySelector('.home-p3-diagnostic-link')?.getAttribute('href')).toContain('p3/topics/algebra/learn/');
      });
      expect(generatedHome).toContain("document.documentElement.dataset.theme='dark'");
      for (const topicLabel of ['Algebra', 'Log/Exp', 'Complex', 'Trigonometry', 'Vectors', 'Differentiation', 'Integration', 'Diff Eq', 'Iteration']) {
        expect(generatedHome).toContain(topicLabel);
      }
      expect(generatedHome).not.toContain('Start P3 with Algebra.');
      expect(generatedHome).not.toContain('path-unit-grid');
      expect(generatedHome).not.toContain('homepage-course-panel');
      expect(generatedHome).not.toContain('Choose a paper');
      expect(generatedHome).not.toContain('Pure Mathematics 1');
      expect(generatedHome).not.toContain('What should I do?');
      expect(generatedHome).not.toContain('Direct links');
      expect(generatedHome).not.toContain('P3 content QA');
      expect(generatedHome).not.toContain('Trust Signals');
      expect(generatedHome).not.toContain('The Asterion Learning Loop');
      expect(generatedHome).not.toContain('AI-powered');
      expect(generatedHome).not.toContain('personalized learning revolution');
      expect(generatedHome).not.toContain('trusted by');
      expect(generatedHome).not.toContain('parents');
      expect(generatedHome).not.toContain('investors');
    }

    if (existsSync(generatedP3Path)) {
      const generatedP3 = readFileSync(generatedP3Path, 'utf8');
      expect(generatedP3).toContain('Pure Mathematics 3');
      expect(generatedP3).toContain('Diagnostic');
      expect(generatedP3).toContain('Need to Know');
      expect(generatedP3).toContain('Start diagnostic');
      expect(generatedP3).toContain('All topic routes');
      expect(generatedP3).toContain('Summer homework minimum');
      expect(generatedP3).toContain('Default path: Diagnostic → Learn → Checked Practice → Exam Training.');
      expect(generatedP3).toContain('Already confident? Try Checked Practice');
      expect(generatedP3).toContain('Complete the P3 Diagnostic first.');
      expect(generatedP3).toContain('Complete Checked Practice for each P3 unit.');
      expect(generatedP3).toContain('Export your local progress CSV after each session');
      expect(generatedP3).toContain('Progress is saved only in this browser on this device.');
      expect(generatedP3).toContain('data-p3-next-step-panel');
      expect(generatedP3).toContain('path-unit-grid');
      expect(generatedP3).toContain('data-progress-field-guide');
      expect(generatedP3).toContain('data-progress-skill');
      expect(generatedP3).toContain('data-progress-exam');
      expect(generatedP3).toContain('Export progress');
      expect(generatedP3).toContain('review/#export-progress');
      expect(generatedP3.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
      expect(generatedP3.match(/data-path-unit-primary-action/g)?.length).toBe(9);
      expect(generatedP3.match(/data-path-unit-fast-lane-action/g)?.length).toBe(9);
      expect(generatedP3.match(/class="path-unit-direct-routes"/g)?.length).toBe(9);
      withDocument(generatedP3, (p3Document) => {
        const algebraPrimaryAction = p3Document.querySelector('[data-path-unit="algebra"] [data-path-unit-primary-action]');
        const algebraFastLaneAction = p3Document.querySelector('[data-path-unit="algebra"] [data-path-unit-fast-lane-action]');
        expect(visibleText(algebraPrimaryAction as Element)).toBe('Start Algebra Learn');
        expect(algebraPrimaryAction?.getAttribute('href')).toBe('topics/algebra/learn/');
        expect(visibleText(algebraFastLaneAction as Element)).toBe('Already confident? Try Checked Practice');
        expect(algebraFastLaneAction?.getAttribute('href')).toBe('topics/algebra/skill-check/');
      });
      expect(generatedP3).not.toContain('course-topic-button-grid');
    }

    if (existsSync(generatedP3TopicsPath)) {
      const generatedP3Topics = readFileSync(generatedP3TopicsPath, 'utf8');
      expect(generatedP3Topics).toContain('CAIE 9709 Paper 3');
      expect(generatedP3Topics).toContain('P3 Topic Overview');
      expect(generatedP3Topics).toContain('path-unit-grid');
      expect(generatedP3Topics.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
      expect(generatedP3Topics.match(/data-path-unit-primary-action/g)?.length).toBe(9);
      expect(generatedP3Topics.match(/data-path-unit-fast-lane-action/g)?.length).toBe(9);
      expect(generatedP3Topics).toContain('Direct routes');
    }
  });

  it('gates final exam review on local unit completion requirements', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain('p3ExamReviewRequirements');
    expect(generatorSource).toContain('data-required-topics');
    expect(staticClientSource).toContain('updateExamReviewGate');
    expect(staticClientSource).toContain('All P3 units have checked evidence in this browser. Mixed exam review is open.');
    expect(staticClientSource).toContain('Finish lesson sequence');

    const generatedReviewPath = 'docs/p3/review/index.html';
    if (existsSync(generatedReviewPath)) {
      const generatedReview = readFileSync(generatedReviewPath, 'utf8');
      expect(generatedReview).toContain('Export Progress');
      expect(generatedReview).toContain('Review mistakes from saved Checked Practice');
      expect(generatedReview).toContain('data-p3-exam-review-gate');
      expect(generatedReview).toContain('Mixed Paper 3 questions');
      expect(generatedReview).toContain('Locked until the path is complete');
      expect(generatedReview).toContain('data-review-skill-routes');
      expect(generatedReview).toContain('Progress summary for teacher');
      expect(generatedReview).toContain('This record is saved only in this browser on this device. It is local evidence, not a server-verified account record.');
      expect(generatedReview).toContain('p3_alg_partial_fraction_form');
      expect(generatedReview).toContain('../topics/algebra/skill-check/#practice-algebra_partial_fractions');
    }
  });

  it('locks Learn Mode step navigation until the current step is completed', () => {
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');
    const generatedStaticClientSource = readFileSync('docs/assets/static-study.js', 'utf8');
    const learnFlowSourceStart = staticClientSource.indexOf('function setupLearnModeFlow()');
    const learnFlowSourceEnd = staticClientSource.indexOf('function setupWorksheetFlow()', learnFlowSourceStart);
    const learnFlowSource = staticClientSource.slice(learnFlowSourceStart, learnFlowSourceEnd);
    const generatedLearnFlowSourceStart = generatedStaticClientSource.indexOf('function setupLearnModeFlow()');
    const generatedLearnFlowSourceEnd = generatedStaticClientSource.indexOf('function setupWorksheetFlow()', generatedLearnFlowSourceStart);
    const generatedLearnFlowSource = generatedStaticClientSource.slice(generatedLearnFlowSourceStart, generatedLearnFlowSourceEnd);

    expect(staticClientSource).toContain('function setupLearnModeFlow()');
    expect(learnFlowSource).toContain('function currentCardComplete()');
    expect(learnFlowSource).toContain('if (!currentCardComplete()) {');
    expect(learnFlowSource).toContain('var complete = currentCardComplete();');
    expect(learnFlowSource).toContain('next.disabled = !complete;');
    expect(learnFlowSource).toContain('inlineNext.disabled = cardIndex !== index || !complete;');
    expect(learnFlowSource).toContain("next.setAttribute('aria-disabled', complete ? 'false' : 'true');");
    expect(generatedLearnFlowSource).toContain('next.disabled = !complete;');
    expect(learnFlowSource).not.toContain('next.disabled = false;');
  });

  it('ships an accessible correct-answer celebration modal without changing evidence semantics', () => {
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');
    const staticCssSource = readFileSync('src/static-study/static-study.css', 'utf8');

    expect(staticClientSource).toContain('function showCorrectCelebration(options)');
    expect(staticClientSource).toContain("dialog.setAttribute('role', 'dialog')");
    expect(staticClientSource).toContain("dialog.setAttribute('aria-modal', 'true')");
    expect(staticClientSource).toContain('A clean Checked Practice pass is the strongest local evidence.');
    expect(staticClientSource).toContain('Saved as Learn progress only. A clean Checked Practice pass is the strongest local evidence.');
    expect(staticClientSource).toContain('Mini-check passed within the retry window for this repair module.');
    expect(staticClientSource).toContain('Every diagnostic mark was correct. This is strong starting evidence for the P3 path.');
    expect(staticCssSource).toContain('.correct-celebration-dialog');
    expect(staticCssSource).toContain('@keyframes correct-celebration-icon-in');
    expect(staticCssSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(staticCssSource).toContain('.correct-celebration-icon');
  });

  it('does not expose legacy self-reported Checked Practice completion controls', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).not.toContain('data-save-skill-check');
    expect(generatorSource).not.toContain('I tried this');
    expect(staticClientSource).not.toContain('data-save-skill-check');

    for (const pagePath of REQUIRED_STATIC_STUDY_PAGE_PATHS.filter((pagePath) => pagePath.includes('/skill-check/'))) {
      const generatedPath = `docs/${pagePath}`;
      if (!existsSync(generatedPath)) continue;
      const generatedSource = readFileSync(generatedPath, 'utf8');
      expect(generatedSource, generatedPath).not.toContain('data-save-skill-check');
      expect(generatedSource, generatedPath).not.toContain('I tried this');
    }
  });

  it('keeps static support actions and printable worksheet routes available', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain('Export Progress');
    expect(generatorSource).toContain('Send local progress CSV');
    expect(generatorSource).toContain('Progress summary for teacher');
    expect(generatorSource).toContain('P3 units with clean Checked Practice pass');
    expect(generatorSource).toContain('Browser/device warning');
    expect(generatorSource).toContain('data-export-local-progress-form');
    expect(generatorSource).toContain('data-download-export-csv');
    expect(generatorSource).toContain('data-progress-transfer-controls');
    expect(generatorSource).toContain('data-export-progress-json');
    expect(generatorSource).toContain('data-import-progress-json');
    expect(staticClientSource).toContain('data-export-local-progress-form');
    expect(staticClientSource).toContain('exportLocalProgressDownload');
    expect(staticClientSource).toContain("PROGRESS_EXPORT_KIND = 'asterion-progress-export'");
    expect(staticClientSource).toContain("storageKeys: [STORAGE_KEY, THEME_STORAGE_KEY]");
    expect(staticClientSource).toContain('validateProgressImportPayload');
    expect(staticClientSource).toContain('Importing replaces progress saved in this browser.');
    expect(staticClientSource).toContain('downloadTextFile(progressJsonFilename(payload.exportedAt), json,');
    expect(staticClientSource).toContain('localProgressTeacherSummary');
    expect(staticClientSource).toContain('data-export-teacher-summary');
    expect(staticClientSource).toContain('Not recorded in this browser');
    expect(staticClientSource).toContain('mailto:');
    expect(staticClientSource).toContain('data-copy-export-csv');
    expect(generatorSource).toContain('Print / Save PDF');

    const algebraWorksheetPath = 'docs/p3/topics/algebra/worksheet/index.html';
    if (existsSync(algebraWorksheetPath)) {
      const worksheetSource = readFileSync(algebraWorksheetPath, 'utf8');
      expect(worksheetSource).toContain('Algebra Checked Practice Worksheet');
      expect(worksheetSource).toContain('Student name:');
      expect(worksheetSource).toContain('Print / Save PDF');
      expect(worksheetSource).toContain('data-export-progress-json');
      expect(worksheetSource).toContain('data-import-progress-json');
    }

    const integrationWorksheetPath = 'docs/p3/topics/integration/worksheet/index.html';
    if (existsSync(integrationWorksheetPath)) {
      const worksheetSource = readFileSync(integrationWorksheetPath, 'utf8');
      expect(worksheetSource).not.toContain('No printable Checked Practice items are available for this group yet.');
    }

    expect(generatorSource).toContain('Check Answer');
    expect(generatorSource).toContain('Hint');
    expect(generatorSource).toContain('Review mistakes from saved Checked Practice');
  });

  it('keeps P1 Review standalone with one module visible and mini-checks revealed after fast checks', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain("{ key: 'courses', label: 'Home'");
    expect(generatorSource).toContain("{ key: 'p3-diagnostic', label: 'Diagnostic'");
    expect(generatorSource).toContain("{ key: 'p3-topics', label: 'P3 Units'");
    expect(generatorSource).toContain("{ key: 'p3-exam-training', label: 'Exam Training'");
    expect(generatorSource).toContain('data-p1-repair-module-tab');
    expect(generatorSource).toContain('data-p1-repair-mini-check-panel hidden');
    expect(generatorSource).toContain('Submit Fast Check');
    expect(generatorSource).toContain('Submit Mini-Check');
    expect(generatorSource).toContain('data-p1-repair-next');
    expect(generatorSource).not.toContain('Readiness rule');
    expect(generatorSource).not.toContain('Recommended route');

    expect(staticClientSource).toContain('setupP1RepairLaneFlow');
    expect(staticClientSource).toContain('p1RepairHasFastSubmission');
    expect(staticClientSource).toContain("element.disabled = false");
    expect(staticClientSource).not.toContain('Available after the diagnostic recommends P1_REPAIR_REQUIRED.');

    const generatedP1ReviewPath = 'docs/p3/repair-lane/index.html';
    if (existsSync(generatedP1ReviewPath)) {
      const generatedP1Review = readFileSync(generatedP1ReviewPath, 'utf8');
      withDocument(generatedP1Review, (document) => {
        const navLabels = Array.from(document.querySelectorAll('.site-nav a')).map(visibleText);

        expect(navLabels).toEqual(['Home', 'Diagnostic', 'P3 Units', 'Exam Training']);
        expect(document.querySelector('[data-theme-toggle]')).not.toBeNull();
        expect(document.querySelectorAll('[data-p1-repair-module-tab]')).toHaveLength(5);
        expect(document.querySelectorAll('[data-p1-repair-module]')).toHaveLength(5);
        expect(document.querySelectorAll('[data-p1-repair-module][hidden]')).toHaveLength(4);
        expect(document.querySelectorAll('[data-p1-repair-mini-check-panel][hidden]')).toHaveLength(5);
      });
      expect(generatedP1Review).toContain('Submit Fast Check');
      expect(generatedP1Review).toContain('Submit Mini-Check');
      expect(generatedP1Review).toContain('Next module');
      expect(generatedP1Review).not.toContain('Readiness rule');
      expect(generatedP1Review).not.toContain('Recommended route');
    }
  });

  it('renders structured math editor mounts for deterministic typed answer inputs', () => {
    const oldGenericInstruction = 'Type a compact expression, e.g. ln(5x) or x^2-x-6.';
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain('answerFormatGuidance');
    expect(generatorSource).toContain('renderMathAnswerInput');
    expect(generatorSource).toContain('data-answer-format');
    expect(generatorSource).toContain('math-answer-input');
    expect(generatorSource).toContain('data-math-answer-raw');
    expect(generatorSource).toContain('data-math-editor-mount');
    expect(generatorSource).not.toContain(oldGenericInstruction);
    expect(staticClientSource).toContain('setupMathAnswerEditors');
    expect(staticClientSource).toContain('MATH_EDITOR_BUTTON_GROUPS');
    expect(staticClientSource).toContain('normalizeMathEditorValue');

    for (const generatedPath of [
      'docs/p3/topics/vectors/learn/index.html',
      'docs/p3/topics/trigonometry/learn/index.html',
      'docs/p3/topics/algebra/learn/index.html',
      'docs/p3/topics/algebra/skill-check/index.html',
      'docs/p3/diagnostic/index.html',
      'docs/p3/repair-lane/index.html',
    ]) {
      if (!existsSync(generatedPath)) continue;
      const html = readFileSync(generatedPath, 'utf8');
      expect(html, generatedPath).not.toContain(oldGenericInstruction);
      expect(html, generatedPath).toContain('math-answer-input');
      expect(html, generatedPath).toContain('data-math-answer-raw');
      expect(html, generatedPath).toContain('data-math-editor-mount');
      expect(html, generatedPath).toContain('aria-describedby');
    }

    if (existsSync('docs/p3/topics/vectors/learn/index.html')) {
      withStaticDocument('docs/p3/topics/vectors/learn/index.html', (document) => {
        const notationStep = document.querySelector('[data-learn-step-id="learn-vectors-2d-3d-notation"]');
        expect(notationStep).not.toBeNull();
        if (notationStep) {
          const guidance = notationStep.querySelector('.answer-format-guidance');
          expect(guidance?.textContent).toContain('Answer format: column-vector components as (a,b,c), with commas.');
          expect(notationStep.querySelector('.math-answer-input[data-answer-kind="coordinate-vector"]')).not.toBeNull();
          expect(notationStep.querySelector('[data-math-editor-mount]')).not.toBeNull();
          expect(notationStep.querySelector('input[name="submittedAnswer"][data-math-answer-raw]')?.getAttribute('placeholder')).toBe('(a,b,c)');
        }
      });
    }

    if (existsSync('docs/p3/topics/trigonometry/learn/index.html')) {
      withStaticDocument('docs/p3/topics/trigonometry/learn/index.html', (document) => {
        const multiValueInput = document.querySelector('.math-answer-input[data-answer-kind="multi-value"]');
        expect(multiValueInput).not.toBeNull();
        expect(multiValueInput?.querySelector('.answer-format-guidance')?.textContent).toContain('Answer format: separate values with commas, e.g. a, b.');
        expect(multiValueInput?.querySelector('[data-math-editor-mount]')).not.toBeNull();
        expect(multiValueInput?.querySelector('input[name="submittedAnswer"][data-math-answer-raw][placeholder="a, b"]')).not.toBeNull();
      });
    }

    if (existsSync('docs/p3/topics/algebra/learn/index.html')) {
      withStaticDocument('docs/p3/topics/algebra/learn/index.html', (document) => {
        const numericInput = document.querySelector('.math-answer-input[data-answer-kind="numeric"]');
        expect(numericInput).not.toBeNull();
        expect(numericInput?.querySelector('.answer-format-guidance')?.textContent).toContain('Answer format: number, fraction, radical, or pi form.');
        expect(numericInput?.querySelector('[data-math-editor-mount]')).not.toBeNull();
        expect(numericInput?.querySelector('input[name="submittedAnswer"][data-math-answer-raw][placeholder="3/2"]')).not.toBeNull();
      });
    }

    if (existsSync('docs/p3/topics/algebra/skill-check/index.html')) {
      withStaticDocument('docs/p3/topics/algebra/skill-check/index.html', (document) => {
        const twoValueForm = document.querySelector('[data-check-id="sc-alg-polynomial-division-core-001"]');
        expect(twoValueForm).not.toBeNull();
        if (twoValueForm) {
          const guidanceText = Array.from(twoValueForm.querySelectorAll('.answer-format-guidance'), (element) => element.textContent || '').join(' ');
          expect(guidanceText).toContain('Answer format: type a compact expression using ^ for powers.');
          expect(guidanceText).toContain('Answer format: number, fraction, radical, or pi form.');
          expect(twoValueForm.querySelectorAll('.math-answer-input')).toHaveLength(2);
          expect(twoValueForm.querySelectorAll('[data-math-editor-mount]')).toHaveLength(2);
          expect(twoValueForm.querySelector('input[aria-label="quotient"][data-math-answer-raw]')?.getAttribute('placeholder')).toBe('x^2-x-6');
          expect(twoValueForm.querySelector('input[aria-label="remainder"][data-math-answer-raw]')?.getAttribute('placeholder')).toBe('3/2');
          const quotientInput = twoValueForm.querySelector('input[aria-label="quotient"]');
          const describedBy = quotientInput?.getAttribute('aria-describedby');
          expect(describedBy).toBeTruthy();
          expect(describedBy ? twoValueForm.querySelector(`#${describedBy}`) : null).not.toBeNull();
        }
      });
    }

    if (existsSync('docs/p3/diagnostic/index.html')) {
      withStaticDocument('docs/p3/diagnostic/index.html', (document) => {
        const diagnosticInput = document.querySelector('[data-diagnostic-mark-point]');
        expect(diagnosticInput).not.toBeNull();
        expect(diagnosticInput?.getAttribute('data-answer-format')).toMatch(/^Answer format:/);
        expect(diagnosticInput?.getAttribute('placeholder')).toBeTruthy();
        expect(diagnosticInput?.hasAttribute('data-math-answer-raw')).toBe(true);
        expect(diagnosticInput?.closest('.math-answer-input')).not.toBeNull();
        expect(diagnosticInput?.closest('.math-answer-input')?.querySelector('[data-math-editor-mount]')).not.toBeNull();
      });
    }

    if (existsSync('docs/p3/repair-lane/index.html')) {
      withStaticDocument('docs/p3/repair-lane/index.html', (document) => {
        const repairInput = document.querySelector('[data-p1-repair-fast-question]');
        expect(repairInput).not.toBeNull();
        expect(repairInput?.getAttribute('data-answer-format')).toMatch(/^Answer format:/);
        expect(repairInput?.getAttribute('placeholder')).toBeTruthy();
        expect(repairInput?.hasAttribute('data-math-answer-raw')).toBe(true);
        expect(repairInput?.closest('.math-answer-input')).not.toBeNull();
        expect(repairInput?.closest('.math-answer-input')?.querySelector('[data-math-editor-mount]')).not.toBeNull();
      });
    }
  });

  it('renders ordered-card checks as numbered selection controls instead of math text fields', () => {
    const orderedChecks = [
      ['docs/p3/topics/algebra/skill-check/index.html', 'sc-alg-polynomial-division-foundation-001', 4],
      ['docs/p3/topics/logarithmic-and-exponential-functions/skill-check/index.html', 'sc-log-natural-challenge-001', 3],
      ['docs/p3/topics/logarithmic-and-exponential-functions/skill-check/index.html', 'sc-log-domain-challenge-001', 4],
      ['docs/p3/topics/logarithmic-and-exponential-functions/skill-check/index.html', 'sc-log-linearisation-foundation-001', 4],
      ['docs/p3/topics/logarithmic-and-exponential-functions/skill-check/index.html', 'sc-log-linearisation-challenge-001', 4],
    ] as const;

    for (const [generatedPath, checkId, positionCount] of orderedChecks) {
      if (!existsSync(generatedPath)) continue;
      withStaticDocument(generatedPath, (document) => {
        const form = document.querySelector(`[data-check-id="${checkId}"]`);
        expect(form, checkId).not.toBeNull();
        expect(form?.querySelector('.ordered-card-input'), checkId).not.toBeNull();
        expect(form?.querySelectorAll('.ordered-card-bank li'), checkId).toHaveLength(positionCount);
        expect(form?.querySelectorAll('select[name="submittedAnswer"]'), checkId).toHaveLength(positionCount);
        expect(form?.querySelector('.math-answer-input'), checkId).toBeNull();
      });
    }
  });

  it('keeps local agent-loop run artifacts out of git status noise', () => {
    const gitignore = readFileSync('.gitignore', 'utf8').split(/\r?\n/);

    expect(gitignore).toContain('.agent-runs/');
    expect(gitignore).toContain('agentic-loop-template/');
    expect(gitignore).toContain('reports/*.json');
    expect(gitignore).toContain('reports/screenshots/');
    expect(gitignore).not.toContain('.agent-loop/');
    expect(gitignore).not.toContain('reports/');
  });

  it('does not duplicate the same Field Guide visual inside a generated Learn step', () => {
    for (const topic of STUDY_TOPICS) {
      const generatedPath = `docs/p3/topics/${topic.slug}/learn/index.html`;
      if (!existsSync(generatedPath)) continue;

      withStaticDocument(generatedPath, (document) => {
        for (const step of Array.from(document.querySelectorAll('[data-learn-step-card]'))) {
          const visualTopicIds = Array.from(
            step.querySelectorAll('[data-field-guide-visual]'),
            (element) => element.getAttribute('data-field-guide-visual') ?? '',
          );
          const duplicateIds = visualTopicIds.filter((id, index) => visualTopicIds.indexOf(id) !== index);

          expect(duplicateIds, `${generatedPath} ${step.getAttribute('data-learn-step-id') ?? ''}`).toEqual([]);
        }
      });
    }
  });

  it('does not render generic supplemental visual appendices on generated Learn pages', () => {
    for (const topic of STUDY_TOPICS) {
      const generatedPath = `docs/p3/topics/${topic.slug}/learn/index.html`;
      if (!existsSync(generatedPath)) continue;
      const generatedSource = readFileSync(generatedPath, 'utf8');

      expect(generatedSource, generatedPath).not.toContain('Extra diagram for this unit');
      expect(generatedSource, generatedPath).not.toContain('supplemental-visual-section');
    }
  });

  it('renders Vectors Learn visuals only inside relevant step cards', () => {
    const generatedPath = 'docs/p3/topics/vectors/learn/index.html';
    if (!existsSync(generatedPath)) return;
    withStaticDocument(generatedPath, (document) => {
      const notationStep = document.querySelector('[data-learn-step-id="learn-vectors-2d-3d-notation"]');
      const lineIntersectionStep = document.querySelector('[data-learn-step-id="learn-vectors-line-intersection"]');
      const footStep = document.querySelector('[data-learn-step-id="learn-vectors-foot-of-perpendicular"]');

      expect(notationStep?.querySelector('[data-field-guide-visual="vectors_intersect_parallel_skew"]')).toBeNull();
      expect(notationStep?.querySelector('[data-field-guide-visual="vectors_point_to_line_distance"]')).toBeNull();
      expect(lineIntersectionStep?.querySelector('[data-field-guide-visual="vectors_intersect_parallel_skew"]')).not.toBeNull();
      expect(footStep?.querySelector('[data-field-guide-visual="vectors_point_to_line_distance"]')).not.toBeNull();
    });
  });

  it('renders key Learn visual teaching labels in generated HTML metadata', () => {
    const expectedLabelsByRoute = new Map<string, string[]>([
      ['p3/topics/complex-numbers/learn/index.html', ['|z|', 'arg z', '2π/n']],
      ['p3/topics/vectors/learn/index.html', ['PQ · d = 0']],
      ['p3/topics/integration/learn/index.html', ['F(b) - F(a)']],
    ]);

    for (const [pagePath, expectedLabels] of expectedLabelsByRoute) {
      const generatedPath = `docs/${pagePath}`;
      if (!existsSync(generatedPath)) continue;
      withStaticDocument(generatedPath, (document) => {
        const visualText = Array.from(document.querySelectorAll('[data-field-guide-visual]'))
          .map((element) => [
            element.getAttribute('data-visual-title') ?? '',
            element.getAttribute('data-instructional-labels') ?? '',
            visibleText(element),
          ].join(' '))
          .join(' ');

        for (const expectedLabel of expectedLabels) {
          expect(visualText, pagePath).toContain(expectedLabel);
        }
      });
    }
  });

  it('keeps student-facing primary learning areas below the cognitive-load guardrail unless explicitly classified', () => {
    const generatedStudentPages = REQUIRED_STATIC_STUDY_PAGE_PATHS
      .filter((pagePath) => pagePath.startsWith('p3/'));

    for (const pagePath of generatedStudentPages) {
      const generatedPath = `docs/${pagePath}`;
      if (!existsSync(generatedPath)) continue;

      withStaticDocument(generatedPath, (document) => {
        const overloadedPageType = KNOWN_OVERLOADED_STUDENT_PAGE_TYPES.find((pageType) => pageType.routePattern.test(pagePath));

        if (overloadedPageType) {
          const overloadedElements = document.querySelectorAll(overloadedPageType.selector);
          expect(
            overloadedElements.length,
            `${generatedPath} is classified as ${overloadedPageType.label}; keep it out of the primary learning flow or split it before promoting.`,
          ).toBeGreaterThan(MAX_PRIMARY_LEARNING_AREA_ELEMENTS);
          return;
        }

        expect(
          primaryLearningAreaCount(document),
          `${generatedPath} exposes too many primary learning areas; split the page or classify the overload intentionally.`,
        ).toBeLessThanOrEqual(MAX_PRIMARY_LEARNING_AREA_ELEMENTS);
      });
    }
  });

  it('keeps generated P3 headings and prominent route controls consistent', () => {
    const generatedPages = [
      'docs/index.html',
      'docs/p3/index.html',
      'docs/p3/topics/index.html',
      'docs/p3/need-to-know/index.html',
      'docs/p3/review/index.html',
      ...STUDY_TOPICS.flatMap((topic) => [
        `docs/p3/topics/${topic.slug}/learn/index.html`,
        `docs/p3/topics/${topic.slug}/field-guide/index.html`,
        `docs/p3/topics/${topic.slug}/skill-check/index.html`,
        `docs/p3/topics/${topic.slug}/exam-training/index.html`,
      ]),
    ];

    for (const generatedPath of generatedPages) {
      if (!existsSync(generatedPath)) continue;
      const pagePath = generatedPath.replace(/^docs\//, '');
      withStaticDocument(generatedPath, (document) => {
        const prominentLinks = Array.from(document.querySelectorAll([
          '.hero-actions a[href]',
          '.home-hero-actions a[href]',
          '.p3-dashboard-secondary-links a[href]',
          '.section-heading a.button[href]',
          '.path-unit-primary-action[href]',
          '.path-unit-progress a[href]',
          '.course-card[href]',
          '.next-step-card a[href]',
          '.learn-mode-hero-actions a[href]',
        ].join(',')));
        const routes = prominentLinks
          .map((link) => ({
            label: visibleText(link),
            route: normalizeRoute(pagePath, link.getAttribute('href') ?? ''),
          }))
          .filter((link) => link.route && !link.route.includes('#'));
        const duplicates = routes.filter((link, index) => routes.findIndex((candidate) => candidate.route === link.route) !== index);

        expect(duplicates, generatedPath).toEqual([]);
      });
    }

    if (existsSync('docs/p3/index.html')) {
      withStaticDocument('docs/p3/index.html', (document) => {
        expect(visibleText(document.querySelector('h1') as Element)).toBe('Pure Mathematics 3');
      });
    }

    for (const topic of STUDY_TOPICS) {
      const learnPath = `docs/p3/topics/${topic.slug}/learn/index.html`;
      const examPath = `docs/p3/topics/${topic.slug}/exam-training/index.html`;
      if (existsSync(learnPath)) {
        withStaticDocument(learnPath, (document) => {
          expect(visibleText(document.querySelector('h1') as Element)).toBe(`${topic.name} — Learn`);
        });
      }
      if (existsSync(examPath)) {
        withStaticDocument(examPath, (document) => {
          expect(visibleText(document.querySelector('h1') as Element)).toBe(`${topic.name} — Exam Training`);
        });
      }
    }
  });
});
