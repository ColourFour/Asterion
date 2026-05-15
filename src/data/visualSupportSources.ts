export type VisualSupportPageType = 'field-guide' | 'warm-up';

export type VisualSupportStatus = 'temporary-online-source' | 'review-required';

export interface VisualSupportSource {
  id: string;
  regionId?: string;
  topicIds?: string[];
  skillIds?: string[];
  pageType: VisualSupportPageType;
  title: string;
  purpose: string;
  imageUrl: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  altText: string;
  status: VisualSupportStatus;
  replacementNotes: string;
}

export const visualSupportSources: VisualSupportSource[] = [
  {
    id: 'logarithm-grove-log-exp-inverse',
    regionId: 'logarithm-grove',
    topicIds: ['9709_p3_topic_logarithmic_and_exponential_functions', 'logarithms_and_exponentials'],
    pageType: 'field-guide',
    title: 'Log and exponential shape reminder',
    purpose: 'Logarithm/exponential inverse relationship visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logarithm_plots.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Logarithm_plots.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'User:stpasha; previous author Richard F. Lyon, Wikimedia Commons',
    altText: 'Graphs of logarithm functions with different bases, showing logarithmic growth shape.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion mini-card showing exponential and logarithm curves as inverse functions, with no worked exam answer.',
  },
  {
    id: 'trig-observatory-unit-circle-quadrants',
    regionId: 'trig-observatory',
    topicIds: ['9709_p3_topic_trigonometry', 'trigonometry'],
    pageType: 'field-guide',
    title: 'Unit circle quadrant reminder',
    purpose: 'Unit circle quadrant reminder',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Unit_circle_angles_color.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unit_circle_angles_color.svg',
    license: 'Public domain, via Wikimedia Commons',
    attribution: 'Color version of original by Gustavb, Wikimedia Commons',
    altText: 'Unit circle diagram with common radian and degree angles around the four quadrants.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion quadrant sign and interval-check card for sine, cosine, and tangent.',
  },
  {
    id: 'complex-harbor-argand-plane',
    regionId: 'complex-harbor',
    topicIds: ['9709_p3_topic_complex_numbers', 'complex_numbers'],
    pageType: 'field-guide',
    title: 'Argand plane visual reminder',
    purpose: 'Argand plane visual reminder',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Complex_number_illustration.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Complex_number_illustration.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Wikimedia Commons contributor Wolfkeeper',
    altText: 'Complex number shown as a point and vector on real and imaginary axes.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion Argand mini-plot showing real axis, imaginary axis, modulus radius, and argument arc.',
  },
  {
    id: 'calculus-cliffs-derivative-tangent',
    regionId: 'calculus-cliffs',
    topicIds: ['9709_p3_topic_differentiation', 'differentiation'],
    pageType: 'field-guide',
    title: 'Derivative tangent-line reminder',
    purpose: 'Derivative tangent-line visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Derivative.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Derivative.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Olivier Cleynen, Wikimedia Commons',
    altText: 'Curve with a tangent line at one point, illustrating derivative as local gradient.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion tangent/normal flow card linking differentiate, substitute x, gradient, and line equation.',
  },
  {
    id: 'integration-gardens-area-under-curve',
    regionId: 'integration-gardens',
    topicIds: ['9709_p3_topic_integration', 'integration'],
    pageType: 'field-guide',
    title: 'Area under a curve reminder',
    purpose: 'Integration area-under-curve intuition',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Riemann_sum_convergence.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Riemann_sum_convergence.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Brad219, Wikimedia Commons; redrawn from original PNG source authored by KSmrq',
    altText: 'Riemann rectangles under a curve showing area approximation improving with thinner rectangles.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion definite-integral area card that avoids matching any live exam diagram.',
  },
  {
    id: 'vector-workshop-vector-components',
    regionId: 'vector-workshop',
    topicIds: ['9709_p3_topic_vectors', 'vectors'],
    pageType: 'field-guide',
    title: 'Vector direction and components',
    purpose: 'Vector direction and magnitude visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vector_components.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vector_components.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Jakob.scholbach, Wikimedia Commons',
    altText: 'Vector arrow broken into horizontal and vertical components on coordinate axes.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with an original Asterion vector-line card for position vector, direction vector, and parameter comparison.',
  },
  {
    id: 'logarithm-grove-warm-up-log-exp-inverse',
    regionId: 'logarithm-grove',
    topicIds: ['9709_p3_topic_logarithmic_and_exponential_functions', 'logarithms_and_exponentials'],
    pageType: 'warm-up',
    title: 'Log and exponential shape reminder',
    purpose: 'Post-reveal support for inverse log/exponential thinking',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logarithm_plots.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Logarithm_plots.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'User:stpasha; previous author Richard F. Lyon, Wikimedia Commons',
    altText: 'Graphs of logarithm functions with different bases, shown as a post-solution reminder.',
    status: 'temporary-online-source',
    replacementNotes: 'Replace with the same future Asterion log/exponential mini-card used by Field Guide.',
  },
];

function intersects(left: string[] | undefined, right: Array<string | undefined>): boolean {
  if (!left?.length) return false;
  const rightSet = new Set(right.filter((value): value is string => Boolean(value)));
  return left.some((value) => rightSet.has(value));
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function isDisplayableVisualSupportSource(source: VisualSupportSource): boolean {
  return (
    source.status === 'temporary-online-source'
    && hasText(source.id)
    && hasText(source.title)
    && hasText(source.purpose)
    && hasText(source.imageUrl)
    && hasText(source.sourceUrl)
    && hasText(source.license)
    && hasText(source.attribution)
    && hasText(source.altText)
    && hasText(source.replacementNotes)
    && Boolean(source.regionId || source.topicIds?.length || source.skillIds?.length)
  );
}

export function findVisualSupportSource(input: {
  pageType: VisualSupportPageType;
  regionId?: string;
  topicIds?: Array<string | undefined>;
  skillIds?: Array<string | undefined>;
}): VisualSupportSource | undefined {
  return visualSupportSources.find((source) => (
    isDisplayableVisualSupportSource(source)
    && source.pageType === input.pageType
    && (
      (input.regionId && source.regionId === input.regionId)
      || intersects(source.topicIds, input.topicIds ?? [])
      || intersects(source.skillIds, input.skillIds ?? [])
    )
  ));
}
