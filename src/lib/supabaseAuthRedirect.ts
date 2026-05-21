import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import type { SupabaseAuthClient } from './supabaseAuth';

const INTENDED_DASHBOARD_ROUTE_KEY = 'asterion:supabase-auth:intended-dashboard-route';
const INTENDED_DASHBOARD_ROUTE_PARAM = 'asterion_auth_route';

interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface BrowserLocationLike {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}

interface BrowserHistoryLike {
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

interface SupabaseAuthRedirectSession {
  user?: {
    id?: string;
  } | null;
}

function safeAuthStorage(): BrowserStorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function stripNestedHash(path: string): string {
  const nestedHashIndex = path.indexOf('#');
  return nestedHashIndex >= 0 ? path.slice(0, nestedHashIndex) : path;
}

function normalizeDashboardRoute(path: string): string | undefined {
  const cleanPath = stripNestedHash(path);
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) return '/admin';
  if (cleanPath === '/teacher' || cleanPath.startsWith('/teacher/')) return cleanPath;
  return undefined;
}

function routeParamValue(route: string): string {
  return route.startsWith('/') ? route.slice(1) : route;
}

function routeFromParamValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return normalizeDashboardRoute(value.startsWith('/') ? value : `/${value}`);
}

export function dashboardAuthRouteFromLocation(pathname: string, hash: string): string | undefined {
  const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';
  return normalizeDashboardRoute(hashPath) ?? normalizeDashboardRoute(pathname);
}

export function dashboardAuthRouteFromSearch(search: string): string | undefined {
  return routeFromParamValue(new URLSearchParams(search).get(INTENDED_DASHBOARD_ROUTE_PARAM));
}

export function supabaseMagicLinkRedirectTo(
  location: Pick<BrowserLocationLike, 'origin'> = window.location,
  intendedRoute?: string,
): string {
  const normalized = intendedRoute ? normalizeDashboardRoute(intendedRoute) : undefined;
  if (!normalized) return location.origin;

  const url = new URL(location.origin);
  url.searchParams.set(INTENDED_DASHBOARD_ROUTE_PARAM, routeParamValue(normalized));
  return url.toString();
}

export function saveSupabaseAuthIntendedRoute(route: string | undefined, storage: BrowserStorageLike | undefined = safeAuthStorage()): void {
  if (!storage) return;
  const normalized = route ? normalizeDashboardRoute(route) : undefined;
  if (!normalized) {
    storage.removeItem(INTENDED_DASHBOARD_ROUTE_KEY);
    return;
  }
  storage.setItem(INTENDED_DASHBOARD_ROUTE_KEY, normalized);
}

export function readSupabaseAuthIntendedRoute(storage: BrowserStorageLike | undefined = safeAuthStorage()): string | undefined {
  if (!storage) return undefined;
  return normalizeDashboardRoute(storage.getItem(INTENDED_DASHBOARD_ROUTE_KEY) ?? '');
}

export function clearSupabaseAuthIntendedRoute(storage: BrowserStorageLike | undefined = safeAuthStorage()): void {
  storage?.removeItem(INTENDED_DASHBOARD_ROUTE_KEY);
}

export function hasSupabaseAuthFragment(hash: string): boolean {
  return /(?:^#?|[&#])(?:access_token|refresh_token|expires_in|token_type|error|error_code)=/.test(hash);
}

function searchWithoutDashboardRoute(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(INTENDED_DASHBOARD_ROUTE_PARAM);
  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : '';
}

export function recoverSupabaseAuthRedirectForSession({
  session,
  location = window.location,
  history = window.history,
  storage = safeAuthStorage(),
}: {
  session: SupabaseAuthRedirectSession | null | undefined;
  location?: BrowserLocationLike;
  history?: BrowserHistoryLike;
  storage?: BrowserStorageLike;
}): string | undefined {
  if (!session?.user?.id || !hasSupabaseAuthFragment(location.hash)) return undefined;

  const intendedRoute = dashboardAuthRouteFromSearch(location.search)
    ?? readSupabaseAuthIntendedRoute(storage)
    ?? dashboardAuthRouteFromLocation(location.pathname, location.hash);
  clearSupabaseAuthIntendedRoute(storage);

  const cleanSearch = searchWithoutDashboardRoute(location.search);
  const nextUrl = intendedRoute
    ? `${location.pathname}${cleanSearch}#${intendedRoute}`
    : `${location.pathname}${cleanSearch}`;
  history.replaceState(null, '', nextUrl);
  return intendedRoute;
}

async function waitForRecoveredSession(
  client: SupabaseAuthClient,
  timeoutMs: number,
): Promise<SupabaseAuthRedirectSession | null | undefined> {
  const firstResult = await client.auth.getSession();
  if (firstResult.error) return undefined;
  const firstSession = firstResult.data?.session;
  if (firstSession?.user?.id) return firstSession;

  return await new Promise((resolve) => {
    let settled = false;
    const subscription = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) settle(session);
    }).data?.subscription;
    const timer = window.setTimeout(() => settle(firstSession ?? null), timeoutMs);

    function settle(session: SupabaseAuthRedirectSession | null | undefined) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      subscription?.unsubscribe();
      resolve(session);
    }
  });
}

export async function recoverSupabaseAuthRedirect(options: {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseAuthClient | undefined>;
  location?: BrowserLocationLike;
  history?: BrowserHistoryLike;
  storage?: BrowserStorageLike;
  timeoutMs?: number;
} = {}): Promise<string | undefined> {
  const location = options.location ?? window.location;
  if (!hasSupabaseAuthFragment(location.hash)) return undefined;

  const config = options.config ?? resolveSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.publishableKey) return undefined;

  const client = options.createClient
    ? await options.createClient()
    : await createSupabaseBrowserClient(config, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }) as SupabaseAuthClient | undefined;
  if (!client) return undefined;

  const session = await waitForRecoveredSession(client, options.timeoutMs ?? 2500);

  return recoverSupabaseAuthRedirectForSession({
    session,
    location,
    history: options.history,
    storage: options.storage,
  });
}
