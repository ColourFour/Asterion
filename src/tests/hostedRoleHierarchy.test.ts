import { describe, expect, it } from 'vitest';
import { canAccessHostedRole } from '../lib/hostedRoleHierarchy';

describe('hosted role hierarchy', () => {
  it('treats admin as the superset classroom role', () => {
    expect(canAccessHostedRole(['admin'], 'teacher')).toBe(true);
    expect(canAccessHostedRole(['admin'], 'admin')).toBe(true);
    expect(canAccessHostedRole(['admin'], 'student_preview')).toBe(true);
  });

  it('keeps teacher below admin but eligible for staff student-side preview', () => {
    expect(canAccessHostedRole(['teacher'], 'teacher')).toBe(true);
    expect(canAccessHostedRole(['teacher'], 'admin')).toBe(false);
    expect(canAccessHostedRole(['teacher'], 'student_preview')).toBe(true);
  });

  it('keeps student and no-role accounts out of privileged routes', () => {
    expect(canAccessHostedRole(['student'], 'teacher')).toBe(false);
    expect(canAccessHostedRole([], 'teacher')).toBe(false);
    expect(canAccessHostedRole(undefined, 'admin')).toBe(false);
    expect(canAccessHostedRole(['student'], 'student')).toBe(true);
  });
});
