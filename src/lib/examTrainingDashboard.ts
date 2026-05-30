import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import type { NormalizedQuestion, RegionProgress, StoredProgress } from '../types';
import { filterMasteryEvidence, type MasteryPartEvidence } from './masteryEvidence';

export type ExamTrainingPracticeMode = 'core' | 'weak' | 'stretch';

export const EXAM_TRAINING_PRACTICE_LABELS: Record<ExamTrainingPracticeMode, string> = {
  core: 'Core Practice',
  weak: 'Weak Area Review',
  stretch: 'Stretch Practice',
};

export type ExamTrainingMasteryStatus = 'strong' | 'secure' | 'developing' | 'needs_work' | 'not_tried';

export interface ExamTrainingTopicMasteryItem {
  skillId: string;
  name: string;
  status: ExamTrainingMasteryStatus;
  statusLabel: string;
  scorePercent?: number;
  attempts: number;
  evidenceLabel: 'Recent saved practice' | 'Saved practice' | 'Try a question first';
}

export interface ExamTrainingRewardGoal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
}

const studentFriendlySkillNames: Record<string, string> = {
  'algebra.binomial_validity_range': 'Binomial Validity Range',
  'algebra.modulus_equation_basic': 'Modulus Equations',
  'algebra.partial_fractions_distinct_linear': 'Partial Fractions: Distinct Linear',
  'algebra.partial_fractions_repeated_linear': 'Partial Fractions: Repeated Linear',
  'algebra.polynomial_remainder_factor_basic': 'Polynomial Remainder & Factor',
  'algebra.structure_rearrangement_basic': 'Structure Rearrangement',
  'binomial_expansion.first_terms_and_coefficient': 'Binomial Expansion: First Terms',
  'complex_numbers.cartesian_conjugate_basic': 'Cartesian & Conjugate',
  'complex_numbers.locus_basic': 'Complex Locus',
  'complex_numbers.modulus_argument_basic': 'Modulus & Argument',
  'complex_numbers.roots_basic': 'Roots of Complex Numbers',
  'differential_equations.context_model_basic': 'Differential Equations: Context Model',
  'differential_equations.initial_condition_basic': 'Differential Equations: Initial Condition',
  'differential_equations.separation_basic': 'Differential Equations: Separation',
  'differentiation.chain_rule_basic': 'Chain Rule',
  'differentiation.chain_product_basic': 'Chain & Product Rule',
  'differentiation.implicit_log_exp_basic': 'Implicit Log/Exp Differentiation',
  'differentiation.product_rule_basic': 'Product Rule',
  'differentiation.stationary_tangent_normal_basic': 'Stationary, Tangent & Normal',
  'integration.definite_area_basic': 'Definite Area',
  'integration.method_setup_basic': 'Integration Method Setup',
  'integration.parts_substitution_basic': 'Integration by Parts/Substitution',
  'logarithms_and_exponentials.calculus_context_basic': 'Log/Exp Calculus Context',
  'logarithms_and_exponentials.domain_validation_basic': 'Domain Validation',
  'logarithms_and_exponentials.linearisation_basic': 'Linearisation',
  'logarithms_and_exponentials.log_equation_basic': 'Log Equations',
  'numerical_methods.accuracy_rounding_basic': 'Accuracy & Rounding',
  'numerical_methods.iteration_formula_basic': 'Iteration Formula',
  'numerical_methods.sign_change_iteration_basic': 'Sign Change Iteration',
  'parametric_equations.derivative_ratio_basic': 'Parametric Derivative Ratio',
  'quadratics.discriminant_root_condition_basic': 'Quadratic Discriminant & Root Condition',
  'trigonometry.identity_rewrite_basic': 'Trig Identity Rewrite',
  'trigonometry.double_angle_basic': 'Double Angle',
  'trigonometry.solve_equation_interval_basic': 'Solve Trig Equation on Interval',
  'trigonometry.r_form_basic': 'R-Form',
  'vectors.line_intersection_basic': 'Vector Line Intersection',
  'vectors.line_relationship_basic': 'Vector Line Relationships',
  'vectors.line_scalar_product_basic': 'Vector Scalar Product',
};

interface TopicMasteryContract {
  skillId: string;
  name: string;
  broadTopic: string;
  aliases: string[];
}

const regionBroadTopicLabels: Record<string, string> = {
  'algebra-forge': 'Algebra',
  'logarithm-grove': 'Logarithms and Exponentials',
  'trig-observatory': 'Trigonometry',
  'complex-harbor': 'Complex Numbers',
  'calculus-cliffs': 'Differentiation',
  'integration-gardens': 'Integration',
  'vector-workshop': 'Vectors',
  'numerical-mines': 'Numerical Methods',
  'differential-shrine': 'Differential Equations',
};

const fieldGuideTopicAliases: Record<string, string[]> = {
  algebra_modulus_graph_equations: ['algebra.modulus_equation_basic'],
  algebra_polynomial_division: ['algebra.structure_rearrangement_basic'],
  algebra_remainder_factor_theorem: ['algebra.polynomial_remainder_factor_basic'],
  algebra_partial_fractions: [
    'algebra.partial_fractions_distinct_linear',
    'algebra.partial_fractions_repeated_linear',
  ],
  algebra_binomial_expansion: [
    'algebra.binomial_validity_range',
    'binomial_expansion.first_terms_and_coefficient',
  ],
  log_equations_inequalities: [
    'logarithms_and_exponentials.log_equation_basic',
    'logarithms_and_exponentials.domain_validation_basic',
  ],
  log_linearisation: ['logarithms_and_exponentials.linearisation_basic'],
  trig_pythagorean_identities: [
    'trigonometry.identity_rewrite_basic',
    'trigonometry.solve_equation_interval_basic',
  ],
  trig_double_angle_formulae: ['trigonometry.double_angle_basic'],
  trig_r_form_transformations: ['trigonometry.r_form_basic'],
  complex_numbers_cartesian_conjugate_basic: ['complex_numbers.cartesian_conjugate_basic'],
  complex_numbers_modulus_argument_basic: ['complex_numbers.modulus_argument_basic'],
  complex_numbers_locus_basic: ['complex_numbers.locus_basic'],
  complex_numbers_roots_basic: ['complex_numbers.roots_basic'],
  derivatives_exponential_logarithmic: ['differentiation.implicit_log_exp_basic'],
  derivatives_product_rule: ['differentiation.product_rule_basic', 'differentiation.chain_product_basic'],
  derivatives_implicit: ['differentiation.stationary_tangent_normal_basic'],
  derivatives_parametric: ['parametric_equations.derivative_ratio_basic'],
  integrals_basic_trig: ['integration.method_setup_basic'],
  integrals_substitution: ['integration.parts_substitution_basic'],
  integrals_by_parts: ['integration.parts_substitution_basic'],
  vectors_line_equation: ['vectors.line_relationship_basic'],
  vectors_intersect_parallel_skew: [
    'vectors.line_intersection_basic',
    'vectors.line_relationship_basic',
  ],
  vectors_scalar_product: ['vectors.line_scalar_product_basic'],
  vectors_angle_between_lines: ['vectors.line_scalar_product_basic'],
  iteration_change_of_sign: [
    'numerical_methods.sign_change_iteration_basic',
    'numerical_methods.accuracy_rounding_basic',
  ],
  iteration_fixed_point_roots: ['numerical_methods.iteration_formula_basic'],
  iteration_convergence: ['numerical_methods.accuracy_rounding_basic'],
  differential_first_order_model: ['differential_equations.context_model_basic'],
  differential_separable_variables: ['differential_equations.separation_basic'],
  differential_particular_solutions: ['differential_equations.initial_condition_basic'],
  differential_modeling: ['differential_equations.context_model_basic'],
};

function aliasKey(skillId: string): string {
  return skillId.replace(/\./g, '_');
}

export const EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS: TopicMasteryContract[] = Object.entries(FIELD_GUIDE_TOPICS_BY_REGION)
  .flatMap(([regionId, topics]) => topics.map((topic) => {
    const skillId = topic.skillIds[0];
    return {
      skillId,
      name: topic.title,
      broadTopic: regionBroadTopicLabels[regionId] ?? topic.title,
      aliases: Array.from(new Set([
        ...topic.skillIds,
        ...(fieldGuideTopicAliases[skillId] ?? []),
        ...(fieldGuideTopicAliases[aliasKey(skillId)] ?? []),
      ])),
    };
  }));

const contractBySkillOrAlias = new Map<string, TopicMasteryContract>();
for (const contract of EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS) {
  contractBySkillOrAlias.set(contract.skillId, contract);
  for (const alias of contract.aliases) {
    contractBySkillOrAlias.set(alias, contract);
  }
}

interface SkillEvidenceStats {
  marksEarned: number;
  marksAvailable: number;
  ratios: number[];
  questionIds: Set<string>;
}

function normalizeSkillId(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function allExamTrainingSkillIds(): string[] {
  return EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS.map((contract) => contract.skillId);
}

function contractForSkillId(skillId: string | undefined): TopicMasteryContract | undefined {
  const normalized = normalizeSkillId(skillId);
  return normalized ? contractBySkillOrAlias.get(normalized) : undefined;
}

function canonicalExamTrainingSkillId(skillId: string): string | undefined {
  return contractForSkillId(skillId)?.skillId;
}

function fallbackSkillName(skillId: string): string {
  return skillId
    .split('.')
    .pop()!
    .replace(/_basic$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function examTrainingSkillName(skillId: string | undefined): string | undefined {
  const normalized = normalizeSkillId(skillId);
  if (!normalized) return undefined;
  return contractForSkillId(normalized)?.name ?? studentFriendlySkillNames[normalized] ?? fallbackSkillName(normalized);
}

export function knownExamTrainingSkillName(skillId: string | undefined): string | undefined {
  const normalized = normalizeSkillId(skillId);
  if (!normalized) return undefined;
  return contractForSkillId(normalized)?.name ?? studentFriendlySkillNames[normalized];
}

function addEvidence(stats: SkillEvidenceStats, input: {
  marksEarned: number;
  marksAvailable: number;
  ratio?: number;
  questionId: string;
}) {
  if (input.marksAvailable <= 0) return;
  stats.marksEarned += input.marksEarned;
  stats.marksAvailable += input.marksAvailable;
  const ratio = typeof input.ratio === 'number' && Number.isFinite(input.ratio)
    ? input.ratio
    : input.marksEarned / input.marksAvailable;
  if (Number.isFinite(ratio)) stats.ratios.push(ratio);
  stats.questionIds.add(input.questionId);
}

function partSkillIds(part: MasteryPartEvidence): string[] {
  return [part.skillRef, part.primaryTopicId]
    .map(normalizeSkillId)
    .filter((skillId): skillId is string => Boolean(skillId));
}

function statusForScore(score: number | undefined, attempts: number): Pick<ExamTrainingTopicMasteryItem, 'status' | 'statusLabel'> {
  if (attempts <= 0 || typeof score !== 'number' || !Number.isFinite(score)) {
    return { status: 'not_tried', statusLabel: 'Not Tried' };
  }
  if (score >= 0.8) return { status: 'strong', statusLabel: 'Strong' };
  if (score >= 0.65) return { status: 'secure', statusLabel: 'Secure' };
  if (score >= 0.45) return { status: 'developing', statusLabel: 'Developing' };
  return { status: 'needs_work', statusLabel: 'Needs Work' };
}

function topicProfileScore(progress: StoredProgress, skillId: string, name: string): number | undefined {
  const exactProfile = progress.topicProfiles[skillId]
    ?? Object.values(progress.topicProfiles).find((profile) => profile.topic === skillId || profile.topic === name);
  if (!exactProfile || exactProfile.attempts <= 0) return undefined;
  return exactProfile.masteryScore;
}

export function buildExamTrainingTopicMastery(input: {
  progress: StoredProgress;
  questions: NormalizedQuestion[];
}): ExamTrainingTopicMasteryItem[] {
  const skillIds = allExamTrainingSkillIds();
  const knownSkillIds = new Set([
    ...skillIds,
    ...EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS.flatMap((contract) => contract.aliases),
  ].map(normalizeSkillId).filter((skillId): skillId is string => Boolean(skillId)));
  const statsBySkillId = new Map<string, SkillEvidenceStats>();
  const getStats = (skillId: string) => {
    const normalized = canonicalExamTrainingSkillId(skillId) ?? normalizeSkillId(skillId)!;
    let stats = statsBySkillId.get(normalized);
    if (!stats) {
      stats = { marksEarned: 0, marksAvailable: 0, ratios: [], questionIds: new Set<string>() };
      statsBySkillId.set(normalized, stats);
    }
    return stats;
  };

  const masteryEvidence = filterMasteryEvidence({
    attempts: input.progress.attempts,
    questions: input.questions,
  });

  for (const evidence of masteryEvidence) {
    let matchedPartEvidence = false;
    for (const part of evidence.partEvidence ?? []) {
      for (const skillId of partSkillIds(part)) {
        if (!knownSkillIds.has(skillId)) continue;
        matchedPartEvidence = true;
        addEvidence(getStats(skillId), {
          marksEarned: part.marksEarned,
          marksAvailable: part.marksAvailable,
          ratio: part.scoreRatio,
          questionId: evidence.attempt.questionId,
        });
      }
    }

    const routeSkillId = normalizeSkillId(evidence.question?.routeEvidence?.primaryTopicId ?? evidence.question?.topicRouting?.primaryTopicId);
    if (!matchedPartEvidence && routeSkillId && knownSkillIds.has(routeSkillId)) {
      addEvidence(getStats(routeSkillId), {
        marksEarned: evidence.marksEarned,
        marksAvailable: evidence.marksAvailable,
        ratio: evidence.scoreRatio,
        questionId: evidence.attempt.questionId,
      });
    }
  }

  return skillIds.map((skillId) => {
    const contract = contractForSkillId(skillId);
    const name = contract?.name ?? studentFriendlySkillNames[skillId] ?? fallbackSkillName(skillId);
    const stats = statsBySkillId.get(normalizeSkillId(skillId)!);
    const profileScore = topicProfileScore(input.progress, skillId, name)
      ?? contract?.aliases.map((alias) => topicProfileScore(input.progress, alias, name)).find((score) => typeof score === 'number');
    const lifetimeScore = stats && stats.marksAvailable > 0 ? stats.marksEarned / stats.marksAvailable : undefined;
    const recentRatios = stats?.ratios.slice(-8) ?? [];
    const recentScore = recentRatios.length ? recentRatios.reduce((sum, value) => sum + value, 0) / recentRatios.length : undefined;
    const projectedScore = typeof lifetimeScore === 'number' && typeof recentScore === 'number'
      ? lifetimeScore * 0.45 + recentScore * 0.55
      : profileScore;
    const attempts = stats?.questionIds.size ?? (typeof profileScore === 'number' ? 1 : 0);
    const status = statusForScore(projectedScore, attempts);
    return {
      skillId,
      name,
      ...status,
      scorePercent: attempts > 0 && typeof projectedScore === 'number' ? Math.round(projectedScore * 100) : undefined,
      attempts,
      evidenceLabel: attempts > 0
        ? stats ? 'Recent saved practice' : 'Saved practice'
        : 'Try a question first',
    };
  });
}

export function buildExamTrainingRewardGoals(input: {
  progress: StoredProgress;
  topicMastery: ExamTrainingTopicMasteryItem[];
  worldProgress: RegionProgress[];
}): ExamTrainingRewardGoal[] {
  const algebraAttempts = input.worldProgress.find((item) => item.region.id === 'algebra-forge')?.attempts ?? 0;
  const strongTopics = input.topicMastery.filter((item) => item.status === 'strong').length;
  const p3SavedAttempts = input.progress.attempts.filter((attempt) => String(attempt.paperFamily).toLowerCase() === 'p3').length;

  return [
    {
      id: 'algebra-practice',
      title: 'Algebra Practice',
      description: 'Complete 40 Algebra exam-training items.',
      current: algebraAttempts,
      target: 40,
    },
    {
      id: 'topic-confidence',
      title: 'Topic Confidence',
      description: 'Score 80%+ on 5 topics.',
      current: strongTopics,
      target: 5,
    },
    {
      id: 'p3-practice',
      title: 'Exam Practice',
      description: 'Complete 100 Exam Training items.',
      current: p3SavedAttempts,
      target: 100,
    },
  ];
}
