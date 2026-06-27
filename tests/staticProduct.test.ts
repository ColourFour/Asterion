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
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/content-qa/index.html');
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
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('p3/exam-training/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('regions/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('topics/algebra/index.html');
  });

  it('uses the root page as the course selector and keeps P3 as the direct learning path', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const generatedHomePath = 'docs/index.html';
    const generatedP3Path = 'docs/p3/index.html';
    const generatedP3TopicsPath = 'docs/p3/topics/index.html';

    expect(generatorSource).toContain('CAIE 9709 Paper 3');
    expect(generatorSource).toContain('path-unit-grid');
    expect(generatorSource).toContain('Start Unit 1: Algebra');
    expect(generatorSource).toContain("htmlByPath.set('index.html', renderCourseSelectorPage())");
    expect(generatorSource).toContain('renderP3DashboardPage(data, course)');
    expect(generatorSource).toContain('data-p3-exam-review-gate');
    expect(generatorSource).toContain('data-flow-final-href');
    expect(generatorSource).toContain('Check Answer');
    expect(generatorSource).toContain('homepage-course-panel');

    if (existsSync(generatedHomePath)) {
      const generatedHome = readFileSync(generatedHomePath, 'utf8');
      expect(generatedHome).toContain('Choose the course before the study path.');
      expect(generatedHome).toContain('homepage-course-panel');
      expect(generatedHome).toContain('Start P3');
      expect(generatedHome).toContain('Available later');
      expect(generatedHome.match(/class="course-card/g)?.length).toBeGreaterThanOrEqual(4);
      expect(generatedHome).not.toContain('Start P3 with Algebra.');
      expect(generatedHome).not.toContain('path-unit-grid');
    }

    if (existsSync(generatedP3Path)) {
      const generatedP3 = readFileSync(generatedP3Path, 'utf8');
      expect(generatedP3).toContain('Pure Mathematics 3');
      expect(generatedP3).toContain('Unsure? Take diagnostic');
      expect(generatedP3).toContain('Start Unit 1: Algebra');
      expect(generatedP3).toContain('All topic routes');
      expect(generatedP3).toContain('data-p3-next-step-panel');
      expect(generatedP3).toContain('path-unit-grid');
      expect(generatedP3).toContain('data-progress-field-guide');
      expect(generatedP3).toContain('data-progress-skill');
      expect(generatedP3).toContain('data-progress-exam');
      expect(generatedP3).toContain('Review Mistakes');
      expect(generatedP3.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
      expect(generatedP3.match(/data-path-unit-primary-action/g)?.length).toBe(9);
      expect(generatedP3.match(/class="path-unit-direct-routes"/g)?.length).toBe(9);
      expect(generatedP3).not.toContain('course-topic-button-grid');
    }

    if (existsSync(generatedP3TopicsPath)) {
      const generatedP3Topics = readFileSync(generatedP3TopicsPath, 'utf8');
      expect(generatedP3Topics).toContain('CAIE 9709 Paper 3');
      expect(generatedP3Topics).toContain('P3 Topic Overview');
      expect(generatedP3Topics).toContain('path-unit-grid');
      expect(generatedP3Topics.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
      expect(generatedP3Topics.match(/data-path-unit-primary-action/g)?.length).toBe(9);
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
      expect(generatedReview).toContain('Review Mistakes');
      expect(generatedReview).toContain('data-p3-exam-review-gate');
      expect(generatedReview).toContain('Mixed Paper 3 questions');
      expect(generatedReview).toContain('Locked until the path is complete');
      expect(generatedReview).toContain('data-review-skill-routes');
      expect(generatedReview).toContain('p3_alg_partial_fraction_form');
      expect(generatedReview).toContain('../topics/algebra/learn/#practice-algebra_partial_fractions');
    }
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

    expect(generatorSource).toContain('Export local progress CSV');
    expect(staticClientSource).toContain('data-export-local-progress');
    expect(generatorSource).toContain('Print / Save PDF');

    const algebraWorksheetPath = 'docs/p3/topics/algebra/worksheet/index.html';
    if (existsSync(algebraWorksheetPath)) {
      const worksheetSource = readFileSync(algebraWorksheetPath, 'utf8');
      expect(worksheetSource).toContain('Algebra Checked Practice Worksheet');
      expect(worksheetSource).toContain('Student name:');
      expect(worksheetSource).toContain('Print / Save PDF');
    }

    expect(generatorSource).toContain('Check Answer');
    expect(generatorSource).toContain('Hint');
    expect(generatorSource).toContain('Review Mistakes');
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

  it('does not duplicate the same Field Guide visual on a generated Learn page', () => {
    for (const topic of STUDY_TOPICS) {
      const generatedPath = `docs/p3/topics/${topic.slug}/learn/index.html`;
      if (!existsSync(generatedPath)) continue;
      const generatedSource = readFileSync(generatedPath, 'utf8');
      const visualTopicIds = Array.from(
        generatedSource.matchAll(/data-field-guide-visual="([^"]+)"/g),
        (match) => match[1],
      );
      const duplicateIds = visualTopicIds.filter((id, index) => visualTopicIds.indexOf(id) !== index);

      expect(duplicateIds, generatedPath).toEqual([]);
    }
  });

  it('keeps student-facing primary learning areas below the cognitive-load guardrail unless explicitly classified', () => {
    const generatedStudentPages = REQUIRED_STATIC_STUDY_PAGE_PATHS
      .filter((pagePath) => pagePath.startsWith('p3/'))
      .filter((pagePath) => pagePath !== 'p3/content-qa/index.html');

    for (const pagePath of generatedStudentPages) {
      const generatedPath = `docs/${pagePath}`;
      if (!existsSync(generatedPath)) continue;

      const document = new JSDOM(readFileSync(generatedPath, 'utf8')).window.document;
      const overloadedPageType = KNOWN_OVERLOADED_STUDENT_PAGE_TYPES.find((pageType) => pageType.routePattern.test(pagePath));

      if (overloadedPageType) {
        const overloadedElements = document.querySelectorAll(overloadedPageType.selector);
        expect(
          overloadedElements.length,
          `${generatedPath} is classified as ${overloadedPageType.label}; keep it out of the primary learning flow or split it before promoting.`,
        ).toBeGreaterThan(MAX_PRIMARY_LEARNING_AREA_ELEMENTS);
        continue;
      }

      expect(
        primaryLearningAreaCount(document),
        `${generatedPath} exposes too many primary learning areas; split the page or classify the overload intentionally.`,
      ).toBeLessThanOrEqual(MAX_PRIMARY_LEARNING_AREA_ELEMENTS);
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
      const document = new JSDOM(readFileSync(generatedPath, 'utf8')).window.document;
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
    }

    if (existsSync('docs/p3/index.html')) {
      const document = new JSDOM(readFileSync('docs/p3/index.html', 'utf8')).window.document;
      expect(visibleText(document.querySelector('h1') as Element)).toBe('Pure Mathematics 3');
    }

    for (const topic of STUDY_TOPICS) {
      const learnPath = `docs/p3/topics/${topic.slug}/learn/index.html`;
      const examPath = `docs/p3/topics/${topic.slug}/exam-training/index.html`;
      if (existsSync(learnPath)) {
        const document = new JSDOM(readFileSync(learnPath, 'utf8')).window.document;
        expect(visibleText(document.querySelector('h1') as Element)).toBe(`${topic.name} — Learn`);
      }
      if (existsSync(examPath)) {
        const document = new JSDOM(readFileSync(examPath, 'utf8')).window.document;
        expect(visibleText(document.querySelector('h1') as Element)).toBe(`${topic.name} — Exam Training`);
      }
    }
  });
});
