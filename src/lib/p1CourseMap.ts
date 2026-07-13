import { P1_SKILL_CONTRACT, P1_STUDY_TOPICS } from '../data/p1CourseContract';
import type { WorldDefinition } from '../types';

export const P1_TOPIC_ID_TO_REGION_ID = Object.fromEntries(P1_STUDY_TOPICS.map((topic) => [
  `9709_p1_topic_${topic.slug.replace(/-/g, '_')}`,
  topic.slug,
])) as Record<string, string>;

export const P1_COURSE_MAP: WorldDefinition = {
  id: 'p1-course-map',
  name: 'Pure Mathematics 1',
  paperFamily: 'p1',
  regions: P1_STUDY_TOPICS.map((topic) => {
    const skills = P1_SKILL_CONTRACT.filter((skill) => skill.topicId === topic.id);
    const topicId = `9709_p1_topic_${topic.slug.replace(/-/g, '_')}`;
    return {
      id: topic.slug,
      name: topic.title,
      description: topic.description,
      activeByDefault: topic.order <= 2,
      topicIds: [topicId],
      subtopics: skills.map((skill) => skill.title),
      matchTerms: Array.from(new Set([
        topic.title,
        topic.slug,
        topicId,
        ...skills.flatMap((skill) => [skill.title, ...skill.examTriggers]),
      ])),
    };
  }),
};
