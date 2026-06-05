import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS } from '../lib/staticStudyRoutes';
import { STUDY_TOPICS } from '../lib/topicStudy';
import { COURSES, P3_COURSE_ID } from '../data/courses';
import { getSeedTopicsForCourse } from '../data/courseSeedContent';

describe('static study routes', () => {
  it('declares the required real HTML pages', () => {
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toEqual(expect.arrayContaining([
      'index.html',
      'p1/index.html',
      'p3/index.html',
      'm1/index.html',
      's1/index.html',
      'p1/topics/index.html',
      'p1/topics/quadratics/index.html',
      'p1/topics/quadratics/field-guide/index.html',
      'p1/topics/quadratics/skill-check/index.html',
      'p1/topics/quadratics/practice/index.html',
      'p1/topics/quadratics/exam-training/index.html',
      'p1/exam-training/index.html',
      'm1/topics/index.html',
      'm1/topics/velocity-and-constant-acceleration/index.html',
      'm1/topics/velocity-and-constant-acceleration/field-guide/index.html',
      'm1/topics/velocity-and-constant-acceleration/skill-check/index.html',
      'm1/topics/velocity-and-constant-acceleration/practice/index.html',
      'm1/topics/velocity-and-constant-acceleration/exam-training/index.html',
      'm1/exam-training/index.html',
      's1/topics/index.html',
      's1/topics/data-representation/index.html',
      's1/topics/data-representation/field-guide/index.html',
      's1/topics/data-representation/skill-check/index.html',
      's1/topics/data-representation/practice/index.html',
      's1/topics/data-representation/exam-training/index.html',
      's1/exam-training/index.html',
      'p3/topics/index.html',
      'p3/topics/algebra/index.html',
      'p3/topics/algebra/field-guide/index.html',
      'p3/topics/algebra/skill-check/index.html',
      'p3/topics/algebra/practice/index.html',
      'p3/topics/algebra/exam-training/index.html',
      'regions/index.html',
      'topics/algebra/index.html',
      'topics/algebra/field-guide/index.html',
      'topics/algebra/skill-check/index.html',
      'topics/algebra/practice/index.html',
      'topics/algebra/exam-training/index.html',
      'topics/logarithms/index.html',
      'topics/trigonometry/index.html',
      'topics/argand/index.html',
      'topics/calculus/index.html',
      'topics/integration/index.html',
      'topics/vectors/index.html',
      'topics/iteration/index.html',
      'topics/differential-equations/index.html',
      'exam-training/index.html',
      'p3/exam-training/index.html',
    ]));
  });

  it('declares a dashboard route for every course shell', () => {
    for (const course of COURSES) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/index.html`);
    }
  });

  it('declares topic, Field Guide, Skill Check, Practice compatibility, and exam-training routes for seeded courses', () => {
    for (const course of COURSES.filter((course) => course.id !== P3_COURSE_ID)) {
      const topics = getSeedTopicsForCourse(course.id);
      expect(topics.length).toBeGreaterThan(0);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/exam-training/index.html`);
      for (const topic of topics) {
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/field-guide/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/skill-check/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/practice/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/exam-training/index.html`);
      }
    }
  });

  it('renders seeded practice pages with student-facing skill-check copy', () => {
    const staticBuilderSource = readFileSync('scripts/build-static-site.ts', 'utf8');

    expect(staticBuilderSource).toContain('Start Skill Checks');
    expect(staticBuilderSource).toContain('Try these quick checks after the Field Guide');
    expect(staticBuilderSource).toContain("[/support-only/gi, 'practice']");
    expect(staticBuilderSource).not.toContain('Student trial warning');
  });

  it('maps P1 Field Guide subtopics to exact Skill Check anchors with a graceful fallback', () => {
    const staticBuilderSource = readFileSync('scripts/build-static-site.ts', 'utf8');
    const staticStudyScript = readFileSync('src/static-study/static-study.js', 'utf8');

    expect(staticBuilderSource).toContain("getP1SkillCheckGroup(section.id) ? section.id : undefined");
    expect(staticBuilderSource).toContain("label = 'Try 3 quick questions'");
    expect(staticBuilderSource).toContain('p1SkillCheckGroupIdForSection(course, section)');
    expect(staticBuilderSource).not.toContain('renderSkillCheckTransition(fromPagePath, practicePath, section.id)');
    expect(staticStudyScript).toContain("'Try 3 quick questions'");
  });

  it('declares P3-prefixed hub, Field Guide, Skill Check, Practice compatibility, and Exam Training pages for every topic', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/skill-check/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/practice/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`);
    }
  });

  it('keeps legacy unprefixed P3 paths as compatibility pages', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/skill-check/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/practice/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/exam-training/index.html`);
    }
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('regions/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('exam-training/index.html');
  });
});
