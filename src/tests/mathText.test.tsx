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

describe('MathText', () => {
  it('renders inline LaTeX delimiters with KaTeX markup', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ root, container });

    await act(async () => {
      root.render(<MathText text="Convert $a^x=b$ into $x=\\log_a b$." />);
    });
    for (let attempt = 0; attempt < 20 && !container.innerHTML.includes('katex'); attempt += 1) {
      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 10));
      });
    }

    expect(container.innerHTML).toContain('katex');
    expect(container.innerHTML).toContain('log');
    expect(container.textContent).not.toContain('$a^x=b$');
  });
});
