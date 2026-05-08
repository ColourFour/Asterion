import { describe, expect, it } from 'vitest';
import type { RegionProgress, StoredProgress } from '../types';
import { buildAttemptsCsv, buildExportJson } from '../lib/exportAttempts';

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
      region: { id: 'algebra-forge', name: 'Algebra Vault', description: '', subtopics: [], activeByDefault: true, matchTerms: [] },
      availableQuestions: 10,
      attempts: 3,
      totalMarksEarned: 18,
      totalMarksAvailable: 30,
      subtopicsTouched: 1,
      rank: 'Bronze',
      isActive: true,
    }] satisfies RegionProgress[];

    const exported = buildExportJson(progress, undefined, regionProgress);

    expect(exported.regionProgress?.[0].region.name).toBe('Algebra Vault');
    expect(exported.regionProgress?.[0].rank).toBe('Bronze');
  });

  it('exports M, B, and A mark breakdown columns for attempts', () => {
    const progress: StoredProgress = {
      avatar: { palette: 'ember', crest: 'star' },
      attempts: [{
        id: 'attempt-1',
        profileId: 'profile-1',
        questionId: 'q1',
        paperFamily: 'p3',
        topicDisplayName: 'Algebra',
        marksEarned: 3,
        markBreakdown: { m: 1, b: 1, a: 1 },
        marksAvailable: 4,
        scoreRatio: 0.75,
        mistakeType: 'algebra_error',
        timeSpentSeconds: 120,
        markSchemeRevealed: true,
        attemptedAt: '2026-05-08T00:00:00.000Z',
      }],
      topicProfiles: {},
      issueReports: [],
      settings: { activePaperFamily: 'p3' },
    };

    const csv = buildAttemptsCsv(progress);

    expect(csv.split('\n')[0]).toContain('"M marks","B marks","A marks"');
    expect(csv.split('\n')[1]).toContain('"3","1","1","1","4"');
  });
});
