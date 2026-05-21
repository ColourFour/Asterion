import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dashboardAuthRouteFromSearch,
  dashboardAuthRouteFromLocation,
  hasSupabaseAuthFragment,
  recoverSupabaseAuthRedirect,
  recoverSupabaseAuthRedirectForSession,
  saveSupabaseAuthIntendedRoute,
  supabaseMagicLinkRedirectTo,
} from '../lib/supabaseAuthRedirect';
import type { SupabaseAuthClient } from '../lib/supabaseAuth';

afterEach(() => {
  window.localStorage.clear();
});

describe('Supabase auth redirect handling', () => {
  it('uses a non-hash callback URL for admin and teacher magic-link requests', () => {
    expect(supabaseMagicLinkRedirectTo({ origin: 'https://asterion-eta.vercel.app' })).toBe('https://asterion-eta.vercel.app');
    expect(supabaseMagicLinkRedirectTo({ origin: 'https://asterion-eta.vercel.app' }, '/admin')).toBe('https://asterion-eta.vercel.app/?asterion_auth_route=admin');
    expect(supabaseMagicLinkRedirectTo({ origin: 'https://asterion-eta.vercel.app' }, '/teacher')).toBe('https://asterion-eta.vercel.app/?asterion_auth_route=teacher');
    expect(dashboardAuthRouteFromLocation('/', '#/admin')).toBe('/admin');
    expect(dashboardAuthRouteFromLocation('/', '#/teacher')).toBe('/teacher');
    expect(dashboardAuthRouteFromSearch('?asterion_auth_route=admin')).toBe('/admin');
    expect(dashboardAuthRouteFromSearch('?asterion_auth_route=teacher')).toBe('/teacher');
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

  it('prefers the non-hash callback route parameter and removes it with the auth hash', () => {
    const replaceState = vi.fn();

    const restoredRoute = recoverSupabaseAuthRedirectForSession({
      session: { user: { id: 'user-1' } },
      location: {
        origin: 'https://asterion-eta.vercel.app',
        pathname: '/',
        search: '?asterion_auth_route=teacher',
        hash: '#access_token=token&refresh_token=refresh&expires_in=3600&token_type=bearer',
      },
      history: { replaceState },
      storage: window.localStorage,
    });

    expect(restoredRoute).toBe('/teacher');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#/teacher');
  });

  it('waits for Supabase to emit the recovered session before cleaning the URL', async () => {
    const replaceState = vi.fn();
    const unsubscribe = vi.fn();
    let authCallback: ((event: string, session: { user: { id: string } } | null) => void) | undefined;
    const client: SupabaseAuthClient = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn((callback) => {
          authCallback = callback;
          return { data: { subscription: { unsubscribe } } };
        }),
        signInWithOtp: vi.fn(),
        signOut: vi.fn(),
      },
    };

    const recovery = recoverSupabaseAuthRedirect({
      config: {
        url: 'https://asterion-example.supabase.co',
        publishableKey: 'sb_publishable_example',
        isConfigured: true,
        missing: [],
        invalid: [],
      },
      createClient: async () => client,
      location: {
        origin: 'https://asterion-eta.vercel.app',
        pathname: '/',
        search: '?asterion_auth_route=admin',
        hash: '#access_token=token&refresh_token=refresh&expires_in=3600&token_type=bearer',
      },
      history: { replaceState },
      storage: window.localStorage,
      timeoutMs: 100,
    });

    await Promise.resolve();
    await Promise.resolve();
    authCallback?.('SIGNED_IN', { user: { id: 'user-1' } });

    await expect(recovery).resolves.toBe('/admin');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#/admin');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('recognizes root Supabase implicit auth fragments without requiring hash dashboard routes', () => {
    expect(hasSupabaseAuthFragment('#access_token=token')).toBe(true);
    expect(hasSupabaseAuthFragment('#/admin')).toBe(false);
    expect(hasSupabaseAuthFragment('#/teacher')).toBe(false);
  });
});
