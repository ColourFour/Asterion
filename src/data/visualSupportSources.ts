export type VisualSupportPageType = 'field-guide' | 'warm-up';

export type VisualSupportStatus = 'approved' | 'temporary-online-source' | 'review-required';
export type VisualSupportKind = 'mini_diagram' | 'method_pattern' | 'none' | 'needs_visual';

export interface VisualSupportSource {
  id: string;
  regionId?: string;
  topicIds?: string[];
  skillIds?: string[];
  pageType: VisualSupportPageType;
  visualKind: VisualSupportKind;
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
    id: 'algebra-forge-binomial-structure',
    regionId: 'algebra-forge',
    topicIds: ['9709_p3_topic_algebra', 'algebra'],
    skillIds: ['p3_alg_binomial_terms_coefficients', 'p3_alg_structure_rearrangement'],
    pageType: 'field-guide',
    visualKind: 'method_pattern',
    title: 'Binomial structure method pattern',
    purpose: 'Method pattern for binomial expansion term structure',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Binomial_theorem_visualisation.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Binomial_theorem_visualisation.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Cmglee, Wikimedia Commons',
    altText: 'Visual decomposition of binomial expansion into line, square, cube, and fourth-power structures.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Algebra Vault mini-card showing coefficient structure and expansion choices before calculation.',
  },
  {
    id: 'algebra-forge-warm-up-binomial-structure',
    regionId: 'algebra-forge',
    topicIds: ['9709_p3_topic_algebra', 'algebra'],
    skillIds: ['p3_alg_binomial_terms_coefficients', 'p3_alg_binomial_validity'],
    pageType: 'warm-up',
    visualKind: 'method_pattern',
    title: 'Binomial structure method pattern',
    purpose: 'Post-reveal method pattern for expansion terms and validity checks',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Binomial_theorem_visualisation.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Binomial_theorem_visualisation.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Cmglee, Wikimedia Commons',
    altText: 'Binomial expansion visual shown after reveal as a reminder of term structure.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Algebra Vault post-reveal card for binomial coefficients, term choice, and validity checks.',
  },
  {
    id: 'logarithm-grove-log-exp-inverse',
    regionId: 'logarithm-grove',
    topicIds: ['9709_p3_topic_logarithmic_and_exponential_functions', 'logarithms_and_exponentials'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Log and exponential shape reminder',
    purpose: 'Logarithm/exponential inverse relationship visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logarithm_plots.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Logarithm_plots.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'User:stpasha; previous author Richard F. Lyon, Wikimedia Commons',
    altText: 'Graphs of logarithm functions with different bases, showing logarithmic growth shape.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion mini-card showing exponential and logarithm curves as inverse functions, with no worked exam answer.',
  },
  {
    id: 'trig-observatory-unit-circle-quadrants',
    regionId: 'trig-observatory',
    topicIds: ['9709_p3_topic_trigonometry', 'trigonometry'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Unit circle quadrant reminder',
    purpose: 'Unit circle quadrant reminder',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Unit_circle_angles_color.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unit_circle_angles_color.svg',
    license: 'Public domain, via Wikimedia Commons',
    attribution: 'Color version of original by Gustavb, Wikimedia Commons',
    altText: 'Unit circle diagram with common radian and degree angles around the four quadrants.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion quadrant sign and interval-check card for sine, cosine, and tangent.',
  },
  {
    id: 'trig-observatory-warm-up-sine-cosine-periodicity',
    regionId: 'trig-observatory',
    topicIds: ['9709_p3_topic_trigonometry', 'trigonometry'],
    skillIds: ['p3_trig_equation_interval', 'p3_trig_quadrant_solutions'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Sine and cosine periodicity',
    purpose: 'Post-reveal support for checking interval solutions',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sine_and_Cosine.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sine_and_Cosine.svg',
    license: 'Public domain, via Wikimedia Commons',
    attribution: 'Inductiveload, Wikimedia Commons',
    altText: 'Graphs of sine and cosine from negative three pi to three pi, showing periodic wave shapes.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Trigonometry Spire interval sweep card showing sine and cosine periods with quadrant sign checks.',
  },
  {
    id: 'complex-harbor-argand-plane',
    regionId: 'complex-harbor',
    topicIds: ['9709_p3_topic_complex_numbers', 'complex_numbers'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Argand plane visual reminder',
    purpose: 'Argand plane visual reminder',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Complex_number_illustration.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Complex_number_illustration.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Wikimedia Commons contributor Wolfkeeper',
    altText: 'Complex number shown as a point and vector on real and imaginary axes.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion Argand mini-plot showing real axis, imaginary axis, modulus radius, and argument arc.',
  },
  {
    id: 'complex-harbor-warm-up-modulus-argument',
    regionId: 'complex-harbor',
    topicIds: ['9709_p3_topic_complex_numbers', 'complex_numbers'],
    skillIds: ['p3_complex_modulus_argument_form', 'p3_complex_argand_loci_regions'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Modulus and argument reminder',
    purpose: 'Post-reveal support for polar-form and Argand interpretation',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Complex_number_illustration_modarg.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Complex_number_illustration_modarg.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Kan8eDie, Wikimedia Commons',
    altText: 'Complex number shown on an Argand plane with modulus radius and argument angle.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Argand Atrium mini-plane showing point z, modulus radius, and argument arc in the region visual style.',
  },
  {
    id: 'calculus-cliffs-derivative-tangent',
    regionId: 'calculus-cliffs',
    topicIds: ['9709_p3_topic_differentiation', 'differentiation'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Derivative tangent-line reminder',
    purpose: 'Derivative tangent-line visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Derivative.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Derivative.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Olivier Cleynen, Wikimedia Commons',
    altText: 'Curve with a tangent line at one point, illustrating derivative as local gradient.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion tangent/normal flow card linking differentiate, substitute x, gradient, and line equation.',
  },
  {
    id: 'calculus-cliffs-warm-up-derivative-tangent',
    regionId: 'calculus-cliffs',
    topicIds: ['9709_p3_topic_differentiation', 'differentiation'],
    skillIds: ['p3_diff_stationary_tangent_normal', 'p3_diff_method_selection'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Derivative as local gradient',
    purpose: 'Post-reveal support for tangent and gradient interpretation',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Derivative.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Derivative.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Olivier Cleynen, Wikimedia Commons',
    altText: 'Curve with a tangent line at one point, used after reveal to connect derivative and local gradient.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Calculus Cliffs mini-card showing derivative, tangent gradient, normal gradient, and line-equation setup.',
  },
  {
    id: 'integration-gardens-area-under-curve',
    regionId: 'integration-gardens',
    topicIds: ['9709_p3_topic_integration', 'integration'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Area under a curve reminder',
    purpose: 'Integration area-under-curve intuition',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Riemann_sum_convergence.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Riemann_sum_convergence.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Brad219, Wikimedia Commons; redrawn from original PNG source authored by KSmrq',
    altText: 'Riemann rectangles under a curve showing area approximation improving with thinner rectangles.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion definite-integral area card that avoids matching any live exam diagram.',
  },
  {
    id: 'integration-gardens-warm-up-riemann-area',
    regionId: 'integration-gardens',
    topicIds: ['9709_p3_topic_integration', 'integration'],
    skillIds: ['p3_int_definite_improper_area', 'p3_int_method_choice'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Area accumulation reminder',
    purpose: 'Post-reveal support for definite-integral area meaning',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Riemann_sum_convergence.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Riemann_sum_convergence.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Brad219, Wikimedia Commons; redrawn from original PNG source authored by KSmrq',
    altText: 'Riemann rectangles under a curve shown after reveal as a reminder of area accumulation.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Integral Terraces post-reveal card showing signed area and bounds without matching exam artwork.',
  },
  {
    id: 'vector-workshop-vector-components',
    regionId: 'vector-workshop',
    topicIds: ['9709_p3_topic_vectors', 'vectors'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Vector direction and components',
    purpose: 'Vector direction and magnitude visual',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vector_components.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vector_components.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Jakob.scholbach, Wikimedia Commons',
    altText: 'Vector arrow broken into horizontal and vertical components on coordinate axes.',
    status: 'approved',
    replacementNotes: 'Replace with an original Asterion vector-line card for position vector, direction vector, and parameter comparison.',
  },
  {
    id: 'vector-workshop-warm-up-3d-vector',
    regionId: 'vector-workshop',
    topicIds: ['9709_p3_topic_vectors', 'vectors'],
    skillIds: ['p3_vec_line_equations_intersections', 'p3_vec_3d_geometry_modelling'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: '3D vector direction reminder',
    purpose: 'Post-reveal support for components and direction in 3D',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/3D_Vector.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:3D_Vector.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Acdx, Wikimedia Commons',
    altText: 'Three-dimensional coordinate axes with a vector direction shown from the origin.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Vectors Gate card showing position vector, direction vector, and component comparison on 3D axes.',
  },
  {
    id: 'numerical-mines-cobweb-iteration',
    regionId: 'numerical-mines',
    topicIds: ['9709_p3_topic_numerical_solution_of_equations', 'numerical_solution_of_equations'],
    skillIds: ['p3_num_iteration_formula', 'p3_num_accuracy_rounding'],
    pageType: 'field-guide',
    visualKind: 'needs_visual',
    title: 'Fixed-point iteration visual',
    purpose: 'Cobweb diagram reminder for repeated iteration',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cobweb_plot.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cobweb_plot.svg',
    license: 'CC BY-SA 4.0, via Wikimedia Commons',
    attribution: 'Wikimedia Commons contributor Prillwitz',
    altText: 'Cobweb plot showing repeated fixed-point iteration steps between a curve and the line y equals x.',
    status: 'review-required',
    replacementNotes: 'Replace with an Asterion original Iteration Forge cobweb card showing x_n to x_n+1 movement and convergence checks.',
  },
  {
    id: 'numerical-mines-newton-iteration',
    regionId: 'numerical-mines',
    topicIds: ['9709_p3_topic_numerical_solution_of_equations', 'numerical_solution_of_equations'],
    skillIds: ['p3_num_sign_change_graph_evidence', 'p3_num_iteration_formula'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Newton iteration root visual',
    purpose: 'Iteration graph reminder for approaching a root',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/NewtonIteration_Ani.gif',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:NewtonIteration_Ani.gif',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Ralf Pfeifer, Wikimedia Commons',
    altText: 'Animation of Newton iteration tangents moving successive estimates toward a root.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Iteration Forge static card showing sign-change evidence, iteration steps, and rounding caution.',
  },
  {
    id: 'numerical-mines-warm-up-newton-iteration',
    regionId: 'numerical-mines',
    topicIds: ['9709_p3_topic_numerical_solution_of_equations', 'numerical_solution_of_equations'],
    skillIds: ['p3_num_iteration_formula', 'p3_num_accuracy_rounding'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Iteration path reminder',
    purpose: 'Post-reveal support for repeated approximation steps',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/NewtonIteration_Ani.gif',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:NewtonIteration_Ani.gif',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'Ralf Pfeifer, Wikimedia Commons',
    altText: 'Newton iteration animation shown after reveal as a reminder that each estimate feeds the next.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Iteration Forge post-reveal card showing estimate table, recurrence use, and final rounding check.',
  },
  {
    id: 'differential-shrine-slope-field',
    regionId: 'differential-shrine',
    topicIds: ['9709_p3_topic_differential_equations', 'differential_equations'],
    skillIds: ['p3_de_separation_setup', 'p3_de_forming_context_model'],
    pageType: 'field-guide',
    visualKind: 'mini_diagram',
    title: 'Slope field visual reminder',
    purpose: 'Direction-field support for interpreting a differential equation',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Slope_field_and_its_integral_curve.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Slope_field_and_its_integral_curve.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Matsievsky, Wikimedia Commons',
    altText: 'Slope field with short line segments and an integral curve showing one solution path.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Differential Shrine slope-field card showing local gradient arrows and one solution curve.',
  },
  {
    id: 'differential-shrine-warm-up-slope-field',
    regionId: 'differential-shrine',
    topicIds: ['9709_p3_topic_differential_equations', 'differential_equations'],
    skillIds: ['p3_de_initial_condition', 'p3_de_separation_setup'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Direction field reminder',
    purpose: 'Post-reveal support for solution-family thinking',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Slope_field_and_its_integral_curve.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Slope_field_and_its_integral_curve.svg',
    license: 'CC0 1.0, via Wikimedia Commons',
    attribution: 'Matsievsky, Wikimedia Commons',
    altText: 'Direction field and integral curve shown after reveal to remind that a differential equation represents a family of curves.',
    status: 'approved',
    replacementNotes: 'Replace with an Asterion original Differential Shrine post-reveal card showing a general solution family and an initial-condition curve.',
  },
  {
    id: 'logarithm-grove-warm-up-log-exp-inverse',
    regionId: 'logarithm-grove',
    topicIds: ['9709_p3_topic_logarithmic_and_exponential_functions', 'logarithms_and_exponentials'],
    pageType: 'warm-up',
    visualKind: 'mini_diagram',
    title: 'Log and exponential shape reminder',
    purpose: 'Post-reveal support for inverse log/exponential thinking',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logarithm_plots.svg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Logarithm_plots.svg',
    license: 'CC BY-SA 3.0, via Wikimedia Commons',
    attribution: 'User:stpasha; previous author Richard F. Lyon, Wikimedia Commons',
    altText: 'Graphs of logarithm functions with different bases, shown as a post-solution reminder.',
    status: 'approved',
    replacementNotes: 'Replace with the same future Asterion log/exponential mini-card used by Field Guide.',
  },
];

export const fieldGuideVisualSupportNeeds = [
  {
    regionId: 'complex-harbor',
    topicId: 'locus',
    visualKind: 'needs_visual' as const,
    note: 'Argand loci need an original mini-diagram showing locus shape, boundary, and shading conventions.',
  },
  {
    regionId: 'complex-harbor',
    topicId: 'roots',
    visualKind: 'needs_visual' as const,
    note: 'Complex roots need an original Argand mini-diagram showing equal angular spacing and modulus roots.',
  },
  {
    regionId: 'vector-workshop',
    topicId: 'line-relationship',
    visualKind: 'needs_visual' as const,
    note: 'Vector line relationships need a mini-diagram distinguishing intersecting, parallel, and skew lines.',
  },
  {
    regionId: 'numerical-mines',
    topicId: 'iteration-formula',
    visualKind: 'needs_visual' as const,
    note: 'Iteration and convergence need an original cobweb or value-flow mini-diagram rather than a generic external animation.',
  },
  {
    regionId: 'differential-shrine',
    topicId: 'context-model',
    visualKind: 'needs_visual' as const,
    note: 'Differential modelling would benefit from a method-pattern card or mini-diagram linking rate wording to variables and constants.',
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
    (source.status === 'approved' || source.status === 'temporary-online-source')
    && hasText(source.id)
    && hasText(source.title)
    && hasText(source.purpose)
    && (source.visualKind === 'mini_diagram' || source.visualKind === 'method_pattern')
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
