import { getRegionHubAsset } from '../lib/regionAssets';
import { resolvePublicAssetPath } from '../lib/resolveAssetPath';
import type { P3RegionId } from '../lib/p3SkillContract';

export interface GuardianChallenge {
  regionId: P3RegionId;
  title: string;
  topicLabel: string;
  prompt: string;
  studentFacingWarning: string;
  guidance: string[];
  guardianAssetPath?: string;
  status: 'placeholder';
  countsForMastery: false;
}

export const GUARDIAN_PLACEHOLDER_WARNING = 'This stretch challenge is a pilot placeholder. It is designed to feel like a boss problem for this region. It may go beyond CAIE 9709 P3 and does not count as official mastery evidence yet.';

const guardianAssetPaths: Partial<Record<P3RegionId, string>> = {
  'algebra-forge': '/assets/guardian-art/optimized/algebra-forge-guardian-960.png',
  'calculus-cliffs': '/assets/guardian-art/optimized/calculus-cliffs-guardian-960.png',
  'complex-harbor': '/assets/guardian-art/optimized/complex-harbor-guardian-960.png',
  'differential-shrine': '/assets/guardian-art/optimized/differential-shrine-guardian-960.png',
  'integration-gardens': '/assets/guardian-art/optimized/integration-gardens-guardian-960.png',
  'logarithm-grove': '/assets/guardian-art/optimized/logarithm-grove-guardian-960.png',
  'numerical-mines': '/assets/guardian-art/optimized/numerical-mines-guardian-960.png',
  'trig-observatory': '/assets/guardian-art/optimized/trig-observatory-guardian-960.png',
};

const challengeRecords: Array<Omit<GuardianChallenge, 'guardianAssetPath' | 'status' | 'countsForMastery' | 'studentFacingWarning'>> = [
  {
    regionId: 'algebra-forge',
    title: 'Vault Identity Lock',
    topicLabel: 'Algebraic manipulation and partial fractions',
    prompt: 'Find constants A, B, C, D, and E such that $\\frac{2x^3-5x^2+7x-4}{(x-1)^2(x^2+1)} = A + \\frac{B}{x-1} + \\frac{C}{(x-1)^2} + \\frac{Dx+E}{x^2+1}$. Then state one value of x that would be unsafe to substitute directly while solving.',
    guidance: [
      'Start by matching degrees, then multiply through by the full denominator.',
      'Use x = 1 to isolate the repeated-factor coefficient before comparing remaining powers of x.',
      'The repeated factor means x = 1 is excluded from direct substitution into the original fraction.',
    ],
  },
  {
    regionId: 'logarithm-grove',
    title: 'Lantern Growth Gate',
    topicLabel: 'Logarithmic and exponential equations',
    prompt: 'Solve $\\log_2(x+3) + \\log_2(x-1) = 3 + \\log_2(x-2)$, giving all restrictions on x before solving.',
    guidance: [
      'Write the domain first: every logarithm argument must be positive.',
      'Combine the logarithms into one logarithmic statement before converting to exponential form.',
      'Check any algebraic solution in the original equation, not only in the simplified equation.',
    ],
  },
  {
    regionId: 'trig-observatory',
    title: 'Spire Alignment Trial',
    topicLabel: 'Trigonometric identities and equations',
    prompt: 'For $0 \\le x < 2\\pi$, solve $3\\sin x - 4\\cos x = 2\\sin 2x$. Give answers in exact form where possible or to 3 significant figures.',
    guidance: [
      'Consider the R-form for the linear expression on the left, but notice the right side still contains a product.',
      'Rewrite $\\sin 2x$ as $2\\sin x\\cos x$ and look for useful cases.',
      'Keep the full interval check; this kind of equation can lose or add roots if divided too early.',
    ],
  },
  {
    regionId: 'complex-harbor',
    title: 'Argand Tide Locus',
    topicLabel: 'Complex-number loci and modulus-argument form',
    prompt: 'The complex number z satisfies $|z-(2+i)| = 2|z+i|$. Describe the locus in Cartesian form, then find where this locus intersects the real axis.',
    guidance: [
      'Let z = x + iy and translate each modulus into a distance expression.',
      'Square both sides carefully, then collect terms to identify the circle.',
      'For real-axis intersections, set y = 0 after the locus equation is simplified.',
    ],
  },
  {
    regionId: 'calculus-cliffs',
    title: 'Cliff Tangent Trial',
    topicLabel: 'Implicit and tangent differentiation',
    prompt: 'The curve is defined implicitly by $x^2y + y^3 = 10$. Find the equation of the tangent at the point where x = 3 and y = 1, then state whether y is increasing or decreasing there.',
    guidance: [
      'Differentiate every term with respect to x, using the product rule on $x^2y$ and the chain rule on $y^3$.',
      'Substitute x = 3 and y = 1 only after finding the expression involving $dy/dx$.',
      'The sign of the gradient tells you whether y is increasing or decreasing at that point.',
    ],
  },
  {
    regionId: 'integration-gardens',
    title: 'Terrace Integral Trial',
    topicLabel: 'Integration by substitution and partial fractions',
    prompt: 'Evaluate $\\int_0^1 \\frac{2x+1}{x^2+x+1}\\,dx$, then explain why the denominator does not create a singularity on this interval.',
    guidance: [
      'Split the numerator so part of it is the derivative of the denominator.',
      'A small leftover constant may lead to an arctangent-style integral, which is beyond routine P3 fluency but useful as a stretch.',
      'Check the quadratic discriminant or complete the square to discuss why the denominator stays positive.',
    ],
  },
  {
    regionId: 'vector-workshop',
    title: 'Gate Alignment Problem',
    topicLabel: 'Vector geometry and line angles',
    prompt: 'Line l has equation $\\mathbf{r}=(1,2,-1)+s(2,-1,2)$. Point P has position vector $(4,0,3)$. Find the point on l closest to P and the shortest distance from P to l.',
    guidance: [
      'Write a general point on the line, then form the vector from that point to P.',
      'At the closest point, this vector is perpendicular to the line direction.',
      'Use a scalar product equal to zero to find the parameter, then compute the distance.',
    ],
  },
  {
    regionId: 'numerical-mines',
    title: 'Fixed-Point Forge',
    topicLabel: 'Iteration and root finding',
    prompt: 'The equation $x^3 - 2x - 5 = 0$ has a root between 2 and 3. Investigate whether the iteration $x_{n+1}=\\sqrt[3]{2x_n+5}$ converges from $x_0=2$, and estimate the root to 3 decimal places.',
    guidance: [
      'Use a few iterations and track whether the values settle.',
      'For a stronger check, consider the size of the derivative of the iteration function near the root.',
      'A sign-change check can support the interval, but the iteration behavior is the main focus here.',
    ],
  },
  {
    regionId: 'differential-shrine',
    title: 'Shrine Flow Model',
    topicLabel: 'Separable differential equations',
    prompt: 'A quantity y changes according to $\\frac{dy}{dx}=y(4-y)$, with y = 1 when x = 0. Separate variables and find y in terms of x.',
    guidance: [
      'Separate into $\\frac{1}{y(4-y)}dy = dx$ before integrating.',
      'Use partial fractions on the left side.',
      'Apply the initial condition after integrating to determine the constant.',
    ],
  },
];

export const guardianChallenges: GuardianChallenge[] = challengeRecords.map((record) => {
  const asset = guardianAssetPaths[record.regionId] ?? getRegionHubAsset(record.regionId);
  return {
    ...record,
    studentFacingWarning: GUARDIAN_PLACEHOLDER_WARNING,
    guardianAssetPath: asset ? resolvePublicAssetPath(asset) : undefined,
    status: 'placeholder',
    countsForMastery: false,
  };
});

export function getGuardianChallengeForRegion(regionId: string): GuardianChallenge | undefined {
  return guardianChallenges.find((challenge) => challenge.regionId === regionId);
}
