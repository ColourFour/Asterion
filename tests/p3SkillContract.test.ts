import { describe, expect, it } from 'vitest';
import {
  P3_OFFICIAL_TOPICS,
  P3_SKILL_CONTRACT,
  P3_SKILL_IDS,
  P3_SKILL_READINESS_STATUSES,
} from '../src/data/p3SkillContract';

const expectedTopicCounts = {
  Algebra: 7,
  'Logarithmic and Exponential Functions': 6,
  Trigonometry: 5,
  Differentiation: 5,
  Integration: 4,
  'Numerical Solution of Equations': 3,
  Vectors: 3,
  'Differential Equations': 3,
  'Complex Numbers': 4,
} as const;

describe('P3 skill contract source data', () => {
  it('uses stable unique P3 skill ids', () => {
    const ids = P3_SKILL_CONTRACT.map((skill) => skill.id);

    expect(ids).toEqual(P3_SKILL_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^p3_[a-z0-9]+(?:_[a-z0-9]+)*$/);
    }
  });

  it('maps every skill to exactly one official P3 topic', () => {
    const officialTopics = new Set<string>(P3_OFFICIAL_TOPICS);
    const counts = Object.fromEntries(P3_OFFICIAL_TOPICS.map((topic) => [topic, 0]));

    for (const skill of P3_SKILL_CONTRACT) {
      expect(officialTopics.has(skill.officialTopic)).toBe(true);
      counts[skill.officialTopic] += 1;
    }

    expect(counts).toEqual(expectedTopicCounts);
  });

  it('keeps each skill readable and machine-checkable', () => {
    const readinessStatuses = new Set<string>(P3_SKILL_READINESS_STATUSES);
    const skillIds = new Set<string>(P3_SKILL_IDS);

    for (const skill of P3_SKILL_CONTRACT) {
      expect(skill.title.trim().length).toBeGreaterThan(0);
      expect(skill.needToKnow.length).toBeGreaterThan(0);
      expect(Array.isArray(skill.examTriggers)).toBe(true);
      expect(readinessStatuses.has(skill.readiness)).toBe(true);
      expect(Array.isArray(skill.prerequisiteSkills)).toBe(true);

      for (const prerequisiteSkill of skill.prerequisiteSkills) {
        expect(skillIds.has(prerequisiteSkill)).toBe(true);
      }
    }
  });

  it('does not promote any non-P3 course through the contract', () => {
    expect(new Set(P3_SKILL_CONTRACT.map((skill) => skill.course))).toEqual(new Set(['p3']));
  });
});
