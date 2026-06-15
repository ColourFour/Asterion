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

  it('uses the root page as a direct P3 learning path, not a homepage/course selector', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const generatedHomePath = 'docs/index.html';

    expect(generatorSource).toContain('Learn P3 in order.');
    expect(generatorSource).toContain('After P1');
    expect(generatorSource).toContain('renderP3LearningPathPage(data)');
    expect(generatorSource).toContain('data-p3-exam-review-gate');
    expect(generatorSource).toContain('data-flow-final-href');
    expect(generatorSource).toContain('Pass the visible machine-checkable item to continue');

    if (existsSync(generatedHomePath)) {
      const generatedHome = readFileSync(generatedHomePath, 'utf8');
      expect(generatedHome).toContain('Learn P3 in order.');
      expect(generatedHome).toContain('P3 unit sequence');
      expect(generatedHome).toContain('Mixed Exam Review');
      expect(generatedHome).not.toContain('CAIE 9709 practice that starts with the');
      expect(generatedHome).not.toContain('Choose the trusted path');
      expect(generatedHome).not.toContain('Support only courses');
      expect(generatedHome).not.toContain('homepage-hero');
    }
  });

  it('gates final exam review on local unit completion requirements', () => {
    const generatorSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(generatorSource).toContain('p3ExamReviewRequirements');
    expect(generatorSource).toContain('data-required-topics');
    expect(staticClientSource).toContain('updateExamReviewGate');
    expect(staticClientSource).toContain('All P3 units are complete in this browser. Mixed exam review is open.');
    expect(staticClientSource).toContain('Pass to continue');

    const generatedReviewPath = 'docs/p3/review/index.html';
    if (existsSync(generatedReviewPath)) {
      const generatedReview = readFileSync(generatedReviewPath, 'utf8');
      expect(generatedReview).toContain('P3 Exam Review');
      expect(generatedReview).toContain('data-p3-exam-review-gate');
      expect(generatedReview).toContain('Mixed Paper 3 questions');
      expect(generatedReview).toContain('Locked until the path is complete');
    }
  });

  it('does not expose legacy self-reported Skill Check completion controls', () => {
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
      expect(worksheetSource).toContain('Algebra Skill Check Worksheet');
      expect(worksheetSource).toContain('Student name:');
      expect(worksheetSource).toContain('Print / Save PDF');
    }

    expect(generatorSource).toContain('Start Skill Check');
    expect(generatorSource).toContain('Go to Skill Check');
    expect(generatorSource).toContain('Open Exam Review');
  });
});
