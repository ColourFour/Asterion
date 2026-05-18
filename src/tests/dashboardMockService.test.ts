import { describe, expect, it } from 'vitest';
import {
  addRosterStudent,
  archiveRosterStudent,
  canStudentAccessApp,
  canUseRegionActivity,
  claimRosterSlotByClassCode,
  generateTeacherCsvExport,
  getClassRegionSignals,
  getStudentEvidence,
  getStudentSummaries,
  getTeacherClassDashboard,
  getTeacherClassDashboardForTeacher,
  getTeacherClassRoster,
  groupStudentsByNextStep,
  listAdminClassRecords,
  listAdminAuditEvents,
  listAdminClasses,
  listAdminTeacherRecords,
  listAdminTeachers,
  listTeacherClasses,
  resetRosterClaim,
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
    expect(dashboard.progressSummary.lockedRegionCount).toBeGreaterThan(0);
    expect(dashboard.regionSummaries.length).toBeGreaterThan(0);
    expect(dashboard.studentRows.length).toBeGreaterThan(0);
    expect(dashboard.focusThisWeek.length).toBe(3);
    expect(dashboard.weeklySummary.className).toBe(dashboard.class.name);
    expect(dashboard.exportRows.length).toBe(dashboard.studentRows.length);
    expect(dashboard.roster.students.some((student) => student.status === 'unclaimed')).toBe(true);
    expect(dashboard.classCode.code).toMatch(/^AST-/);
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

    expect(grouped.needs_warm_up.length + grouped.needs_teacher_review.length).toBeGreaterThan(0);
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

  it('renders admin teacher and class records with exactly one teacher per class and class codes', async () => {
    const teachers = await listAdminTeacherRecords();
    const classes = await listAdminClassRecords();
    const teacherIds = new Set(teachers.map((teacher) => teacher.id));

    expect(teachers.length).toBeGreaterThanOrEqual(2);
    expect(classes.filter((item) => item.status === 'active').length).toBeGreaterThanOrEqual(2);
    expect(classes.some((item) => item.status === 'archived')).toBe(true);

    for (const classRecord of classes) {
      expect(classRecord.teacherId).toEqual(expect.any(String));
      expect(teacherIds.has(classRecord.teacherId)).toBe(true);
      expect(classRecord.classCode.code).toEqual(expect.any(String));
      expect(classRecord.classCode.classId).toBe(classRecord.id);
    }
  });

  it('limits teacher roster and class management to assigned classes', async () => {
    const hypatiaClasses = await listTeacherClasses('teacher-hypatia');
    const noetherClasses = await listTeacherClasses('teacher-noether');

    expect(hypatiaClasses.every((teacherClass) => teacherClass.teacherId === 'teacher-hypatia')).toBe(true);
    expect(noetherClasses.every((teacherClass) => teacherClass.teacherId === 'teacher-noether')).toBe(true);
    await expect(getTeacherClassDashboardForTeacher('teacher-noether', 'class-p3-alpha')).resolves.toBeUndefined();
    await expect(getTeacherClassDashboardForTeacher('teacher-hypatia', 'class-p3-alpha')).resolves.toMatchObject({
      class: expect.objectContaining({ id: 'class-p3-alpha' }),
    });
  });

  it('keeps roster slots teacher-created, claimable by class code, and archive-not-delete', async () => {
    const before = await getTeacherClassRoster('teacher-hypatia', 'class-p3-alpha');
    expect(before?.students.some((student) => student.status === 'archived')).toBe(true);

    const invalidCode = await claimRosterSlotByClassCode({ classCode: 'NOPE', displayName: 'Maya Q.' });
    expect(invalidCode).toMatchObject({
      status: 'invalid_class_code',
      message: 'Enter a valid class code from your teacher.',
    });
    expect(canStudentAccessApp(invalidCode)).toBe(false);

    const denied = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Self Added Student' });
    expect(denied.status).toBe('roster_name_not_found');
    expect(canStudentAccessApp(denied)).toBe(false);

    const archivedDenied = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Archived Student' });
    expect(archivedDenied).toMatchObject({
      status: 'archived',
      message: 'This roster entry is archived. Ask your teacher or admin for help.',
    });
    expect(canStudentAccessApp(archivedDenied)).toBe(false);

    const alreadyClaimed = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Ada L.' });
    expect(alreadyClaimed).toMatchObject({
      status: 'already_claimed',
      message: 'This roster entry has already been claimed. Ask your teacher or admin for help.',
    });
    expect(canStudentAccessApp(alreadyClaimed)).toBe(false);

    const added = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Test Roster Student');
    expect(added).toMatchObject({ status: 'unclaimed' });

    const claimed = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Test Roster Student', optionalEmail: 'test@example.student' });
    expect(claimed.status).toBe('claimed');
    expect(canStudentAccessApp(claimed)).toBe(true);

    const archived = await archiveRosterStudent('teacher-hypatia', 'class-p3-alpha', added!.id);
    expect(archived).toMatchObject({ status: 'archived', archivedAt: expect.any(String) });

    const after = await getTeacherClassRoster('teacher-hypatia', 'class-p3-alpha');
    expect(after?.students.find((student) => student.id === added!.id)?.status).toBe('archived');
  });

  it('resets only claimed active roster slots without deleting progress or creating roster entries', async () => {
    const added = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Resettable Claim Student');
    expect(added).toMatchObject({ status: 'unclaimed' });

    const beforeRoster = await getTeacherClassRoster('teacher-hypatia', 'class-p3-alpha');
    const beforeRosterCount = beforeRoster?.students.length ?? 0;
    const beforeProgress = await getStudentEvidence('student-ada');

    const claimed = await claimRosterSlotByClassCode({
      classCode: 'AST-P3A',
      displayName: 'Resettable Claim Student',
      optionalEmail: 'resettable@example.student',
    });
    expect(claimed.status).toBe('claimed');

    const blockedBeforeReset = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Resettable Claim Student' });
    expect(blockedBeforeReset.status).toBe('already_claimed');

    const reset = await resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-hypatia',
      classId: 'class-p3-alpha',
      rosterStudentId: added!.id,
    });
    expect(reset).toMatchObject({ id: added!.id, status: 'unclaimed' });
    expect(reset?.claimedAt).toBeUndefined();
    expect(reset?.optionalEmail).toBeUndefined();
    expect(reset?.optionalDetails).toBeUndefined();

    const afterResetClaim = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Resettable Claim Student' });
    expect(afterResetClaim.status).toBe('claimed');

    const adminReset = await resetRosterClaim({
      actorRole: 'admin',
      classId: 'class-p3-alpha',
      rosterStudentId: added!.id,
    });
    expect(adminReset?.status).toBe('unclaimed');

    const afterRoster = await getTeacherClassRoster('teacher-hypatia', 'class-p3-alpha');
    expect(afterRoster?.students.length).toBe(beforeRosterCount);
    expect(afterRoster?.students.filter((student) => student.displayName === 'Resettable Claim Student')).toHaveLength(1);
    await expect(getStudentEvidence('student-ada')).resolves.toEqual(beforeProgress);
  });

  it('does not reset unclaimed, archived, or wrong-teacher roster slots', async () => {
    const unclaimed = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Never Claimed Student');
    await expect(resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-hypatia',
      classId: 'class-p3-alpha',
      rosterStudentId: unclaimed!.id,
    })).resolves.toBeUndefined();

    const claimed = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Wrong Teacher Reset Student');
    await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Wrong Teacher Reset Student' });
    await expect(resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-noether',
      classId: 'class-p3-alpha',
      rosterStudentId: claimed!.id,
    })).resolves.toBeUndefined();

    const archived = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Archived Reset Student');
    await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Archived Reset Student' });
    await archiveRosterStudent('teacher-hypatia', 'class-p3-alpha', archived!.id);
    await expect(resetRosterClaim({
      actorRole: 'admin',
      classId: 'class-p3-alpha',
      rosterStudentId: archived!.id,
    })).resolves.toBeUndefined();
    await expect(claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Archived Reset Student' })).resolves.toMatchObject({
      status: 'archived',
    });
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

      for (const access of dashboard.regionAccess) {
        expect(isValidP3RegionId(access.regionId), access.regionId).toBe(true);
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
      classCode: 'AST-P3A',
      teacherName: 'Ms Hypatia',
      studentName: expect.any(String),
      rosterStatus: expect.any(String),
      overallProgressPercent: expect.any(Number),
      currentFocusRegion: expect.any(String),
      attemptsCount: expect.any(Number),
      notesWarnings: expect.any(String),
    });

    const csv = generateTeacherCsvExport(dashboard.exportRows);
    expect(csv).toContain('"className"');
    expect(csv).toContain('"Algebra Vault progress"');
    expect(csv).toContain('"Algebra Vault access"');
    expect(csv).toContain('"Argand Atrium excluded from class progress"');
    expect(csv).toContain('"P3 Alpha"');
  });

  it('excludes locked regions from progress pressure while preserving visible evidence', async () => {
    const dashboard = await getTeacherClassDashboard('class-p3-alpha');
    const lockedRegion = dashboard.regionSummaries.find((region) => region.regionId === 'complex-harbor');
    const mika = dashboard.studentRows.find((row) => row.displayName === 'Mika C.');
    const mikaComplex = mika?.regionCells.find((cell) => cell.regionId === 'complex-harbor');

    expect(lockedRegion).toMatchObject({
      access: 'field_guide_only',
      excludedFromClassProgress: true,
      accessLabel: 'Field Guide only',
    });
    expect(lockedRegion?.averageProgressPercent).toBeGreaterThan(0);
    expect(mikaComplex).toMatchObject({
      attemptsCount: 1,
      excludedFromClassProgress: true,
    });
    expect(mika?.warnings.some((warning) => warning.includes('Argand Atrium'))).toBe(false);
  });

  it('models locked region activity permissions as Field Guide only', () => {
    expect(canUseRegionActivity('field_guide_only', 'field_guide')).toBe(true);
    expect(canUseRegionActivity('field_guide_only', 'quick_check')).toBe(false);
    expect(canUseRegionActivity('field_guide_only', 'warm_up')).toBe(false);
    expect(canUseRegionActivity('field_guide_only', 'exam_practice')).toBe(false);
    expect(canUseRegionActivity('field_guide_only', 'guardian')).toBe(false);
    expect(canUseRegionActivity('field_guide_only', 'mastery_progression')).toBe(false);
    expect(canUseRegionActivity('open', 'guardian')).toBe(true);
  });
});
