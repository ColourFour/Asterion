import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TeacherDashboard } from '../components/dashboard/TeacherDashboard';
import { clearTeacherQuestionsForTests, submitTeacherQuestion } from '../lib/teacherQuestionQueue';

vi.mock('../lib/dashboardDataService', async () => {
  const actual = await vi.importActual<typeof import('../lib/dashboardDataService')>('../lib/dashboardDataService');
  return {
    ...actual,
    dashboardDataService: actual.mockDashboardDataService,
  };
});

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
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return container;
}

async function waitForText(container: HTMLElement, text: string) {
  for (let index = 0; index < 120; index += 1) {
    if (container.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  throw new Error(`Timed out waiting for text: ${text}`);
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
  clearTeacherQuestionsForTests();
});

describe('TeacherDashboard student questions', () => {
  it('shows submitted Exam Training questions in the class queue', async () => {
    submitTeacherQuestion({
      message: 'Can you explain the M1 line?',
      studentDisplayName: 'Pilot Student',
      classId: 'class-p3-alpha',
      classCode: 'AST-P3A',
      questionId: 'p3_q1',
      questionLabel: 'Question 1',
      paper: '31autumn21',
      questionNumber: '1',
      regionName: 'Algebra Vault',
      topic: 'Algebra',
      practiceMode: 'Core Practice',
      createdAt: '2026-05-27T08:00:00.000Z',
      solutionRevealed: true,
    });

    const container = await render(
      <TeacherDashboard classId="class-p3-alpha" page="class" onNavigatePath={vi.fn()} />,
    );
    await waitForText(container, 'Student Questions');

    expect(container.textContent).toContain('Can you explain the M1 line?');
    expect(container.textContent).toContain('Pilot Student');
    expect(container.textContent).toContain('Core Practice');
    expect(container.textContent).toContain('Algebra Vault');
    expect(container.textContent).toContain('31autumn21 Q1');
    expect(container.textContent).toContain('Solution had been revealed when sent.');
  });
});
