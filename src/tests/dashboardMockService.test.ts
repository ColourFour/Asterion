import { describe, expect, it } from 'vitest';
import {
  generateTeacherCsvExport,
  getClassRegionSignals,
  getStudentEvidence,
  getStudentSummaries,
  getTeacherClassDashboard,
  groupStudentsByNextStep,
  listAdminAuditEvents,
  listAdminClasses,
  listAdminTeachers,
  listTeacherClasses,
} from '../lib/dashboardMockService';
import { isValidP3RegionId } from '../lib/p3SkillContract';

describe('dashboard mock service', () => {
  it('returns teacher classes and a class dashboard through the service boundary', async () => {
    const classes = await listTeacherClasses();
    expect(classes.length).toBeGreaterThan(0);
    expect(classes[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      teacherId: expect.any(String),
      joinCode: expect.any(String),
      createdAt: expect.any(String),
    });

    const dashboard = await getTeacherClassDashboard(classes[0].id);
    expect(dashboard.class.id).toBe(classes[0].id);
    expect(dashboard.progressSummary.studentCount).toBeGreaterThan(0);
    expect(dashboard.regionSummaries.length).toBeGreaterThan(0);
    expect(dashboard.studentRows.length).toBeGreaterThan(0);
    expect(dashboard.focusThisWeek.length).toBe(3);
    expect(dashboard.weeklySummary.className).toBe(dashboard.class.name);
    expect(dashboard.exportRows.length).toBe(dashboard.studentRows.length);
    expect(dashboard.actionCards[0].evidenceRefs[0]).toMatchObject({
      questionId: expect.any(String),
      regionId: expect.any(String),
      activityType: expect.any(String),
      action: expect.any(String),
      outcome: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it('groups student summaries by recommended next step without percentages', async () => {
    const dashboard = await getTeacherClassDashboard('class-p3-alpha');
    const grouped = groupStudentsByNextStep(dashboard.studentSummaries);

    expect(grouped.needs_field_guide.length).toBeGreaterThan(0);
    expect(dashboard.studentSummaries.length).toBe(dashboard.studentRows.length);
    expect(dashboard.studentRows.find((student) => student.displayName === 'Nora P.')?.guardianEligibleRegionCount).toBeGreaterThan(0);
    expect(grouped.needs_teacher_review.length).toBeGreaterThan(0);
  });

  it('returns student evidence and admin support data', async () => {
    await expect(getStudentEvidence('student-ada')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ activityType: 'warm_up', regionId: 'algebra-forge' }),
    ]));
    await expect(listAdminTeachers()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'teacher-hypatia' }),
    ]));
    await expect(listAdminClasses()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ joinCode: 'AST-P3A' }),
    ]));
    await expect(listAdminAuditEvents()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ actorRole: 'admin' }),
    ]));
  });

  it('keeps mock dashboard region IDs aligned with canonical P3 region IDs', async () => {
    const classes = await listTeacherClasses();
    for (const teacherClass of classes) {
      const dashboard = await getTeacherClassDashboard(teacherClass.id);
      const signals = await getClassRegionSignals(teacherClass.id);
      const summaries = await getStudentSummaries(teacherClass.id);

      for (const signal of signals) {
        expect(isValidP3RegionId(signal.regionId), signal.regionId).toBe(true);
      }

      for (const region of dashboard.regionSummaries) {
        expect(isValidP3RegionId(region.regionId), region.regionId).toBe(true);
      }

      for (const row of dashboard.studentRows) {
        expect(isValidP3RegionId(row.currentFocusRegionId), row.currentFocusRegionId).toBe(true);
        for (const cell of row.regionCells) {
          expect(isValidP3RegionId(cell.regionId), cell.regionId).toBe(true);
        }
      }

      for (const student of summaries) {
        expect(isValidP3RegionId(student.currentRegionId), student.currentRegionId).toBe(true);
        for (const evidence of await getStudentEvidence(student.id)) {
          expect(isValidP3RegionId(evidence.regionId), evidence.regionId).toBe(true);
        }
      }

      for (const card of dashboard.actionCards) {
        if (card.regionId) expect(isValidP3RegionId(card.regionId), card.regionId).toBe(true);
        for (const evidence of card.evidenceRefs) {
          expect(isValidP3RegionId(evidence.regionId), evidence.regionId).toBe(true);
        }
      }
    }
  });

  it('builds the weekly summary and Excel-compatible export rows', async () => {
    const dashboard = await getTeacherClassDashboard('class-p3-alpha');

    expect(dashboard.studentRows.length).toBeGreaterThanOrEqual(12);
    expect(dashboard.weeklySummary.topFocusRegions.length).toBeGreaterThan(0);
    expect(dashboard.weeklySummary.studentsNeedingAttention.length).toBeGreaterThan(0);
    expect(dashboard.weeklySummary.suggestedTeacherActions.length).toBe(3);
    expect(dashboard.exportRows[0]).toMatchObject({
      className: 'P3 Alpha',
      studentName: expect.any(String),
      overallProgressPercent: expect.any(Number),
      currentFocusRegion: expect.any(String),
      attemptsCount: expect.any(Number),
      notesWarnings: expect.any(String),
    });

    const csv = generateTeacherCsvExport(dashboard.exportRows);
    expect(csv).toContain('"className"');
    expect(csv).toContain('"Algebra Vault progress"');
    expect(csv).toContain('"P3 Alpha"');
  });
});
