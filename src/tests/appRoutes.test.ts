import { describe, expect, it } from 'vitest';
import { dashboardRouteEnabled, parseDashboardRoute } from '../lib/appRoutes';

describe('parseDashboardRoute', () => {
  it('keeps normal paths on the student route', () => {
    expect(parseDashboardRoute('/', '')).toEqual({ kind: 'student' });
    expect(parseDashboardRoute('/', '#/regions/algebra')).toEqual({ kind: 'student' });
  });

  it('parses teacher routes from hash paths', () => {
    expect(parseDashboardRoute('/', '#/teacher')).toEqual({ kind: 'teacher', page: 'home' });
    expect(parseDashboardRoute('/', '#/teacher/classes/class-p3-alpha')).toEqual({
      kind: 'teacher',
      classId: 'class-p3-alpha',
      page: 'class',
    });
    expect(parseDashboardRoute('/', '#/teacher/classes/class-p3-alpha/roster')).toEqual({
      kind: 'teacher',
      classId: 'class-p3-alpha',
      page: 'roster',
    });
    expect(parseDashboardRoute('/', '#/teacher/classes/class-p3-alpha/regions/algebra')).toEqual({
      kind: 'teacher',
      classId: 'class-p3-alpha',
      page: 'region',
      regionId: 'algebra',
    });
  });

  it('parses admin routes from hash and path routes', () => {
    expect(parseDashboardRoute('/', '#/admin')).toEqual({ kind: 'admin' });
    expect(parseDashboardRoute('/admin/settings', '')).toEqual({ kind: 'admin' });
  });

  it('falls back to the pathname when the hash belongs to student routing', () => {
    expect(parseDashboardRoute('/teacher/classes/class-p3-alpha', '#/regions/algebra')).toEqual({
      kind: 'teacher',
      classId: 'class-p3-alpha',
      page: 'class',
    });
  });

  it('keeps dashboard routes disabled for the student pilot config gate', () => {
    expect(dashboardRouteEnabled({ kind: 'student' }, { dashboardRoutesEnabled: false })).toBe(true);
    expect(dashboardRouteEnabled({ kind: 'teacher', page: 'home' }, { dashboardRoutesEnabled: false })).toBe(false);
    expect(dashboardRouteEnabled({ kind: 'admin' }, { dashboardRoutesEnabled: false })).toBe(false);
    expect(dashboardRouteEnabled({ kind: 'teacher', page: 'home' }, { dashboardRoutesEnabled: true })).toBe(true);
  });
});
