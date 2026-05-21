import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import {
  dashboardAuthRouteFromLocation,
  saveSupabaseAuthIntendedRoute,
  supabaseMagicLinkRedirectTo,
} from './supabaseAuthRedirect';

export type SupabaseAuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'error';

export interface SupabaseAuthUser {
  id: string;
  email?: string;
}

export interface SupabaseAuthState {
  status: SupabaseAuthStatus;
  user?: SupabaseAuthUser;
  error?: string;
}

interface SupabaseAuthSession {
  user?: {
    id?: string;
    email?: string;
  } | null;
}

interface SupabaseAuthSubscription {
  unsubscribe(): void;
}

export interface SupabaseAuthClient {
  auth: {
    getSession(): Promise<{ data?: { session?: SupabaseAuthSession | null } | null; error?: unknown }>;
    onAuthStateChange(
      callback: (event: string, session: SupabaseAuthSession | null) => void,
    ): { data?: { subscription?: SupabaseAuthSubscription | null } | null };
    signInWithOtp(input: { email: string; options?: { emailRedirectTo?: string } }): Promise<{ error?: unknown }>;
    signOut(): Promise<{ error?: unknown }>;
  };
}

export interface SupabaseAuthHookOptions {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseAuthClient | undefined>;
  enabled?: boolean;
  redirectTo?: string;
}

export interface SupabaseAuthController extends SupabaseAuthState {
  signInWithOtp(email: string): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<{ ok: boolean; error?: string }>;
}

const signedOutState: SupabaseAuthState = { status: 'signed-out' };

function authErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function supabaseAuthStateFromSession(session: SupabaseAuthSession | null | undefined): SupabaseAuthState {
  const userId = session?.user?.id;
  if (!userId) return signedOutState;
  return {
    status: 'signed-in',
    user: {
      id: userId,
      email: session.user?.email,
    },
  };
}

export function supabaseAuthConfigError(config: SupabaseConfig): string | undefined {
  if (config.missing.length > 0) return 'Browser-safe Supabase configuration is missing.';
  if (!config.isConfigured) return 'Browser-safe Supabase configuration is invalid.';
  return undefined;
}

export async function readSupabaseAuthSession(options: {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseAuthClient | undefined>;
} = {}): Promise<SupabaseAuthState> {
  const config = options.config ?? resolveSupabaseConfig();
  const configError = supabaseAuthConfigError(config);
  if (configError) return { status: 'error', error: configError };

  const createClient = options.createClient ?? (async () => (
    await createSupabaseBrowserClient(config, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }) as SupabaseAuthClient | undefined
  ));

  const client = await createClient();
  if (!client) return { status: 'error', error: 'Supabase Auth client could not be created.' };

  const result = await client.auth.getSession();
  if (result.error) {
    return {
      status: 'error',
      error: authErrorMessage(result.error, 'Supabase Auth session could not be read.'),
    };
  }
  return supabaseAuthStateFromSession(result.data?.session);
}

export function useSupabaseAuthSession(options: SupabaseAuthHookOptions = {}): SupabaseAuthController {
  const enabled = options.enabled ?? true;
  const [config] = useState(() => options.config ?? resolveSupabaseConfig());
  const createClient = options.createClient;
  const redirectTo = options.redirectTo;
  const clientRef = useRef<SupabaseAuthClient | undefined>(undefined);
  const [state, setState] = useState<SupabaseAuthState>(() => (enabled ? { status: 'loading' } : signedOutState));

  const ensureClient = useCallback(async () => {
    const configError = supabaseAuthConfigError(config);
    if (configError) {
      setState({ status: 'error', error: configError });
      return undefined;
    }
    if (clientRef.current) return clientRef.current;
    const client = createClient
      ? await createClient()
      : (await createSupabaseBrowserClient(config, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }) as SupabaseAuthClient | undefined);
    if (!client) {
      setState({ status: 'error', error: 'Supabase Auth client could not be created.' });
      return undefined;
    }
    clientRef.current = client;
    return client;
  }, [config, createClient]);

  useEffect(() => {
    if (!enabled) {
      setState(signedOutState);
      return undefined;
    }

    let cancelled = false;
    let subscription: SupabaseAuthSubscription | undefined;

    async function syncSession() {
      setState({ status: 'loading' });
      const client = await ensureClient();
      if (!client || cancelled) return;

      const result = await client.auth.getSession();
      if (cancelled) return;
      if (result.error) {
        setState({
          status: 'error',
          error: authErrorMessage(result.error, 'Supabase Auth session could not be read.'),
        });
        return;
      }
      setState(supabaseAuthStateFromSession(result.data?.session));

      subscription = client.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setState(supabaseAuthStateFromSession(session));
      }).data?.subscription ?? undefined;
    }

    syncSession();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [enabled, ensureClient]);

  const signInWithOtp = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return { ok: false, error: 'Enter an email address.' };

    const client = await ensureClient();
    if (!client) return { ok: false, error: 'Supabase Auth is unavailable.' };

    if (!redirectTo) {
      saveSupabaseAuthIntendedRoute(dashboardAuthRouteFromLocation(window.location.pathname, window.location.hash));
    }
    const result = await client.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo ?? supabaseMagicLinkRedirectTo(),
      },
    });
    if (result.error) {
      return {
        ok: false,
        error: authErrorMessage(result.error, 'Supabase magic-link sign-in failed.'),
      };
    }
    return { ok: true };
  }, [ensureClient, redirectTo]);

  const signOut = useCallback(async () => {
    const client = await ensureClient();
    if (!client) return { ok: false, error: 'Supabase Auth is unavailable.' };

    const result = await client.auth.signOut();
    if (result.error) {
      return {
        ok: false,
        error: authErrorMessage(result.error, 'Supabase sign-out failed.'),
      };
    }
    setState(signedOutState);
    return { ok: true };
  }, [ensureClient]);

  return {
    ...state,
    signInWithOtp,
    signOut,
  };
}
