import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
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

describe('static P3 product contract', () => {
  it('makes P3 the only ready course path', () => {
    expect(COURSES.map((course) => course.id)).toEqual(['p1', 'p3', 'm1', 's1']);
    expect(COURSES.map(coursePath)).toEqual(['/p1', '/p3', '/m1', '/s1']);

    expect(getCourseBySlug(P3_COURSE_ID)?.status).toBe('ready');
    expect(getCourseBySlug(P3_COURSE_ID)?.statusLabel).toBe('Ready');

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
    expect(generatorSource).toContain('Start Learn');
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
      expect(generatedP3).toContain('P3: Pure Mathematics 3');
      expect(generatedP3).toContain('Take the diagnostic');
      expect(generatedP3).toContain('Start Unit 1: Algebra');
      expect(generatedP3).toContain('Open full unit path');
      expect(generatedP3).toContain('path-unit-grid');
      expect(generatedP3).toContain('data-progress-field-guide');
      expect(generatedP3).toContain('data-progress-skill');
      expect(generatedP3).toContain('data-progress-exam');
      expect(generatedP3).toContain('Check review status');
      expect(generatedP3.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
      expect(generatedP3).not.toContain('course-topic-button-grid');
    }

    if (existsSync(generatedP3TopicsPath)) {
      const generatedP3Topics = readFileSync(generatedP3TopicsPath, 'utf8');
      expect(generatedP3Topics).toContain('CAIE 9709 Paper 3');
      expect(generatedP3Topics).toContain('Start P3 with Algebra.');
      expect(generatedP3Topics).toContain('path-unit-grid');
      expect(generatedP3Topics.match(/class="path-unit-card path-unit-tile"/g)?.length).toBe(9);
    }
  });

  it('gates final exam review on local unit completion requirements', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain('p3ExamReviewRequirements');
    expect(generatorSource).toContain('data-required-topics');
    expect(staticClientSource).toContain('updateExamReviewGate');
    expect(staticClientSource).toContain('All P3 units are complete in this browser. Mixed exam review is open.');
    expect(staticClientSource).toContain('Finish lesson sequence');

    const generatedReviewPath = 'docs/p3/review/index.html';
    if (existsSync(generatedReviewPath)) {
      const generatedReview = readFileSync(generatedReviewPath, 'utf8');
      expect(generatedReview).toContain('P3 Exam Review');
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

    expect(generatorSource).toContain('Start Learn');
    expect(generatorSource).toContain('Continue to Learn');
    expect(generatorSource).toContain('Check review status');
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
});
