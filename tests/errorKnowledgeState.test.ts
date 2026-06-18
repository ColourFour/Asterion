import { describe, expect, it } from 'vitest';
import { transformErrorToKnowledgeState, type KnowledgeAttemptEvidence } from '../src/lib/errorKnowledgeState';

function attempt(overrides: Partial<KnowledgeAttemptEvidence> = {}): KnowledgeAttemptEvidence {
  return {
    attemptId: 'attempt-1',
    source: 'checked_practice',
    timestamp: '2026-06-18T02:15:00.000Z',
    question: {
      questionId: 'q1',
      course: 'p3',
      topic: 'Integration',
      regionId: 'integration',
      skillNodes: [{
        id: 'p3_int_substitution_chain_rule',
        label: 'Integration by substitution',
        course: 'p3',
        regionId: 'integration',
        source: 'reviewed_skill_map',
      }],
      markPoints: [{
        id: 'q1_mp1',
        label: 'Apply the chain-rule adjustment',
        markCode: 'M1',
        gained: false,
        marks: 1,
        skillNodeIds: ['p3_int_substitution_chain_rule'],
        errorType: 'conceptual_gap',
        representation: 'composite-integrand',
        evidenceStrength: 0.9,
      }],
    },
    response: {
      finalAnswer: 'x^2 + c',
      timeTakenSeconds: 180,
    },
    evaluation: {
      marksEarned: 0,
      marksAvailable: 1,
    },
    ...overrides,
  };
}

describe('error-to-knowledge-state transformer', () => {
  it('maps a missed mark point to a skill-linked error and shifts first failure toward fragile', () => {
    const result = transformErrorToKnowledgeState({ attempt: attempt() });

    expect(result.errors).toEqual([
      expect.objectContaining({
        markPointId: 'q1_mp1',
        primarySkillNodeId: 'p3_int_substitution_chain_rule',
        skillNodeIds: ['p3_int_substitution_chain_rule'],
        errorType: 'conceptual_gap',
        severity: 'high',
      }),
    ]);
    expect(result.skillStateGraph.skills.p3_int_substitution_chain_rule).toMatchObject({
      category: 'unknown',
      stabilityFlag: 'fragile',
      lastOutcome: 'failure',
    });
    expect(result.skillStateGraph.skills.p3_int_substitution_chain_rule.score).toBeLessThan(50);
    expect(result.interventionPlan.action).toBe('micro_reteach');
    expect(result.schedulingInstruction).toMatchObject({
      retestTiming: 'immediate',
      difficultyRelation: 'isomorphic',
    });
  });

  it('detects a reusable misconception after repeated same-skill failures on different questions', () => {
    const first = transformErrorToKnowledgeState({ attempt: attempt() });
    const second = transformErrorToKnowledgeState({
      previousGraph: first.skillStateGraph,
      priorErrors: first.errors,
      attempt: attempt({
        attemptId: 'attempt-2',
        question: {
          ...attempt().question,
          questionId: 'q2',
          markPoints: [{
            id: 'q2_mp1',
            label: 'Adjust dx using the inner derivative',
            markCode: 'M1',
            gained: false,
            marks: 1,
            skillNodeIds: ['p3_int_substitution_chain_rule'],
            errorType: 'conceptual_gap',
            representation: 'substitution-equation',
            evidenceStrength: 0.9,
          }],
        },
        evaluation: {
          marksEarned: 0,
          marksAvailable: 1,
        },
      }),
    });

    expect(second.errors[0]).toMatchObject({
      repeat: true,
      misconceptionTag: 'p3_int_substitution_chain_rule:conceptual_gap:across-representations',
    });
    expect(second.skillStateGraph.misconceptions.p3_int_substitution_chain_rule?.tag).toBeUndefined();
    expect(second.skillStateGraph.misconceptions['p3_int_substitution_chain_rule:conceptual_gap:across-representations']).toMatchObject({
      description: expect.stringContaining('Integration by substitution'),
      evidenceCount: 2,
      questionIds: ['q1', 'q2'],
    });
    expect(second.interventionPlan.action).toBe('drill_set');
  });

  it('flags volatility when a skill fails after prior success', () => {
    const success = transformErrorToKnowledgeState({
      attempt: attempt({
        attemptId: 'success-1',
        timestamp: '2026-06-15T02:15:00.000Z',
        question: {
          ...attempt().question,
          questionId: 'q-success',
          markPoints: [{
            id: 'q_success_mp1',
            label: 'Apply substitution correctly',
            markCode: 'M1',
            gained: true,
            marks: 1,
            skillNodeIds: ['p3_int_substitution_chain_rule'],
            evidenceStrength: 0.9,
          }],
        },
        evaluation: {
          marksEarned: 1,
          marksAvailable: 1,
        },
      }),
    });
    const failure = transformErrorToKnowledgeState({
      previousGraph: success.skillStateGraph,
      attempt: attempt({
        attemptId: 'failure-after-success',
        timestamp: '2026-06-18T02:15:00.000Z',
      }),
    });

    expect(failure.stateUpdates[0]).toMatchObject({
      stabilityFlag: 'volatile',
      outcome: 'failure',
    });
    expect(failure.interventionPlan.action).toBe('delayed_retest');
    expect(failure.schedulingInstruction.retestTiming).toBe('delayed');
  });
});
