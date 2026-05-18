import { describe, expect, it } from 'vitest';
import {
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
    expect(dashboard.actionCards.length).toBeGreaterThan(0);
    expect(dashboard.regionSignals.length).toBeGreaterThan(0);
    expect(dashboard.studentSummaries.length).toBeGreaterThan(0);
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

    expect(grouped.needs_field_guide.map((student) => student.displayName)).toContain('Jun W.');
    expect(grouped.needs_warm_up.length).toBe(2);
    expect(grouped.ready_for_exam_training.map((student) => student.displayName)).toContain('Nora P.');
    expect(grouped.needs_teacher_review.map((student) => student.displayName)).toContain('Iman T.');
  });

  it('returns student evidence and admin support data', async () => {
    await expect(getStudentEvidence('student-ada')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ activityType: 'warm_up', action: 'submitted' }),
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
});
