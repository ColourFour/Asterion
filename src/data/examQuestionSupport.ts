export interface ExamQuestionSupportPrompt {
  firstStep: string;
}

export const EXAM_QUESTION_SUPPORT_PROMPTS: Record<string, ExamQuestionSupportPrompt> = {
  '32spring21_q04': {
    firstStep: 'Separate the variables first: put the y terms with dy and the x terms with dx before integrating and using the given point.',
  },
  '32spring21_q10': {
    firstStep: 'Use the given substitution u = sin x: write du = cos x dx, rewrite the trig factor in u, then change the limits.',
  },
  '32summer21_q02': {
    firstStep: 'Start with the locus |z + 1 - i| <= 1: identify the circle centre and radius, then add the arg(z - 1) boundary ray.',
  },
  '32summer21_q04': {
    firstStep: 'For integration by parts, take u = tan^-1(x/2) and dv = dx first, then apply the limits only after integrating.',
  },
  '32summer21_q07': {
    firstStep: 'Translate "gradient is proportional to" into dy/dx = k times the given expression before using the two points to find k.',
  },
  '31autumn21_q07': {
    firstStep: 'For the differential equation, separate x ln x with dx and t with dt; the derivative of ln(ln x) is the key link.',
  },
  '31autumn21_q04': {
    firstStep: 'Use u = sqrt(x) first: write dx = 2u du, change x + 1 to u^2 + 1, and change the lower limit to sqrt(3).',
  },
  '32spring22_q11': {
    firstStep: 'For the area part, use u = cos x exactly as given: write du = -sin x dx before changing the limits.',
  },
  '31summer22_q04': {
    firstStep: 'Separate y from x first: put dy/y on one side and the x expression over 1 + x^2 with dx on the other.',
  },
  '32summer22_q10': {
    firstStep: 'Use the given complex root first: substitute it or pair it with its conjugate before forming the remaining factor.',
  },
  '32spring23_q01': {
    firstStep: 'Use the subtraction law first: ln A - ln B = ln(A/B). Then exponentiate both sides.',
  },
  '32spring23_q02': {
    firstStep: 'Draw the two argument boundary rays from 1 + 2i first, then add the vertical line Re z = 3.',
  },
  '32spring23_q03': {
    firstStep: 'Set up the division by x^2 - x + 1 first, then compare the remainder with 3x + 2.',
  },
  '32spring23_q04': {
    firstStep: 'Let z = x + iy and z* = x - iy, then clear the denominator before equating real and imaginary parts.',
  },
  '32spring23_q05': {
    firstStep: 'Differentiate the parametric equations with respect to t first, then use dy/dx = (dy/dt)/(dx/dt).',
  },
  '32spring23_q06': {
    firstStep: 'Match 5 sin theta + 12 cos theta to R cos(theta - alpha) first, using R cos alpha and R sin alpha.',
  },
  '32spring23_q07': {
    firstStep: 'For the root check, evaluate the two sides of x = (3/4)sin x + pi/2 at x = 2 and x = 2.5.',
  },
  '32spring23_q09': {
    firstStep: 'Separate e^(3y) from sin^2(2x) before integrating; keep the initial condition until after integration.',
  },
  '32spring23_q10': {
    firstStep: 'For the vector angle, form OA and OB as component vectors, then use the scalar-product formula.',
  },
  '31summer23_q01': {
    firstStep: 'Set u = e^(2x) so the equation becomes a quadratic in u; solve for positive u before taking logs.',
  },
  '31summer23_q03': {
    firstStep: 'Expand sqrt(1 + 4x) up to the x^3 term first, then multiply by 3 + x and collect the x^3 coefficient.',
  },
  '31summer23_q04': {
    firstStep: 'Rewrite sin 2theta and cos 2theta using sin theta and cos theta, then factor the resulting expression.',
  },
  '31summer23_q05': {
    firstStep: 'Differentiate implicitly first, keeping every dy/dx term attached to the y terms before rearranging.',
  },
  '31summer23_q06': {
    firstStep: 'Use the parallelogram relation first: find one side vector, then build the missing position vector for D.',
  },
  '31summer23_q09': {
    firstStep: 'For part (a), integrate x e^(-2x) by parts first, then rearrange the result into a = 1/2 ln(4a + 2) before iterating.',
  },
  '32summer23_q03': {
    firstStep: 'For |z + 3 - 2i| = 2, identify the circle centre and radius before finding the nearest point to the origin.',
  },
  '32summer23_q05': {
    firstStep: 'Substitute a = 2 + yi first, expand powers carefully, and collect real and imaginary parts separately.',
  },
  '32summer23_q06': {
    firstStep: 'Start by evaluating the relevant expression at 0.5 and 1; then apply the given iteration formula once exactly.',
  },
  '32summer23_q07': {
    firstStep: 'Use implicit differentiation first and collect the dy/dx terms before applying the tangent-gradient condition.',
  },
  '32summer23_q08': {
    firstStep: 'Separate y from x first, then integrate before applying y = 0 when x = 1.',
  },
  '32summer23_q11': {
    firstStep: 'Write AB as a vector equation and compare it with line l first; for the perpendicular foot, use a zero dot product with the line direction.',
  },
  '33summer23_q04': {
    firstStep: 'Differentiate x and y with respect to theta separately, then divide dy/dtheta by dx/dtheta.',
  },
  '33summer23_q05': {
    firstStep: 'Differentiate y = x^2 cos 3x and set the derivative to zero first, then use the fixed-point formula to iterate for a.',
  },
  '33summer23_q06': {
    firstStep: 'First combine 3 cos x + 2 cos(x - 60 degrees) into R cos(x - alpha), then use that form in the equation.',
  },
  '33summer23_q07': {
    firstStep: 'Use u = cos x first: write du = -sin x dx, rewrite sin 2x as 2sin x cos x, then change the limits.',
  },
  '33summer23_q09': {
    firstStep: 'Use perpendicular direction vectors first: take the scalar product and set it equal to zero.',
  },
  '33summer23_q11': {
    firstStep: 'Use the modulus-argument form first: find the modulus and argument before cubing with de Moivre.',
  },
  '31autumn23_q01': {
    firstStep: 'Differentiate y = x^2/(1 - 3x) with the quotient rule, then set the gradient expression equal to 8.',
  },
  '31autumn23_q02': {
    firstStep: 'Convert |z - 2i| <= |z + 2 - i| into a perpendicular-bisector boundary before adding the argument region.',
  },
  '31autumn23_q03': {
    firstStep: 'Take logs of y = ab^x to get ln y = ln a + x ln b, then use the straight-line gradient and intercept.',
  },
  '31autumn23_q04': {
    firstStep: 'Convert u to x + iy first, then use tan(arg u) = imaginary part divided by real part.',
  },
  '31autumn23_q05': {
    firstStep: 'Use compound-angle formulae on each sine and cosine expression, then collect the tan x terms.',
  },
  '31autumn23_q06': {
    firstStep: 'Find dy/dx from the parametric derivatives first, then use the normal gradient condition.',
  },
  '31autumn23_q07': {
    firstStep: 'Separate the x terms from tan theta first; integrate before applying x = 1 when theta = 0.',
  },
  '31autumn23_q08': {
    firstStep: 'For the graph proof, name the two functions you would sketch; for the bracket, evaluate at x = 1 and x = 2.',
  },
  '32autumn23_q02': {
    firstStep: 'Differentiate x and y with respect to t first, then substitute t = e only after forming dy/dx.',
  },
  '32autumn23_q03': {
    firstStep: 'Use p(1/2) = 0 from the factor 2x - 1 first, then use p(-1) = 12 from the remainder on division by x + 1.',
  },
  '32autumn23_q04': {
    firstStep: 'Draw the circle |z - 4 - 3i| <= 2 first, then intersect it with the half-plane Re z <= 3.',
  },
  '32autumn23_q05': {
    firstStep: 'Split the rational integrand first: look for a constant plus terms involving x/(x^2 + 4) and 1/(x^2 + 4).',
  },
  '32autumn23_q06': {
    firstStep: 'Start with the two graph forms for the equation, then evaluate the expressions at 0.6 and 0.8 for the bracket.',
  },
  '33autumn23_q01': {
    firstStep: 'Remove the modulus-style inequality first: solve the two boundary equations 2^(x+1) - 2 = +/-0.5.',
  },
  '33autumn23_q02': {
    firstStep: 'Turn |z - 1 + 2i| < |z| into a perpendicular-bisector boundary, then add the circle |z - 2| < 1.',
  },
  '33autumn23_q03': {
    firstStep: 'Use the remainder theorem twice: substitute x = -2 for x + 2, then x = 1/2 for 2x - 1.',
  },
  '33autumn23_q05': {
    firstStep: 'Differentiate the product or quotient form carefully, then set dy/dx = 0 to locate stationary points.',
  },
  '33autumn23_q06': {
    firstStep: 'Rewrite cot^2 theta as 1/sin^2 theta - 1 and cos 2theta as 1 - 2sin^2 theta.',
  },
  '33autumn23_q07': {
    firstStep: 'Differentiate implicitly first, collect dy/dx terms, then set the numerator of dy/dx to zero for a horizontal tangent.',
  },
  '33autumn23_q08': {
    firstStep: 'Separate cos^2(3y) from e^(4x) first; use sec^2(3y) dy on the y side before integrating.',
  },
  '33autumn23_q10': {
    firstStep: 'For the area part, integrate x cos 2x by parts: choose u = x and dv = cos 2x dx.',
  },
  '31summer24_q01': {
    firstStep: 'Expand (1 - 2x)^(1/2) up to x^2 first, then multiply by (3 + x) and keep terms only to x^2.',
  },
  '31summer24_q02': {
    firstStep: 'Combine the logs so ln(x - 5) + ln x = 7, then exponentiate to form a quadratic.',
  },
  '31summer24_q03': {
    firstStep: 'Take logs of a^y = bx and rearrange into a straight-line relation using y against ln x.',
  },
  '31summer24_q04': {
    firstStep: 'Find the modulus and argument of u first, then combine modulus and argument with the given complex number v.',
  },
  '31summer24_q07': {
    firstStep: 'Sketch the circle locus first, then turn the equal-distance locus for w into a perpendicular bisector.',
  },
  '31summer24_q09': {
    firstStep: 'Use perpendicular direction vectors first: set their dot product equal to zero to find a, then equate line components.',
  },
  '32spring24_q01': {
    firstStep: 'Start the division by x^2 + 5 first, or write the polynomial as (x^2 + 5) times a quotient plus the stated remainder.',
  },
  '32spring24_q07': {
    firstStep: 'Differentiate y = xe^(2x) - 5x and set the derivative to zero first, then use the given fixed-point equation for the root.',
  },
  '32spring24_q08': {
    firstStep: 'Expand cos(x + pi/4) first, collect the sin x and cos x terms, then convert them to R sin(x + alpha).',
  },
  '32spring24_q09': {
    firstStep: 'Form the side and diagonal vectors from OA, OB and OC first, then use scalar products for the angle work.',
  },
};

export function examQuestionSupportPrompt(questionId: string): ExamQuestionSupportPrompt | undefined {
  return EXAM_QUESTION_SUPPORT_PROMPTS[questionId];
}
