import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { CourseSelector } from '../components/course/CourseSelector';
import type { CourseMetadata } from '../data/courses';

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
});

describe('CourseSelector homepage', () => {
  it('communicates the Asterion loop, P3 maturity, and draft support status', async () => {
    const openedCourses: CourseMetadata[] = [];
    const container = await render(<CourseSelector onOpenCourse={(course) => openedCourses.push(course)} />);

    expect(container.textContent).toContain('Asterion trains exam readiness through a visible learning loop.');
    expect(container.textContent).toContain('Field Guide');
    expect(container.textContent).toContain('Skill Check');
    expect(container.textContent).toContain('Exam Training');
    expect(container.textContent).toContain('Recommended first click: P3 Pure Mathematics 3');
    expect(container.textContent).toContain('Most complete Asterion path');
    expect(container.textContent).toContain('Recommended starting path');
    expect(container.textContent).toContain('Full Field Guide, Skill Check, and Exam Training flow');
    expect(container.textContent).toContain('Start with P3');
    expect(container.textContent).toContain('P3 image-first practice');
    expect(container.textContent).toContain('source question and mark-scheme images');
    expect(container.textContent).toContain('Draft/support courses');
    expect(container.textContent).toContain('Draft/support section');
    expect(container.textContent).toContain('P1, M1, and S1 are draft support sections');
    expect(container.textContent).toContain('View P1 draft support');
    expect(container.textContent).toContain('View M1 draft support');
    expect(container.textContent).toContain('View S1 draft support');
    expect(container.textContent).toContain('Homepage acceptance checklist');
    expect(container.textContent).toContain('Algebra');
    expect(container.textContent).toContain('9709 P1 1.1: Quadratics');
    expect(container.textContent).not.toContain('Choose your course');
    expect(container.textContent).not.toContain('Brain loading');

    const primaryAction = Array.from(container.querySelectorAll('button')).find((button) => (
      button.textContent?.includes('Start with P3 training')
    ));
    expect(primaryAction).toBeTruthy();

    const p3Card = container.querySelector('.course-card-featured');
    const firstSupportCard = container.querySelector('.course-support-grid .course-card');
    expect(p3Card?.textContent).toContain('Start with P3');
    expect(firstSupportCard?.textContent).toContain('Draft/support section');
    expect(
      Boolean(p3Card && firstSupportCard && (p3Card.compareDocumentPosition(firstSupportCard) & Node.DOCUMENT_POSITION_FOLLOWING)),
    ).toBe(true);

    await act(async () => {
      primaryAction?.click();
      await Promise.resolve();
    });

    expect(openedCourses.map((course) => course.shortName)).toEqual(['P3']);
  });
});
