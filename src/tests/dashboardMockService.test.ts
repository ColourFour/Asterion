import { describe, expect, it } from 'vitest';
import {
  getStudentEvidence,
  getTeacherClassDashboard,
  groupStudentsByNextStep,
  listAdminAuditEvents,
  listAdminClasses,
  listAdminTeachers,
  listTeacherClasses,
} from '../lib/dashboardMockService';

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
});
