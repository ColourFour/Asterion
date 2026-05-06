import { describe, expect, it } from 'vitest';
import type { RegionProgress, StoredProgress } from '../types';
import { buildExportJson } from '../lib/exportAttempts';

describe('buildExportJson', () => {
  it('includes region progress evidence when provided', () => {
    const progress: StoredProgress = {
      avatar: { palette: 'ember', crest: 'star' },
      attempts: [],
      topicProfiles: {},
      issueReports: [],
      settings: { activePaperFamily: 'p3' },
    };
    const regionProgress = [{
      region: { id: 'algebra-forge', name: 'Algebra Forge', description: '', subtopics: [], activeByDefault: true, matchTerms: [] },
      availableQuestions: 10,
      attempts: 3,
      totalMarksEarned: 18,
      totalMarksAvailable: 30,
      subtopicsTouched: 1,
      rank: 'Bronze',
      isActive: true,
    }] satisfies RegionProgress[];

    const exported = buildExportJson(progress, undefined, regionProgress);

    expect(exported.regionProgress?.[0].region.name).toBe('Algebra Forge');
    expect(exported.regionProgress?.[0].rank).toBe('Bronze');
  });
});
