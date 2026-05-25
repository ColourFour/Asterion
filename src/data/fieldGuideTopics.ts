export interface FieldGuideTopicExample {
  title: string;
  prompt: string;
  workedLines: string[];
  patternTitle: string;
  patternRows: { from: string; move: string; to: string }[];
  tryPrompt: string;
  tryScaffold: string[];
  takeaway: string[];
  result: string;
}

export interface FieldGuideTopic {
  id: string;
  marker: string;
  title: string;
  purpose: string;
  skillIds: string[];
  preview: string;
  description: string;
  supportNote?: string;
  examples: FieldGuideTopicExample[];
}

export const REQUIRED_FIELD_GUIDE_SKILL_IDS = [
  'algebra.binomial_validity_range',
  'algebra.modulus_equation_basic',
  'algebra.partial_fractions_distinct_linear',
  'algebra.partial_fractions_repeated_linear',
  'algebra.polynomial_remainder_factor_basic',
  'algebra.structure_rearrangement_basic',
  'binomial_expansion.first_terms_and_coefficient',
  'complex_numbers.cartesian_conjugate_basic',
  'complex_numbers.locus_basic',
  'complex_numbers.modulus_argument_basic',
  'complex_numbers.roots_basic',
  'differential_equations.context_model_basic',
  'differential_equations.initial_condition_basic',
  'differential_equations.separation_basic',
  'differentiation.chain_product_basic',
  'differentiation.chain_rule_basic',
  'differentiation.implicit_log_exp_basic',
  'differentiation.product_rule_basic',
  'differentiation.stationary_tangent_normal_basic',
  'integration.definite_area_basic',
  'integration.method_setup_basic',
  'integration.parts_substitution_basic',
  'logarithms_and_exponentials.calculus_context_basic',
  'logarithms_and_exponentials.domain_validation_basic',
  'logarithms_and_exponentials.linearisation_basic',
  'logarithms_and_exponentials.log_equation_basic',
  'numerical_methods.accuracy_rounding_basic',
  'numerical_methods.iteration_formula_basic',
  'numerical_methods.sign_change_iteration_basic',
  'parametric_equations.derivative_ratio_basic',
  'quadratics.discriminant_root_condition_basic',
  'trigonometry.identity_rewrite_basic',
  'trigonometry.double_angle_basic',
  'trigonometry.solve_equation_interval_basic',
  'trigonometry.r_form_basic',
  'vectors.line_intersection_basic',
  'vectors.line_relationship_basic',
  'vectors.line_scalar_product_basic',
] as const;

export const FIELD_GUIDE_TOPICS_BY_REGION: Record<string, FieldGuideTopic[]> = {
  'algebra-forge': [
    {
      id: 'polynomial-division',
      marker: '/',
      title: 'Polynomial Division',
      purpose: 'Use structure, division, and root conditions before expanding.',
      skillIds: [
        'algebra.structure_rearrangement_basic',
        'algebra.polynomial_remainder_factor_basic',
        'quadratics.discriminant_root_condition_basic',
      ],
      preview: '$$ \\frac{2x^3+3x^2-x+5}{x-2} $$',
      description: 'Use structure first, then divide or test roots deliberately.',
      examples: [
        {
          title: 'Divide by a linear factor',
          prompt: 'Divide $2x^3+3x^2-x+5$ by $x-2$.',
          workedLines: [
            '$2x^3 \\div x = 2x^2$, so subtract $2x^3-4x^2$.',
            'Bring down to get $7x^2-x+5$.',
            '$7x^2 \\div x = 7x$, so subtract $7x^2-14x$.',
            '$13x \\div x = 13$, so subtract $13x-26$.',
            'The remainder is $31$.',
          ],
          patternTitle: 'Leading term / leading term',
          patternRows: [
            { from: '$2x^3$', move: '$\\div x$', to: '$2x^2$' },
            { from: '$7x^2$', move: '$\\div x$', to: '$7x$' },
            { from: '$13x$', move: '$\\div x$', to: '$13$' },
          ],
          tryPrompt: 'Divide $x^3-4x^2+x-2$ by $x-1$.',
          tryScaffold: ['First quotient term', 'Subtract', 'Bring down', 'Remainder'],
          takeaway: [
            'Keep dividing the leading terms.',
            'Use rearrangement before expansion when structure is visible.',
            'For quadratics, the discriminant controls the root condition.',
          ],
          result: '$$ 2x^2+7x+13+\\frac{31}{x-2} $$',
        },
      ],
    },
    {
      id: 'modulus-remainders',
      marker: 'mod',
      title: 'Modulus Equations',
      purpose: 'Split a modulus equation into simple cases.',
      skillIds: ['algebra.modulus_equation_basic'],
      preview: '$$ |2x-3|=5 $$',
      description: 'A modulus equation usually means two matching distance cases.',
      supportNote: 'Support skill: this bridge uses P1 algebra and functions language. P3 mastery evidence still comes from reviewed exam-style P3 practice.',
      examples: [
        {
          title: 'Split into two cases',
          prompt: 'Solve $|2x-3|=5$.',
          workedLines: [
            'The inside can equal $5$ or $-5$.',
            'Case 1: $2x-3=5$, so $x=4$.',
            'Case 2: $2x-3=-5$, so $x=-1$.',
            'Both values make the original modulus equal $5$.',
          ],
          patternTitle: 'Modulus split',
          patternRows: [
            { from: '$|A|=k$', move: '$k>0$', to: '$A=k$' },
            { from: '$|A|=k$', move: 'also', to: '$A=-k$' },
            { from: 'answers', move: 'check in', to: 'original' },
          ],
          tryPrompt: 'Solve $|3x+1|=7$.',
          tryScaffold: ['Positive case', 'Negative case', 'Solve both', 'Check'],
          takeaway: [
            'Only split when the right side is non-negative.',
            'Solve both linear cases.',
            'Check in the original modulus equation.',
          ],
          result: '$$ x=4\\quad\\text{or}\\quad x=-1 $$',
        },
      ],
    },
    {
      id: 'partial-fractions',
      marker: 'f',
      title: 'Partial Fractions',
      purpose: 'Choose the partial-fraction form from the denominator.',
      skillIds: [
        'algebra.partial_fractions_distinct_linear',
        'algebra.partial_fractions_repeated_linear',
      ],
      preview: '$$ \\frac{2x+3}{(x-1)(x+2)} $$',
      description: 'Distinct and repeated linear factors need different numerator slots.',
      examples: [
        {
          title: 'Set up distinct linear factors',
          prompt: 'Decompose $\\frac{5x+1}{(x-1)(x+2)}$.',
          workedLines: [
            'Use $\\frac{5x+1}{(x-1)(x+2)}=\\frac{A}{x-1}+\\frac{B}{x+2}$.',
            'Clear denominators: $5x+1=A(x+2)+B(x-1)$.',
            'Set $x=1$: $6=3A$, so $A=2$.',
            'Set $x=-2$: $-9=-3B$, so $B=3$.',
          ],
          patternTitle: 'Denominator shape',
          patternRows: [
            { from: '$(x-a)(x-b)$', move: 'uses', to: '$\\frac{A}{x-a}+\\frac{B}{x-b}$' },
            { from: '$(x-a)^2$', move: 'uses', to: '$\\frac{A}{x-a}+\\frac{B}{(x-a)^2}$' },
            { from: 'clear', move: 'then', to: 'substitute roots' },
          ],
          tryPrompt: 'Decompose $\\frac{3x+5}{(x+1)(x+2)}$.',
          tryScaffold: ['Write form', 'Clear denominators', 'Use x = -1', 'Use x = -2'],
          takeaway: [
            'Let the denominator choose the form.',
            'Repeated factors need every power.',
            'Roots of factors isolate constants cleanly.',
          ],
          result: '$$ \\frac{2}{x-1}+\\frac{3}{x+2} $$',
        },
      ],
    },
    {
      id: 'binomial-expansions',
      marker: '(x)^n',
      title: 'Binomial Expansions',
      purpose: 'Build first terms and carry the validity range.',
      skillIds: [
        'binomial_expansion.first_terms_and_coefficient',
        'algebra.binomial_validity_range',
      ],
      preview: '$$ (1+2x)^{-1/2} $$',
      description: 'Use the coefficient pattern, then state where the expansion works.',
      examples: [
        {
          title: 'First three terms with validity',
          prompt: 'Write the first three terms of $(1+2x)^{-1/2}$ and state the validity range.',
          workedLines: [
            'Use $(1+u)^n=1+nu+\\frac{n(n-1)}{2}u^2+\\cdots$.',
            'Here $u=2x$ and $n=-\\frac12$.',
            'The linear term is $-\\frac12(2x)=-x$.',
            'The quadratic term is $\\frac{(-\\frac12)(-\\frac32)}{2}(2x)^2=\\frac32x^2$.',
            'Validity comes from $|2x|<1$, so $|x|<\\frac12$.',
          ],
          patternTitle: 'Term builder',
          patternRows: [
            { from: '$1$', move: 'constant', to: '$1$' },
            { from: '$nu$', move: 'linear', to: '$-x$' },
            { from: '$\\frac{n(n-1)}{2}u^2$', move: 'quadratic', to: '$\\frac32x^2$' },
          ],
          tryPrompt: 'Find the first three terms of $(1-3x)^{-1/2}$ and state the validity range.',
          tryScaffold: ['Identify u and n', 'Constant term', 'Linear and quadratic terms', 'Validity condition'],
          takeaway: [
            'Substitute $u$ before simplifying terms.',
            'Write terms in increasing powers of $x$.',
            'For rational powers, carry the validity condition.',
          ],
          result: '$$ 1-x+\\frac32x^2,\\quad |x|<\\frac12 $$',
        },
      ],
    },
  ],
  'logarithm-grove': [
    {
      id: 'log-equations-domain',
      marker: 'log',
      title: 'Log Equations',
      purpose: 'Combine logs, solve, then check the domain.',
      skillIds: [
        'logarithms_and_exponentials.log_equation_basic',
        'logarithms_and_exponentials.domain_validation_basic',
      ],
      preview: '$$ \\ln x+\\ln 3=\\ln 12 $$',
      description: 'Log laws solve the equation only after the inputs are valid.',
      examples: [
        {
          title: 'Combine before comparing',
          prompt: 'Solve $\\ln x+\\ln 3=\\ln 12$.',
          workedLines: [
            'Domain first: $x>0$.',
            'Use the product law: $\\ln x+\\ln 3=\\ln(3x)$.',
            'Compare arguments: $3x=12$.',
            'So $x=4$, which satisfies $x>0$.',
          ],
          patternTitle: 'Safe log solving',
          patternRows: [
            { from: 'domain', move: 'before', to: 'log laws' },
            { from: '$\\ln a+\\ln b$', move: 'becomes', to: '$\\ln(ab)$' },
            { from: 'solution', move: 'check', to: 'original' },
          ],
          tryPrompt: 'Solve $\\ln(2x)-\\ln 3=\\ln 4$.',
          tryScaffold: ['Domain', 'Combine logs', 'Compare', 'Check'],
          takeaway: [
            'Keep all log inputs positive.',
            'Combine to one log before comparing.',
            'Reject any value that fails the original domain.',
          ],
          result: '$$ x=4 $$',
        },
      ],
    },
    {
      id: 'log-linearisation',
      marker: 'Y',
      title: 'Linearisation',
      purpose: 'Turn a power law into straight-line form.',
      skillIds: ['logarithms_and_exponentials.linearisation_basic'],
      preview: '$$ y=2x^3 \\Rightarrow \\ln y=\\ln2+3\\ln x $$',
      description: 'Taking logs can reveal gradient and intercept.',
      examples: [
        {
          title: 'Power law to line',
          prompt: 'For $y=2x^3$, write a straight-line form using logs.',
          workedLines: [
            'Take natural logs: $\\ln y=\\ln(2x^3)$.',
            'Split the product: $\\ln y=\\ln2+\\ln(x^3)$.',
            'Bring down the power: $\\ln y=\\ln2+3\\ln x$.',
            'Plot $\\ln y$ against $\\ln x$ for gradient $3$.',
          ],
          patternTitle: 'Straight-line match',
          patternRows: [
            { from: '$Y$', move: 'is', to: '$\\ln y$' },
            { from: '$X$', move: 'is', to: '$\\ln x$' },
            { from: '$Y=c+mX$', move: 'gives', to: '$m=3$' },
          ],
          tryPrompt: 'Linearise $y=5x^2$.',
          tryScaffold: ['Take logs', 'Split product', 'Move power', 'Name gradient'],
          takeaway: [
            'Choose the axes from the log form.',
            'Gradient is the power in a power law.',
            'Intercept is the logged multiplier.',
          ],
          result: '$$ \\ln y=\\ln2+3\\ln x $$',
        },
      ],
    },
    {
      id: 'exponential-calculus-context',
      marker: 'e',
      title: 'Exponential Contexts',
      purpose: 'Use exponential and log forms inside calculus and modelling questions.',
      skillIds: ['logarithms_and_exponentials.calculus_context_basic'],
      preview: '$$ \\frac{dy}{dx}=2e^{2x},\\ y(0)=5 $$',
      description: 'Exponential expressions often appear as rates, growth or decay models, and integrals, not only as derivative reminders.',
      examples: [
        {
          title: 'Recover a model from an exponential rate',
          prompt: 'Given $\\frac{dy}{dx}=2e^{2x}$ and $y=5$ when $x=0$, find $y$.',
          workedLines: [
            'Integrate the rate: $y=\\int 2e^{2x}\\,dx=e^{2x}+C$.',
            'Use the condition $y=5$ when $x=0$.',
            '$5=e^0+C=1+C$, so $C=4$.',
            'Therefore $y=e^{2x}+4$.',
          ],
          patternTitle: 'Rate to model',
          patternRows: [
            { from: 'rate', move: 'integrate', to: 'general model' },
            { from: '$e^{kx}$', move: 'integrates to', to: '$\\frac1k e^{kx}$' },
            { from: 'condition', move: 'finds', to: '$C$' },
          ],
          tryPrompt: 'Given $\\frac{dy}{dx}=3e^{3x}$ and $y(0)=2$, find $y$.',
          tryScaffold: ['Integrate the rate', 'Add C', 'Use the condition', 'Write the model'],
          takeaway: [
            'Read exponential calculus in context: rate, model, condition.',
            'Integration reverses the exponential chain factor.',
            'Use a given value after the general model is formed.',
          ],
          result: '$$ y=e^{2x}+4 $$',
        },
      ],
    },
  ],
  'trig-observatory': [
    {
      id: 'identity-rewrite',
      marker: 'id',
      title: 'Identity Rewrite',
      purpose: 'Choose an identity that moves toward the requested form.',
      skillIds: ['trigonometry.identity_rewrite_basic'],
      preview: '$$ 1-\\cos^2x=\\sin^2x $$',
      description: 'Rewrite the side with more structure first.',
      supportNote: 'Support skill: this is an identity bridge before P3 trig solving. Mastery evidence comes from exam-style P3 trigonometry practice.',
      examples: [
        {
          title: 'Move toward one function',
          prompt: 'Rewrite $1-\\cos^2x$ in terms of $\\sin x$.',
          workedLines: [
            'Use $\\sin^2x+\\cos^2x=1$.',
            'Rearrange to $1-\\cos^2x=\\sin^2x$.',
            'The final expression now uses only $\\sin x$.',
          ],
          patternTitle: 'Identity choice',
          patternRows: [
            { from: 'target', move: 'choose', to: 'matching identity' },
            { from: '$1-\\cos^2x$', move: 'equals', to: '$\\sin^2x$' },
            { from: 'one function', move: 'is', to: 'cleaner' },
          ],
          tryPrompt: 'Rewrite $1-\\sin^2x$ in terms of $\\cos x$.',
          tryScaffold: ['Pick identity', 'Rearrange', 'Substitute', 'Simplify'],
          takeaway: [
            'Let the requested function guide the identity.',
            'Rearrange before expanding.',
            'Keep the proof direction simple.',
          ],
          result: '$$ \\sin^2x $$',
        },
      ],
    },
    {
      id: 'double-angle',
      marker: '2x',
      title: 'Double Angle',
      purpose: 'Pick the double-angle form that matches the expression.',
      skillIds: ['trigonometry.double_angle_basic'],
      preview: '$$ 1-\\cos2x=2\\sin^2x $$',
      description: 'Double-angle formulae are useful when one angle is twice another.',
      examples: [
        {
          title: 'Choose the sine form',
          prompt: 'Rewrite $1-\\cos2x$ using $\\sin x$.',
          workedLines: [
            'Use $\\cos2x=1-2\\sin^2x$.',
            'Substitute: $1-\\cos2x=1-(1-2\\sin^2x)$.',
            'Simplify the brackets to get $2\\sin^2x$.',
          ],
          patternTitle: 'Double-angle target',
          patternRows: [
            { from: '$\\cos2x$', move: 'sine form', to: '$1-2\\sin^2x$' },
            { from: '$1-(1-2\\sin^2x)$', move: 'simplify', to: '$2\\sin^2x$' },
            { from: 'target function', move: 'drives', to: 'formula choice' },
          ],
          tryPrompt: 'Rewrite $1+\\cos2x$ using $\\cos x$.',
          tryScaffold: ['Choose form', 'Substitute', 'Simplify', 'Check target'],
          takeaway: [
            'There are several double-angle forms.',
            'Choose the one closest to the target.',
            'Watch brackets after substitution.',
          ],
          result: '$$ 2\\sin^2x $$',
        },
      ],
    },
    {
      id: 'solve-interval',
      marker: '0..',
      title: 'Solve on an Interval',
      purpose: 'Find all trig solutions in the requested interval.',
      skillIds: ['trigonometry.solve_equation_interval_basic'],
      preview: '$$ \\sin x=\\frac12,\\ 0\\le x<2\\pi $$',
      description: 'Reference angle plus quadrant signs gives the answer list.',
      examples: [
        {
          title: 'Sweep the interval',
          prompt: 'Solve $\\sin x=\\frac12$ for $0\\le x<2\\pi$.',
          workedLines: [
            'Reference angle: $\\sin^{-1}(\\frac12)=\\frac{\\pi}{6}$.',
            'Sine is positive in quadrants I and II.',
            'So $x=\\frac{\\pi}{6}$ or $x=\\frac{5\\pi}{6}$.',
            'Both values lie in $0\\le x<2\\pi$.',
          ],
          patternTitle: 'Reference and quadrant',
          patternRows: [
            { from: 'reference', move: 'is', to: '$\\frac{\\pi}{6}$' },
            { from: 'positive sine', move: 'in', to: 'QI, QII' },
            { from: 'interval', move: 'filters', to: 'answers' },
          ],
          tryPrompt: 'Solve $\\cos x=\\frac12$ for $0\\le x<2\\pi$.',
          tryScaffold: ['Reference angle', 'Quadrants', 'List values', 'Check interval'],
          takeaway: [
            'The inverse trig value is only the reference start.',
            'Use signs to choose quadrants.',
            'The interval decides the final list.',
          ],
          result: '$$ x=\\frac{\\pi}{6},\\ \\frac{5\\pi}{6} $$',
        },
      ],
    },
    {
      id: 'r-form',
      marker: 'R',
      title: 'R-Form',
      purpose: 'Rewrite a sine/cosine sum as one shifted trig function.',
      skillIds: ['trigonometry.r_form_basic'],
      preview: '$$ 3\\sin x+4\\cos x=5\\sin(x+\\alpha) $$',
      description: 'Match coefficients after expanding the compound angle.',
      examples: [
        {
          title: 'Find R and alpha',
          prompt: 'Write $3\\sin x+4\\cos x$ as $R\\sin(x+\\alpha)$.',
          workedLines: [
            'Expand: $R\\sin(x+\\alpha)=R\\sin x\\cos\\alpha+R\\cos x\\sin\\alpha$.',
            'Match coefficients: $R\\cos\\alpha=3$ and $R\\sin\\alpha=4$.',
            'So $R=\\sqrt{3^2+4^2}=5$.',
            '$\\tan\\alpha=\\frac43$.',
          ],
          patternTitle: 'Coefficient match',
          patternRows: [
            { from: '$\\sin x$', move: 'coefficient', to: '$R\\cos\\alpha$' },
            { from: '$\\cos x$', move: 'coefficient', to: '$R\\sin\\alpha$' },
            { from: '$R$', move: 'length', to: '$5$' },
          ],
          tryPrompt: 'Write $5\\sin x+12\\cos x$ in R-form.',
          tryScaffold: ['Expand form', 'Match coefficients', 'Find R', 'Find alpha'],
          takeaway: [
            'Expand the target form before matching.',
            'R is the hypotenuse from the two coefficients.',
            'Use the correct quadrant for alpha.',
          ],
          result: '$$ 5\\sin(x+\\alpha),\\quad \\tan\\alpha=\\frac43 $$',
        },
      ],
    },
  ],
  'complex-harbor': [
    {
      id: 'cartesian-conjugate',
      marker: 'z',
      title: 'Cartesian and Conjugate',
      purpose: 'Work safely with complex numbers and their conjugates.',
      skillIds: ['complex_numbers.cartesian_conjugate_basic'],
      preview: '$$ (3+2i)(3-2i)=13 $$',
      description: 'The conjugate changes the sign of the imaginary part.',
      supportNote: 'Support skill: this rehearses complex-number algebra before P3 modulus, argument, loci, and roots. It is not Guardian evidence by itself.',
      examples: [
        {
          title: 'Use the conjugate',
          prompt: 'Simplify $(3+2i)(3-2i)$.',
          workedLines: [
            'The conjugate of $3+2i$ is $3-2i$.',
            'Multiply: $9-6i+6i-4i^2$.',
            'Since $i^2=-1$, this becomes $9+4=13$.',
          ],
          patternTitle: 'Conjugate product',
          patternRows: [
            { from: '$a+bi$', move: 'conjugate', to: '$a-bi$' },
            { from: 'middle terms', move: 'cancel', to: 'real result' },
            { from: '$i^2$', move: 'is', to: '$-1$' },
          ],
          tryPrompt: 'Simplify $(4-i)(4+i)$.',
          tryScaffold: ['Identify conjugate', 'Multiply', 'Use i squared', 'Simplify'],
          takeaway: [
            'Conjugates have opposite imaginary signs.',
            'Their product is real.',
            'Always replace $i^2$ with $-1$.',
          ],
          result: '$$ 13 $$',
        },
      ],
    },
    {
      id: 'modulus-argument',
      marker: 'arg',
      title: 'Modulus and Argument',
      purpose: 'Convert a complex number into size and angle.',
      skillIds: ['complex_numbers.modulus_argument_basic'],
      preview: '$$ z=3+4i,\\ |z|=5 $$',
      description: 'Modulus is distance from the origin; argument is direction.',
      examples: [
        {
          title: 'Find size and angle',
          prompt: 'For $z=3+4i$, find $|z|$ and $\\arg z$.',
          workedLines: [
            '$|z|=\\sqrt{3^2+4^2}=5$.',
            '$\\tan\\theta=\\frac43$.',
            'The point is in quadrant I, so $\\arg z=\\tan^{-1}(\\frac43)$.',
          ],
          patternTitle: 'Argand triangle',
          patternRows: [
            { from: 'real', move: 'horizontal', to: '$3$' },
            { from: 'imaginary', move: 'vertical', to: '$4$' },
            { from: 'modulus', move: 'distance', to: '$5$' },
          ],
          tryPrompt: 'Find $|1-i|$ and its argument.',
          tryScaffold: ['Plot quadrant', 'Find modulus', 'Find angle', 'State sign'],
          takeaway: [
            'Draw the quadrant first.',
            'Use Pythagoras for modulus.',
            'Argument must match the quadrant.',
          ],
          result: '$$ |z|=5,\\quad \\arg z=\\tan^{-1}\\left(\\frac43\\right) $$',
        },
      ],
    },
    {
      id: 'locus',
      marker: 'loc',
      title: 'Locus',
      purpose: 'Read an Argand condition as a geometric path.',
      skillIds: ['complex_numbers.locus_basic'],
      preview: '$$ |z-2|=3 $$',
      description: 'A modulus condition is usually a distance statement.',
      examples: [
        {
          title: 'Circle from distance',
          prompt: 'Describe the locus $|z-2|=3$.',
          workedLines: [
            '$z-2$ means distance from the point $2+0i$.',
            'The distance is always $3$.',
            'So the locus is a circle centre $(2,0)$ radius $3$.',
          ],
          patternTitle: 'Distance language',
          patternRows: [
            { from: '$|z-a|$', move: 'means', to: 'distance from a' },
            { from: '$=r$', move: 'means', to: 'circle radius r' },
            { from: '$|z-2|=3$', move: 'centre', to: '$(2,0)$' },
          ],
          tryPrompt: 'Describe $|z+1-i|=2$.',
          tryScaffold: ['Find centre', 'Find radius', 'Sketch', 'State locus'],
          takeaway: [
            'Convert the expression into a point first.',
            'A fixed distance from a point is a circle.',
            'State centre and radius clearly.',
          ],
          result: 'Circle centre $(2,0)$, radius $3$.',
        },
      ],
    },
    {
      id: 'roots',
      marker: 'root',
      title: 'Roots',
      purpose: 'Use modulus and argument to find complex roots.',
      skillIds: ['complex_numbers.roots_basic'],
      preview: '$$ z^3=8 $$',
      description: 'Roots share modulus changes and split arguments evenly.',
      examples: [
        {
          title: 'Cube roots of a real number',
          prompt: 'Find the arguments of the roots of $z^3=8$.',
          workedLines: [
            'Write $8=8e^{i2k\\pi}$.',
            'Cube-root the modulus: $|z|=2$.',
            'Divide arguments by $3$: $\\theta=0,\\frac{2\\pi}{3},\\frac{4\\pi}{3}$.',
          ],
          patternTitle: 'Root spacing',
          patternRows: [
            { from: '$r$', move: 'nth root', to: '$r^{1/n}$' },
            { from: 'full turn', move: 'split', to: '$\\frac{2\\pi}{n}$' },
            { from: '3 roots', move: 'spaced by', to: '$\\frac{2\\pi}{3}$' },
          ],
          tryPrompt: 'Find the arguments of the square roots of $9$.',
          tryScaffold: ['Modulus root', 'First argument', 'Spacing', 'List roots'],
          takeaway: [
            'There are n roots for an nth-root question.',
            'Arguments are evenly spaced.',
            'Keep modulus and argument separate.',
          ],
          result: '$$ \\theta=0,\\ \\frac{2\\pi}{3},\\ \\frac{4\\pi}{3} $$',
        },
      ],
    },
  ],
  'calculus-cliffs': [
    {
      id: 'chain-rule',
      marker: 'ch',
      title: 'Chain Rule',
      purpose: 'Differentiate a composite expression one layer at a time.',
      skillIds: ['differentiation.chain_rule_basic'],
      preview: '$$ \\frac{d}{dx}(3x+1)^5 $$',
      description: 'Differentiate the outside, then multiply by the inside derivative.',
      examples: [
        {
          title: 'Outside then inside',
          prompt: 'Differentiate $y=(3x+1)^5$.',
          workedLines: [
            'Outside derivative: $5(3x+1)^4$.',
            'Inside derivative: $3$.',
            'Multiply them: $\\frac{dy}{dx}=15(3x+1)^4$.',
          ],
          patternTitle: 'Layer rule',
          patternRows: [
            { from: 'outside', move: 'differentiate', to: '$5(3x+1)^4$' },
            { from: 'inside', move: 'differentiate', to: '$3$' },
            { from: 'multiply', move: 'gives', to: '$15(3x+1)^4$' },
          ],
          tryPrompt: 'Differentiate $(2x-5)^4$.',
          tryScaffold: ['Outside derivative', 'Inside derivative', 'Multiply', 'Simplify'],
          takeaway: [
            'Spot the inside expression.',
            'Do not forget the inside derivative.',
            'Leave factored form if it is clearer.',
          ],
          result: '$$ 15(3x+1)^4 $$',
        },
      ],
    },
    {
      id: 'product-chain',
      marker: 'uv',
      title: 'Product / Quotient Rule',
      purpose: 'Differentiate products and quotients without dropping derivative terms.',
      skillIds: [
        'differentiation.product_rule_basic',
        'differentiation.chain_product_basic',
      ],
      preview: '$$ x^2(1+x)^5 $$',
      description: 'Use $uv\\prime+vu\\prime$ for products, $\\frac{vu\\prime-uv\\prime}{v^2}$ for quotients, and handle any inner chain separately.',
      examples: [
        {
          title: 'Product with a chain factor',
          prompt: 'Differentiate $y=x^2(1+x)^5$.',
          workedLines: [
            'Let $u=x^2$ and $v=(1+x)^5$.',
            '$u\\prime=2x$ and $v\\prime=5(1+x)^4$.',
            'Use $uv\\prime+vu\\prime$.',
            '$\\frac{dy}{dx}=5x^2(1+x)^4+2x(1+x)^5$.',
          ],
          patternTitle: 'Product structure',
          patternRows: [
            { from: '$u$', move: 'times', to: '$v\\prime$' },
            { from: '$v$', move: 'times', to: '$u\\prime$' },
            { from: 'add', move: 'then', to: 'simplify if useful' },
          ],
          tryPrompt: 'Differentiate $x(2x+1)^3$.',
          tryScaffold: ['Choose u', 'Choose v', 'Find derivatives', 'Apply product rule'],
          takeaway: [
            'Products need two derivative terms.',
            'A bracket power inside the product still needs chain rule.',
            'Do not expand unless it helps.',
          ],
          result: '$$ 5x^2(1+x)^4+2x(1+x)^5 $$',
        },
        {
          title: 'Quotient rule denominator',
          prompt: 'Differentiate $y=\\frac{x^2+1}{x-1}$.',
          workedLines: [
            'Let $u=x^2+1$ and $v=x-1$.',
            '$u\\prime=2x$ and $v\\prime=1$.',
            'Use $\\frac{vu\\prime-uv\\prime}{v^2}$.',
            '$\\frac{dy}{dx}=\\frac{(x-1)(2x)-(x^2+1)}{(x-1)^2}$.',
          ],
          patternTitle: 'Quotient structure',
          patternRows: [
            { from: '$v u\\prime$', move: 'minus', to: '$u v\\prime$' },
            { from: 'denominator', move: 'squared', to: '$v^2$' },
            { from: 'simplify', move: 'after', to: 'rule setup' },
          ],
          tryPrompt: 'Set up the quotient rule for $y=\\frac{x+2}{x^2+1}$.',
          tryScaffold: ['Choose u and v', 'Find derivatives', 'Write numerator', 'Square denominator'],
          takeaway: [
            'The quotient denominator is always squared.',
            'Keep the numerator order as $v u\\prime-u v\\prime$.',
            'Simplify only after the rule is correctly set up.',
          ],
          result: '$$ \\frac{(x-1)(2x)-(x^2+1)}{(x-1)^2} $$',
        },
      ],
    },
    {
      id: 'implicit-log-exp',
      marker: 'ln',
      title: 'Implicit Log/Exp',
      purpose: 'Differentiate equations where y is not isolated.',
      skillIds: ['differentiation.implicit_log_exp_basic'],
      preview: '$$ e^y+\\ln x=x^2 $$',
      description: 'Differentiate both sides and multiply every hidden y derivative by $\\frac{dy}{dx}$, including log and exponential terms.',
      examples: [
        {
          title: 'Differentiate log and exponential terms implicitly',
          prompt: 'For $e^y+\\ln x=x^2$, find $\\frac{dy}{dx}$.',
          workedLines: [
            'Differentiate $e^y$ to get $e^y\\frac{dy}{dx}$.',
            'Differentiate $\\ln x$ to get $\\frac{1}{x}$.',
            'Differentiate $x^2$ to get $2x$.',
            'So $e^y\\frac{dy}{dx}+\\frac1x=2x$, hence $\\frac{dy}{dx}=\\frac{2x-\\frac1x}{e^y}$.',
          ],
          patternTitle: 'Hidden y chain',
          patternRows: [
            { from: '$e^y$', move: 'derivative', to: '$e^y\\frac{dy}{dx}$' },
            { from: '$\\ln y$', move: 'derivative', to: '$\\frac1y\\frac{dy}{dx}$' },
            { from: 'collect', move: '$dy/dx$', to: 'solve' },
          ],
          tryPrompt: 'Differentiate $\\ln y+x^2=3$ implicitly.',
          tryScaffold: ['Differentiate log y', 'Differentiate x term', 'Collect dy/dx', 'Solve'],
          takeaway: [
            'Every y derivative carries $\\frac{dy}{dx}$.',
            'For $e^y$ and $\\ln y$, the hidden chain factor is still needed.',
            'Solve algebraically at the end.',
          ],
          result: '$$ \\frac{dy}{dx}=\\frac{2x-\\frac1x}{e^y} $$',
        },
      ],
    },
    {
      id: 'stationary-tangent-normal',
      marker: 'm',
      title: 'Stationary, Tangent, Normal',
      purpose: 'Use gradients to find stationary points and line equations.',
      skillIds: ['differentiation.stationary_tangent_normal_basic'],
      preview: '$$ y=x^2-4x+1 $$',
      description: 'Set derivative to zero for stationary points; use gradient for tangents.',
      examples: [
        {
          title: 'Find a stationary point',
          prompt: 'Find the stationary point of $y=x^2-4x+1$.',
          workedLines: [
            '$\\frac{dy}{dx}=2x-4$.',
            'Stationary means $2x-4=0$, so $x=2$.',
            'Substitute: $y=4-8+1=-3$.',
            'The stationary point is $(2,-3)$.',
          ],
          patternTitle: 'Gradient decisions',
          patternRows: [
            { from: 'stationary', move: 'set', to: '$dy/dx=0$' },
            { from: 'tangent', move: 'uses', to: '$m=dy/dx$' },
            { from: 'normal', move: 'uses', to: '$m_n=-1/m$' },
          ],
          tryPrompt: 'Find the stationary point of $y=x^2-6x+4$.',
          tryScaffold: ['Differentiate', 'Set zero', 'Find x', 'Find y'],
          takeaway: [
            'Stationary points have zero gradient.',
            'A tangent uses the curve gradient.',
            'A normal gradient is the negative reciprocal.',
          ],
          result: '$$ (2,-3) $$',
        },
      ],
    },
    {
      id: 'parametric-derivative',
      marker: 't',
      title: 'Parametric Gradients',
      purpose: 'Find dy/dx from derivatives with respect to a parameter.',
      skillIds: ['parametric_equations.derivative_ratio_basic'],
      preview: '$$ \\frac{dy}{dx}=\\frac{dy/dt}{dx/dt} $$',
      description: 'Differentiate x and y with respect to the parameter, then divide.',
      examples: [
        {
          title: 'Use derivative ratio',
          prompt: 'If $x=t^2$ and $y=t^3$, find $\\frac{dy}{dx}$.',
          workedLines: [
            '$\\frac{dx}{dt}=2t$.',
            '$\\frac{dy}{dt}=3t^2$.',
            '$\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}=\\frac{3t^2}{2t}=\\frac32t$.',
          ],
          patternTitle: 'Parameter bridge',
          patternRows: [
            { from: '$dy/dt$', move: 'over', to: '$dx/dt$' },
            { from: 'same t', move: 'then', to: 'simplify' },
            { from: 'point value', move: 'substitute', to: 'last' },
          ],
          tryPrompt: 'If $x=2t$ and $y=t^2+1$, find $\\frac{dy}{dx}$.',
          tryScaffold: ['Find dx/dt', 'Find dy/dt', 'Divide', 'Simplify'],
          takeaway: [
            'Never divide y by x directly.',
            'Use the derivative ratio.',
            'Substitute a given parameter value after forming the ratio.',
          ],
          result: '$$ \\frac{dy}{dx}=\\frac32t $$',
        },
      ],
    },
  ],
  'integration-gardens': [
    {
      id: 'method-setup',
      marker: 'int',
      title: 'Method Setup',
      purpose: 'Choose the integration method from the integrand shape.',
      skillIds: ['integration.method_setup_basic'],
      preview: '$$ \\int 2x(x^2+1)^4\\,dx $$',
      description: 'Look for a derivative already sitting beside a composite expression.',
      examples: [
        {
          title: 'Spot substitution shape',
          prompt: 'Choose a method for $\\int 2x(x^2+1)^4\\,dx$.',
          workedLines: [
            'The inside expression is $x^2+1$.',
            'Its derivative is $2x$, which is present.',
            'Use substitution with $u=x^2+1$.',
          ],
          patternTitle: 'Method clue',
          patternRows: [
            { from: 'inside', move: '$u$', to: '$x^2+1$' },
            { from: 'derivative', move: '$du$', to: '$2x dx$' },
            { from: 'method', move: 'is', to: 'substitution' },
          ],
          tryPrompt: 'Choose a method for $\\int x e^{x^2}\\,dx$.',
          tryScaffold: ['Find inside', 'Find derivative', 'Compare', 'Choose method'],
          takeaway: [
            'Choose the method before calculating.',
            'Substitution often has an inside expression and its derivative.',
            'Parts is useful for products without that derivative match.',
          ],
          result: 'Use substitution with $u=x^2+1$.',
        },
      ],
    },
    {
      id: 'parts-substitution',
      marker: 'uv',
      title: 'Parts and Substitution',
      purpose: 'Set up substitution or integration by parts cleanly.',
      skillIds: ['integration.parts_substitution_basic'],
      preview: '$$ \\int x e^x\\,dx $$',
      description: 'For parts, choose which factor to differentiate and which to integrate.',
      examples: [
        {
          title: 'Set up integration by parts',
          prompt: 'Use parts to integrate $\\int x e^x\\,dx$.',
          workedLines: [
            'Choose $u=x$ and $dv=e^x dx$.',
            'Then $du=dx$ and $v=e^x$.',
            'Use $\\int u\\,dv=uv-\\int v\\,du$.',
            'So the integral is $xe^x-\\int e^x dx=xe^x-e^x+C$.',
          ],
          patternTitle: 'Parts template',
          patternRows: [
            { from: '$u$', move: 'differentiate', to: '$du$' },
            { from: '$dv$', move: 'integrate', to: '$v$' },
            { from: '$uv$', move: 'minus', to: '$\\int vdu$' },
          ],
          tryPrompt: 'Set up parts for $\\int x\\cos x\\,dx$.',
          tryScaffold: ['Choose u', 'Choose dv', 'Find du', 'Find v'],
          takeaway: [
            'Write the parts template first.',
            'Choose u to become simpler when differentiated.',
            'Keep the final constant for indefinite integrals.',
          ],
          result: '$$ xe^x-e^x+C $$',
        },
      ],
    },
    {
      id: 'definite-area',
      marker: 'A',
      title: 'Definite Area',
      purpose: 'Use limits to calculate area under a curve.',
      skillIds: ['integration.definite_area_basic'],
      preview: '$$ \\int_0^2 x^2\\,dx $$',
      description: 'Integrate first, then substitute upper and lower limits.',
      examples: [
        {
          title: 'Evaluate with limits',
          prompt: 'Find $\\int_0^2 x^2\\,dx$.',
          workedLines: [
            'An antiderivative of $x^2$ is $\\frac{x^3}{3}$.',
            'Substitute the upper limit: $\\frac{2^3}{3}=\\frac83$.',
            'Substitute the lower limit: $0$.',
            'Area is $\\frac83-0=\\frac83$.',
          ],
          patternTitle: 'Limit order',
          patternRows: [
            { from: 'integrate', move: 'first', to: '$F(x)$' },
            { from: 'upper', move: 'minus', to: 'lower' },
            { from: 'area', move: 'check', to: 'positive' },
          ],
          tryPrompt: 'Find $\\int_1^3 2x\\,dx$.',
          tryScaffold: ['Integrate', 'Upper value', 'Lower value', 'Subtract'],
          takeaway: [
            'Limits are used after integrating.',
            'Use upper minus lower.',
            'For area below the axis, consider absolute area if asked.',
          ],
          result: '$$ \\frac83 $$',
        },
      ],
    },
  ],
  'vector-workshop': [
    {
      id: 'line-intersection',
      marker: 'x',
      title: 'Line Intersections',
      purpose: 'Equate vector lines component by component.',
      skillIds: ['vectors.line_intersection_basic'],
      preview: '$$ \\mathbf r=\\mathbf a+\\lambda\\mathbf d $$',
      description: 'An intersection must use one parameter value on each line.',
      examples: [
        {
          title: 'Equate components',
          prompt: 'For $\\mathbf r=(1,0)+\\lambda(2,1)$ and $\\mathbf r=(3,1)+\\mu(0,1)$, test intersection.',
          workedLines: [
            'Equate x-components: $1+2\\lambda=3$, so $\\lambda=1$.',
            'Equate y-components: $\\lambda=1+\\mu$.',
            'With $\\lambda=1$, $\\mu=0$.',
            'Both components agree, so the lines intersect at $(3,1)$.',
          ],
          patternTitle: 'Component check',
          patternRows: [
            { from: 'x component', move: 'finds', to: 'parameter' },
            { from: 'y component', move: 'checks', to: 'same point' },
            { from: 'all components', move: 'must', to: 'agree' },
          ],
          tryPrompt: 'Check if $(0,1)+s(1,2)$ meets $(2,5)+t(1,0)$.',
          tryScaffold: ['Equate x', 'Equate y', 'Solve', 'Check point'],
          takeaway: [
            'Use different parameter names for different lines.',
            'One matching component is not enough.',
            'All components must give the same point.',
          ],
          result: 'The lines intersect at $(3,1)$.',
        },
      ],
    },
    {
      id: 'line-relationship',
      marker: '||',
      title: 'Line Relationships',
      purpose: 'Decide if vector lines are parallel, intersecting, or skew.',
      skillIds: ['vectors.line_relationship_basic'],
      preview: '$$ (2,4,6)=2(1,2,3) $$',
      description: 'Direction vectors and component checks classify the relationship.',
      examples: [
        {
          title: 'Check for parallel directions',
          prompt: 'Are direction vectors $(1,2,3)$ and $(2,4,6)$ parallel?',
          workedLines: [
            'Compare components as ratios.',
            '$2/1=2$, $4/2=2$, and $6/3=2$.',
            'All ratios match, so the directions are parallel.',
          ],
          patternTitle: 'Relationship test',
          patternRows: [
            { from: 'same direction ratio', move: 'means', to: 'parallel' },
            { from: 'intersect test works', move: 'means', to: 'meet' },
            { from: 'not parallel and no meet', move: 'means', to: 'skew' },
          ],
          tryPrompt: 'Are $(2,1,0)$ and $(4,2,1)$ parallel?',
          tryScaffold: ['Compare ratios', 'Check all components', 'State relationship', 'Explain'],
          takeaway: [
            'Parallel lines have proportional direction vectors.',
            'Skew lines do not meet and are not parallel.',
            'In 3D, always check all components.',
          ],
          result: 'The directions are parallel.',
        },
      ],
    },
    {
      id: 'scalar-product',
      marker: 'dot',
      title: 'Scalar Product',
      purpose: 'Use dot products for angles and perpendicular tests.',
      skillIds: ['vectors.line_scalar_product_basic'],
      preview: '$$ \\mathbf a\\cdot\\mathbf b=|a||b|\\cos\\theta $$',
      description: 'The dot product connects components to angle geometry.',
      examples: [
        {
          title: 'Find the angle',
          prompt: 'Find the angle between $(1,0,0)$ and $(1,1,0)$.',
          workedLines: [
            'Dot product: $(1)(1)+(0)(1)+(0)(0)=1$.',
            'Magnitudes are $1$ and $\\sqrt2$.',
            '$\\cos\\theta=\\frac{1}{\\sqrt2}$.',
            'So $\\theta=45^\\circ$.',
          ],
          patternTitle: 'Dot product angle',
          patternRows: [
            { from: '$a\\cdot b$', move: 'over', to: '$|a||b|$' },
            { from: 'cos theta', move: 'then', to: 'angle' },
            { from: '$a\\cdot b=0$', move: 'means', to: 'perpendicular' },
          ],
          tryPrompt: 'Find the angle between $(1,1,0)$ and $(0,1,0)$.',
          tryScaffold: ['Dot product', 'Magnitudes', 'Cos theta', 'Angle'],
          takeaway: [
            'Dot product uses matching components.',
            'Divide by both magnitudes before inverse cosine.',
            'A zero dot product means perpendicular vectors.',
          ],
          result: '$$ 45^\\circ $$',
        },
      ],
    },
  ],
  'numerical-mines': [
    {
      id: 'sign-change',
      marker: '+/-',
      title: 'Sign Change',
      purpose: 'Use a sign change to locate a root interval.',
      skillIds: ['numerical_methods.sign_change_iteration_basic'],
      preview: '$$ f(a)f(b)<0 $$',
      description: 'A sign change shows a root is bracketed when the function is continuous.',
      examples: [
        {
          title: 'Bracket a root',
          prompt: 'Show that $f(x)=x^3-x-1$ has a root between $1$ and $2$.',
          workedLines: [
            '$f(1)=1-1-1=-1$.',
            '$f(2)=8-2-1=5$.',
            'The signs are different.',
            'So a root lies between $1$ and $2$.',
          ],
          patternTitle: 'Bracket test',
          patternRows: [
            { from: '$f(a)<0$', move: 'and', to: '$f(b)>0$' },
            { from: 'continuous', move: 'gives', to: 'root between' },
            { from: 'interval', move: 'then', to: 'refine' },
          ],
          tryPrompt: 'Test whether $x^3-4$ has a root between $1$ and $2$.',
          tryScaffold: ['Evaluate left', 'Evaluate right', 'Compare signs', 'Conclude'],
          takeaway: [
            'Use values at both ends of the interval.',
            'Opposite signs bracket a root.',
            'State the interval clearly.',
          ],
          result: 'A root lies in $(1,2)$.',
        },
      ],
    },
    {
      id: 'iteration-formula',
      marker: 'xn',
      title: 'Iteration Formula',
      purpose: 'Apply an iteration rule step by step.',
      skillIds: ['numerical_methods.iteration_formula_basic'],
      preview: '$$ x_{n+1}=\\sqrt{x_n+1} $$',
      description: 'Substitute the current value to generate the next value.',
      examples: [
        {
          title: 'One iteration step',
          prompt: 'Use $x_{n+1}=\\sqrt{x_n+1}$ with $x_0=1$. Find $x_1$ and $x_2$.',
          workedLines: [
            '$x_1=\\sqrt{1+1}=\\sqrt2$.',
            '$x_2=\\sqrt{\\sqrt2+1}$.',
            'Keep enough decimal accuracy if approximating.',
          ],
          patternTitle: 'Feed forward',
          patternRows: [
            { from: '$x_0$', move: 'into rule', to: '$x_1$' },
            { from: '$x_1$', move: 'into rule', to: '$x_2$' },
            { from: 'repeat', move: 'until', to: 'accuracy reached' },
          ],
          tryPrompt: 'Use $x_{n+1}=\\frac{4}{x_n+1}$ with $x_0=1$ to find $x_1$.',
          tryScaffold: ['Write rule', 'Substitute x0', 'Calculate', 'Round later'],
          takeaway: [
            'Use the previous value, not the original each time.',
            'Show enough working for each iteration.',
            'Keep guard digits until the final answer.',
          ],
          result: '$$ x_1=\\sqrt2,\\quad x_2=\\sqrt{\\sqrt2+1} $$',
        },
      ],
    },
    {
      id: 'accuracy-rounding',
      marker: 'dp',
      title: 'Accuracy and Rounding',
      purpose: 'Round iteration results only after the stopping criterion is secure.',
      skillIds: ['numerical_methods.accuracy_rounding_basic'],
      preview: '$$ x_4=1.41421,\\ x_5=1.41422 $$',
      description: 'In numerical methods, rounding is part of the evidence that an iterative approximation has stabilised.',
      supportNote: 'Support skill: rounding conventions support P3 numerical methods. Guardian evidence comes from reviewed numerical-method questions, not from generic rounding alone.',
      examples: [
        {
          title: 'Use stable iterates before rounding',
          prompt: 'An iteration gives $x_4=1.41421$ and $x_5=1.41422$. What value is secure to $3$ decimal places?',
          workedLines: [
            'Round each iterate to $3$ decimal places.',
            '$x_4=1.41421$ rounds to $1.414$.',
            '$x_5=1.41422$ also rounds to $1.414$.',
            'Since both agree at the requested accuracy, state $1.414$.',
          ],
          patternTitle: 'Iteration accuracy check',
          patternRows: [
            { from: 'two iterates', move: 'round both', to: 'same dp' },
            { from: 'same result', move: 'supports', to: 'accuracy claim' },
            { from: 'not same', move: 'continue', to: 'iteration' },
          ],
          tryPrompt: 'If $x_3=2.23603$ and $x_4=2.23607$, decide the value to $3$ decimal places.',
          tryScaffold: ['Round x3', 'Round x4', 'Compare', 'State or continue'],
          takeaway: [
            'Use agreement between iterates as evidence for final accuracy.',
            'Know whether the question asks decimal places or significant figures.',
            'State final values to the requested accuracy.',
          ],
          result: '$$ 1.414 $$',
        },
      ],
    },
  ],
  'differential-shrine': [
    {
      id: 'context-model',
      marker: 'rate',
      title: 'Context Model',
      purpose: 'Translate a worded rate statement into a differential equation.',
      skillIds: ['differential_equations.context_model_basic'],
      preview: '$$ \\frac{dP}{dt}=kP $$',
      description: 'Identify the changing quantity and how the rate is described.',
      examples: [
        {
          title: 'Proportional growth',
          prompt: 'A population grows at a rate proportional to its size $P$. Write a differential equation.',
          workedLines: [
            'Changing quantity: $P$.',
            'Independent variable: $t$.',
            'Rate proportional to size means $\\frac{dP}{dt}=kP$.',
          ],
          patternTitle: 'Words to symbols',
          patternRows: [
            { from: 'rate of P', move: 'means', to: '$dP/dt$' },
            { from: 'proportional to P', move: 'means', to: '$kP$' },
            { from: 'model', move: 'is', to: '$dP/dt=kP$' },
          ],
          tryPrompt: 'A mass cools at a rate proportional to its temperature excess $T-20$. Write a model.',
          tryScaffold: ['Changing quantity', 'Rate phrase', 'Constant', 'Equation'],
          takeaway: [
            'Name the changing quantity first.',
            'Translate proportional language with a constant.',
            'Use signs to match growth or decrease.',
          ],
          result: '$$ \\frac{dP}{dt}=kP $$',
        },
      ],
    },
    {
      id: 'separation',
      marker: 'dy',
      title: 'Separation',
      purpose: 'Separate variables before integrating.',
      skillIds: ['differential_equations.separation_basic'],
      preview: '$$ \\frac{dy}{dx}=xy $$',
      description: 'Put y terms with dy and x terms with dx.',
      examples: [
        {
          title: 'Separate cleanly',
          prompt: 'Solve the differential equation $\\frac{dy}{dx}=xy$ up to the integration step.',
          workedLines: [
            'Divide by $y$: $\\frac{1}{y}\\frac{dy}{dx}=x$.',
            'Write separated form: $\\frac{1}{y}\\,dy=x\\,dx$.',
            'Now integrate both sides.',
          ],
          patternTitle: 'Variable sides',
          patternRows: [
            { from: 'y terms', move: 'with', to: '$dy$' },
            { from: 'x terms', move: 'with', to: '$dx$' },
            { from: 'then', move: 'integrate', to: 'both sides' },
          ],
          tryPrompt: 'Separate $\\frac{dy}{dx}=\\frac{x}{y}$.',
          tryScaffold: ['Move y', 'Move dx', 'Check sides', 'Integrate'],
          takeaway: [
            'Separate before integrating.',
            'Keep differentials with their variables.',
            'Add the constant after integration.',
          ],
          result: '$$ \\frac{1}{y}\\,dy=x\\,dx $$',
        },
      ],
    },
    {
      id: 'initial-condition',
      marker: 'C',
      title: 'Initial Condition',
      purpose: 'Use a given point to find the constant after integration.',
      skillIds: ['differential_equations.initial_condition_basic'],
      preview: '$$ y=Ce^x,\\ y(0)=5 $$',
      description: 'The condition belongs after the general solution is found.',
      examples: [
        {
          title: 'Find the constant',
          prompt: 'If $y=Ce^x$ and $y=5$ when $x=0$, find $C$.',
          workedLines: [
            'Substitute $x=0$ and $y=5$.',
            '$5=Ce^0$.',
            'Since $e^0=1$, $C=5$.',
          ],
          patternTitle: 'Condition step',
          patternRows: [
            { from: 'general solution', move: 'then', to: 'condition' },
            { from: 'given point', move: 'substitute', to: 'find C' },
            { from: 'particular solution', move: 'has', to: 'no unknown C' },
          ],
          tryPrompt: 'If $y=Cx^2$ and $y=12$ when $x=2$, find $C$.',
          tryScaffold: ['Substitute x', 'Substitute y', 'Solve C', 'Write solution'],
          takeaway: [
            'Use the initial condition after integrating.',
            'Substitute both coordinates carefully.',
            'Return the particular solution if asked.',
          ],
          result: '$$ C=5 $$',
        },
      ],
    },
  ],
};

export function getFieldGuideTopicsForRegion(regionId: string | undefined): FieldGuideTopic[] {
  return regionId ? FIELD_GUIDE_TOPICS_BY_REGION[regionId] ?? [] : [];
}

export function fieldGuideSkillCoverage(): Map<string, string[]> {
  const coverage = new Map<string, string[]>();
  for (const [regionId, topics] of Object.entries(FIELD_GUIDE_TOPICS_BY_REGION)) {
    for (const topic of topics) {
      for (const skillId of topic.skillIds) {
        coverage.set(skillId, [...(coverage.get(skillId) ?? []), `${regionId}/${topic.id}`]);
      }
    }
  }
  return coverage;
}
