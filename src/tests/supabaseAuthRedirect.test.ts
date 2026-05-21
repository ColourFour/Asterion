import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dashboardAuthRouteFromLocation,
  hasSupabaseAuthFragment,
  recoverSupabaseAuthRedirectForSession,
  saveSupabaseAuthIntendedRoute,
  supabaseMagicLinkRedirectTo,
} from '../lib/supabaseAuthRedirect';

afterEach(() => {
  window.localStorage.clear();
});

describe('Supabase auth redirect handling', () => {
  it('uses a non-hash callback URL for admin and teacher magic-link requests', () => {
    expect(supabaseMagicLinkRedirectTo({ origin: 'https://asterion-eta.vercel.app' })).toBe('https://asterion-eta.vercel.app');
    expect(dashboardAuthRouteFromLocation('/', '#/admin')).toBe('/admin');
    expect(dashboardAuthRouteFromLocation('/', '#/teacher')).toBe('/teacher');
  });

  it('does not preserve collided auth hashes as dashboard redirect URLs', () => {
    expect(dashboardAuthRouteFromLocation('/', '#/admin#access_token=token')).toBe('/admin');
    expect(dashboardAuthRouteFromLocation('/', '#/teacher#access_token=token')).toBe('/teacher');
  });

  it('clears Supabase auth tokens after a valid session and restores the intended dashboard route', () => {
    const replaceState = vi.fn();
    saveSupabaseAuthIntendedRoute('/admin');

    const restoredRoute = recoverSupabaseAuthRedirectForSession({
      session: { user: { id: 'user-1' } },
      location: {
        origin: 'https://asterion-eta.vercel.app',
        pathname: '/',
        search: '',
        hash: '#access_token=token&refresh_token=refresh&expires_in=3600&token_type=bearer',
      },
      history: { replaceState },
      storage: window.localStorage,
    });

    expect(restoredRoute).toBe('/admin');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#/admin');
    expect(window.localStorage.getItem('asterion:supabase-auth:intended-dashboard-route')).toBeNull();
  });

  it('recognizes root Supabase implicit auth fragments without requiring hash dashboard routes', () => {
    expect(hasSupabaseAuthFragment('#access_token=token')).toBe(true);
    expect(hasSupabaseAuthFragment('#/admin')).toBe(false);
    expect(hasSupabaseAuthFragment('#/teacher')).toBe(false);
  });
});
