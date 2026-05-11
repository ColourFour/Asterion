import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { MathText } from '../components/shared/MathText';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLElement }> = [];

afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

async function waitForKatex(container: HTMLElement) {
  for (let attempt = 0; attempt < 20 && !container.innerHTML.includes('katex'); attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 10));
    });
  }
}

describe('MathText', () => {
  it('renders inline LaTeX delimiters with KaTeX markup', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, container });

    await act(async () => {
      root.render(<MathText text="Convert $a^x=b$ into $x=\\log_a b$." />);
    });
    await waitForKatex(container);

    expect(container.innerHTML).toContain('katex');
    expect(container.innerHTML).toContain('log');
    expect(container.textContent).not.toContain('$a^x=b$');
  });

  it('renders common raw generated-practice math as KaTeX', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, container });

    await act(async () => {
      root.render(<MathText text="Solve sin x = 1/2 for 0 <= x <= pi." />);
    });
    await waitForKatex(container);

    expect(container.innerHTML).toContain('katex');
    expect(container.textContent).toContain('≤');
    expect(container.textContent).toContain('π');
    expect(container.textContent).not.toContain('<=');
  });

  it('renders raw LaTeX fragments without requiring delimiters', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, container });

    await act(async () => {
      root.render(<MathText text={`Decompose \\frac{3x+1}{(x-1)(x+2)}.`} />);
    });
    await waitForKatex(container);

    expect(container.innerHTML).toContain('katex');
    expect(container.innerHTML).toContain('mfrac');
  });

  it('renders raw derivatives, fractions, powers, and trig notation legibly', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, container });

    await act(async () => {
      root.render(<MathText text="Use dy/dx = 3t/2 and sin^2 x + cos^2 x = 1." />);
    });
    await waitForKatex(container);

    expect(container.innerHTML).toContain('katex');
    expect(container.innerHTML).toContain('mfrac');
    expect(container.textContent).toContain('sin');
    expect(container.textContent).not.toContain('dy/dx');
  });
});
