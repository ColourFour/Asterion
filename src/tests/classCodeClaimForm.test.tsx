import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassCodeClaimForm } from '../components/onboarding/ClassCodeClaimForm';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

async function render(ui: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  await act(async () => {
    root.render(ui);
    await Promise.resolve();
  });

  return container;
}

beforeEach(() => {
  vi.stubEnv('VITE_ASTERION_APP_PROFILE', 'classroom-pilot');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://asterion-example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
});

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
  vi.unstubAllEnvs();
});

describe('ClassCodeClaimForm', () => {
  it('renders student code-name entry without visible Supabase auth UI in hosted claim mode', async () => {
    const container = await render(<ClassCodeClaimForm onClaimed={vi.fn()} />);

    expect(container.textContent).toContain('Enter the class code and roster name your teacher gave you.');
    expect(container.textContent).toContain('Class code');
    expect(container.textContent).toContain('Roster name');
    expect(Array.from(container.querySelectorAll('button')).map((button) => button.textContent)).toEqual(['Enter class']);
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.textContent).not.toContain('Magic link');
    expect(container.textContent).not.toContain('magic link');
    expect(container.textContent).not.toContain('Sign in before hosted roster claim');
    expect(container.textContent).not.toContain('Supabase Auth');
    expect(container.textContent).not.toContain('Teacher login');
    expect(container.textContent).not.toContain('Admin login');
  });
});
