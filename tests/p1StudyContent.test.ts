import { describe, expect, it } from 'vitest';
import { P1_SKILL_CONTRACT, P1_STUDY_TOPICS } from '../src/data/p1CourseContract';
import {
  getCourseTopicStudyContent,
  getP1TopicStudyContentBySlug,
  P1_SKILL_STUDY_CONTENT,
  P1_TOPIC_STUDY_CONTENT,
} from '../src/data/p1StudyContent';

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

describe('P1 authored study content', () => {
  it('provides finite Learn and primary/retry Checked Practice data for all eight topics', () => {
    expect(P1_TOPIC_STUDY_CONTENT).toHaveLength(8);
    expect(P1_TOPIC_STUDY_CONTENT.map((topic) => topic.topicSlug)).toEqual(P1_STUDY_TOPICS.map((topic) => topic.slug));

    for (const topic of P1_TOPIC_STUDY_CONTENT) {
      expect(topic.learn.length).toBeGreaterThan(0);
      expect(topic.checkedPractice.length).toBeGreaterThan(0);
      expect(topic.learn).toHaveLength(topic.skillIds.length);
      expect(topic.checkedPractice).toHaveLength(topic.skillIds.length);
      expect(topic.checkedPracticeRetries).toHaveLength(topic.skillIds.length);
    }
  });

  it('covers every contract skill once in Learn and with exactly one primary and one retry', () => {
    const contractSkillIds = P1_SKILL_CONTRACT.map((skill) => skill.id);
    const contentSkillIds = P1_SKILL_STUDY_CONTENT.map((content) => content.skillId);

    expect(new Set(contentSkillIds)).toEqual(new Set(contractSkillIds));
    expect(new Set(contentSkillIds).size).toBe(contentSkillIds.length);

    const topicSkillIds = P1_TOPIC_STUDY_CONTENT.flatMap((topic) => topic.skillIds);
    expect(topicSkillIds).toEqual(contractSkillIds);

    const primaryItems = P1_TOPIC_STUDY_CONTENT.flatMap((topic) => topic.checkedPractice);
    const retryItems = P1_TOPIC_STUDY_CONTENT.flatMap((topic) => topic.checkedPracticeRetries).filter(Boolean);
    expect(primaryItems).toHaveLength(contractSkillIds.length);
    expect(retryItems).toHaveLength(P1_SKILL_CONTRACT.filter((skill) => skill.evidenceEligibility === 'strong-checked-practice').length);
  });

  it('keeps every primary and retry deterministic, reviewed and distinct', () => {
    const itemIds = P1_SKILL_STUDY_CONTENT.flatMap((content) => [
      content.checkedPractice.itemId,
      content.checkedPracticeRetry?.itemId,
    ]).filter((itemId): itemId is string => Boolean(itemId));
    expect(new Set(itemIds).size).toBe(itemIds.length);

    const retryVariantIds = P1_SKILL_STUDY_CONTENT
      .map((content) => content.checkedPracticeRetry?.retryVariantId)
      .filter((variantId): variantId is string => Boolean(variantId));
    expect(new Set(retryVariantIds).size).toBe(retryVariantIds.length);

    for (const content of P1_SKILL_STUDY_CONTENT) {
      expect(content.learn.learningGoal.trim()).not.toBe('');
      expect(content.learn.teachingPoints.length).toBeGreaterThanOrEqual(2);
      expect(content.learn.workedExample.steps.length).toBeGreaterThanOrEqual(2);
      const contractSkill = P1_SKILL_CONTRACT.find((skill) => skill.id === content.skillId)!;
      if (contractSkill.evidenceEligibility === 'manual-practice-only') {
        expect(content.checkedPracticeRetry).toBeUndefined();
      } else {
        expect(content.checkedPracticeRetry?.prompt).not.toBe(content.checkedPractice.prompt);
        expect(content.checkedPracticeRetry?.retryVariantId).toBe(`${content.skillId}:retry-1`);
      }

      for (const item of [content.checkedPractice, content.checkedPracticeRetry].filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))) {
        expect(item.hint.trim()).not.toBe('');
        expect(item.workedSolution.length).toBeGreaterThanOrEqual(2);
        expect(item.reviewStatus).toBe('reviewed');

        if (contractSkill.evidenceEligibility === 'manual-practice-only') {
          expect(item.answerType).toBe('manual-self-marked');
          expect(item.expectedOptionId).toBeNull();
          expect(item.options).toEqual([]);
          expect(item.progressionEligible).toBe(false);
        } else {
          expect(item.answerType).toBe('single-choice');
          expect(item.expectedOptionId).toMatch(/^option-[abc]$/);
          expect(item.options.map((option) => option.id)).toEqual(['option-a', 'option-b', 'option-c']);
          expect(item.progressionEligible).toBe(true);
        }
      }
    }
  });

  it('uses opaque option ids and distributes correct choices across authored positions', () => {
    const automaticItems = P1_SKILL_STUDY_CONTENT.flatMap((content) => [
      content.checkedPractice,
      content.checkedPracticeRetry,
    ]).filter((item): item is NonNullable<typeof item> => Boolean(item) && item.answerType === 'single-choice');
    const expectedPositions = automaticItems.map((item) => item.expectedOptionId);

    expect(allStrings(automaticItems)).not.toContain('correct');
    expect(new Set(expectedPositions)).toEqual(new Set(['option-a', 'option-b', 'option-c']));
    for (const optionId of ['option-a', 'option-b', 'option-c']) {
      expect(expectedPositions.filter((expected) => expected === optionId).length).toBeGreaterThan(20);
    }
  });

  it('preserves TeX backslashes without embedded control characters', () => {
    for (const value of allStrings(P1_SKILL_STUDY_CONTENT)) {
      expect(value).not.toMatch(/[\u0000-\u001f]/);
    }

    const trig = getP1TopicStudyContentBySlug('trigonometry');
    expect(trig?.learn.some((learn) => learn.workedExample.prompt.includes('\\sin'))).toBe(true);
    expect(trig?.learn.some((learn) => learn.workedExample.prompt.includes('\\cos'))).toBe(true);
  });

  it('exposes safe course-keyed and slug-keyed getters', () => {
    expect(getCourseTopicStudyContent('p1')).toBe(P1_TOPIC_STUDY_CONTENT);
    expect(getCourseTopicStudyContent('p3')).toEqual([]);
    expect(getP1TopicStudyContentBySlug('quadratics')?.topicId).toBe('p1-quadratics');
    expect(getP1TopicStudyContentBySlug('not-a-topic')).toBeUndefined();
  });
});
