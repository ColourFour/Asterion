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

    expect(container.textContent).toContain('CAIE 9709 practice that starts from the method, not the mark scheme.');
    expect(container.textContent).toContain('Asterion sends you through Field Guide, Skill Check, and Exam Training');
    expect(container.textContent).toContain('Training flow');
    expect(container.textContent).toContain('Method to evidence');
    expect(container.textContent).toContain('Field Guide');
    expect(container.textContent).toContain('Skill Check');
    expect(container.textContent).toContain('Exam Training');
    expect(container.textContent).toContain('Review');
    expect(container.textContent).toContain('Use mark-scheme review and gap checks before another attempt.');
    expect(container.textContent).toContain('Recommended first click: P3 Pure Mathematics 3');
    expect(container.textContent).toContain('Most complete Asterion path');
    expect(container.textContent).toContain('Recommended starting path');
    expect(container.textContent).toContain('Full method-first Field Guide, Skill Check, Exam Training, and review flow');
    expect(container.textContent).toContain('Start with P3');
    expect(container.textContent).toContain('Start here if you want the complete Asterion loop.');
    expect(container.textContent).toContain('Includes Algebra, Logarithms');
    expect(container.textContent).toContain('Early support courses');
    expect(container.textContent).toContain('Early support');
    expect(container.textContent).toContain('Support only: useful for orientation, not a fully reviewed course path yet.');
    expect(container.textContent).toContain('P1, M1, and S1 are available as early support while their coverage is expanded and reviewed.');
    expect(container.textContent).toContain('View P1 support');
    expect(container.textContent).toContain('View M1 support');
    expect(container.textContent).toContain('View S1 support');
    expect(container.textContent).not.toContain('Homepage acceptance checklist');
    expect(container.textContent).toContain('Algebra');
    expect(container.textContent).not.toContain('Choose your course');
    expect(container.textContent).not.toContain('Brain loading');

    const primaryAction = Array.from(container.querySelectorAll('button')).find((button) => (
      button.textContent?.includes('Start with P3 training')
    ));
    expect(primaryAction).toBeTruthy();

    const p3Card = container.querySelector('.course-card-featured');
    const firstSupportCard = container.querySelector('.course-support-grid .course-card');
    expect(p3Card?.textContent).toContain('Start with P3');
    expect(firstSupportCard?.textContent).toContain('Early support');
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
