import type { AsterionRuntimeConfig } from './appConfig';

export type TeacherDashboardRoute = {
  kind: 'teacher';
  classId?: string;
  page: 'home' | 'class' | 'roster' | 'region';
  regionId?: string;
};

export type DashboardRoute = TeacherDashboardRoute | { kind: 'admin' } | { kind: 'student' };

export function dashboardRouteEnabled(route: DashboardRoute, config: Pick<AsterionRuntimeConfig, 'dashboardRoutesEnabled'>): boolean {
  return route.kind === 'student' || config.dashboardRoutesEnabled;
}

export function parseDashboardRoute(pathname: string, hash: string): DashboardRoute {
  const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';
  const routePath = hashPath.startsWith('/teacher') || hashPath.startsWith('/admin') ? hashPath : pathname;
  if (routePath === '/admin' || routePath.startsWith('/admin/')) return { kind: 'admin' };
  if (routePath === '/teacher') return { kind: 'teacher', page: 'home' };

  const teacherRosterMatch = routePath.match(/^\/teacher\/classes\/([^/]+)\/roster$/);
  if (teacherRosterMatch) return { kind: 'teacher', classId: teacherRosterMatch[1], page: 'roster' };

  const teacherRegionMatch = routePath.match(/^\/teacher\/classes\/([^/]+)\/regions\/([^/]+)$/);
  if (teacherRegionMatch) {
    return { kind: 'teacher', classId: teacherRegionMatch[1], page: 'region', regionId: teacherRegionMatch[2] };
  }

  const teacherClassMatch = routePath.match(/^\/teacher\/classes\/([^/]+)$/);
  if (teacherClassMatch) return { kind: 'teacher', classId: teacherClassMatch[1], page: 'class' };

  return { kind: 'student' };
}
