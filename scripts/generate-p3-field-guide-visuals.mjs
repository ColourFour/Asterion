import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(repoRoot, 'public/assets/p3/visuals');
const tmpRoot = path.join(repoRoot, '.tmp/p3-visuals');

const W = 960;
const H = 540;
const blue = '#1f5fbf';
const blue2 = '#60a5fa';
const ink = '#172033';
const grey = '#64748b';
const pale = '#dbeafe';
const green = '#15803d';
const amber = '#b45309';
const red = '#b91c1c';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svg(parts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; fill: ${ink}; font-size: 22px; }
    .title { font-size: 30px; font-weight: 700; }
    .label { font-size: 21px; font-weight: 650; }
    .small { font-size: 18px; }
    .tiny { font-size: 16px; }
    .axis { stroke: ${ink}; stroke-width: 2.4; }
    .grid { stroke: #e5e7eb; stroke-width: 1.2; }
    .blue { stroke: ${blue}; stroke-width: 4.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .blue-thin { stroke: ${blue}; stroke-width: 2.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .grey { stroke: ${grey}; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .green { stroke: ${green}; stroke-width: 3.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .amber { stroke: ${amber}; stroke-width: 3.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .red { stroke: ${red}; stroke-width: 3.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .dash { stroke-dasharray: 10 9; }
    .shade { fill: ${pale}; opacity: 0.74; }
    .green-shade { fill: #dcfce7; opacity: 0.86; }
    .amber-shade { fill: #fef3c7; opacity: 0.86; }
    .dot { fill: ${blue}; stroke: #fff; stroke-width: 3; }
    .green-dot { fill: ${green}; stroke: #fff; stroke-width: 3; }
    .red-dot { fill: ${red}; stroke: #fff; stroke-width: 3; }
    .panel { fill: #f8fafc; stroke: #d1d5db; stroke-width: 1.6; rx: 14; }
    .note { fill: #fff7ed; stroke: #fed7aa; stroke-width: 1.5; rx: 12; }
  </style>
  ${parts.join('\n')}
</svg>`;
}

function text(x, y, value, cls = '') {
  return `<text x="${x}" y="${y}" class="${cls}">${esc(value)}</text>`;
}

function line(x1, y1, x2, y2, cls = 'axis') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
}

function rect(x, y, width, height, cls = 'panel') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="${cls}"/>`;
}

function circle(x, y, r, cls = 'dot') {
  return `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
}

function arrow(x1, y1, x2, y2, color = blue, width = 3) {
  const id = `arrow-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}-${Math.round(width)}`.replace(/-/g, 'm');
  return `
    <defs><marker id="${id}" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 Z" fill="${color}"/></marker></defs>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#${id})"/>
  `;
}

function axes(x0 = 100, y0 = 440, x1 = 860, y1 = 70, xLabel = 'x', yLabel = 'y') {
  return [
    line(x0, y0, x1, y0),
    line(x0, y0, x0, y1),
    text(x1 - 16, y0 + 34, xLabel, 'small'),
    text(x0 - 36, y1 + 12, yLabel, 'small'),
  ];
}

function poly(points, cls = 'blue') {
  return `<polyline points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" class="${cls}"/>`;
}

function pathD(points) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function graphPoints(fn, xMin, xMax, sx, sy, ox, oy, n = 160) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = xMin + (xMax - xMin) * i / n;
    return [ox + x * sx, oy - fn(x) * sy];
  });
}

const diagrams = [
  {
    file: 'algebra/algebra_modulus_graph_equations.png',
    draw() {
      const ox = 440, oy = 395, sx = 120, sy = 50;
      const px = (x) => ox + x * sx;
      const py = (y) => oy - y * sy;
      const a = 1;
      const b = 2;
      const left = a - b;
      const right = a + b;
      return svg([
        text(44, 48, 'Modulus equation vs inequality', 'title'),
        ...axes(80, oy, 705, 105),
        `<path d="${pathD(graphPoints((x) => Math.abs(x - a), -2.5, 4.3, sx, sy, ox, oy, 160))}" class="blue"/>`,
        line(px(-2.5), py(b), px(4.3), py(b), 'green'),
        `<path d="M${px(left)} ${py(b)} L${px(left)} ${oy} L${px(right)} ${oy} L${px(right)} ${py(b)} Z" class="green-shade"/>`,
        line(px(left), oy, px(left), py(b), 'grey dash'),
        line(px(right), oy, px(right), py(b), 'grey dash'),
        circle(px(left), py(b), 8),
        circle(px(right), py(b), 8),
        circle(px(a), py(0), 8, 'green-dot'),
        text(px(a) - 36, oy + 32, 'x=a', 'small'),
        text(px(left) - 42, oy + 32, 'a-b', 'small'),
        text(px(right) - 32, oy + 32, 'a+b', 'small'),
        text(px(a) + 10, py(0) - 12, 'vertex (a,0)', 'small'),
        text(560, 150, 'y = |x-a|', 'label'),
        text(560, py(b) - 12, 'y = b', 'label'),
        rect(725, 112, 195, 260, 'note'),
        text(745, 150, 'Key move', 'label'),
        text(745, 188, '|x-a| = b', 'small'),
        text(745, 216, 'two points', 'small'),
        text(745, 262, '|x-a| < b', 'small'),
        text(745, 290, 'inside interval', 'small'),
        line(748, 326, 895, 326, 'green'),
        text(760, 358, 'shade between', 'small'),
      ]);
    },
  },
  {
    file: 'logarithmic-and-exponential-functions/log_graph_inverse.png',
    draw() {
      const ox = 260, oy = 430, sx = 105, sy = 72;
      const xp = (x) => ox + x * sx;
      const yp = (y) => oy - y * sy;
      return svg([
        text(44, 48, 'Inverse graphs swap coordinates', 'title'),
        ...axes(90, oy, 850, 80),
        `<path d="${pathD(graphPoints((x) => Math.E ** x, -1.45, 1.95, sx, sy, ox, oy, 150))}" class="blue"/>`,
        `<path d="${pathD(graphPoints((x) => Math.log(x), 0.16, 4.35, sx, sy, ox, oy, 170))}" class="green"/>`,
        line(120, 530, 835, -185, 'grey dash'),
        line(ox, 470, ox, 85, 'amber dash'),
        circle(xp(0), yp(1), 8),
        circle(xp(1), yp(0), 8, 'green-dot'),
        line(xp(0), yp(1), xp(1), yp(0), 'grey dash'),
        text(xp(0) - 62, yp(1) - 12, '(0,1)', 'small'),
        text(xp(1) + 8, yp(0) + 28, '(1,0)', 'small'),
        text(540, 105, 'y = e^x', 'label'),
        text(650, 375, 'y = ln x', 'label'),
        text(710, 175, 'mirror: y=x', 'small'),
        rect(560, 220, 300, 118, 'note'),
        text(582, 255, 'Watch domain', 'label'),
        text(582, 288, 'ln x only for x > 0', 'small'),
        text(582, 318, 'range: all real values', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_reciprocal_functions.png',
    draw() {
      const ox = 115, oy = 280, sx = 112, sy = 72;
      const sinPts = graphPoints(Math.sin, 0, Math.PI * 2, sx, sy, ox, oy, 220);
      const cosecPath = (a, b) => pathD(graphPoints((x) => 1 / Math.sin(x), a, b, sx, sy, ox, oy, 110).filter(([, y]) => y > 75 && y < 485));
      return svg([
        text(44, 48, 'Reciprocal trig blows up at zeros', 'title'),
        ...axes(70, oy, 890, 72),
        `<path d="${pathD(sinPts)}" stroke="#94a3b8" stroke-width="3.2" fill="none"/>`,
        `<path d="${cosecPath(0.18, Math.PI - 0.18)}" class="blue"/>`,
        `<path d="${cosecPath(Math.PI + 0.18, 2 * Math.PI - 0.18)}" class="blue"/>`,
        ...[0, Math.PI, 2 * Math.PI].map((x) => line(ox + x * sx, 76, ox + x * sx, 482, 'red dash')),
        ...['0', 'π', '2π'].map((label, i) => text(ox + i * Math.PI * sx - 12, oy + 35, label, 'tiny')),
        text(325, 130, 'y = cosec x = 1/sin x', 'label'),
        text(590, 335, 'base: y = sin x', 'small'),
        text(225, 494, 'vertical asymptotes where sin x = 0', 'small'),
        rect(635, 118, 262, 118, 'note'),
        text(657, 154, 'Watch out', 'label'),
        text(657, 188, 'reciprocal ≠ inverse angle', 'small'),
        text(657, 216, 'cosec x ≠ sin⁻¹x', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_double_angle_interval_solutions.png',
    draw() {
      return svg([
        text(44, 48, 'Choose the double-angle form that matches', 'title'),
        rect(52, 92, 385, 312),
        text(82, 132, 'Formula map', 'label'),
        text(82, 178, 'sin 2x = 2 sin x cos x', 'small'),
        text(82, 226, 'cos 2x = cos²x - sin²x', 'small'),
        text(82, 274, 'cos 2x = 2 cos²x - 1', 'small'),
        text(82, 322, 'cos 2x = 1 - 2 sin²x', 'small'),
        text(82, 372, 'Pick the version already using', 'tiny'),
        text(82, 396, 'the trig function in the equation.', 'tiny'),
        rect(482, 92, 418, 312),
        text(512, 132, 'Mini example', 'label'),
        text(512, 178, 'cos 2x = 3 sin x', 'small'),
        arrow(650, 188, 650, 232, blue, 3),
        text(512, 264, '1 - 2 sin²x = 3 sin x', 'small'),
        text(512, 312, '2 sin²x + 3 sin x - 1 = 0', 'small'),
        text(512, 360, 'Now solve a quadratic in sin x', 'small'),
        rect(238, 426, 505, 70, 'note'),
        text(265, 469, 'Key move: change cos 2x into the form that creates one variable.', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_r_form_transformations.png',
    draw() {
      const ox = 92, oy = 284, sx = 86, sy = 24;
      const shifted = graphPoints((x) => 5 * Math.cos(x - 0.93), 0, Math.PI * 2, sx, sy, ox, oy, 180);
      return svg([
        text(44, 48, 'R-form: amplitude plus phase shift', 'title'),
        ...axes(62, oy, 632, 92),
        `<path d="${pathD(shifted)}" class="blue"/>`,
        line(132, oy, 132, oy - 120, 'blue-thin'),
        text(146, oy - 68, 'max = R', 'small'),
        line(208, 448, 290, 448, 'grey dash'),
        text(232, 474, 'α shift', 'small'),
        text(238, 118, 'a cos x + b sin x = R cos(x-α)', 'small'),
        rect(680, 106, 232, 248),
        text(706, 146, 'Coefficient triangle', 'label'),
        `<polygon points="725,298 850,298 725,178" fill="none" stroke="${ink}" stroke-width="3"/>`,
        text(780, 328, 'a', 'small'),
        text(692, 242, 'b', 'small'),
        text(795, 238, 'R', 'small'),
        text(742, 276, 'α', 'small'),
        text(706, 388, 'R = √(a²+b²)', 'small'),
        text(706, 424, 'tan α = b/a', 'small'),
        rect(300, 410, 312, 68, 'note'),
        text(322, 452, 'Use R for max/min values.', 'small'),
      ]);
    },
  },
  {
    file: 'differentiation/p3_diff_stationary_tangent_normal.png',
    draw() {
      return svg([
        text(44, 48, 'Derivative value becomes line geometry', 'title'),
        ...axes(78, 430, 872, 78),
        `<path d="M88 388 C175 286, 268 248, 358 258 C456 270, 500 366, 612 300 C718 238, 764 166, 874 156" class="blue"/>`,
        circle(612, 300, 8),
        line(508, 350, 725, 247, 'blue-thin'),
        line(568, 205, 656, 395, 'grey'),
        text(632, 290, 'P', 'label'),
        text(706, 242, "tangent gradient = dy/dx", 'small'),
        text(646, 406, 'normal is perpendicular', 'small'),
        circle(348, 257, 8, 'green-dot'),
        line(264, 257, 432, 257, 'green'),
        text(238, 224, "stationary: dy/dx = 0", 'small'),
        rect(548, 95, 330, 96, 'note'),
        text(570, 130, 'Key move', 'label'),
        text(570, 164, 'normal gradient = -1/m, if tangent m ≠ 0', 'small'),
      ]);
    },
  },
  {
    file: 'differentiation/derivatives_parametric.png',
    draw() {
      return svg([
        text(44, 48, 'Parametric gradient compares rates', 'title'),
        ...axes(80, 430, 860, 70),
        `<path d="M120 390 C230 210, 380 150, 520 240 C655 325, 730 270, 830 120" class="blue"/>`,
        circle(520, 240, 8),
        line(430, 184, 610, 296, 'blue-thin'),
        line(480, 303, 560, 175, 'grey'),
        arrow(520, 240, 600, 240, grey, 3),
        arrow(600, 240, 600, 190, grey, 3),
        line(520, 240, 600, 190, 'blue-thin'),
        text(532, 225, 'P(t)', 'small'),
        text(548, 267, 'dx/dt', 'small'),
        text(610, 218, 'dy/dt', 'small'),
        text(585, 165, 'tangent direction', 'small'),
        text(265, 95, 'dy/dx = (dy/dt)/(dx/dt)', 'small'),
      ]);
    },
  },
  {
    file: 'integration/integrals_definite_area_bridge.png',
    draw() {
      const ox = 105, oy = 400, sx = 95, sy = 52;
      const fn = (x) => 0.18 * (x - 3) ** 2 + 1.35;
      const pts = graphPoints(fn, 0, 5.55, sx, sy, ox, oy, 170);
      const area = graphPoints(fn, 1, 4.35, sx, sy, ox, oy, 120);
      return svg([
        text(44, 48, 'Definite integral: bounds decide the area', 'title'),
        ...axes(74, oy, 665, 96),
        `<path d="${pathD(area)} L ${ox + 4.35 * sx} ${oy} L ${ox + 1 * sx} ${oy} Z" class="shade"/>`,
        `<path d="${pathD(pts)}" class="blue"/>`,
        line(ox + 1 * sx, oy, ox + 1 * sx, oy - fn(1) * sy, 'grey'),
        line(ox + 4.35 * sx, oy, ox + 4.35 * sx, oy - fn(4.35) * sy, 'grey'),
        text(ox + 88, oy + 34, 'x=a', 'small'),
        text(ox + 402, oy + 34, 'x=b', 'small'),
        text(232, 168, '∫ₐᵇ f(x) dx = F(b) - F(a)', 'label'),
        text(280, 202, 'signed area under f(x)', 'small'),
        rect(690, 112, 224, 212),
        `<path d="M712 285 C750 190, 820 170, 890 130" stroke="${blue}" stroke-width="3.4" fill="none"/>`,
        `<path d="M712 275 C755 254, 825 238, 890 218" stroke="${green}" stroke-width="3.4" fill="none"/>`,
        `<path d="M735 246 C770 204, 835 185, 878 148 L878 218 C826 235, 772 248, 735 266 Z" class="green-shade"/>`,
        text(707, 356, 'between curves:', 'small'),
        text(707, 386, 'top - bottom', 'label'),
        rect(198, 456, 486, 54, 'note'),
        text(220, 491, 'Watch sign: exam "area" may need positive pieces.', 'small'),
      ]);
    },
  },
  {
    file: 'numerical-solution-of-equations/iteration_graph_root_proof.png',
    draw() {
      const ox = 120, oy = 390, sx = 120, sy = 44;
      const f = (x) => (x - 1.45) * (x + 0.25) * 0.48;
      return svg([
        text(44, 48, 'Bracketing is evidence; iteration is a process', 'title'),
        ...axes(78, oy, 850, 92),
        `<path d="${pathD(graphPoints(f, -0.55, 4.25, sx, sy, ox, oy, 180))}" class="blue"/>`,
        line(ox + 1.1 * sx, 94, ox + 1.1 * sx, oy, 'grey dash'),
        line(ox + 1.8 * sx, 94, ox + 1.8 * sx, oy, 'grey dash'),
        `<rect x="${ox + 1.1 * sx}" y="94" width="${0.7 * sx}" height="${oy - 94}" class="shade"/>`,
        circle(ox + 1.45 * sx, oy, 8),
        text(ox + 1.1 * sx - 10, oy + 34, 'a', 'small'),
        text(ox + 1.8 * sx - 10, oy + 34, 'b', 'small'),
        text(258, 126, 'f(a) < 0', 'small'),
        text(398, 126, 'f(b) > 0', 'small'),
        text(160, 510, 'sign change + continuity ⇒ root in [a,b]', 'small'),
        arrow(665, 260, 748, 206, green, 4),
        arrow(748, 206, 790, 178, green, 4),
        text(648, 302, 'iteration:', 'small'),
        text(648, 330, 'xₙ → xₙ₊₁', 'label'),
        rect(590, 376, 320, 104, 'note'),
        text(632, 416, 'Watch out', 'label'),
        text(632, 448, 'bracketing proof is not', 'small'),
        text(632, 472, 'the iteration itself', 'small'),
      ]);
    },
  },
  {
    file: 'vectors/vectors_intersect_parallel_skew.png',
    draw() {
      return svg([
        text(44, 48, 'Classify vector lines by checks, not by looks', 'title'),
        rect(42, 88, 270, 315),
        text(72, 128, 'Intersecting', 'label'),
        line(76, 258, 260, 142, 'blue'),
        line(82, 145, 260, 272, 'grey'),
        circle(172, 198, 8),
        text(186, 190, 'common point', 'small'),
        text(186, 218, 'P', 'small'),
        text(70, 344, 'solve λ, μ', 'small'),
        text(70, 374, 'same point works', 'small'),
        rect(345, 88, 270, 315),
        text(375, 128, 'Parallel', 'label'),
        arrow(380, 170, 570, 220),
        arrow(380, 258, 570, 308),
        text(390, 354, 'd₂ = k d₁', 'small'),
        text(390, 382, 'then check if distinct', 'small'),
        rect(648, 88, 270, 315),
        text(678, 128, 'Skew', 'label'),
        line(680, 176, 870, 226, 'blue'),
        line(700, 326, 875, 252, 'grey'),
        line(734, 184, 734, 316, 'grey dash'),
        text(675, 354, 'not parallel', 'small'),
        text(675, 382, 'no λ, μ gives same point', 'small'),
        rect(230, 430, 500, 62, 'note'),
        text(258, 470, 'Decision order: compare directions, then test simultaneous parameters.', 'small'),
      ]);
    },
  },
  {
    file: 'vectors/vectors_point_to_line_distance.png',
    draw() {
      return svg([
        text(44, 48, 'Point-to-line distance: find the perpendicular foot', 'title'),
        line(110, 384, 830, 178, 'blue'),
        arrow(470, 282, 612, 242, blue, 4),
        circle(470, 282, 8),
        circle(470, 132, 9, 'green-dot'),
        line(470, 132, 470, 282, 'grey'),
        `<path d="M470 262 L492 256 L498 276" stroke="${ink}" stroke-width="2.3" fill="none"/>`,
        text(482, 128, 'P', 'label'),
        text(484, 290, 'Q = a + λd', 'small'),
        text(622, 238, 'direction d', 'small'),
        text(690, 178, 'line r = a + λd', 'label'),
        arrow(208, 356, 470, 282, grey, 3),
        text(165, 384, 'choose λ', 'small'),
        text(310, 202, 'PQ', 'label'),
        text(290, 232, 'distance = |PQ|', 'small'),
        rect(616, 328, 270, 116, 'note'),
        text(640, 366, 'Key equation', 'label'),
        text(640, 404, 'PQ · d = 0', 'label'),
        text(640, 432, 'perpendicular fixes λ', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/modulus_argument.png',
    draw() {
      const ox = 470, oy = 325;
      const p = [330, 174];
      return svg([
        text(44, 48, 'Argand form: distance plus direction', 'title'),
        line(120, oy, 842, oy),
        line(ox, 470, ox, 86),
        text(822, oy + 35, 'Re z', 'small'),
        text(ox - 58, 96, 'Im z', 'small'),
        arrow(ox, oy, p[0], p[1], blue, 4),
        line(p[0], p[1], p[0], oy, 'grey dash'),
        line(p[0], oy, ox, oy, 'grey dash'),
        circle(p[0], p[1], 9),
        `<path d="M545 325 A75 75 0 0 0 420 270" class="green"/>`,
        text(p[0] - 58, p[1] - 16, 'z = x + iy', 'label'),
        text(380, 242, '|z| = √(x²+y²)', 'small'),
        text(506, 275, 'arg z = θ', 'label'),
        text(345, 358, 'x', 'small'),
        text(294, 258, 'y', 'small'),
        rect(600, 118, 286, 106, 'note'),
        text(624, 154, 'Watch quadrant', 'label'),
        text(624, 188, 'tan⁻¹(y/x) needs sign check', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/locus.png',
    draw() {
      return svg([
        text(44, 48, 'Match complex locus statements to geometry', 'title'),
        rect(42, 90, 270, 315),
        text(68, 130, '|z-a| = r', 'label'),
        line(72, 292, 280, 292),
        line(176, 372, 176, 152),
        circle(176, 262, 78, 'blue-thin'),
        circle(176, 262, 7, 'green-dot'),
        text(188, 266, 'a', 'small'),
        text(218, 220, 'radius r', 'small'),
        text(68, 374, 'circle centre a', 'small'),
        rect(345, 90, 270, 315),
        text(371, 130, 'arg(z-a)=θ', 'label'),
        line(378, 292, 586, 292),
        line(482, 372, 482, 152),
        circle(482, 292, 7, 'red-dot'),
        arrow(482, 292, 582, 210, blue, 4),
        `<path d="M532 292 A50 50 0 0 0 520 252" class="green"/>`,
        text(512, 274, 'θ', 'small'),
        text(371, 362, 'ray from a;', 'small'),
        text(371, 390, 'endpoint excluded', 'small'),
        rect(648, 90, 270, 315),
        text(674, 130, '|z-a| = |z-b|', 'label'),
        line(680, 292, 886, 292),
        line(783, 372, 783, 152),
        circle(730, 292, 7),
        circle(840, 292, 7),
        text(718, 322, 'a', 'small'),
        text(832, 322, 'b', 'small'),
        line(785, 168, 785, 354, 'green'),
        text(674, 374, 'perpendicular bisector', 'small'),
        rect(188, 430, 584, 62, 'note'),
        text(216, 470, 'Shade only when the condition asks for a region, such as ≤ or ≥.', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/roots.png',
    draw() {
      const cx = 480, cy = 280, r = 155;
      const angles = [-20, 100, 220].map((d) => d * Math.PI / 180);
      return svg([
        text(44, 48, 'Complex roots split the full turn equally', 'title'),
        line(150, cy, 820, cy),
        line(cx, 470, cx, 78),
        text(790, cy + 34, 'Re z', 'small'),
        text(cx - 58, 90, 'Im z', 'small'),
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#bfdbfe" stroke-width="5"/>`,
        ...angles.map((a, i) => {
          const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
          return `${arrow(cx, cy, x, y, blue, 3)}${circle(x, y, 8)}${text(x + 9, y - 9, i === 0 ? 'root 1' : `root ${i + 1}`, 'small')}`;
        }),
        `<path d="M555 280 A75 75 0 0 0 506 210" class="green"/>`,
        `<path d="M506 210 A75 75 0 0 0 409 245" class="green"/>`,
        text(574, 132, 'angle step = 2π/n', 'label'),
        text(586, 174, 'rotate to the next root', 'small'),
        text(580, 350, 'same radius', 'small'),
        rect(168, 438, 625, 56, 'note'),
        text(194, 474, 'For zⁿ = r cis θ: arguments are (θ + 2kπ)/n.', 'small'),
      ]);
    },
  },
];

await rm(tmpRoot, { recursive: true, force: true });
await mkdir(tmpRoot, { recursive: true });

const generated = [];
for (const diagram of diagrams) {
  const svgPath = path.join(tmpRoot, diagram.file.replace(/\.png$/, '.svg'));
  const pngPath = path.join(outputRoot, diagram.file);
  await mkdir(path.dirname(svgPath), { recursive: true });
  await mkdir(path.dirname(pngPath), { recursive: true });
  await writeFile(svgPath, diagram.draw(), 'utf8');
  execFileSync('/usr/bin/sips', ['-s', 'format', 'png', svgPath, '--out', pngPath], { stdio: 'ignore' });
  generated.push(path.relative(repoRoot, pngPath));
}

console.log(JSON.stringify({ images_generated: generated.length, generated }, null, 2));
