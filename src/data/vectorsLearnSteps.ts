import type { FieldGuideTopic } from './fieldGuideTopics';
import type { LearnStep } from './learnModeLessons';
import type { SkillCheckItem, SkillCheckInputType } from './skillCheckItems';
import type { SkillCheckAnswerType } from '../skill-checks/answerChecker';

type VectorsLearnCheckDraft = {
  id: string;
  prompt: string;
  inputType?: SkillCheckInputType;
  answerType: SkillCheckAnswerType;
  acceptedAnswers: string[];
  expectedAnswer: string | string[];
  options?: Array<{ id: string; label: string }>;
  expectedOptionIds?: string[];
  orderInsensitive?: boolean;
  hint: string;
  methodCue?: string;
  firstStep?: string;
  workedRoute: string[];
  skillId: string;
  mistakeTags?: string[];
};

type VectorsLearnStepDraft = {
  id: string;
  title: string;
  fieldGuideTopicId: string;
  stem: string;
  prompt: string;
  principle: string;
  explanation: string;
  examTransfer: string;
  primary: VectorsLearnCheckDraft;
  similar: VectorsLearnCheckDraft;
};

const commonVectorMistakes = ['method choice', 'notation', 'parameter error', 'incomplete reasoning'];

function expressionChoices(labels: string[], correctIndex = 0): Array<{ id: string; label: string }> {
  return labels.map((label, index) => ({
    id: index === correctIndex ? 'correct' : `distractor-${index}`,
    label,
  }));
}

const VECTORS_LEARN_DRAFTS: VectorsLearnStepDraft[] = [
  {
    id: 'learn-vectors-direction-from-points',
    title: 'Direction vector from two points',
    fieldGuideTopicId: 'vectors_notation',
    stem: 'A line passes through $A(1,2,-1)$ and $B(4,0,5)$. The direction vector is the displacement from one point to the other.',
    prompt: 'Find $\\overrightarrow{AB}$.',
    principle: 'Principle: subtract initial point coordinates from final point coordinates.',
    explanation: '$\\overrightarrow{AB}=B-A=(4-1,0-2,5-(-1))=(3,-2,6)$.',
    examTransfer: 'Exam transfer: line and angle questions often start by forming a direction vector from two points before using a line equation or scalar product.',
    primary: {
      id: 'learn-vectors-direction-from-points-primary',
      prompt: 'Find $\\overrightarrow{AB}$ for $A(1,2,-1)$ and $B(4,0,5)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(3,-2,6)',
      acceptedAnswers: ['(3,-2,6)', '3,-2,6'],
      hint: 'Use final minus initial coordinate by coordinate.',
      methodCue: '$B-A$.',
      firstStep: 'Use $(4-1,0-2,5-(-1))$.',
      workedRoute: [
        'Subtract $A$ from $B$.',
        'The components are $3$, $-2$, and $6$.',
        'So $\\overrightarrow{AB}=(3,-2,6)$.',
      ],
      skillId: 'vectors_notation',
    },
    similar: {
      id: 'learn-vectors-direction-from-points-similar',
      prompt: 'Find $\\overrightarrow{PQ}$ for $P(-2,3,1)$ and $Q(1,5,-4)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(3,2,-5)',
      acceptedAnswers: ['(3,2,-5)', '3,2,-5'],
      hint: 'Use $Q-P$.',
      methodCue: 'Subtract the starting point coordinates.',
      firstStep: 'Use $(1-(-2),5-3,-4-1)$.',
      workedRoute: [
        '$Q-P=(1-(-2),5-3,-4-1)$.',
        'This gives $(3,2,-5)$.',
        'That displacement is the direction vector from $P$ to $Q$.',
      ],
      skillId: 'vectors_notation',
    },
  },
  {
    id: 'learn-vectors-line-equation',
    title: 'Build a vector equation of a line',
    fieldGuideTopicId: 'vectors_line_equation',
    stem: 'A line passes through $A(1,2,-1)$ and $B(4,0,5)$. Once you have a point and a direction vector, write $\\mathbf r=\\mathbf a+\\lambda\\mathbf d$.',
    prompt: 'Choose the correct vector equation using point $A$ and direction $\\overrightarrow{AB}$.',
    principle: 'Principle: a vector line equation is point vector plus parameter times direction vector.',
    explanation: 'Using point $A$ and direction $(3,-2,6)$ gives $\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$.',
    examTransfer: 'Exam transfer: when a question gives two points on a line, form the direction vector first, then write the vector equation from either point.',
    primary: {
      id: 'learn-vectors-line-equation-primary',
      prompt: 'Choose the line through $A(1,2,-1)$ with direction $(3,-2,6)$.',
      inputType: 'multiple_choice',
      answerType: 'expression-text',
      expectedAnswer: 'r=(1,2,-1)+lambda(3,-2,6)',
      acceptedAnswers: ['r=(1,2,-1)+lambda(3,-2,6)', 'r=(1,2,-1)+t(3,-2,6)'],
      options: expressionChoices([
        '$\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$',
        '$\\mathbf r=(3,-2,6)+\\lambda(1,2,-1)$',
        '$\\mathbf r=(1,2,-1)+\\lambda(4,0,5)$',
      ]),
      expectedOptionIds: ['correct'],
      hint: 'The fixed point comes first; the direction multiplies the parameter.',
      methodCue: '$\\mathbf r=\\mathbf a+\\lambda\\mathbf d$.',
      firstStep: 'Use point $(1,2,-1)$ and direction $(3,-2,6)$.',
      workedRoute: [
        'Use $A$ as the fixed point.',
        'Use $\\overrightarrow{AB}=(3,-2,6)$ as the direction.',
        'The line is $\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$.',
      ],
      skillId: 'vectors_line_equation',
    },
    similar: {
      id: 'learn-vectors-line-equation-similar',
      prompt: 'Choose the line through $P(2,-1,0)$ with direction $(-1,4,3)$.',
      inputType: 'multiple_choice',
      answerType: 'expression-text',
      expectedAnswer: 'r=(2,-1,0)+lambda(-1,4,3)',
      acceptedAnswers: ['r=(2,-1,0)+lambda(-1,4,3)', 'r=(2,-1,0)+t(-1,4,3)'],
      options: expressionChoices([
        '$\\mathbf r=(2,-1,0)+\\lambda(-1,4,3)$',
        '$\\mathbf r=(-1,4,3)+\\lambda(2,-1,0)$',
        '$\\mathbf r=(2,-1,0)+\\lambda(1,-4,-3)$',
      ]),
      expectedOptionIds: ['correct'],
      hint: 'Use the given point as the starting vector.',
      methodCue: 'A reversed direction is also a valid line, but choose the listed direction here.',
      firstStep: '$\\mathbf r=(2,-1,0)+\\lambda\\mathbf d$.',
      workedRoute: [
        'The point vector is $(2,-1,0)$.',
        'The direction vector is $(-1,4,3)$.',
        'So $\\mathbf r=(2,-1,0)+\\lambda(-1,4,3)$.',
      ],
      skillId: 'vectors_line_equation',
    },
  },
  {
    id: 'learn-vectors-point-on-line',
    title: 'Check whether a point lies on a line',
    fieldGuideTopicId: 'vectors_line_equation',
    stem: 'For $\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$, a point lies on the line only if one parameter value works in every coordinate.',
    prompt: 'Does $P(7,-2,11)$ lie on the line? Type yes or no.',
    principle: 'Principle: solve for the parameter from one coordinate, then check the same parameter in the others.',
    explanation: 'From $1+3\\lambda=7$, $\\lambda=2$. Then $2-2(2)=-2$ and $-1+6(2)=11$, so the point lies on the line.',
    examTransfer: 'Exam transfer: point-on-line checks are usually about parameter consistency, not just matching one coordinate.',
    primary: {
      id: 'learn-vectors-point-on-line-primary',
      prompt: 'Does $P(7,-2,11)$ lie on $\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$?',
      inputType: 'numeric',
      answerType: 'exact-text',
      expectedAnswer: 'yes',
      acceptedAnswers: ['yes', 'y'],
      hint: 'Find $\\lambda$ from the $x$ coordinate, then test $y$ and $z$.',
      methodCue: '$1+3\\lambda=7$.',
      firstStep: '$\\lambda=2$.',
      workedRoute: [
        '$1+3\\lambda=7$ gives $\\lambda=2$.',
        'The $y$ coordinate gives $2-2(2)=-2$.',
        'The $z$ coordinate gives $-1+6(2)=11$, so yes.',
      ],
      skillId: 'vectors_line_equation',
    },
    similar: {
      id: 'learn-vectors-point-on-line-similar',
      prompt: 'Does $Q(4,0,10)$ lie on $\\mathbf r=(1,2,-1)+\\lambda(3,-2,6)$?',
      inputType: 'numeric',
      answerType: 'exact-text',
      expectedAnswer: 'no',
      acceptedAnswers: ['no', 'n'],
      hint: 'Use the $x$ coordinate first.',
      methodCue: '$1+3\\lambda=4$ gives $\\lambda=1$.',
      firstStep: 'Check whether $-1+6(1)$ equals $10$.',
      workedRoute: [
        '$1+3\\lambda=4$ gives $\\lambda=1$.',
        'The $y$ coordinate works: $2-2(1)=0$.',
        'The $z$ coordinate gives $5$, not $10$, so no.',
      ],
      skillId: 'vectors_line_equation',
    },
  },
  {
    id: 'learn-vectors-line-intersection',
    title: 'Find where two lines intersect',
    fieldGuideTopicId: 'vectors_intersect_parallel_skew',
    stem: 'Two vector lines intersect only if the same pair of parameters satisfies all three coordinate equations.',
    prompt: 'For $L_1:(1,0,2)+\\lambda(1,2,-1)$ and $L_2:(3,4,0)+\\mu(-1,0,1)$, find the intersection point.',
    principle: 'Principle: equate coordinates, solve two parameters, then verify the third coordinate.',
    explanation: 'The $y$ coordinate gives $2\\lambda=4$, so $\\lambda=2$. Then $x=3$ and $z=0$, so the intersection point is $(3,4,0)$.',
    examTransfer: 'Exam transfer: line intersection questions need coordinate equations and a consistency check; do not stop after only one coordinate works.',
    primary: {
      id: 'learn-vectors-line-intersection-primary',
      prompt: 'Find the intersection point of $L_1:(1,0,2)+\\lambda(1,2,-1)$ and $L_2:(3,4,0)+\\mu(-1,0,1)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(3,4,0)',
      acceptedAnswers: ['(3,4,0)', '3,4,0'],
      hint: 'The $y$ coordinate of $L_2$ is always $4$.',
      methodCue: 'Use $2\\lambda=4$ first.',
      firstStep: '$\\lambda=2$.',
      workedRoute: [
        'From $2\\lambda=4$, get $\\lambda=2$.',
        'Substitute into $L_1$: $(1,0,2)+2(1,2,-1)$.',
        'The intersection point is $(3,4,0)$.',
      ],
      skillId: 'vectors_intersect_parallel_skew',
    },
    similar: {
      id: 'learn-vectors-line-intersection-similar',
      prompt: 'Find the intersection point of $L_1:(0,1,2)+\\lambda(2,1,-1)$ and $L_2:(4,3,0)+\\mu(0,1,2)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(4,3,0)',
      acceptedAnswers: ['(4,3,0)', '4,3,0'],
      hint: 'Use the $x$ coordinate to find $\\lambda$.',
      methodCue: '$2\\lambda=4$.',
      firstStep: '$\\lambda=2$.',
      workedRoute: [
        '$2\\lambda=4$, so $\\lambda=2$.',
        'Substitute into $L_1$ to get $(4,3,0)$.',
        'This is also on $L_2$ when $\\mu=0$.',
      ],
      skillId: 'vectors_intersect_parallel_skew',
    },
  },
  {
    id: 'learn-vectors-skew-check',
    title: 'Recognize skew lines',
    fieldGuideTopicId: 'vectors_intersect_parallel_skew',
    stem: 'In three dimensions, two non-parallel lines can still fail to meet. Those lines are skew.',
    prompt: 'Classify $L_1:(0,0,0)+\\lambda(1,0,0)$ and $L_2:(0,1,1)+\\mu(0,1,0)$.',
    principle: 'Principle: if directions are not parallel and coordinate equations are inconsistent, the lines are skew.',
    explanation: 'The first line always has $z=0$, while the second line always has $z=1$. They cannot intersect, and their directions are not scalar multiples, so they are skew.',
    examTransfer: 'Exam transfer: for 3D lines, always distinguish parallel, intersecting, and skew by checking both direction vectors and coordinate consistency.',
    primary: {
      id: 'learn-vectors-skew-check-primary',
      prompt: 'Classify the two lines as intersecting, parallel, or skew.',
      inputType: 'multiple_choice',
      answerType: 'exact-text',
      expectedAnswer: 'skew',
      acceptedAnswers: ['skew'],
      options: expressionChoices(['Skew', 'Intersecting', 'Parallel']),
      expectedOptionIds: ['correct'],
      hint: 'Compare the fixed $z$ coordinates.',
      methodCue: '$L_1$ has $z=0$; $L_2$ has $z=1$.',
      firstStep: 'The lines cannot share a point because the $z$ coordinates never match.',
      workedRoute: [
        'The direction vectors are not scalar multiples.',
        'The $z$ coordinates are inconsistent.',
        'The lines are skew.',
      ],
      skillId: 'vectors_intersect_parallel_skew',
    },
    similar: {
      id: 'learn-vectors-skew-check-similar',
      prompt: 'Classify $L_1:(1,0,0)+\\lambda(1,1,0)$ and $L_2:(0,1,2)+\\mu(1,-1,0)$.',
      inputType: 'multiple_choice',
      answerType: 'exact-text',
      expectedAnswer: 'skew',
      acceptedAnswers: ['skew'],
      options: expressionChoices(['Skew', 'Intersecting', 'Parallel']),
      expectedOptionIds: ['correct'],
      hint: 'Both lines have constant but different $z$ coordinates.',
      methodCue: 'One line has $z=0$ and the other has $z=2$.',
      firstStep: 'Different fixed $z$ values prevent intersection.',
      workedRoute: [
        'The lines are not parallel.',
        'Their fixed $z$ coordinates differ.',
        'So they are skew.',
      ],
      skillId: 'vectors_intersect_parallel_skew',
    },
  },
  {
    id: 'learn-vectors-scalar-product-perpendicular',
    title: 'Use scalar product for perpendicularity',
    fieldGuideTopicId: 'vectors_scalar_product',
    stem: 'Two non-zero vectors are perpendicular when their scalar product is zero.',
    prompt: 'Find $k$ so that $(1,2,k)$ is perpendicular to $(4,-1,2)$.',
    principle: 'Principle: perpendicular vectors have scalar product $0$.',
    explanation: 'Use $(1,2,k)\\cdot(4,-1,2)=0$. This gives $4-2+2k=0$, so $k=-1$.',
    examTransfer: 'Exam transfer: perpendicularity in vector questions is usually converted into a scalar-product equation.',
    primary: {
      id: 'learn-vectors-scalar-product-perpendicular-primary',
      prompt: 'Find $k$ if $(1,2,k)$ is perpendicular to $(4,-1,2)$.',
      inputType: 'numeric',
      answerType: 'numeric',
      expectedAnswer: '-1',
      acceptedAnswers: ['-1'],
      hint: 'Set the dot product equal to zero.',
      methodCue: '$4-2+2k=0$.',
      firstStep: 'The dot product is $2+2k$.',
      workedRoute: [
        'Perpendicular vectors have dot product zero.',
        '$1(4)+2(-1)+k(2)=0$.',
        '$2+2k=0$, so $k=-1$.',
      ],
      skillId: 'vectors_scalar_product',
    },
    similar: {
      id: 'learn-vectors-scalar-product-perpendicular-similar',
      prompt: 'Find $k$ if $(2,k,3)$ is perpendicular to $(1,4,-2)$.',
      inputType: 'numeric',
      answerType: 'numeric',
      expectedAnswer: '1',
      acceptedAnswers: ['1'],
      hint: 'Use $2(1)+4k+3(-2)=0$.',
      methodCue: '$4k-4=0$.',
      firstStep: '$2+4k-6=0$.',
      workedRoute: [
        'Set the scalar product to zero.',
        '$2+4k-6=0$.',
        'So $k=1$.',
      ],
      skillId: 'vectors_scalar_product',
    },
  },
  {
    id: 'learn-vectors-foot-of-perpendicular',
    title: 'Foot of perpendicular on a line',
    fieldGuideTopicId: 'vectors_point_to_line_distance',
    stem: 'The foot of the perpendicular from point $P$ to a line is the point $Q$ on the line where $\\overrightarrow{PQ}$ is perpendicular to the line direction.',
    prompt: 'For $P(1,2,0)$ and line $\\mathbf r=(0,0,0)+\\lambda(1,0,0)$, find the foot point $Q$.',
    principle: 'Principle: write a general point on the line, then set the joining vector perpendicular to the line direction.',
    explanation: 'A point on the line is $Q=(\\lambda,0,0)$. Then $\\overrightarrow{PQ}=(\\lambda-1,-2,0)$. Dotting with $(1,0,0)$ gives $\\lambda-1=0$, so $Q=(1,0,0)$.',
    examTransfer: 'Exam transfer: distance-to-line and reflection questions often start by finding this perpendicular foot point.',
    primary: {
      id: 'learn-vectors-foot-of-perpendicular-primary',
      prompt: 'Find the foot point from $P(1,2,0)$ to $\\mathbf r=\\lambda(1,0,0)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(1,0,0)',
      acceptedAnswers: ['(1,0,0)', '1,0,0'],
      hint: 'A general point on the line is $(\\lambda,0,0)$.',
      methodCue: 'Use $(\\lambda-1,-2,0)\\cdot(1,0,0)=0$.',
      firstStep: '$\\lambda-1=0$.',
      workedRoute: [
        'Let $Q=(\\lambda,0,0)$.',
        '$\\overrightarrow{PQ}=(\\lambda-1,-2,0)$.',
        'Perpendicularity gives $\\lambda=1$, so $Q=(1,0,0)$.',
      ],
      skillId: 'vectors_point_to_line_distance',
    },
    similar: {
      id: 'learn-vectors-foot-of-perpendicular-similar',
      prompt: 'Find the foot point from $P(2,3,4)$ to $\\mathbf r=(0,0,0)+\\lambda(0,1,0)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(0,3,0)',
      acceptedAnswers: ['(0,3,0)', '0,3,0'],
      hint: 'A general point on the line is $(0,\\lambda,0)$.',
      methodCue: 'Use $(Q-P)\\cdot(0,1,0)=0$.',
      firstStep: '$\\lambda-3=0$.',
      workedRoute: [
        'Let $Q=(0,\\lambda,0)$.',
        '$Q-P=(-2,\\lambda-3,-4)$.',
        'Dotting with $(0,1,0)$ gives $\\lambda=3$, so $Q=(0,3,0)$.',
      ],
      skillId: 'vectors_point_to_line_distance',
    },
  },
  {
    id: 'learn-vectors-reflection-in-line',
    title: 'Reflect a point in a line',
    fieldGuideTopicId: 'vectors_point_to_line_distance',
    stem: 'Once the foot point $Q$ is known, reflecting point $P$ in the line puts $Q$ halfway between $P$ and the reflected point $P\\prime$.',
    prompt: 'If $P=(1,2,0)$ and the foot point is $Q=(1,0,0)$, find the reflection $P\\prime$.',
    principle: 'Principle: the foot point is the midpoint between the original point and its reflection.',
    explanation: 'Use $P\\prime=2Q-P$. This gives $2(1,0,0)-(1,2,0)=(1,-2,0)$.',
    examTransfer: 'Exam transfer: reflection in a vector line is usually a foot-of-perpendicular problem plus the midpoint relation.',
    primary: {
      id: 'learn-vectors-reflection-in-line-primary',
      prompt: 'Reflect $P=(1,2,0)$ in the line when the foot point is $Q=(1,0,0)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(1,-2,0)',
      acceptedAnswers: ['(1,-2,0)', '1,-2,0'],
      hint: 'Use $P\\prime=2Q-P$.',
      methodCue: 'Double the foot point, then subtract the original point.',
      firstStep: '$2Q=(2,0,0)$.',
      workedRoute: [
        'The foot point is the midpoint.',
        '$P\\prime=2Q-P$.',
        '$P\\prime=(2,0,0)-(1,2,0)=(1,-2,0)$.',
      ],
      skillId: 'vectors_point_to_line_distance',
    },
    similar: {
      id: 'learn-vectors-reflection-in-line-similar',
      prompt: 'Reflect $P=(2,3,4)$ in the line when the foot point is $Q=(0,3,0)$.',
      inputType: 'numeric',
      answerType: 'coordinate',
      expectedAnswer: '(-2,3,-4)',
      acceptedAnswers: ['(-2,3,-4)', '-2,3,-4'],
      hint: 'Again use $P\\prime=2Q-P$.',
      methodCue: '$2Q=(0,6,0)$.',
      firstStep: 'Subtract $(2,3,4)$ from $(0,6,0)$.',
      workedRoute: [
        '$P\\prime=2Q-P$.',
        '$2Q=(0,6,0)$.',
        'So $P\\prime=(-2,3,-4)$.',
      ],
      skillId: 'vectors_point_to_line_distance',
    },
  },
  {
    id: 'learn-vectors-angle-between-lines',
    title: 'Angle between two lines',
    fieldGuideTopicId: 'vectors_angle_between_lines',
    stem: 'The angle between two vector lines is the angle between their direction vectors.',
    prompt: 'For direction vectors $(1,0,0)$ and $(1,1,0)$, find $\\cos\\theta$.',
    principle: 'Principle: use $\\cos\\theta=\\frac{\\mathbf a\\cdot\\mathbf b}{|\\mathbf a||\\mathbf b|}$ with direction vectors.',
    explanation: 'The dot product is $1$, the magnitudes are $1$ and $\\sqrt2$, so $\\cos\\theta=\\frac{1}{\\sqrt2}$.',
    examTransfer: 'Exam transfer: angle-between-lines questions usually give line equations; extract the direction vectors before applying the scalar-product formula.',
    primary: {
      id: 'learn-vectors-angle-between-lines-primary',
      prompt: 'For direction vectors $(1,0,0)$ and $(1,1,0)$, find $\\cos\\theta$.',
      inputType: 'numeric',
      answerType: 'expression-text',
      expectedAnswer: '1/sqrt2',
      acceptedAnswers: ['1/sqrt2', '1/\\sqrt2', '1/sqrt(2)', 'sqrt2/2', '\\sqrt2/2'],
      hint: 'Use dot product over the product of magnitudes.',
      methodCue: 'The dot product is $1$.',
      firstStep: '$| (1,0,0) |=1$ and $| (1,1,0) |=\\sqrt2$.',
      workedRoute: [
        'The dot product is $1$.',
        'The magnitudes are $1$ and $\\sqrt2$.',
        'So $\\cos\\theta=\\frac{1}{\\sqrt2}$.',
      ],
      skillId: 'vectors_scalar_product',
    },
    similar: {
      id: 'learn-vectors-angle-between-lines-similar',
      prompt: 'For direction vectors $(0,1,0)$ and $(0,1,1)$, find $\\cos\\theta$.',
      inputType: 'numeric',
      answerType: 'expression-text',
      expectedAnswer: '1/sqrt2',
      acceptedAnswers: ['1/sqrt2', '1/\\sqrt2', '1/sqrt(2)', 'sqrt2/2', '\\sqrt2/2'],
      hint: 'Only the matching second components contribute to the dot product.',
      methodCue: 'The dot product is $1$.',
      firstStep: 'The magnitudes are $1$ and $\\sqrt2$.',
      workedRoute: [
        'The dot product is $1$.',
        'The magnitudes are $1$ and $\\sqrt2$.',
        'So $\\cos\\theta=\\frac{1}{\\sqrt2}$.',
      ],
      skillId: 'vectors_scalar_product',
    },
  },
];

function toSkillCheckItem(
  draft: VectorsLearnCheckDraft,
  fieldGuideTopicId: string,
  stepTitle: string,
): SkillCheckItem {
  return {
    itemId: draft.id,
    paperFamily: 'p3',
    regionId: 'vectors',
    fieldGuideTopicId,
    fieldGuideSubtopicId: fieldGuideTopicId,
    skillId: draft.skillId,
    prompt: draft.prompt,
    inputType: draft.inputType ?? 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: draft.answerType,
    acceptedAnswers: draft.acceptedAnswers,
    expectedAnswer: draft.expectedAnswer,
    expectedOptionIds: draft.expectedOptionIds,
    options: draft.options,
    orderInsensitive: draft.answerType === 'multi-value' ? draft.orderInsensitive ?? true : undefined,
    repairStep: draft.workedRoute.at(-1) ?? draft.prompt,
    mistakeTags: draft.mistakeTags ?? commonVectorMistakes,
    complexity: 'core',
    hints: {
      nudge: draft.hint,
      methodCue: draft.methodCue,
      firstStep: draft.firstStep,
    },
    workedRoute: draft.workedRoute,
    sourceTypes: ['authored'],
    sourceRefs: {},
    review: {
      status: 'teacher_reviewed',
      sourceSkillReviewed: true,
      markEventReviewed: false,
      affectsProgression: false,
    },
    visualTemplateId: `learn-vectors-${stepTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  };
}

export function getAuthoredVectorsLearnSteps(fieldGuideTopics: FieldGuideTopic[]): LearnStep[] {
  const topicById = new Map(fieldGuideTopics.map((topic) => [topic.id, topic]));

  return VECTORS_LEARN_DRAFTS.map((draft): LearnStep => {
    const fieldGuideTopic = topicById.get(draft.fieldGuideTopicId);
    if (!fieldGuideTopic) {
      throw new Error(`Missing Vectors Field Guide topic for Learn step ${draft.id}: ${draft.fieldGuideTopicId}`);
    }
    const primaryCheck = toSkillCheckItem(draft.primary, draft.fieldGuideTopicId, draft.title);
    const similarCheck = toSkillCheckItem(draft.similar, draft.fieldGuideTopicId, draft.title);

    return {
      id: draft.id,
      title: draft.title,
      stem: draft.stem,
      prompt: draft.prompt,
      inputType: primaryCheck.answerType === 'multi-value' ? 'multi-part' : 'text',
      expectedAnswer: draft.primary.acceptedAnswers,
      hint: draft.primary.hint,
      explanation: draft.explanation,
      principle: draft.principle,
      mistakeTags: primaryCheck.mistakeTags,
      nextStepLabel: 'Try a similar checked question',
      examTransfer: draft.examTransfer,
      fieldGuideTopic,
      primaryCheck,
      similarCheck,
      primaryMirrorsSkillEvidence: false,
      similarMirrorsSkillEvidence: true,
    };
  });
}
