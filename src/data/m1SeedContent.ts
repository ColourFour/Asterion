import type { CourseSeedTopic, CourseSeedTopicSection, CourseSeedVisualTemplate } from './courseSeedContent';

const draftStatus = 'Draft/source-filled from content-model/M1/m1-total.pdf; needs syllabus-contract review before Skill Check or mastery use.';

function section(
  id: string,
  title: string,
  purpose: string,
  bullets: string[],
  visualRequirements: string[],
  practicePrompts: string[],
  visualTemplates: CourseSeedVisualTemplate[] = [],
): CourseSeedTopicSection {
  return {
    id,
    title,
    purpose,
    bullets,
    visualRequirements,
    practicePrompts,
    ...(visualTemplates.length ? { visualTemplates } : {}),
  };
}

function visualTemplate(
  id: string,
  title: string,
  explanation: string,
  notice: string,
  supports: string[],
  svg: string,
): CourseSeedVisualTemplate {
  return { id, title, explanation, notice, supports, svg };
}

const displacementTimeGraphTemplate = visualTemplate(
  'm1-template-displacement-time-crossing',
  'Displacement-time graph with intercepts and crossing point',
  'Use this template when two objects move in one straight line and their displacement-time graphs meet.',
  'Gradient represents velocity. The crossing point is the same displacement at the same time, not necessarily the starting point.',
  ['Displacement-time graph', 'Displacement and velocity'],
  `<svg viewBox="0 0 640 360" role="img" aria-labelledby="m1-template-displacement-time-crossing-title">
    <title id="m1-template-displacement-time-crossing-title">Displacement-time graph template</title>
    <defs>
      <marker id="arrow-dt" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker>
    </defs>
    <rect x="18" y="18" width="604" height="324" rx="12" />
    <line x1="92" y1="285" x2="565" y2="285" marker-end="url(#arrow-dt)" />
    <line x1="92" y1="285" x2="92" y2="48" marker-end="url(#arrow-dt)" />
    <text x="570" y="301">t (s)</text>
    <text x="49" y="51">s (m)</text>
    <text x="75" y="305">0</text>
    <line class="grid" x1="92" y1="112" x2="565" y2="112" />
    <line class="grid" x1="170" y1="285" x2="170" y2="48" />
    <line class="grid" x1="438" y1="285" x2="438" y2="48" />
    <line class="accent" x1="92" y1="250" x2="500" y2="70" />
    <line class="contrast" x1="92" y1="96" x2="520" y2="250" />
    <circle class="point" cx="323" cy="148" r="7" />
    <text x="336" y="138">crossing point</text>
    <circle class="point" cx="92" cy="250" r="5" />
    <text x="108" y="263">s-intercept A</text>
    <circle class="point" cx="92" cy="96" r="5" />
    <text x="108" y="90">s-intercept B</text>
    <path class="brace" d="M260 184 L302 166" />
    <path class="brace" d="M260 184 L292 184" />
    <text x="229" y="205">slope = velocity</text>
    <text x="171" y="308">marked time</text>
    <text x="404" y="308">same time</text>
  </svg>`,
);

const velocityTimeGraphTemplate = visualTemplate(
  'm1-template-velocity-time-area-gradient',
  'Velocity-time graph with area and gradient',
  'Use this template for accelerate-cruise-decelerate journeys.',
  'Gradient represents acceleration. Area under the graph represents displacement; area below the axis would count negative.',
  ['Velocity-time graphs', 'Acceleration', 'Equations of constant acceleration'],
  `<svg viewBox="0 0 640 360" role="img" aria-labelledby="m1-template-velocity-time-area-gradient-title">
    <title id="m1-template-velocity-time-area-gradient-title">Velocity-time graph template</title>
    <defs>
      <marker id="arrow-vt" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker>
      <pattern id="shade-vt" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10 L10 0" /></pattern>
    </defs>
    <rect x="18" y="18" width="604" height="324" rx="12" />
    <line x1="92" y1="285" x2="565" y2="285" marker-end="url(#arrow-vt)" />
    <line x1="92" y1="285" x2="92" y2="48" marker-end="url(#arrow-vt)" />
    <text x="570" y="301">t (s)</text>
    <text x="49" y="51">v (m s^-1)</text>
    <polygon class="shade" points="92,285 92,230 190,116 358,116 500,285" />
    <polyline class="accent" points="92,230 190,116 358,116 500,285" />
    <line class="brace" x1="115" y1="230" x2="175" y2="116" />
    <text x="175" y="185">gradient = acceleration</text>
    <text x="235" y="230">shaded area = displacement</text>
    <line class="grid" x1="190" y1="285" x2="190" y2="116" />
    <line class="grid" x1="358" y1="285" x2="358" y2="116" />
    <text x="177" y="308">t1</text>
    <text x="345" y="308">t2</text>
    <text x="507" y="302">stop</text>
  </svg>`,
);

const discontinuityGraphTemplate = visualTemplate(
  'm1-template-piecewise-discontinuity',
  'Piecewise graph with a discontinuity',
  'Use this template when a motion model changes suddenly between stages.',
  'Do not join stages smoothly unless the question says the transition is continuous. Label each stage before using a formula.',
  ['Graphs with discontinuities'],
  `<svg viewBox="0 0 640 360" role="img" aria-labelledby="m1-template-piecewise-discontinuity-title">
    <title id="m1-template-piecewise-discontinuity-title">Piecewise discontinuity graph template</title>
    <defs><marker id="arrow-piece" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="604" height="324" rx="12" />
    <line x1="92" y1="285" x2="565" y2="285" marker-end="url(#arrow-piece)" />
    <line x1="92" y1="285" x2="92" y2="48" marker-end="url(#arrow-piece)" />
    <text x="570" y="301">t</text><text x="62" y="51">v or s</text>
    <polyline class="accent" points="100,250 210,185 275,185" />
    <circle class="open-point" cx="275" cy="185" r="7" />
    <circle class="point" cx="275" cy="110" r="7" />
    <polyline class="contrast" points="275,110 390,145 520,92" />
    <line class="warning" x1="275" y1="285" x2="275" y2="70" />
    <text x="286" y="77">jump / new stage</text>
    <text x="133" y="214">stage 1</text>
    <text x="404" y="124">stage 2</text>
    <text x="255" y="307">transition time</text>
  </svg>`,
);

const freeBodyDiagramTemplate = visualTemplate(
  'm1-template-free-body-diagrams',
  'Free-body diagram set',
  'Use these four mini-templates to decide which forces act on one chosen body.',
  'Draw only forces acting on the selected body. Weight is vertical, normal reaction is perpendicular to the surface, and applied pulls act in their stated direction.',
  ["Newton's first law", 'Combinations of forces', 'Weight and motion due to gravity', 'Normal contact force'],
  `<svg viewBox="0 0 760 420" role="img" aria-labelledby="m1-template-free-body-diagrams-title">
    <title id="m1-template-free-body-diagrams-title">Free-body diagram templates</title>
    <defs><marker id="arrow-fbd" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="724" height="384" rx="12" />
    <g transform="translate(45 45)">
      <text x="0" y="0">horizontal surface</text>
      <line class="ground" x1="0" y1="118" x2="145" y2="118" />
      <rect class="block" x="50" y="78" width="54" height="40" />
      <line class="force" x1="77" y1="78" x2="77" y2="26" marker-end="url(#arrow-fbd)" /><text x="88" y="35">R</text>
      <line class="force" x1="77" y1="118" x2="77" y2="166" marker-end="url(#arrow-fbd)" /><text x="87" y="158">mg</text>
    </g>
    <g transform="translate(245 45)">
      <text x="0" y="0">slope</text>
      <line class="ground" x1="0" y1="140" x2="160" y2="70" />
      <rect class="block" x="75" y="83" width="54" height="40" transform="rotate(-23 102 103)" />
      <line class="force" x1="102" y1="103" x2="80" y2="52" marker-end="url(#arrow-fbd)" /><text x="60" y="48">R</text>
      <line class="force" x1="102" y1="103" x2="102" y2="166" marker-end="url(#arrow-fbd)" /><text x="112" y="158">mg</text>
    </g>
    <g transform="translate(465 45)">
      <text x="0" y="0">vertical motion</text>
      <circle class="block" cx="70" cy="94" r="24" />
      <line class="force" x1="70" y1="94" x2="70" y2="165" marker-end="url(#arrow-fbd)" /><text x="82" y="158">mg</text>
      <line class="ghost" x1="115" y1="155" x2="115" y2="70" marker-end="url(#arrow-fbd)" /><text x="126" y="84">chosen +</text>
    </g>
    <g transform="translate(45 240)">
      <text x="0" y="0">angled pull / push</text>
      <line class="ground" x1="0" y1="116" x2="215" y2="116" />
      <rect class="block" x="55" y="76" width="58" height="40" />
      <line class="force" x1="84" y1="76" x2="84" y2="25" marker-end="url(#arrow-fbd)" /><text x="94" y="36">R</text>
      <line class="force" x1="84" y1="116" x2="84" y2="166" marker-end="url(#arrow-fbd)" /><text x="94" y="158">mg</text>
      <line class="accent" x1="113" y1="84" x2="190" y2="42" marker-end="url(#arrow-fbd)" /><text x="175" y="36">F</text>
      <path class="brace" d="M128 83 A38 38 0 0 1 151 70" /><text x="150" y="88">theta</text>
    </g>
    <g transform="translate(410 245)">
      <text x="0" y="0">student check</text>
      <text x="0" y="34">1. Pick one body.</text>
      <text x="0" y="62">2. Add weight and contacts.</text>
      <text x="0" y="90">3. Add pulls, tensions, resistance.</text>
      <text x="0" y="118">4. Choose axes before equations.</text>
    </g>
  </svg>`,
);

const resolvingTriangleTemplate = visualTemplate(
  'm1-template-resolving-triangle',
  'Resolving-force triangle',
  'Use this template to decide which component uses cosine and which uses sine.',
  'Cosine goes next to the marked angle; sine goes opposite the marked angle. If the angle is marked from a different axis, the component labels swap.',
  ['Resolving forces in horizontal and vertical directions', 'Resolving forces at equilibrium', 'Resolving forces not in equilibrium'],
  `<svg viewBox="0 0 640 360" role="img" aria-labelledby="m1-template-resolving-triangle-title">
    <title id="m1-template-resolving-triangle-title">Resolving force triangle template</title>
    <defs><marker id="arrow-resolve" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="604" height="324" rx="12" />
    <line class="axis" x1="92" y1="270" x2="540" y2="270" marker-end="url(#arrow-resolve)" />
    <line class="axis" x1="92" y1="270" x2="92" y2="58" marker-end="url(#arrow-resolve)" />
    <text x="545" y="286">horizontal</text><text x="42" y="60">vertical</text>
    <line class="accent" x1="135" y1="245" x2="430" y2="110" marker-end="url(#arrow-resolve)" />
    <line class="contrast" x1="135" y1="245" x2="430" y2="245" marker-end="url(#arrow-resolve)" />
    <line class="contrast" x1="430" y1="245" x2="430" y2="110" marker-end="url(#arrow-resolve)" />
    <path class="brace" d="M177 245 A48 48 0 0 1 194 222" />
    <text x="204" y="231">theta from horizontal</text>
    <text x="295" y="98">F</text>
    <text x="270" y="265">horizontal = F cos theta</text>
    <text x="440" y="178">vertical = F sin theta</text>
    <text x="110" y="320">If theta is measured from vertical, swap which component is adjacent.</text>
  </svg>`,
);

const normalReactionTemplate = visualTemplate(
  'm1-template-normal-reaction-cases',
  'Normal reaction cases',
  'Use this template to check whether $R=mg$ is valid.',
  'Normal reaction is perpendicular to the surface. Angled forces and slopes change the perpendicular balance.',
  ['Normal contact force', 'Resolving forces not in equilibrium', 'Friction as contact force'],
  `<svg viewBox="0 0 760 420" role="img" aria-labelledby="m1-template-normal-reaction-cases-title">
    <title id="m1-template-normal-reaction-cases-title">Normal reaction diagrams</title>
    <defs><marker id="arrow-normal" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="724" height="384" rx="12" />
    <g transform="translate(45 70)">
      <text x="0" y="0">horizontal: often R = mg</text>
      <line class="ground" x1="0" y1="122" x2="185" y2="122" /><rect class="block" x="75" y="82" width="55" height="40" />
      <line class="force" x1="103" y1="82" x2="103" y2="30" marker-end="url(#arrow-normal)" /><text x="113" y="42">R</text>
      <line class="force" x1="103" y1="122" x2="103" y2="170" marker-end="url(#arrow-normal)" /><text x="113" y="162">mg</text>
    </g>
    <g transform="translate(285 70)">
      <text x="0" y="0">inclined plane</text>
      <line class="ground" x1="0" y1="155" x2="205" y2="72" /><rect class="block" x="94" y="94" width="55" height="40" transform="rotate(-22 121 114)" />
      <line class="force" x1="121" y1="114" x2="94" y2="54" marker-end="url(#arrow-normal)" /><text x="68" y="55">R</text>
      <line class="force" x1="121" y1="114" x2="121" y2="180" marker-end="url(#arrow-normal)" /><text x="132" y="172">mg</text>
      <text x="95" y="205">resolve perpendicular</text>
    </g>
    <g transform="translate(525 70)">
      <text x="0" y="0">angled force changes R</text>
      <line class="ground" x1="0" y1="122" x2="185" y2="122" /><rect class="block" x="62" y="82" width="55" height="40" />
      <line class="force" x1="90" y1="82" x2="90" y2="32" marker-end="url(#arrow-normal)" /><text x="100" y="42">R</text>
      <line class="force" x1="90" y1="122" x2="90" y2="170" marker-end="url(#arrow-normal)" /><text x="100" y="162">mg</text>
      <line class="accent" x1="118" y1="90" x2="170" y2="58" marker-end="url(#arrow-normal)" /><text x="153" y="50">F</text>
      <text x="0" y="205">include vertical component</text>
    </g>
  </svg>`,
);

const frictionDirectionTemplate = visualTemplate(
  'm1-template-friction-direction',
  'Friction direction guide',
  'Use this template before writing a friction equation.',
  'Friction opposes actual motion or impending motion. At the limit, use $F=\\mu R$ after deciding the direction.',
  ['Friction as contact force', 'Limit of friction', 'Changes of direction with relation to friction'],
  `<svg viewBox="0 0 760 440" role="img" aria-labelledby="m1-template-friction-direction-title">
    <title id="m1-template-friction-direction-title">Friction direction diagrams</title>
    <defs><marker id="arrow-friction" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="724" height="402" rx="12" />
    <g transform="translate(45 55)">
      <text x="0" y="0">impending right</text><line class="ground" x1="0" y1="100" x2="210" y2="100" /><rect class="block" x="80" y="60" width="55" height="40" />
      <line class="accent" x1="135" y1="78" x2="190" y2="78" marker-end="url(#arrow-friction)" /><text x="148" y="67">tendency</text>
      <line class="warning" x1="80" y1="90" x2="25" y2="90" marker-end="url(#arrow-friction)" /><text x="25" y="118">friction left</text>
    </g>
    <g transform="translate(400 55)">
      <text x="0" y="0">impending left</text><line class="ground" x1="0" y1="100" x2="210" y2="100" /><rect class="block" x="80" y="60" width="55" height="40" />
      <line class="accent" x1="80" y1="78" x2="25" y2="78" marker-end="url(#arrow-friction)" /><text x="25" y="67">tendency</text>
      <line class="warning" x1="135" y1="90" x2="190" y2="90" marker-end="url(#arrow-friction)" /><text x="120" y="118">friction right</text>
    </g>
    <g transform="translate(45 235)">
      <text x="0" y="0">impending down slope</text><line class="ground" x1="10" y1="130" x2="230" y2="45" /><rect class="block" x="104" y="70" width="56" height="40" transform="rotate(-21 132 90)" />
      <line class="accent" x1="132" y1="90" x2="90" y2="108" marker-end="url(#arrow-friction)" /><text x="47" y="121">tendency down</text>
      <line class="warning" x1="132" y1="90" x2="185" y2="67" marker-end="url(#arrow-friction)" /><text x="170" y="58">friction up</text>
    </g>
    <g transform="translate(400 235)">
      <text x="0" y="0">impending up slope</text><line class="ground" x1="10" y1="130" x2="230" y2="45" /><rect class="block" x="104" y="70" width="56" height="40" transform="rotate(-21 132 90)" />
      <line class="accent" x1="132" y1="90" x2="185" y2="67" marker-end="url(#arrow-friction)" /><text x="170" y="58">tendency up</text>
      <line class="warning" x1="132" y1="90" x2="90" y2="108" marker-end="url(#arrow-friction)" /><text x="47" y="121">friction down</text>
    </g>
  </svg>`,
);

const connectedParticlesTemplate = visualTemplate(
  'm1-template-connected-particles',
  'Connected-particle setup gallery',
  'Use these mini-templates to identify the connection type before writing equations.',
  'Write one equation per body when you need tension or thrust. Strings usually share acceleration magnitude while intact; rods can be in tension or thrust.',
  ['Objects connected by rods', 'Objects connected by strings', "Newton's third law"],
  `<svg viewBox="0 0 820 520" role="img" aria-labelledby="m1-template-connected-particles-title">
    <title id="m1-template-connected-particles-title">Connected-particle templates</title>
    <defs><marker id="arrow-connected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="784" height="484" rx="12" />
    <g transform="translate(45 55)">
      <text x="0" y="0">rod</text><rect class="block" x="0" y="45" width="55" height="40" /><rect class="block" x="155" y="45" width="55" height="40" /><line class="accent" x1="55" y1="65" x2="155" y2="65" /><text x="78" y="55">rod force</text>
    </g>
    <g transform="translate(310 55)">
      <text x="0" y="0">tow-bar</text><rect class="block" x="0" y="45" width="70" height="40" /><rect class="block" x="170" y="45" width="70" height="40" /><line class="accent" x1="70" y1="65" x2="170" y2="65" /><line class="force" x1="240" y1="65" x2="285" y2="65" marker-end="url(#arrow-connected)" /><text x="82" y="55">tension or thrust</text>
    </g>
    <g transform="translate(45 185)">
      <text x="0" y="0">string over pulley</text><circle class="pulley" cx="125" cy="45" r="24" /><path class="accent" d="M125 69 L125 130 M149 45 L230 45 L230 130" /><rect class="block" x="100" y="130" width="50" height="40" /><rect class="block" x="205" y="130" width="50" height="40" /><text x="86" y="190">same T</text>
    </g>
    <g transform="translate(365 185)">
      <text x="0" y="0">table + hanging mass</text><line class="ground" x1="0" y1="80" x2="220" y2="80" /><rect class="block" x="35" y="40" width="55" height="40" /><circle class="pulley" cx="215" cy="80" r="18" /><path class="accent" d="M90 60 L215 60 L215 145" /><rect class="block" x="190" y="145" width="50" height="40" /><text x="105" y="50">T</text><text x="225" y="128">T</text>
    </g>
    <g transform="translate(45 365)">
      <text x="0" y="0">slope-connected system</text><line class="ground" x1="0" y1="105" x2="220" y2="25" /><rect class="block" x="75" y="48" width="55" height="40" transform="rotate(-20 102 68)" /><circle class="pulley" cx="230" cy="25" r="18" /><path class="accent" d="M130 50 L230 25 L230 130" /><rect class="block" x="205" y="130" width="50" height="40" /><line class="force" x1="105" y1="68" x2="150" y2="52" marker-end="url(#arrow-connected)" /><text x="126" y="44">a</text>
    </g>
  </svg>`,
);

const momentumTableTemplate = visualTemplate(
  'm1-template-momentum-before-after-table',
  'Before/after momentum table',
  'Use this template before writing a conservation of momentum equation.',
  'Choose a positive direction first. Put signed velocities in the table before multiplying by mass.',
  ['Momentum definition', 'Collisions and conservation of momentum'],
  `<svg viewBox="0 0 720 390" role="img" aria-labelledby="m1-template-momentum-before-after-table-title">
    <title id="m1-template-momentum-before-after-table-title">Momentum before-after table</title>
    <rect x="18" y="18" width="684" height="354" rx="12" />
    <text x="48" y="55">positive direction -></text>
    <line class="accent" x1="210" y1="50" x2="285" y2="50" marker-end="url(#arrow-momentum)" />
    <defs><marker id="arrow-momentum" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <g class="table">
      <rect x="48" y="82" width="625" height="250" />
      <line x1="48" y1="132" x2="673" y2="132" /><line x1="48" y1="207" x2="673" y2="207" /><line x1="48" y1="267" x2="673" y2="267" />
      <line x1="165" y1="82" x2="165" y2="332" /><line x1="300" y1="82" x2="300" y2="332" /><line x1="445" y1="82" x2="445" y2="332" /><line x1="555" y1="82" x2="555" y2="332" />
      <text x="72" y="113">stage</text><text x="190" y="113">particle</text><text x="326" y="113">mass</text><text x="464" y="113">velocity</text><text x="575" y="113">momentum</text>
      <text x="70" y="174">before</text><text x="205" y="164">A</text><text x="205" y="194">B</text><text x="324" y="164">mA</text><text x="324" y="194">mB</text><text x="462" y="164">uA</text><text x="462" y="194">uB</text><text x="575" y="164">mA uA</text><text x="575" y="194">mB uB</text>
      <text x="70" y="248">after</text><text x="205" y="240">A</text><text x="205" y="260">B</text><text x="324" y="240">mA</text><text x="324" y="260">mB</text><text x="462" y="240">vA</text><text x="462" y="260">vB</text><text x="575" y="240">mA vA</text><text x="575" y="260">mB vB</text>
      <text x="72" y="305">equation</text><text x="190" y="305">total before = total after</text>
    </g>
  </svg>`,
);

const workEnergySetupTemplate = visualTemplate(
  'm1-template-work-energy-setup',
  'Work-energy setup diagram',
  'Use this template before building an energy equation.',
  'Mark displacement direction first. Work uses the force component along displacement; normal reaction does no work when displacement is along the surface.',
  ['Work done by force', 'Gravitational potential energy', 'Work energy principle', 'Conservation of energy'],
  `<svg viewBox="0 0 760 430" role="img" aria-labelledby="m1-template-work-energy-setup-title">
    <title id="m1-template-work-energy-setup-title">Work-energy setup template</title>
    <defs><marker id="arrow-work" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="724" height="394" rx="12" />
    <line class="ground" x1="70" y1="310" x2="590" y2="160" />
    <rect class="block" x="250" y="225" width="64" height="42" transform="rotate(-16 282 246)" />
    <line class="accent" x1="282" y1="246" x2="412" y2="208" marker-end="url(#arrow-work)" /><text x="382" y="198">force F</text>
    <path class="brace" d="M315 238 A54 54 0 0 1 350 218" /><text x="346" y="244">theta</text>
    <line class="force" x1="282" y1="246" x2="260" y2="180" marker-end="url(#arrow-work)" /><text x="230" y="182">R</text>
    <line class="force" x1="282" y1="246" x2="282" y2="330" marker-end="url(#arrow-work)" /><text x="292" y="323">mg</text>
    <line class="warning" x1="250" y1="257" x2="165" y2="280" marker-end="url(#arrow-work)" /><text x="128" y="297">resistance</text>
    <line class="contrast" x1="160" y1="330" x2="505" y2="230" marker-end="url(#arrow-work)" /><text x="340" y="302">displacement s</text>
    <line class="grid" x1="585" y1="160" x2="585" y2="310" /><line class="grid" x1="90" y1="310" x2="585" y2="310" />
    <text x="596" y="244">height change h</text>
    <text x="88" y="365">Include work by named forces, KE change, and PE change.</text>
  </svg>`,
);

const energyTableTemplate = visualTemplate(
  'm1-template-energy-table',
  'Energy accounting table',
  'Use this table before writing a work-energy or conservation equation.',
  'If resistance, friction, or energy absorbed is present, do not call the equation pure conservation of mechanical energy.',
  ['Work energy principle', 'Conservation of energy', 'Kinetic energy', 'Gravitational potential energy'],
  `<svg viewBox="0 0 760 390" role="img" aria-labelledby="m1-template-energy-table-title">
    <title id="m1-template-energy-table-title">Energy table template</title>
    <rect x="18" y="18" width="724" height="354" rx="12" />
    <g class="table">
      <rect x="48" y="70" width="664" height="255" />
      <line x1="48" y1="120" x2="712" y2="120" /><line x1="48" y1="172" x2="712" y2="172" /><line x1="48" y1="224" x2="712" y2="224" /><line x1="48" y1="276" x2="712" y2="276" />
      <line x1="210" y1="70" x2="210" y2="325" /><line x1="385" y1="70" x2="385" y2="325" /><line x1="545" y1="70" x2="545" y2="325" />
      <text x="70" y="101">term</text><text x="236" y="101">initial</text><text x="414" y="101">final</text><text x="565" y="101">change / work</text>
      <text x="70" y="151">kinetic energy</text><text x="232" y="151">1/2 m u^2</text><text x="407" y="151">1/2 m v^2</text><text x="565" y="151">Delta KE</text>
      <text x="70" y="203">gravitational PE</text><text x="232" y="203">m g h1</text><text x="407" y="203">m g h2</text><text x="565" y="203">Delta PE</text>
      <text x="70" y="255">work by named forces</text><text x="232" y="255">driving +</text><text x="407" y="255">resistance -</text><text x="565" y="255">sum work</text>
      <text x="70" y="307">losses / absorbed</text><text x="232" y="307">friction</text><text x="407" y="307">air resistance</text><text x="565" y="307">include separately</text>
    </g>
  </svg>`,
);

const powerSetupTemplate = visualTemplate(
  'm1-template-power-setup',
  'Power setup: force-speed or work-time',
  'Use this template to choose between $P=Fv$ and $P=W/t$.',
  'Use $P=Fv$ when the force and velocity are in the same line at that instant. Use $P=W/t$ for average power over a time interval.',
  ['Power'],
  `<svg viewBox="0 0 760 390" role="img" aria-labelledby="m1-template-power-setup-title">
    <title id="m1-template-power-setup-title">Power formula scope template</title>
    <defs><marker id="arrow-power" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="724" height="354" rx="12" />
    <g transform="translate(55 70)">
      <text x="0" y="0">instantaneous power: P = Fv</text>
      <line class="ground" x1="0" y1="120" x2="285" y2="120" /><rect class="block" x="90" y="80" width="62" height="40" />
      <line class="accent" x1="152" y1="94" x2="245" y2="94" marker-end="url(#arrow-power)" /><text x="185" y="83">force F</text>
      <line class="contrast" x1="152" y1="112" x2="245" y2="112" marker-end="url(#arrow-power)" /><text x="185" y="144">velocity v</text>
      <text x="0" y="175">valid when aligned in same line</text>
    </g>
    <g transform="translate(420 70)">
      <text x="0" y="0">average power: P = W / t</text>
      <rect class="table-fill" x="0" y="52" width="250" height="118" rx="8" />
      <text x="20" y="86">total work W</text>
      <text x="20" y="118">time interval t</text>
      <line class="accent" x1="20" y1="140" x2="190" y2="140" marker-end="url(#arrow-power)" />
      <text x="20" y="205">use for a journey or interval</text>
    </g>
  </svg>`,
);

const calculusMotionFlowTemplate = visualTemplate(
  'm1-template-calculus-motion-flow',
  'Calculus motion flow',
  'Use this template to decide whether to differentiate or integrate.',
  'Move right by differentiating and left by integrating. Integration needs a condition to fix the constant.',
  ['Velocity as derivative of displacement', 'Acceleration as derivative of velocity', 'Displacement as integral of velocity', 'Velocity as integral of acceleration'],
  `<svg viewBox="0 0 640 270" role="img" aria-labelledby="m1-template-calculus-motion-flow-title">
    <title id="m1-template-calculus-motion-flow-title">Calculus motion flow template</title>
    <defs><marker id="arrow-flow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    <rect x="18" y="18" width="604" height="234" rx="12" />
    <rect class="table-fill" x="60" y="95" width="120" height="55" rx="8" /><text x="98" y="130">s(t)</text>
    <rect class="table-fill" x="270" y="95" width="120" height="55" rx="8" /><text x="308" y="130">v(t)</text>
    <rect class="table-fill" x="480" y="95" width="120" height="55" rx="8" /><text x="518" y="130">a(t)</text>
    <line class="accent" x1="180" y1="112" x2="270" y2="112" marker-end="url(#arrow-flow)" /><text x="195" y="96">differentiate</text>
    <line class="accent" x1="390" y1="112" x2="480" y2="112" marker-end="url(#arrow-flow)" /><text x="405" y="96">differentiate</text>
    <line class="contrast" x1="270" y1="143" x2="180" y2="143" marker-end="url(#arrow-flow)" /><text x="203" y="176">integrate + condition</text>
    <line class="contrast" x1="480" y1="143" x2="390" y2="143" marker-end="url(#arrow-flow)" /><text x="410" y="202">integrate + condition</text>
  </svg>`,
);

export const m1Topics: CourseSeedTopic[] = [
  {
    courseId: 'm1',
    id: 'm1-velocity-constant-acceleration',
    slug: 'velocity-and-constant-acceleration',
    syllabusRef: '9709 M1 1.1',
    title: 'Velocity and Constant Acceleration',
    shortTitle: 'Velocity',
    description: 'Model straight-line motion using displacement, velocity, acceleration, suvat formulae, and motion graphs, including staged journeys and graph discontinuities.',
    headerFormula: 'v=u+at,\\quad s=ut+\\frac12at^2,\\quad v^2=u^2+2as',
    formulas: [
      '$s=vt$ for constant velocity',
      '$a=\\frac{v-u}{t}$',
      '$v=u+at$',
      '$s=ut+\\frac12at^2$',
      '$s=\\frac12(u+v)t$',
      '$v^2=u^2+2as$',
    ],
    studentGoals: [
      'Use signed displacement, velocity, and acceleration in one-dimensional models.',
      'Select and apply a constant-acceleration equation over the correct interval.',
      'Interpret and sketch displacement-time and velocity-time graphs, including staged motion.',
    ],
    keyIdeas: [
      'Displacement is measured from a chosen point and can be negative; distance is not the same thing.',
      'The suvat equations apply only while acceleration is constant.',
      'Graph gradient and area carry the physical meaning, so graph questions should be read before calculating.',
    ],
    workedMethod: [
      'Choose a positive direction and convert units before writing values.',
      'Split the journey into stages whenever velocity, acceleration, or direction changes.',
      'For each constant-acceleration stage, list $s$, $u$, $v$, $a$, and $t$ and choose the equation with one unknown.',
      'For graphs, read gradient for velocity or acceleration and use area under a velocity-time graph for displacement.',
    ],
    commonMistakes: [
      'Using distance when signed displacement is required.',
      'Applying one suvat equation across two different acceleration stages.',
      'Forgetting to include direction changes, rest intervals, or discontinuities on a graph.',
    ],
    selfChecks: [
      'A cyclist travels forwards, turns back, and finishes behind the start point. What sign should the return velocity have?',
      'Which suvat equation avoids time when $u$, $v$, $a$, and $s$ are known?',
      'What do gradient and area mean on a velocity-time graph?',
    ],
    examStyle: [
      'Source-style prompts use vehicles, trains, cyclists, cranes, or traffic-light journeys with staged motion.',
      'Graph parts often ask for a sketch first, then equations of graph sections, areas, or meeting times.',
    ],
    practiceHook: 'Draft/generated practice should start with signed-stage tables, then add displacement-time and velocity-time graph sketches.',
    examTrainingHook: 'Before exam-image routing, review that each prompt states positive direction, interval boundaries, and whether distance or displacement is required.',
    visualRequirements: [
      'Displacement-time graphs with labelled axes, intercepts, gradients, and curved/linear sections.',
      'Velocity-time graphs with areas shaded for displacement and gradients marked for acceleration.',
      'Staged journey timelines showing rest, acceleration, constant-speed, braking, and direction-change intervals.',
      'Graphs with discontinuities where the model jumps, stops, or changes stage abruptly.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Convert units and find speed from a constant-speed journey.',
      'Draft/generated practice: Split a two-stage journey with a return leg and find signed displacement.',
      'Draft/generated practice: Sketch a velocity-time graph for accelerate, cruise, and decelerate stages, then find total displacement from areas.',
      'Draft/generated practice: Given a displacement-time graph, find its equation and interpret when an object reaches a fixed point.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-velocity-displacement-velocity',
        'Displacement and velocity',
        'Keep direction, units, and the difference between distance and displacement explicit.',
        [
          'Use $s=vt$ only when velocity is constant over the stated interval.',
          'Convert minutes, kilometres, and other units before substituting.',
          'Use negative displacement or velocity for motion opposite the chosen positive direction.',
        ],
        ['Straight-line journey diagram or number line with start point, positive direction, and signed displacement.'],
        [
          'Draft/generated practice: A vehicle travels a distance in a given time; convert to SI units and find speed.',
          'Draft/generated practice: A person moves forwards then backwards; calculate total displacement from signed stages.',
        ],
      ),
      section(
        'm1-velocity-acceleration',
        'Acceleration',
        'Treat acceleration as change in velocity per unit time, with direction attached.',
        [
          'Acceleration can be negative when velocity decreases in the positive direction.',
          'A body at rest has zero velocity, not necessarily zero acceleration after release.',
          'State whether acceleration is constant before using constant-acceleration equations.',
        ],
        ['Velocity change arrow or simple velocity-time line showing gradient as acceleration.'],
        [
          'Draft/generated practice: Find acceleration from an initial velocity, final velocity, and time.',
          'Draft/generated practice: Interpret a negative acceleration in a braking or upward-motion context.',
        ],
      ),
      section(
        'm1-velocity-equations-constant-acceleration',
        'Equations of constant acceleration',
        'Choose the suvat equation from known quantities rather than memorising a route.',
        [
          'List $s$, $u$, $v$, $a$, and $t$ before selecting a formula.',
          'Use a separate equation for each interval with its own constant acceleration.',
          'After solving, check the sign and whether the question asked for speed, velocity, distance, or displacement.',
        ],
        ['Suvat variable table for each stage of motion.'],
        [
          'Draft/generated practice: Find a stopping distance from initial speed and constant deceleration.',
          'Draft/generated practice: Find the time to reach a speed from rest under constant acceleration.',
        ],
      ),
      section(
        'm1-velocity-displacement-time-graph',
        'Displacement-time graph',
        'Read and build displacement-time graphs from gradients, intercepts, and equations.',
        [
          'Gradient of a displacement-time graph is velocity.',
          'A straight line means constant velocity; a curve means changing velocity.',
          'Two objects meet when their displacement-time graphs have the same displacement at the same time.',
        ],
        ['Displacement-time graphs with labelled $s$ and $t$ axes, gradients, intercepts, and crossing points.'],
        [
          'Draft/generated practice: Sketch displacement-time graphs for two vehicles moving toward one another.',
          'Draft/generated practice: Find the equation of a straight displacement-time graph from two marked points.',
        ],
        [displacementTimeGraphTemplate],
      ),
      section(
        'm1-velocity-velocity-time-graphs',
        'Velocity-time graphs',
        'Use velocity-time graph gradient and area to connect acceleration and displacement.',
        [
          'Gradient of a velocity-time graph is acceleration.',
          'Area under the graph is displacement, with area below the axis counted negative.',
          'A horizontal section means constant velocity, not rest unless velocity is zero.',
        ],
        ['Velocity-time graphs with triangular/trapezium areas, gradients, and sign below/above the axis.'],
        [
          'Draft/generated practice: Find distance from a velocity-time graph made of triangles and rectangles.',
          'Draft/generated practice: Sketch a braking graph and find the required starting time for braking.',
        ],
        [velocityTimeGraphTemplate],
      ),
      section(
        'm1-velocity-graphs-with-discontinuities',
        'Graphs with discontinuities',
        'Represent staged motion honestly when the model changes abruptly.',
        [
          'A discontinuity can show a jump in modelled velocity or a separate motion stage.',
          'Do not join graph sections smoothly unless the motion description supports it.',
          'Label each stage so the graph can be matched back to the wording.',
        ],
        ['Piecewise velocity-time or displacement-time graph with visible gaps, jumps, or stage breaks.'],
        [
          'Draft/generated practice: Sketch a motion graph with a sudden change of velocity at a given time.',
          'Draft/generated practice: Explain what assumption is being made when a graph has a discontinuity.',
        ],
        [discontinuityGraphTemplate],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-force-and-motion',
    slug: 'force-and-motion',
    syllabusRef: '9709 M1 2.1',
    title: 'Force and Motion',
    shortTitle: 'Forces',
    description: 'Apply Newtonian force modelling to particles, combining forces, weight, normal contact force, and resolving in equilibrium and non-equilibrium cases.',
    headerFormula: '\\sum F=ma,\\quad W=mg',
    formulas: [
      '$\\sum F=ma$',
      '$W=mg$',
      '$R$ acts normal to the contact surface',
      '$F_x=F\\cos\\theta$ or $F\\sin\\theta$ depending on the marked angle',
    ],
    studentGoals: [
      'Draw a force diagram before writing a force equation.',
      'Combine multiple forces into a resultant and connect it to acceleration.',
      'Resolve forces horizontally/vertically or along/perpendicular to a surface in equilibrium and non-equilibrium contexts.',
    ],
    keyIdeas: [
      'Newton\'s first law describes zero resultant force, not zero forces.',
      'Newton\'s second law uses the resultant force in the chosen direction.',
      'Resolving is a diagram-reading task: the sine/cosine choice depends on the angle shown.',
    ],
    workedMethod: [
      'Draw all forces: weight, contact force, tensions, pulls, resistance, and any applied force.',
      'Choose axes that match the geometry, often horizontal/vertical or parallel/perpendicular to a slope.',
      'Resolve every angled force carefully and keep signs consistent.',
      'Use $\\sum F=0$ for equilibrium or $\\sum F=ma$ when acceleration is present.',
    ],
    commonMistakes: [
      'Using one force as $ma$ instead of the resultant of all forces.',
      'Swapping sine and cosine because the angle is measured from a different axis.',
      'Treating normal contact force as always equal to weight when angled forces or slopes are present.',
    ],
    selfChecks: [
      'What is the resultant force on a body moving at constant velocity?',
      'When is the normal contact force equal to $mg$, and when is it not?',
      'How do you decide whether to resolve with sine or cosine?',
    ],
    examStyle: [
      'Source-style force prompts include cars, boats, cyclists, blocks, slopes, bearings, ropes, and particles in equilibrium.',
      'Marks usually depend on a correct diagram and one resolved equation per independent direction.',
    ],
    practiceHook: 'Draft/generated practice should require force diagrams first, then equations of motion or equilibrium from the diagram.',
    examTrainingHook: 'Before Skill Check generation, review force diagrams and resolving diagrams against the source examples and syllabus contract.',
    visualRequirements: [
      'Force diagrams and free-body diagrams with all forces labelled.',
      'Resolving-force diagrams with right triangles and marked angle references.',
      'Horizontal/vertical component diagrams and slope-parallel/slope-normal diagrams.',
      'Equilibrium vector diagrams or force polygons where appropriate.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Draw a free-body diagram for a block on a horizontal surface being pulled by an angled force.',
      'Draft/generated practice: Find acceleration from a driving force and resistance force on horizontal ground.',
      'Draft/generated practice: Resolve a force into horizontal and vertical components from a marked angle.',
      'Draft/generated practice: Use equilibrium equations to find an unknown force and angle in a three-force particle diagram.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-force-newtons-first-law',
        'Newton\'s first law',
        'Recognise constant velocity or rest as zero resultant force.',
        [
          'Rest and constant velocity both imply acceleration is zero.',
          'If acceleration is zero, the resultant force is zero.',
          'Resistance or braking forces must be balanced by other forces for constant velocity.',
        ],
        ['Free-body diagram for a body at rest or moving at constant velocity with balanced forces.'],
        [
          'Draft/generated practice: Find a resistance force when a vehicle comes to rest under constant deceleration.',
          'Draft/generated practice: Explain why a constant-speed object can still have several forces acting on it.',
        ],
        [freeBodyDiagramTemplate],
      ),
      section(
        'm1-force-combinations-of-forces',
        'Combinations of forces',
        'Combine driving forces, resistance, braking, pulls, and weights into a resultant.',
        [
          'Forces in the same direction add; forces in opposite directions subtract.',
          'The resultant force points in the acceleration direction.',
          'Resistance usually acts opposite the motion in these source-style models.',
        ],
        ['One-dimensional force diagram showing driving force, resistance, and acceleration direction.'],
        [
          'Draft/generated practice: Find acceleration from a driving force and air resistance.',
          'Draft/generated practice: Find an engine force when mass, acceleration, and resistance are known.',
        ],
      ),
      section(
        'm1-force-weight-gravity',
        'Weight and motion due to gravity',
        'Use weight as a force and gravity as acceleration when modelling vertical motion.',
        [
          'Weight is $mg$ and acts vertically downward.',
          'In free fall near Earth, acceleration has magnitude $g$ downward.',
          'Keep mass in kg and weight in newtons distinct.',
        ],
        ['Vertical force diagram with weight and chosen positive direction.'],
        [
          'Draft/generated practice: Find the weight of a particle from its mass.',
          'Draft/generated practice: Model vertical motion after release using weight and acceleration due to gravity.',
        ],
      ),
      section(
        'm1-force-normal-contact',
        'Normal contact force',
        'Model contact force perpendicular to a surface and calculate it from perpendicular equilibrium or motion.',
        [
          'The normal contact force is perpendicular to the surface.',
          'On a horizontal surface with no other vertical forces, $R=mg$.',
          'On a slope or with angled pulling/pushing, resolve perpendicular to the surface to find $R$.',
        ],
        ['Free-body diagram showing normal reaction perpendicular to a horizontal or inclined surface.'],
        [
          'Draft/generated practice: Find $R$ for a block on a horizontal surface with an upward angled pull.',
          'Draft/generated practice: Find $R$ for a block resting on a smooth slope.',
        ],
        [normalReactionTemplate],
      ),
      section(
        'm1-force-resolving-horizontal-vertical',
        'Resolving forces in horizontal and vertical directions',
        'Break angled forces into components that can be used in equations.',
        [
          'Mark the angle in the component triangle before choosing sine or cosine.',
          'Horizontal and vertical components must be perpendicular.',
          'Components replace the original force only after resolving in equations.',
        ],
        ['Resolving-force diagrams with component arrows, dashed axes, and marked angle positions.'],
        [
          'Draft/generated practice: Resolve a force at an angle above the horizontal into horizontal and vertical components.',
          'Draft/generated practice: Reconstruct force magnitude and angle from two components.',
        ],
        [resolvingTriangleTemplate],
      ),
      section(
        'm1-force-resolving-equilibrium',
        'Resolving forces at equilibrium',
        'Use two perpendicular zero-resultant equations for particles held in equilibrium.',
        [
          'Equilibrium means $\\sum F_x=0$ and $\\sum F_y=0$ in any perpendicular axes.',
          'Three-force equilibrium often gives two simultaneous equations.',
          'A diagram with bearings or angled ropes must be converted into component equations.',
        ],
        ['Equilibrium resolving diagrams with multiple angled forces and horizontal/vertical axes.'],
        [
          'Draft/generated practice: Find unknown tension and angle for a light object held by two strings.',
          'Draft/generated practice: Use bearings to resolve tugboat forces holding a boat in equilibrium.',
        ],
      ),
      section(
        'm1-force-resolving-not-equilibrium',
        'Resolving forces not in equilibrium',
        'Use resolved resultant-force equations when acceleration is present.',
        [
          'Choose the acceleration direction as a positive axis when possible.',
          'Use $\\sum F=ma$ parallel to the acceleration.',
          'Use perpendicular equilibrium if the object does not accelerate perpendicular to a surface.',
        ],
        ['Slope or horizontal resolving diagram showing resultant force and acceleration direction.'],
        [
          'Draft/generated practice: Find acceleration of a block pulled up a slope by an angled force.',
          'Draft/generated practice: Find air resistance using a resolved equation of motion.',
        ],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-friction',
    slug: 'friction',
    syllabusRef: '9709 M1 3.1',
    title: 'Friction',
    shortTitle: 'Friction',
    description: 'Model friction as a contact force, use limiting friction, and decide friction direction when motion or impending motion changes.',
    headerFormula: 'F\\leq \\mu R,\\quad F_{\\max}=\\mu R',
    formulas: [
      '$F\\leq \\mu R$',
      '$F_{\\max}=\\mu R$ at limiting equilibrium',
      '$R$ is found perpendicular to the contact surface',
    ],
    studentGoals: [
      'Decide the direction of friction from actual or impending relative motion.',
      'Calculate normal contact force before using $F=\\mu R$.',
      'Handle rough horizontal surfaces and rough slopes with resolved equations.',
    ],
    keyIdeas: [
      'Friction opposes relative motion or the tendency of relative motion.',
      'Friction is not automatically equal to $\\mu R$ unless the contact is limiting.',
      'On slopes, normal reaction and friction must be placed on different axes.',
    ],
    workedMethod: [
      'Draw the contact surface, weight, normal contact force, applied forces, and possible friction direction.',
      'Resolve perpendicular to the surface to find $R$ if needed.',
      'Use $F\\leq\\mu R$ generally and $F=\\mu R$ only at the limit of slipping.',
      'Resolve along the surface with signs that match the chosen friction direction.',
    ],
    commonMistakes: [
      'Using $F=\\mu R$ when the object is not at limiting friction.',
      'Putting friction in the direction of motion rather than opposing motion or tendency.',
      'Using $mg$ instead of the actual normal reaction after an angled force changes $R$.',
    ],
    selfChecks: [
      'If a block is about to slide down a slope, which way does friction act?',
      'Why must $R$ be found before using $F=\\mu R$?',
      'What phrase tells you friction is limiting?',
    ],
    examStyle: [
      'Source-style prompts use boxes, sledges, wheelbarrows, ski-planes, bins, rings, and objects on rough slopes.',
      'Questions often ask for a largest or smallest applied force, acceleration after friction, or a coefficient of friction.',
    ],
    practiceHook: 'Draft/generated practice should require a friction direction decision and a normal-reaction equation before calculation.',
    examTrainingHook: 'Before Skill Check generation, review all friction prompts for limiting/non-limiting wording and diagram clarity.',
    visualRequirements: [
      'Friction/slope diagrams showing weight, normal reaction, friction, applied force, and angle of slope.',
      'Horizontal rough-surface diagrams where angled pulls or pushes change $R$.',
      'Direction-change diagrams showing friction before/after reversal or impending motion.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Decide friction direction for a block at rest on a rough slope under different applied forces.',
      'Draft/generated practice: Find the largest horizontal force that keeps an object at rest.',
      'Draft/generated practice: Find acceleration on rough horizontal ground when an angled pull changes the normal reaction.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-friction-contact-force',
        'Friction as contact force',
        'Treat friction as part of the contact interaction, paired with the normal reaction.',
        [
          'Friction acts along the surface.',
          'Normal reaction acts perpendicular to the surface.',
          'The total contact force combines normal reaction and friction.',
        ],
        ['Contact-force diagram on horizontal ground and on an inclined plane.'],
        [
          'Draft/generated practice: Draw the contact forces on a block on a rough slope.',
          'Draft/generated practice: Find the total contact force from normal reaction and friction components.',
        ],
      ),
      section(
        'm1-friction-limit',
        'Limit of friction',
        'Use limiting friction when an object is on the point of slipping.',
        [
          'At the limiting case, $F=\\mu R$.',
          'Largest and smallest force questions usually compare possible impending-motion directions.',
          'Check whether the limit is up the slope, down the slope, left, or right.',
        ],
        ['Limiting-friction diagram showing impending motion and friction in the opposite direction.'],
        [
          'Draft/generated practice: Find the smallest force needed to prevent sliding down a slope.',
          'Draft/generated practice: Find the largest force that keeps an object in equilibrium before it slips upward.',
        ],
        [frictionDirectionTemplate],
      ),
      section(
        'm1-friction-direction-change',
        'Changes of direction with relation to friction',
        'Update friction direction when motion reverses or the tendency of motion changes.',
        [
          'Friction may reverse direction after a collision, bounce, or changed pull.',
          'Treat each stage separately if the direction of motion changes.',
          'A reduced speed after impact can lead to a new stopping-distance stage with friction opposite the new motion.',
        ],
        ['Before/after motion diagram or two-stage rough-surface diagram with friction arrows reversed when needed.'],
        [
          'Draft/generated practice: Model a ball bouncing back on a rough surface and stopping under friction.',
          'Draft/generated practice: Compare two pulling angles and decide which gives a larger friction force.',
        ],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-connected-particles',
    slug: 'connected-particles',
    syllabusRef: '9709 M1 4.1',
    title: 'Connected Particles',
    shortTitle: 'Connected',
    description: 'Use Newton\'s third law and connected-body models with rods, strings, pulleys, shared acceleration, and internal tension or thrust.',
    headerFormula: '\\sum F=ma,\\quad T\\text{ common in a light string}',
    formulas: [
      '$\\sum F=ma$ for each particle or body',
      'Light inextensible string gives common acceleration magnitude',
      'A smooth pulley preserves string tension in the ideal model',
      'Rods can carry tension or thrust',
    ],
    studentGoals: [
      'Draw a separate force diagram for each connected body.',
      'Use string, rod, and pulley constraints to relate accelerations and tensions.',
      'Solve simultaneous equations for acceleration, tension, thrust, or unknown masses.',
    ],
    keyIdeas: [
      'Forces between connected bodies are internal to the whole system but appear in individual-body equations.',
      'A light inextensible string usually gives connected particles the same acceleration magnitude.',
      'Rods can push or pull, so the sign of the rod force must be interpreted as tension or thrust.',
    ],
    workedMethod: [
      'Sketch the whole connected system and mark likely acceleration directions.',
      'Draw separate free-body diagrams for each body.',
      'Write one $\\sum F=ma$ equation per body using a consistent positive direction.',
      'Use string/rod constraints and solve the simultaneous equations.',
    ],
    commonMistakes: [
      'Using one combined system equation when the question asks for tension in a string or rod.',
      'Giving connected bodies unrelated accelerations in an inextensible-string model.',
      'Forgetting that a rod force may be thrust rather than tension.',
    ],
    selfChecks: [
      'Why do particles connected by a light inextensible string usually share acceleration magnitude?',
      'When does tension disappear from a whole-system equation?',
      'What does a negative rod tension tell you?',
    ],
    examStyle: [
      'Source-style prompts include hanging buckets, tow-bars, trains, caravans, chains, multiple pulleys, wedges, and boxes connected by strings.',
      'Longer questions often include a system stage, then a change such as a string breaking or one particle reaching a pulley.',
    ],
    practiceHook: 'Draft/generated practice should use diagrams first, then one equation per object with shared acceleration made explicit.',
    examTrainingHook: 'Before Skill Check generation, review connected-particle diagrams for string, rod, pulley, and acceleration constraints.',
    visualRequirements: [
      'Connected-particle diagrams with separate free-body diagrams for each object.',
      'Rod diagrams showing tension or thrust between vehicles, buckets, or bars.',
      'String and pulley diagrams with tension labels, hanging masses, table masses, and slope masses.',
      'Multi-stage diagrams where a string breaks, a body reaches a pulley, or acceleration constraints change.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Find tension in a rod connecting two bodies in equilibrium.',
      'Draft/generated practice: Find acceleration and tension for two particles connected by a string over a smooth pulley.',
      'Draft/generated practice: Model a car towing a caravan uphill and decide whether the tow-bar is in tension or thrust.',
      'Draft/generated practice: Use a pulley diagram to relate two connected displacements or accelerations.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-connected-newtons-third-law',
        'Newton\'s third law',
        'Distinguish action-reaction pairs from forces acting on one chosen body.',
        [
          'Action-reaction forces act on different bodies.',
          'A free-body diagram for one body shows only forces acting on that body.',
          'Weight and normal reaction are not an action-reaction pair for the same body.',
        ],
        ['Paired-body contact diagram showing equal and opposite forces on different bodies.'],
        [
          'Draft/generated practice: Identify the third-law pair for a box pressing on a floor.',
          'Draft/generated practice: Draw only the forces acting on a box resting on a slope.',
        ],
      ),
      section(
        'm1-connected-rods',
        'Objects connected by rods',
        'Use rod forces as internal pushes or pulls between connected bodies.',
        [
          'A rod can exert tension or thrust depending on the motion and loading.',
          'Draw rod force directions consistently; interpret the sign after solving.',
          'For trains, cars, caravans, or linked masses, one equation per body reveals coupling force.',
        ],
        ['Rod/tow-bar diagram with labelled thrust or tension between bodies.'],
        [
          'Draft/generated practice: Find the tension in a coupling between train carriages.',
          'Draft/generated practice: Decide whether a tow-bar is in tension or thrust for uphill/downhill motion.',
        ],
      ),
      section(
        'm1-connected-strings',
        'Objects connected by strings',
        'Apply light-string and smooth-pulley assumptions to connected particles.',
        [
          'Tension acts along the string away from the particle.',
          'A light inextensible string gives a common acceleration magnitude while intact.',
          'A smooth pulley changes direction of tension but not its magnitude in the ideal model.',
        ],
        ['String/rod/pulley diagrams with tension labels and acceleration arrows.'],
        [
          'Draft/generated practice: Find acceleration and tension for one hanging mass and one table mass.',
          'Draft/generated practice: Recalculate motion after a string breaks or a particle reaches a pulley.',
        ],
        [connectedParticlesTemplate],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-general-motion-straight-line',
    slug: 'general-motion-in-a-straight-line',
    syllabusRef: '9709 M1 5.1',
    title: 'General Motion in a Straight Line',
    shortTitle: 'General motion',
    description: 'Use calculus relationships between displacement, velocity, and acceleration for straight-line motion where acceleration need not be constant.',
    headerFormula: 'v=\\frac{ds}{dt},\\quad a=\\frac{dv}{dt},\\quad s=\\int v\\,dt',
    formulas: [
      '$v=\\frac{ds}{dt}$',
      '$a=\\frac{dv}{dt}$',
      '$s=\\int v\\,dt$',
      '$v=\\int a\\,dt$',
    ],
    studentGoals: [
      'Differentiate displacement to find velocity and velocity to find acceleration.',
      'Integrate velocity to find displacement and acceleration to find velocity.',
      'Use initial conditions and definite limits to find constants and answer context questions.',
    ],
    keyIdeas: [
      'Variable motion needs calculus rather than suvat unless acceleration is known to be constant.',
      'A stationary instant comes from $v=0$, not necessarily $s=0$.',
      'Integration constants are motion information and must be found from the given condition.',
    ],
    workedMethod: [
      'Identify whether the given function is $s(t)$, $v(t)$, or $a(t)$.',
      'Differentiate or integrate once to reach the requested quantity.',
      'Use $t=0$ or another stated condition to find constants when integrating.',
      'Interpret roots, signs, and values in context: rest, speed, displacement, distance, or crossing time.',
    ],
    commonMistakes: [
      'Using suvat when acceleration is variable.',
      'Finding displacement when the question asks for distance travelled after a direction change.',
      'Dropping the constant of integration after integrating velocity or acceleration.',
    ],
    selfChecks: [
      'If $s=t^3-4t$, what expression gives velocity?',
      'What condition shows a particle is instantaneously at rest?',
      'Why is an initial condition needed after integrating acceleration?',
    ],
    examStyle: [
      'Source-style prompts use particles, playground rides, balls, stones, race cars, and vertical projection models with functions of time.',
      'Questions often ask for speed at a time, rest instants, depth/height, finish-line comparisons, or constants from initial data.',
    ],
    practiceHook: 'Draft/generated practice should label whether the given function is displacement, velocity, or acceleration before any calculus.',
    examTrainingHook: 'Before Skill Check generation, separate calculus setup prompts from reviewed exam content and check all constants/units.',
    visualRequirements: [
      'Straight-line displacement/velocity/acceleration relationship diagrams.',
      'Small derivative/integral flow diagram linking $s$, $v$, and $a$.',
      'Motion graphs showing stationary points, velocity sign, or displacement over time.',
      'Vertical-motion diagrams for height/depth contexts when needed.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Differentiate a displacement function to find speed at several times.',
      'Draft/generated practice: Find when a particle is instantaneously at rest from a velocity expression.',
      'Draft/generated practice: Integrate a velocity expression and use $s=0$ at $t=0$ to find displacement.',
      'Draft/generated practice: Integrate acceleration, use an initial velocity, and find velocity at a later time.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-general-velocity-derivative-displacement',
        'Velocity as derivative of displacement',
        'Differentiate $s(t)$ to find velocity and speed.',
        [
          'Velocity is $ds/dt$.',
          'Speed is the magnitude of velocity.',
          'Stationary instants occur when $v=0$.',
        ],
        ['Derivative flow diagram from displacement to velocity, plus optional displacement-time graph tangent.'],
        [
          'Draft/generated practice: Given $s(t)$, find speed at $t=0$, $t=1$, and $t=2$.',
          'Draft/generated practice: Find when a particle is momentarily stationary.',
        ],
        [calculusMotionFlowTemplate],
      ),
      section(
        'm1-general-acceleration-derivative-velocity',
        'Acceleration as derivative of velocity',
        'Differentiate $v(t)$ to find acceleration and interpret its sign.',
        [
          'Acceleration is $dv/dt$.',
          'A positive acceleration increases velocity in the chosen positive direction.',
          'A negative acceleration can describe slowing down or speeding up in the negative direction.',
        ],
        ['Velocity-time curve with tangent gradient marked as acceleration.'],
        [
          'Draft/generated practice: Given $v(t)$, find acceleration at a stated time.',
          'Draft/generated practice: Decide whether a particle is speeding up or slowing down from signs of $v$ and $a$.',
        ],
      ),
      section(
        'm1-general-displacement-integral-velocity',
        'Displacement as integral of velocity',
        'Integrate velocity over time to find displacement.',
        [
          'Displacement change is $\\int v\\,dt$ over the time interval.',
          'Use limits for displacement over a stated interval.',
          'If velocity changes sign, distance travelled may require splitting the interval.',
        ],
        ['Velocity-time graph with signed area linked to displacement.'],
        [
          'Draft/generated practice: Integrate velocity from $t=0$ to $t=5$ to find displacement.',
          'Draft/generated practice: Find total distance when velocity changes sign once.',
        ],
      ),
      section(
        'm1-general-velocity-integral-acceleration',
        'Velocity as integral of acceleration',
        'Integrate acceleration and use an initial velocity condition.',
        [
          'Velocity change is $\\int a\\,dt$.',
          'An initial velocity fixes the constant of integration.',
          'After finding $v(t)$, further integration may be needed for displacement.',
        ],
        ['Acceleration-time graph or integral flow diagram from acceleration to velocity.'],
        [
          'Draft/generated practice: Integrate $a(t)$ and use $v=0$ at $t=0$ to find velocity.',
          'Draft/generated practice: Use a velocity expression found from acceleration to find a later speed.',
        ],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-momentum',
    slug: 'momentum',
    syllabusRef: '9709 M1 6.1',
    title: 'Momentum',
    shortTitle: 'Momentum',
    description: 'Use linear momentum, changes in momentum, and conservation of momentum for one-dimensional collision and separation models.',
    headerFormula: 'p=mv,\\quad \\sum p_{\\text{before}}=\\sum p_{\\text{after}}',
    formulas: [
      '$p=mv$',
      '$\\Delta p=mv-mu$',
      '$\\sum p_{\\text{before}}=\\sum p_{\\text{after}}$ when no external impulse acts',
    ],
    studentGoals: [
      'Calculate signed momentum from mass and velocity.',
      'Use before/after momentum equations for direct collisions.',
      'Interpret reversed direction, coalescence, rebounds, and separation from velocity signs.',
    ],
    keyIdeas: [
      'Momentum is a vector in these straight-line models, so direction signs are essential.',
      'Conservation of momentum applies to the system during a collision when external impulse is ignored.',
      'Momentum conservation does not automatically mean kinetic energy is conserved.',
    ],
    workedMethod: [
      'Choose a positive direction and assign signed velocities before and after.',
      'Create a before/after table with one row per particle.',
      'Write total momentum before equals total momentum after for the system.',
      'Solve for the unknown speed, mass, or ratio and interpret any negative answer as direction.',
    ],
    commonMistakes: [
      'Treating all speeds as positive in the momentum equation.',
      'Using conservation of kinetic energy when only momentum is justified.',
      'Forgetting that stuck-together particles share a final velocity.',
    ],
    selfChecks: [
      'What is the signed momentum of a 0.2 kg ball moving at $-8$ m s$^{-1}$?',
      'How should two particles stuck together after impact be represented in the after column?',
      'Why can the final velocity in a momentum equation be negative?',
    ],
    examStyle: [
      'Source-style prompts include falling bodies, bouncing balls, hockey balls, snooker balls, bean bags, sledges, and multi-particle collisions.',
      'Questions often ask for an unknown speed, mass ratio, rebound height, or modelling assumption.',
    ],
    practiceHook: 'Draft/generated practice should use signed before/after momentum tables before forming equations.',
    examTrainingHook: 'Before Skill Check generation, review every momentum prompt for positive-direction statements and conservation assumptions.',
    visualRequirements: [
      'Before/after momentum tables with mass, velocity, and momentum columns.',
      'One-dimensional collision diagrams showing direction arrows before and after.',
      'Coalescence/rebound diagrams where particles stick, reverse, or separate.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Fill a before/after momentum table for two particles moving toward one another.',
      'Draft/generated practice: Find a final velocity when two particles coalesce.',
      'Draft/generated practice: Find an unknown mass ratio from a direct collision with reversed directions.',
      'Draft/generated practice: Calculate change in momentum for a vertical bounce.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-momentum-definition',
        'Momentum definition',
        'Calculate momentum as mass times signed velocity.',
        [
          'Use kg for mass and m s$^{-1}$ for velocity.',
          'Momentum has direction in a straight-line model.',
          'Change in momentum is final momentum minus initial momentum.',
        ],
        ['Momentum arrow diagram or table with signed velocities.'],
        [
          'Draft/generated practice: Find downward momentum just before a falling object lands.',
          'Draft/generated practice: Find change in momentum for a ball caught after moving upward or downward.',
        ],
      ),
      section(
        'm1-momentum-collisions-conservation',
        'Collisions and conservation of momentum',
        'Use system momentum before and after a collision.',
        [
          'Write all before velocities and after velocities with signs.',
          'Use one conservation equation for the whole isolated system.',
          'If bodies stick together, give them one common final velocity.',
        ],
        ['Before/after collision diagram and momentum table.'],
        [
          'Draft/generated practice: Find the final speed of a crate after a box collides and sticks to it.',
          'Draft/generated practice: Use conservation of momentum to find a ratio of masses after a direct impact.',
        ],
        [momentumTableTemplate],
      ),
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-work-and-energy',
    slug: 'work-and-energy',
    syllabusRef: '9709 M1 7.1',
    title: 'Work and Energy',
    shortTitle: 'Energy',
    description: 'Use work done by forces, kinetic energy, gravitational potential energy, the work-energy principle, conservation of energy, and power.',
    headerFormula: 'W=Fs\\cos\\theta,\\quad KE=\\frac12mv^2,\\quad PE=mgh,\\quad P=Fv',
    formulas: [
      '$W=Fs\\cos\\theta$',
      '$KE=\\frac12mv^2$',
      '$PE=mgh$',
      '$\\text{work done by resultant force}=\\Delta KE$',
      '$P=\\frac{W}{t}$',
      '$P=Fv$ for force and velocity in the same line',
    ],
    studentGoals: [
      'Calculate work done by forces, including angled forces and resistive forces.',
      'Use kinetic and gravitational potential energy changes in energy equations.',
      'Apply conservation of energy and power relationships without creating fake mark-scheme claims.',
    ],
    keyIdeas: [
      'Work done transfers energy and depends on the component of force in the displacement direction.',
      'Normal reaction often does no work when displacement is along the surface.',
      'Energy conservation is valid only when non-conservative work is absent or separately included.',
    ],
    workedMethod: [
      'Draw the motion setup and mark displacement, height change, and forces doing work.',
      'Calculate work terms with signs: driving work positive, resistance/friction usually negative.',
      'Write an energy balance using initial and final kinetic/potential energy plus work terms.',
      'For power, decide whether the question needs average power $W/t$ or instantaneous power $Fv$.',
    ],
    commonMistakes: [
      'Using force magnitude instead of the force component in the direction of displacement.',
      'Counting work by the normal reaction when displacement is along the surface.',
      'Calling an energy equation conservation when friction or resistance is doing work.',
    ],
    selfChecks: [
      'What work is done by a force at $30^\\circ$ to the direction of motion over a displacement $s$?',
      'How does gravitational potential energy change when height decreases by $h$?',
      'When should you use $P=W/t$ instead of $P=Fv$?',
    ],
    examStyle: [
      'Source-style prompts include barges, boxes, crates, sledges, water slides, cars, skydivers, golf balls, pulleys, and engines.',
      'Questions often ask for work by named forces, speed after descent, resistance, energy absorbed, or power at a given speed.',
    ],
    practiceHook: 'Draft/generated practice should begin with work-energy setup diagrams and energy tables before asking for speeds or forces.',
    examTrainingHook: 'Before Skill Check generation, review work-energy prompts for force-component diagrams and clear conservation/non-conservation wording.',
    visualRequirements: [
      'Work-energy setup diagrams with displacement direction, force angle, height change, and resistance.',
      'Energy tables listing initial/final KE, initial/final PE, and work terms.',
      'Slope diagrams showing work against gravity and non-gravitational resistance.',
      'Power diagrams showing force and velocity in the same line when $P=Fv$ is used.',
    ],
    genericPracticePrompts: [
      'Draft/generated practice: Find work done by an angled pulling force and by friction over a horizontal displacement.',
      'Draft/generated practice: Use $KE$ and $PE$ changes to find speed at the bottom of a smooth slope.',
      'Draft/generated practice: Include resistance in a work-energy equation to find an average resistance force.',
      'Draft/generated practice: Find engine power from tractive force and speed.',
    ],
    reviewStatus: draftStatus,
    fieldGuideSections: [
      section(
        'm1-energy-work-done-by-force',
        'Work done by force',
        'Use the force component in the displacement direction.',
        [
          'For a force at angle $\\theta$ to motion, work is $Fs\\cos\\theta$.',
          'Resistance and friction usually do negative work against the motion.',
          'A force perpendicular to displacement does no work.',
        ],
        ['Work-energy setup diagram showing displacement arrow, angled force, and component along motion.'],
        [
          'Draft/generated practice: Find work done by tension pulling a barge at an angle.',
          'Draft/generated practice: Find total work by tension, friction, weight, and normal reaction for a box moving horizontally.',
        ],
        [workEnergySetupTemplate],
      ),
      section(
        'm1-energy-kinetic-energy',
        'Kinetic energy',
        'Calculate and compare kinetic energy from speed.',
        [
          'Kinetic energy is $\\frac12mv^2$ and is always non-negative.',
          'A change in kinetic energy compares final and initial values.',
          'Use speed in m s$^{-1}$, not km h$^{-1}$.',
        ],
        ['Energy table with initial and final kinetic energy columns.'],
        [
          'Draft/generated practice: Find increase in kinetic energy as speed changes.',
          'Draft/generated practice: Use work done by resultant force to find a final speed.',
        ],
      ),
      section(
        'm1-energy-gravitational-potential-energy',
        'Gravitational potential energy',
        'Track energy changes from vertical height changes.',
        [
          'Gravitational potential energy change is $mg\\Delta h$.',
          'Only vertical height change matters, not path length.',
          'Descending loses gravitational potential energy; ascending gains it.',
        ],
        ['Slope or vertical-height diagram with height change marked separately from path length.'],
        [
          'Draft/generated practice: Find loss of gravitational potential energy on a slide or hill.',
          'Draft/generated practice: Use vertical height change to find work against gravity on an incline.',
        ],
      ),
      section(
        'm1-energy-work-energy-principle',
        'Work energy principle',
        'Connect resultant work to change in kinetic energy.',
        [
          'The work done by the resultant force equals the change in kinetic energy.',
          'Equivalent energy-balance equations can include individual work terms.',
          'Signs matter for work terms even though energy is scalar.',
        ],
        ['Work-energy table showing each force work term and the KE change.'],
        [
          'Draft/generated practice: Find speed after a journey with driving work and resistance work.',
          'Draft/generated practice: Find average resistance from a known speed change and distance.',
        ],
        [energyTableTemplate],
      ),
      section(
        'm1-energy-conservation',
        'Conservation of energy',
        'Use conservation only when no non-conservative work is present or it is accounted for.',
        [
          'For smooth/no-resistance motion, loss in $PE$ can become gain in $KE$.',
          'With friction or resistance, include work against resistance.',
          'Do not assume energy is conserved when a question states energy is absorbed or dissipated.',
        ],
        ['Conservation energy diagram showing exchange between PE and KE, with optional loss term.'],
        [
          'Draft/generated practice: Find speed at the bottom of a smooth descent from height loss.',
          'Draft/generated practice: Explain how a resistance force changes the conservation equation.',
        ],
      ),
      section(
        'm1-energy-power',
        'Power',
        'Relate work rate, force, and speed.',
        [
          'Average power is work done divided by time.',
          'Instantaneous power in straight-line motion is $P=Fv$ for the driving force along the motion.',
          'Use watts for joules per second.',
        ],
        ['Power setup diagram showing tractive force, velocity direction, and any resistance force.'],
        [
          'Draft/generated practice: Find power from work done over a time interval.',
          'Draft/generated practice: Find tractive force from power and constant speed.',
        ],
        [powerSetupTemplate],
      ),
    ],
  },
];
