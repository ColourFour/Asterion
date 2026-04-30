export interface TopicDefinition {
  id: string;
  label: string;
  focusSubtopics: string[];
}

export const P3_TOPIC_MAP: TopicDefinition[] = [
  { id: 'algebra', label: 'Algebra', focusSubtopics: ['long division', 'modulus', 'binomial expansion', 'partial fractions'] },
  { id: 'logs-exp', label: 'Logarithmic and exponential functions', focusSubtopics: ['logarithms', 'exponentials'] },
  { id: 'trigonometry', label: 'Trigonometry', focusSubtopics: ['trigonometric identities', 'equations', 'radians'] },
  { id: 'differentiation', label: 'Differentiation', focusSubtopics: ['chain rule', 'product rule', 'implicit differentiation'] },
  { id: 'integration', label: 'Integration', focusSubtopics: ['substitution', 'parts', 'partial fractions'] },
  { id: 'numerical', label: 'Numerical solution of equations', focusSubtopics: ['iteration', 'sign change', 'Newton-Raphson'] },
  { id: 'vectors', label: 'Vectors', focusSubtopics: ['lines', 'scalar product', 'geometry'] },
  { id: 'differential-equations', label: 'Differential equations', focusSubtopics: ['separation of variables', 'modelling'] },
  { id: 'complex', label: 'Complex numbers', focusSubtopics: ['polar form', 'modulus', 'argument', 'loci'] },
];

export function topicIdFromLabel(label: string): string {
  const normalized = label.toLowerCase();
  const match = P3_TOPIC_MAP.find((topic) => normalized.includes(topic.label.toLowerCase()) || topic.label.toLowerCase().includes(normalized));
  return match?.id ?? (normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unclassified');
}
