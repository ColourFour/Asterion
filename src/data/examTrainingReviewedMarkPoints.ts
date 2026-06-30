export interface ReviewedExamTrainingMarkPoint {
  mark_code: string;
  label: string;
  confidence?: number;
  review_status?: string;
}

function mp(mark_code: string, label: string): ReviewedExamTrainingMarkPoint {
  return { mark_code, label, confidence: 1, review_status: 'reviewed' };
}

const REVIEWED_EXAM_TRAINING_MARK_POINTS: Record<string, ReviewedExamTrainingMarkPoint[]> = {
  '31summer23_q03_whole': [
    mp('B1', 'State unsimplified term in x^3, or its coefficient, in the expansion of (1+4x)^(1/2).'),
    mp('B1', 'State unsimplified term in x^2, or its coefficient, in the expansion of (1+4x)^(1/2).'),
    mp('M1', 'Multiply by (3+x) and combine terms in x^3, or their coefficients.'),
    mp('A1', 'Obtain answer 10, or accept 10x^3.'),
  ],
  '31summer24_q01_whole': [
    mp('B1', 'State correct unsimplified first two terms of the expansion of (1-2x)^(1/2).'),
    mp('B1', 'State correct unsimplified term in x^2.'),
    mp('M1', 'Obtain sufficient terms of the product of (3+x) and the expansion up to the term in x^2.'),
    mp('A1', 'Obtain final answer 3 - 2x - (5/2)x^2.'),
  ],
  '32autumn23_q03_whole': [
    mp('M1', 'Substitute x = 1/2 and equate the result to zero, or use equivalent division remainder work.'),
    mp('A1', 'Obtain a correct evaluated equation, e.g. 1/4 + a/4 - 11/2 + b = 0 or a + 4b = 21.'),
    mp('M1', 'Substitute x = -1 and equate the result to 12, or use equivalent division remainder work.'),
    mp('A1', 'Obtain a correct evaluated equation, e.g. -2 + a + 11 + b = 12 or a + b = 3.'),
    mp('A1', 'Obtain a = -3 and b = 6.'),
  ],
  '32spring23_q03_whole': [
    mp('M1', 'Commence division and reach partial quotient 2x^2 + (a +/- 2)x.'),
    mp('A1', 'Obtain correct quotient 2x^2 + (a + 2)x + a.'),
    mp('M1', 'Set their linear remainder equal to part of 3x + 2 and solve for a or for b.'),
    mp('A1', 'Obtain answer a = -3.'),
    mp('A1', 'Obtain answer b = 5.'),
  ],
  '32spring24_q01_whole': [
    mp('M1', 'Commence division and reach partial quotient of the form x^2 +/- 3x, or equivalent coefficient comparison.'),
    mp('A1', 'Obtain quotient x^2 - 3x + 4.'),
    mp('A1', 'Obtain remainder 3x + 7.'),
  ],
  '33autumn23_q03_whole': [
    mp('M1', 'Substitute x = -2 and equate the result to -38, or use equivalent division remainder work.'),
    mp('A1', 'Obtain a correct evaluated equation, e.g. -16 + 4a - 2b + 6 = -38 or 4a - 2b = -28.'),
    mp('M1', 'Substitute x = 1/2 and equate the result to 19/2, or use equivalent division remainder work.'),
    mp('A1', 'Obtain a correct evaluated equation, e.g. 1/4 + a/4 + b/2 + 6 = 19/2 or a/4 + b/2 = 13/4.'),
    mp('A1', 'Obtain a = -3 and b = 8.'),
  ],

  '31autumn23_q02_whole': [
    mp('B1', 'Show the points representing 2i and -2+i.'),
    mp('B1FT', 'Show the perpendicular bisector of their two plotted points.'),
    mp('B1', 'Show the correct half-line of gradient 1 from (-1, 0).'),
    mp('B1', 'Show the correct loci and shade the correct region.'),
  ],
  '31autumn23_q04_a': [
    mp('M1', 'Multiply numerator and denominator by the conjugate a+5i, or use an equivalent real-imaginary comparison.'),
    mp('M1', 'Use i^2=-1 correctly, or compare real and imaginary parts correctly.'),
    mp('A1', 'Obtain the correct expression for u in terms of a.'),
  ],
  '31summer24_q04_b': [
    mp('B1FT', 'State or imply r=5/2, following through from their modulus in part (a).'),
    mp('B1FT', 'State or imply theta=5pi/6, following through from their argument in part (a).'),
  ],
  '31summer24_q07_a': [
    mp('B1', 'Show a circle with centre (3, -2).'),
    mp('B1FT', 'Show a circle with radius 2, following through a centre not at the origin.'),
    mp('B1', 'Show the point (-3, 4), or the midpoint (0, 1).'),
    mp('B1FT', 'Show the perpendicular bisector of the line joining (-3, 4) and the centre of the circle.'),
  ],
  '32autumn23_q04_b': [
    mp('M1', 'Carry out a complete method for finding the greatest value of arg z.'),
    mp('A1', 'Obtain the greatest value 1.06 radians, or 60.45 degrees.'),
  ],
  '32spring23_q02_a': [
    mp('B1', 'Show correct half-lines from 1+2i, symmetrical about y=2.'),
    mp('B1', 'Show the line x=3 extending in both quadrants.'),
    mp('B1FT', 'Shade the correct region using the drawn boundaries.'),
  ],
  '32spring23_q02_b': [
    mp('M1', 'Carry out a complete method for finding the least value of arg z.'),
    mp('A1', 'Obtain the least value of arg z, -0.454 to 3 significant figures.'),
  ],
  '32spring23_q04_whole': [
    mp('B1', 'Substitute z=x+iy and z*=x-iy to obtain a correct Cartesian equation.'),
    mp('M1', 'Separate real and imaginary parts and rearrange toward a circle equation.'),
    mp('A1', 'Obtain the correct circle equation.'),
    mp('DM1', 'Use the circle geometry to find the required least modulus.'),
    mp('A1', 'Obtain the correct least modulus value.'),
  ],

  '32summer21_q07_whole': [
    mp('B1', 'State a differential equation of the form dy/dx = ky/(x+1).'),
    mp('M1', 'Separate variables and integrate at least one side correctly.'),
    mp('A1', 'Obtain the integrated logarithmic relation.'),
    mp('A1', 'Use the first condition correctly in the integrated relation.'),
    mp('DM1', 'Use the second condition to determine the remaining constant or parameter.'),
    mp('A1', 'Obtain the required particular solution.'),
    mp('A1', 'Obtain the final requested value from the particular solution.'),
  ],
  '31autumn21_q07_b': [
    mp('B1', 'Separate the variables correctly.'),
    mp('B1', 'Obtain the ln(ln x) term.'),
    mp('B1', 'Obtain the -ln t term.'),
    mp('M1', 'Evaluate the constant, or use x=e and t=2 as limits, in a logarithmic solution.'),
    mp('A1', 'Obtain the correct solution in any form.'),
    mp('M1', 'Use logarithm laws to remove logarithms.'),
    mp('A1', 'Obtain x=e^(2/t), or a simplified equivalent.'),
  ],
  '31autumn21_q07_c': [
    mp('B1', 'State that x tends to 1.'),
  ],
  '32summer23_q08_b': [
    mp('B1', 'State the exact limiting value of y as x increases.'),
  ],
  '33autumn23_q08_whole': [
    mp('B1', 'Separate variables into a sec^2(3y) term and an exponential term.'),
    mp('M1', 'Integrate the trigonometric side correctly.'),
    mp('A1', 'Integrate the exponential side correctly.'),
    mp('B1', 'Use the given initial condition in the integrated equation.'),
    mp('M1', 'Use the remaining condition to determine the constant.'),
    mp('A1', 'Obtain the correct particular relation.'),
    mp('A1', 'Obtain the final requested value.'),
  ],

  '31autumn23_q01_whole': [
    mp('M1', 'Use the quotient rule or product rule correctly.'),
    mp('A1', 'Obtain the correct derivative in any form.'),
    mp('DM1', 'Equate the derivative to zero and form a solvable equation.'),
    mp('A1', 'Obtain the correct stationary x-value or values.'),
    mp('A1', 'Obtain the required stationary point result.'),
  ],
  '31summer23_q05_b': [
    mp('M1', 'State or imply 2ay - x^2 = 0 for a stationary point.'),
    mp('DM1', 'Substitute into the curve equation to obtain an equation in x and a, or in y and a.'),
    mp('A1', 'Obtain one correct stationary point.'),
    mp('A1', 'Obtain the second correct stationary point and no others.'),
  ],
  '32spring23_q05_b': [
    mp('B1', 'Obtain x=-e^(-2) and y=3 at t=-1.'),
    mp('B1', 'Obtain the gradient of the normal as -e^(-2).'),
    mp('B1', 'Substitute y=0 into the normal equation to obtain the required intercept.'),
  ],
  '32summer23_q07_b': [
    mp('M1', 'Equate dy/dx to -2 and solve for x in terms of y, or for y in terms of x.'),
    mp('A1', 'Obtain x=-4y, or y=-x/4.'),
    mp('DM1', 'Substitute their relation into the curve equation.'),
    mp('A1', 'Obtain one correct exact pair of values.'),
    mp('A1', 'Obtain both correct pairs of values with correct pairing.'),
  ],
  '33autumn23_q07_a': [
    mp('B1', 'State or imply the 2y dy/dx term when differentiating y^2.'),
    mp('M1', 'Equate the derivative of the left-hand side to zero and solve for dy/dx.'),
    mp('A1', 'Obtain the given expression for dy/dx from correct working.'),
  ],
  '33autumn23_q05_whole': [
    mp('M1', 'Use the product rule or quotient rule correctly.'),
    mp('A1', 'Obtain the correct derivative in any form.'),
    mp('M1', 'Equate the derivative or numerator to zero and solve for x.'),
    mp('A1', 'Obtain the stationary point at x=0.'),
    mp('A1', 'Obtain the positive non-zero stationary point.'),
    mp('A1', 'Obtain the negative non-zero stationary point.'),
  ],

  '31autumn21_q04_whole': [
    mp('B1', 'State the correct derivative for the substitution u=sqrt(x).'),
    mp('M1', 'Substitute throughout for x and dx.'),
    mp('A1', 'Obtain the correct transformed integral.'),
    mp('M1', 'Integrate to an arctan form.'),
    mp('A1', 'Use the transformed limits correctly.'),
    mp('A1', 'Obtain the exact final value.'),
  ],
  '32autumn23_q05_whole': [
    mp('B1', 'Split the fraction correctly before integrating.'),
    mp('M1', 'Attempt integration to obtain logarithmic or arctan terms from the split form.'),
    mp('A1FT', 'Obtain the correct logarithmic term, following through their split coefficients.'),
    mp('A1FT', 'Obtain the correct arctan term, following through their split coefficients.'),
    mp('M1', 'Use the limits 0 and 6 correctly in the integrated expression.'),
    mp('A1', 'Obtain the final exact expression.'),
  ],
  '32summer21_q04_whole': [
    mp('M1', 'Commence integration by parts and reach an expression with a remaining arctan-type integral.'),
    mp('A1', 'Obtain the first integration-by-parts term correctly.'),
    mp('A1', 'Obtain the remaining integral term correctly.'),
    mp('DM1', 'Complete the integration and use the limits correctly.'),
    mp('A1', 'Obtain the final exact value.'),
  ],
  '33summer23_q07_a': [
    mp('B1', 'State du/dx = -sin x for the substitution u=cos x.'),
    mp('M1', 'Use the double-angle formula and substitute for x and dx throughout.'),
    mp('A1', 'Obtain the correct integral in u.'),
    mp('A1', 'Complete the integration for part (a).'),
  ],
  '33summer23_q07_b': [
    mp('M1', 'Commence integration by parts for the u e^(2u) term.'),
    mp('A1', 'Obtain the correct integrated expression in u.'),
    mp('DM1', 'Use the substituted limits or back-substitution correctly.'),
    mp('A1', 'Obtain the final exact answer for part (b).'),
  ],
  '33autumn23_q10_a': [
    mp('M1', 'Use the product rule correctly on y=x cos 2x.'),
    mp('A1', 'Obtain the correct derivative in any form.'),
    mp('A1FT', 'Obtain y=-pi/2 and dy/dx=-1 when x=pi/2, following through their derivative.'),
    mp('A1', 'Obtain the tangent equation x+y=0.'),
  ],
  '31autumn23_q09_b': [
    mp('B1', 'State or imply the correct expression for dx in terms of du.'),
    mp('M1', 'Substitute for x and dx.'),
    mp('A1', 'Obtain the correct transformed integral.'),
    mp('M1', 'Use the correct limits in the transformed integral.'),
    mp('A1', 'Obtain the final exact answer.'),
  ],

  '31autumn23_q03_whole': [
    mp('B1', 'State or imply ln y = ln a + x ln b.'),
    mp('M1', 'Carry out a complete method for finding ln a or ln b.'),
    mp('A1', 'Obtain a = 4.06 to 3 significant figures.'),
    mp('A1', 'Obtain b = 9.97 to 3 significant figures.'),
  ],
  '33autumn23_q01_whole': [
    mp('B1', 'State or imply the correct non-modular inequality.'),
    mp('M1', 'Use a correct method to solve the resulting exponential equation or inequality.'),
    mp('A1', 'Obtain the critical values x=0.322 and x=-0.415 to 3 significant figures.'),
    mp('A1', 'State the final strict interval -0.415 < x < 0.322.'),
  ],

  '31summer23_q09_a': [
    mp('M1', 'Commence integration by parts for x e^(-2x).'),
    mp('A1', 'Obtain the first integration-by-parts line correctly.'),
    mp('A1', 'Complete the integration correctly.'),
    mp('DM1', 'Use the limits correctly and equate to 1/8.'),
    mp('A1', 'Obtain a = (1/2) ln(4a+2) correctly.'),
  ],
  '31autumn23_q08_a': [
    mp('B1', 'Sketch a relevant graph such as y=e^x-3 with the correct shape and intercept.'),
    mp('B1', 'Sketch a second relevant graph such as y=x and justify the single intersection.'),
  ],
  '32autumn23_q06_a': [
    mp('B1', 'Sketch a relevant graph such as y=cot x on the required interval.'),
    mp('B1', 'Sketch a second relevant graph such as y=2-cos x and justify the intersection.'),
  ],
  '32autumn23_q06_b': [
    mp('M1', 'Calculate relevant values at x=0.6 and x=0.8, working in radians.'),
    mp('A1', 'Complete the interval argument with correct calculated values.'),
  ],
  '32spring23_q07_b': [
    mp('M1', 'Calculate relevant values at x=2 and x=2.5, working in radians.'),
    mp('A1', 'Complete the interval argument with correct calculated values.'),
  ],
  '31summer23_q09_b': [
    mp('M1', 'Calculate relevant values at a=0.5 and a=1.'),
    mp('A1', 'Complete the sign or comparison argument correctly.'),
  ],
  '31summer23_q09_c': [
    mp('M1', 'Use the iterative process correctly at least once.'),
    mp('A1', 'Obtain final answer 0.84.'),
    mp('A1', 'Show enough iterations or a sign change to justify 0.84 to 2 decimal places.'),
  ],
  '32spring24_q07_a': [
    mp('M1', 'Use the product rule correctly.'),
    mp('A1', 'Obtain the correct derivative in any form.'),
    mp('A1', 'Equate the derivative to zero and obtain the given fixed-point form.'),
  ],
  '32spring24_q07_b': [
    mp('M1', 'Calculate relevant values at x=0.4 and x=0.5.'),
    mp('A1', 'Complete the interval argument with correct calculated values.'),
  ],
  '32spring24_q07_c': [
    mp('M1', 'Use the iterative process correctly at least twice.'),
    mp('A1', 'Obtain final answer 0.47.'),
    mp('A1', 'Show enough iterations or a sign change to justify 0.47 to 2 decimal places.'),
  ],
  '33summer23_q05_a': [
    mp('M1', 'Use the product rule correctly.'),
    mp('A1', 'Obtain the correct derivative in any form.'),
    mp('A1', 'Equate the derivative to zero and obtain the required fixed-point form.'),
  ],
  '33summer23_q05_b': [
    mp('M1', 'Use the iterative process correctly at least twice.'),
    mp('A1', 'Obtain final answer 0.36.'),
    mp('A1', 'Show enough iterations or a sign change to justify 0.36 to 2 decimal places.'),
  ],

  '32spring23_q06_a': [
    mp('B1', 'State R=13.'),
    mp('M1', 'Use correct trigonometric formulae to find alpha.'),
    mp('A1', 'Obtain the correct R-form.'),
  ],
  '31autumn23_q05_b': [
    mp('B1', 'Obtain one correct value of x in the required interval.'),
    mp('B1FT', 'Obtain the second correct value of x in the interval, following through the first value where allowed.'),
  ],
  '31summer23_q04_b': [
    mp('B1', 'Factorise the trigonometric equation or obtain an equivalent quadratic in tan theta.'),
    mp('M1', 'Solve to obtain a value for theta.'),
    mp('A1', 'Obtain one correct value, such as 45 degrees.'),
    mp('A1', 'Obtain the second correct value and no others in the interval.'),
  ],
  '32spring23_q06_b': [
    mp('B1FT', 'State the inverse-cosine value, following through their R.'),
    mp('M1', 'Use a correct method to find a value of 2x in the interval.'),
    mp('A1', 'Obtain the first correct x-value.'),
    mp('A1', 'Obtain the second correct x-value.'),
  ],
  '32spring24_q08_a': [
    mp('B1', 'Use the correct expansion of cos(x+pi/4).'),
    mp('B1FT', 'State R from the obtained expression.'),
    mp('M1', 'Use correct trigonometric formulae to find alpha.'),
    mp('A1', 'Obtain the correct R-form.'),
  ],
  '32spring24_q08_b': [
    mp('B1FT', 'State the inverse-sine value, following through their R.'),
    mp('M1', 'Use a correct method to obtain an unsimplified theta value.'),
    mp('A1', 'Obtain one correct answer in the interval.'),
    mp('A1', 'Obtain a second correct answer in the interval.'),
    mp('A1', 'Obtain the remaining correct answers in the interval and no extras.'),
  ],
  '33autumn23_q06_a': [
    mp('M1', 'Use a correct Pythagorean trigonometric identity.'),
    mp('B1', 'Use or obtain the correct reciprocal trigonometric relation.'),
    mp('A1', 'Obtain the required simplified expression.'),
  ],
  '33autumn23_q06_b': [
    mp('M1', 'Solve the resulting quadratic trigonometric equation.'),
    mp('A1', 'Obtain a correct theta value.'),
    mp('A1', 'Obtain all required theta values in the interval.'),
  ],
  '33summer23_q06_a': [
    mp('B1', 'Expand cos(x-60 degrees) correctly and combine terms.'),
    mp('B1FT', 'State R from the obtained expression.'),
    mp('M1', 'Use correct trigonometric formulae to find alpha.'),
    mp('A1', 'Obtain the correct R-form.'),
  ],
  '33summer23_q06_b': [
    mp('B1FT', 'State the inverse-cosine value, following through their R.'),
    mp('M1', 'Use a correct method to find a value of 2 theta in the interval.'),
    mp('A1', 'Obtain one correct theta value.'),
    mp('A1', 'Obtain the remaining correct theta value.'),
  ],

  '31summer24_q09_a': [
    mp('B1', 'Evaluate the scalar product of the direction vectors and equate it to zero.'),
  ],
  '31summer24_q09_b': [
    mp('B1', 'Express a general point of at least one line correctly in component form.'),
    mp('M1', 'Equate components of the two lines and solve for the parameters.'),
    mp('A1', 'Obtain the correct parameter values.'),
    mp('A1', 'Obtain the correct intersection point.'),
  ],
  '31summer24_q09_c': [
    mp('M1', 'Equate a component of line l1 to the matching component of A and solve for the parameter.'),
    mp('A1', 'Use the parameter value to show the point is A.'),
  ],
  '31summer24_q09_d': [
    mp('M1', 'Use the midpoint or direction-vector method to find the position vector of B.'),
    mp('A1', 'Obtain the position vector of B as 3i - 3j + 7k.'),
  ],
  '32spring24_q09_a': [
    mp('M1', 'Find the scalar product of a pair of adjacent sides.'),
    mp('A1', 'Show that the adjacent sides are perpendicular.'),
    mp('M1', 'Compare a pair of opposite sides.'),
    mp('A1', 'Show the opposite sides are parallel and equal in length, hence OABC is a rectangle.'),
  ],
  '32spring24_q09_b': [
    mp('B1', 'State or imply vector AC, or half of vector AC.'),
    mp('M1', 'Find the scalar product of a pair of relevant vectors.'),
    mp('M1', 'Use the correct process for the moduli and inverse cosine.'),
    mp('A1', 'Obtain the angle 65.0 degrees, or 1.13 radians.'),
  ],
  '32summer23_q11_a': [
    mp('M1', 'Carry out a correct method for finding a vector equation for AB.'),
    mp('A1', 'Obtain a correct vector equation for AB.'),
    mp('M1', 'Equate two pairs of components with the other line.'),
    mp('A1', 'Obtain the correct parameter values.'),
    mp('A1', 'Obtain the required intersection result.'),
  ],
  '32summer23_q11_b': [
    mp('B1', 'Find AP for a general point P on line l.'),
    mp('M1', 'Set the scalar product with the line direction equal to zero.'),
    mp('A1', 'Solve for the parameter and obtain the foot of the perpendicular.'),
    mp('A1', 'Obtain the required shortest distance result.'),
  ],
  '33summer23_q09_a': [
    mp('M1', 'Set the scalar product of direction vectors equal to zero.'),
    mp('M1', 'Use point P to find the value of lambda.'),
    mp('A1', 'Obtain c=-5 or b=6.'),
    mp('A1', 'Obtain a=-6, b=6, and c=-5.'),
  ],
  '33summer23_q09_b': [
    mp('B1', 'Find PQ, or QP, for a general point Q on line m.'),
    mp('M1', 'Set the scalar product with the direction vector for m equal to zero.'),
    mp('A1', 'Solve and obtain mu=-1.'),
    mp('A1', 'Obtain OQ or PQ correctly.'),
    mp('DM1', 'Carry out a method to find the position vector of R.'),
    mp('A1', 'Obtain the correct position vector of R.'),
  ],
};

export function reviewedExamTrainingMarkPointsForSubpart(
  subpartId: string | undefined,
): ReviewedExamTrainingMarkPoint[] | undefined {
  if (!subpartId) return undefined;
  return REVIEWED_EXAM_TRAINING_MARK_POINTS[subpartId];
}
