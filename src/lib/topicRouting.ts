import type { RegionDefinition } from '../types';

export interface TopicRoutingMetadata {
  primaryTopicId?: string;
  confidence?: string;
  reviewRequired?: boolean;
  reviewReasons?: string[];
  evidenceUsed?: string[];
  routingSource?: string;
  mappedRegionId?: string;
}

export const P3_TOPIC_ID_TO_REGION_ID: Record<string, string> = {
  '9709_p3_topic_algebra': 'algebra-forge',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'logarithm-grove',
  '9709_p3_topic_trigonometry': 'trig-observatory',
  '9709_p3_topic_complex_numbers': 'complex-harbor',
  '9709_p3_topic_differentiation': 'calculus-cliffs',
  '9709_p3_topic_integration': 'integration-gardens',
  '9709_p3_topic_vectors': 'vector-workshop',
  '9709_p3_topic_numerical_solution_of_equations': 'numerical-mines',
  '9709_p3_topic_differential_equations': 'differential-shrine',
};

export const P3_TOPIC_ID_TO_REGION_NAME: Record<string, string> = {
  '9709_p3_topic_algebra': 'Algebra Vault',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'Logarithm Observatory',
  '9709_p3_topic_trigonometry': 'Trigonometry Spire',
  '9709_p3_topic_complex_numbers': 'Argand Atrium',
  '9709_p3_topic_differentiation': 'Calculus Cliffs',
  '9709_p3_topic_integration': 'Integral Terraces',
  '9709_p3_topic_vectors': 'Vectors Gate',
  '9709_p3_topic_numerical_solution_of_equations': 'Iteration Forge',
  '9709_p3_topic_differential_equations': 'Differential Shrine',
};

export function regionForTopicRouting(
  routing: TopicRoutingMetadata | undefined,
  regions: RegionDefinition[],
): RegionDefinition | undefined {
  if (!routing?.mappedRegionId) return undefined;
  return regions.find((region) => region.id === routing.mappedRegionId);
}
