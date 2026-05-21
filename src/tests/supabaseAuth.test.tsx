import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthPanel } from '../components/auth/SupabaseAuthPanel';
import {
  readSupabaseAuthSession,
  supabaseAuthStateFromSession,
  type SupabaseAuthClient,
} from '../lib/supabaseAuth';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

function createAuthClient(session: { user: { id: string; email?: string } } | null = null) {
  const signInWithOtp = vi.fn(async () => ({ error: null }));
  const signInWithPassword = vi.fn(async () => ({ error: null }));
  const updateUser = vi.fn(async () => ({ error: null }));
  const signOut = vi.fn(async () => ({ error: null }));
  const unsubscribe = vi.fn();
  const client: SupabaseAuthClient = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
      signInWithOtp,
      signInWithPassword,
      updateUser,
      signOut,
    },
  };
  return { client, signInWithOtp, signInWithPassword, updateUser, signOut, unsubscribe };
}

async function render(ui: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  await act(async () => {
    root.render(ui);
    await Promise.resolve();
    await Promise.resolve();
  });

  return container;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of mountedContainers.splice(0)) {
    container.remove();
  }
  document.body.innerHTML = '';
  window.localStorage.clear();
});

describe('Supabase Auth shell', () => {
  it('normalizes loading target session states safely', async () => {
    expect(supabaseAuthStateFromSession(null)).toEqual({ status: 'signed-out' });
    expect(supabaseAuthStateFromSession({ user: { id: 'user-1', email: 'teacher@example.test' } })).toEqual({
      status: 'signed-in',
      user: {
        id: 'user-1',
        email: 'teacher@example.test',
      },
    });

    await expect(readSupabaseAuthSession({ config: resolveSupabaseConfig({}) })).resolves.toMatchObject({
      status: 'error',
      error: expect.stringContaining('missing'),
    });
  });

  it('sends an email OTP and shows the check-your-email state', async () => {
    window.history.replaceState(null, '', '/#/teacher');
    const fake = createAuthClient(null);
    const container = await render(
      <SupabaseAuthPanel hookOptions={{ config: validConfig, createClient: async () => fake.client }} />,
    );

    setInputValue(container.querySelector('input[type="email"]')!, 'teacher@example.test');
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Send magic link'))?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fake.signInWithOtp).toHaveBeenCalledWith({
      email: 'teacher@example.test',
      options: {
        emailRedirectTo: `${window.location.origin}/?asterion_auth_route=teacher`,
      },
    });
    const [signInInput] = fake.signInWithOtp.mock.calls[0] as unknown as [{ options: { emailRedirectTo: string } }];
    expect(signInInput.options.emailRedirectTo).not.toContain('#/teacher');
    expect(window.localStorage.getItem('asterion:supabase-auth:intended-dashboard-route')).toBe('/teacher');
    expect(container.textContent).toContain('Check your email for the Asterion sign-in link.');
    expect(container.textContent).toContain('Sign-in does not guarantee teacher or admin access.');
  });

  it('supports Supabase email/password sign-in without granting roles', async () => {
    const fake = createAuthClient(null);
    const container = await render(
      <SupabaseAuthPanel hookOptions={{ config: validConfig, createClient: async () => fake.client }} />,
    );

    setInputValue(container.querySelector('input[type="email"]')!, 'teacher@example.test');
    setInputValue(container.querySelector('input[type="password"]')!, 'temporary-password');
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sign in with password'))?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fake.signInWithPassword).toHaveBeenCalledWith({
      email: 'teacher@example.test',
      password: 'temporary-password',
    });
    expect(container.textContent).toContain('Signed in with Supabase Auth.');
    expect(container.textContent).toContain('Sign-in does not guarantee teacher or admin access.');
  });

  it('shows signed-in email and signs out', async () => {
    const fake = createAuthClient({ user: { id: 'user-1', email: 'admin@example.test' } });
    const container = await render(
      <SupabaseAuthPanel hookOptions={{ config: validConfig, createClient: async () => fake.client }} />,
    );

    expect(container.textContent).toContain('admin@example.test');

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sign out'))?.click();
      await Promise.resolve();
    });

    expect(fake.signOut).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Sign in with password');
    expect(container.textContent).toContain('Send magic link');
  });

  it('lets a signed-in user change their Supabase password', async () => {
    const fake = createAuthClient({ user: { id: 'user-1', email: 'teacher@example.test' } });
    const container = await render(
      <SupabaseAuthPanel hookOptions={{ config: validConfig, createClient: async () => fake.client }} />,
    );

    const passwordInput = container.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).toBeTruthy();
    setInputValue(passwordInput!, 'new-password-123');

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Change password'))?.click();
      await Promise.resolve();
    });

    expect(fake.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
    expect(container.textContent).toContain('Password updated.');
  });
});
