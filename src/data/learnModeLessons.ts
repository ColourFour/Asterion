import { getFieldGuideTopicsForRegion, type FieldGuideTopic, type FieldGuideTopicExample } from './fieldGuideTopics';
import {
  getSkillCheckItemsForFieldGuideTopic,
  skillCheckAnswerSpecForItem,
  type SkillCheckInputType,
  type SkillCheckItem,
} from './skillCheckItems';
import { getAuthoredAlgebraLearnSteps } from './algebraLearnSteps';
import { getAuthoredLogExpLearnSteps } from './logarithmicExponentialLearnSteps';
import { getAuthoredTrigonometryLearnSteps } from './trigonometryLearnSteps';
import { getAuthoredVectorsLearnSteps } from './vectorsLearnSteps';
import { getAuthoredDifferentiationLearnSteps } from './differentiationLearnSteps';
import { getAuthoredIntegrationLearnSteps } from './integrationLearnSteps';
import { getAuthoredDifferentialEquationsLearnSteps } from './differentialEquationsLearnSteps';
import { getAuthoredComplexNumbersLearnSteps } from './complexNumbersLearnSteps';
import { getAuthoredIterationLearnSteps } from './iterationLearnSteps';

export type LearnStepInputType =
  | 'multiple-choice'
  | 'numeric'
  | 'vector'
  | 'equation'
  | 'text'
  | 'multi-part';

export interface LearnStep {
  id: string;
  title: string;
  stem: string;
  prompt: string;
  inputType: LearnStepInputType;
  expectedAnswer: unknown;
  hint?: string;
  explanation: string;
  principle?: string;
  mistakeTags?: string[];
  nextStepLabel?: string;
  examTransfer: string;
  fieldGuideTopic: FieldGuideTopic;
  primaryCheck?: SkillCheckItem;
  similarCheck?: SkillCheckItem;
  primaryMirrorsSkillEvidence?: boolean;
  similarMirrorsSkillEvidence?: boolean;
  visualTopicIds?: string[];
}

export const LEARN_VISUAL_TOPIC_IDS_BY_STEP_ID: Record<string, string[]> = {
  'learn-alg-absolute-value-graph': ['algebra_modulus_graph_equations'],
  'learn-alg-absolute-value-equations': ['algebra_modulus_graph_equations'],
  'learn-alg-absolute-value-inequalities': ['algebra_modulus_graph_equations'],
  'learn-alg-absolute-value-graph-intervals': ['algebra_modulus_graph_equations'],
  'learn-log-natural-e-inverse': ['log_graph_inverse'],
  'learn-trig-reciprocal-graphs': ['trig_reciprocal_functions'],
  'learn-trig-reciprocal-identities-equations': ['trig_reciprocal_functions'],
  'learn-trig-identity-full-solve': ['trig_double_angle_formulae'],
  'learn-trig-basic-equation-interval': ['trig_double_angle_formulae'],
  'learn-trig-r-form-transform': ['trig_r_form_transformations'],
  'learn-diff-tangent-gradient': ['p3_diff_stationary_tangent_normal'],
  'learn-diff-normal-gradient': ['p3_diff_stationary_tangent_normal'],
  'learn-diff-stationary-condition': ['p3_diff_stationary_tangent_normal'],
  'learn-diff-classify-stationary': ['p3_diff_stationary_tangent_normal'],
  'learn-int-definite-upper-minus-lower': ['integrals_definite_area_bridge'],
  'learn-int-area-between-curves': ['integrals_definite_area_bridge'],
  'learn-iteration-sign-change-bracket': ['iteration_graph_root_proof'],
  'learn-iteration-graph-link': ['iteration_graph_root_proof'],
  'learn-complex-modulus': ['modulus-argument'],
  'learn-complex-argument-quadrant': ['modulus-argument'],
  'learn-complex-cartesian-to-modarg': ['modulus-argument'],
  'learn-complex-modarg-to-cartesian': ['modulus-argument'],
  'learn-complex-roots-arguments': ['roots'],
  'learn-complex-modulus-locus': ['locus'],
  'learn-complex-argument-locus': ['locus'],
  'learn-vectors-line-intersection': ['vectors_intersect_parallel_skew'],
  'learn-vectors-skew-check': ['vectors_intersect_parallel_skew'],
  'learn-vectors-foot-of-perpendicular': ['vectors_point_to_line_distance'],
  'learn-vectors-reflection-in-line': ['vectors_point_to_line_distance'],
};

function withContextualVisuals(steps: LearnStep[]): LearnStep[] {
  return steps.map((step) => ({
    ...step,
    visualTopicIds: LEARN_VISUAL_TOPIC_IDS_BY_STEP_ID[step.id],
  }));
}

function learnInputType(inputType: SkillCheckInputType | undefined): LearnStepInputType {
  if (inputType === 'multiple_choice' || inputType === 'checkbox' || inputType === 'ordered_cards') return 'multiple-choice';
  if (inputType === 'two_value') return 'multi-part';
  if (inputType === 'numeric') return 'numeric';
  return 'text';
}

function firstExpectedAnswer(item: SkillCheckItem | undefined): unknown {
  if (!item) return undefined;
  const spec = skillCheckAnswerSpecForItem(item);
  if (spec?.acceptedAnswers.length) return spec.acceptedAnswers;
  return item.expectedAnswer ?? item.expectedOptionIds ?? item.expectedOrder;
}

function fallbackAcceptedAnswer(example: FieldGuideTopicExample | undefined): string {
  return (example?.tryResult ?? example?.result ?? '')
    .replace(/^\$\$?\s*/, '')
    .replace(/\s*\$\$?$/, '')
    .trim();
}

function fallbackLearnCheck(regionId: string | undefined, fieldGuideTopic: FieldGuideTopic): SkillCheckItem | undefined {
  const example = fieldGuideTopic.examples[0];
  const acceptedAnswer = fallbackAcceptedAnswer(example);
  if (!example || !acceptedAnswer) return undefined;
  return {
    itemId: `learn-check-${fieldGuideTopic.id}`,
    paperFamily: 'p3',
    regionId: regionId ?? '',
    fieldGuideTopicId: fieldGuideTopic.id,
    fieldGuideSubtopicId: fieldGuideTopic.id,
    skillId: fieldGuideTopic.skillIds[0] ?? fieldGuideTopic.id,
    prompt: example.lesson?.similarOne ?? example.tryPrompt ?? example.prompt,
    inputType: 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: [acceptedAnswer],
    repairStep: example.tryWorkedLines?.[0] ?? example.workedLines[0],
    mistakeTags: ['method choice', 'incomplete reasoning'],
    expectedAnswer: acceptedAnswer,
    complexity: 'foundation',
    hints: {
      nudge: example.lesson?.nextUsefulPiece ?? example.tryScaffold[0] ?? 'Use the named method from this Learn step.',
      methodCue: example.patternTitle,
      firstStep: example.tryWorkedLines?.[0] ?? example.workedLines[0],
    },
    workedRoute: example.tryWorkedLines?.length ? example.tryWorkedLines : example.workedLines,
    sourceTypes: ['authored'],
    sourceRefs: {},
    review: {
      status: 'teacher_reviewed',
      sourceSkillReviewed: true,
      markEventReviewed: false,
      affectsProgression: false,
    },
  };
}

export function getLearnStepsForRegion(regionId: string | undefined): LearnStep[] {
  const fieldGuideTopics = getFieldGuideTopicsForRegion(regionId);
  if (regionId === 'algebra') return withContextualVisuals(getAuthoredAlgebraLearnSteps(fieldGuideTopics));
  if (regionId === 'logarithmic-and-exponential-functions') return withContextualVisuals(getAuthoredLogExpLearnSteps(fieldGuideTopics));
  if (regionId === 'trigonometry') return withContextualVisuals(getAuthoredTrigonometryLearnSteps(fieldGuideTopics));
  if (regionId === 'differentiation') return withContextualVisuals(getAuthoredDifferentiationLearnSteps(fieldGuideTopics));
  if (regionId === 'integration') return withContextualVisuals(getAuthoredIntegrationLearnSteps(fieldGuideTopics));
  if (regionId === 'numerical-solution-of-equations') return withContextualVisuals(getAuthoredIterationLearnSteps(fieldGuideTopics));
  if (regionId === 'differential-equations') return withContextualVisuals(getAuthoredDifferentialEquationsLearnSteps(fieldGuideTopics));
  if (regionId === 'complex-numbers') return withContextualVisuals(getAuthoredComplexNumbersLearnSteps(fieldGuideTopics));
  if (regionId === 'vectors') return withContextualVisuals(getAuthoredVectorsLearnSteps(fieldGuideTopics));

  return withContextualVisuals(fieldGuideTopics.map((fieldGuideTopic): LearnStep => {
    const example = fieldGuideTopic.examples[0];
    const lesson = example?.lesson;
    const checkableItems = getSkillCheckItemsForFieldGuideTopic(fieldGuideTopic.id)
      .filter((item) => Boolean(skillCheckAnswerSpecForItem(item)));
    const primaryCheck = checkableItems[0] ?? fallbackLearnCheck(regionId, fieldGuideTopic);
    const similarCheck = checkableItems.find((item) => item.itemId !== primaryCheck?.itemId);

    return {
      id: `learn-${fieldGuideTopic.id}`,
      title: fieldGuideTopic.title,
      stem: primaryCheck?.prompt ?? lesson?.needProblem ?? example?.prompt ?? fieldGuideTopic.preview,
      prompt: lesson?.studentAction ?? primaryCheck?.hints.firstStep ?? 'Try the first useful move before opening the explanation.',
      inputType: learnInputType(primaryCheck?.inputType),
      expectedAnswer: firstExpectedAnswer(primaryCheck),
      hint: primaryCheck?.hints.nudge ?? lesson?.nextUsefulPiece ?? example?.tryScaffold[0],
      explanation: primaryCheck?.workedRoute.join(' ') ?? lesson?.nextUsefulPiece ?? example?.workedLines.join(' ') ?? fieldGuideTopic.description,
      principle: lesson?.namedPrinciple ?? `Principle: ${fieldGuideTopic.title}.`,
      mistakeTags: primaryCheck?.mistakeTags,
      nextStepLabel: similarCheck ? 'Try a similar checked question' : undefined,
      examTransfer: lesson?.examTransfer ?? example?.takeaway.at(-1) ?? 'Exam transfer: identify the method before completing the routine calculation.',
      fieldGuideTopic,
      primaryCheck,
      similarCheck,
      primaryMirrorsSkillEvidence: true,
      similarMirrorsSkillEvidence: true,
    };
  }));
}

export function validateLearnSteps(regionIds: string[]): string[] {
  return regionIds.flatMap((regionId) => getLearnStepsForRegion(regionId).flatMap((step) => {
    const errors: string[] = [];
    if (!step.stem.trim()) errors.push(`${regionId}/${step.id} is missing a stem`);
    if (!step.prompt.trim()) errors.push(`${regionId}/${step.id} is missing an action prompt`);
    if (!step.explanation.trim()) errors.push(`${regionId}/${step.id} is missing an explanation`);
    if (!step.principle?.trim()) errors.push(`${regionId}/${step.id} is missing a named principle`);
    if (!step.examTransfer.trim()) errors.push(`${regionId}/${step.id} is missing exam transfer text`);
    if (!step.primaryCheck) errors.push(`${regionId}/${step.id} has no deterministic primary check`);
    if (!step.expectedAnswer) errors.push(`${regionId}/${step.id} is missing expected answer data`);
    if (!step.hint?.trim()) errors.push(`${regionId}/${step.id} is missing a targeted hint`);
    return errors;
  }));
}
