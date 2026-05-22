import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingClassClaim,
  loadPendingClassClaim,
  PENDING_CLASS_CLAIM_STORAGE_KEY,
  savePendingClassClaim,
} from '../lib/studentClassClaimStore';
import type { StudentClaimState } from '../types';

const claim: StudentClaimState = {
  status: 'claimed',
  classId: 'class-p3-alpha',
  className: 'P3 Alpha',
  classCode: 'AST-P3A',
  teacherId: 'teacher-noether',
  teacherName: 'Dr Noether',
  rosterStudentId: 'roster-ada',
  displayName: 'Ada Lovelace',
  message: 'Claimed roster slot.',
};

describe('student class claim local handoff store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps a claimed roster slot available across browser restart before profile save', () => {
    expect(savePendingClassClaim(claim)).toEqual(claim);

    const reloaded = loadPendingClassClaim();

    expect(reloaded).toEqual(claim);
    expect(JSON.parse(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY) ?? '{}')).toMatchObject({
      status: 'claimed',
      classId: 'class-p3-alpha',
      rosterStudentId: 'roster-ada',
    });
  });

  it('clears the pending class claim after the profile is saved or restarted', () => {
    savePendingClassClaim(claim);
    clearPendingClassClaim();

    expect(loadPendingClassClaim()).toBeUndefined();
    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
  });
});
