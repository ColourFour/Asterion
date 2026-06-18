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
const blue2 = '#6ea8fe';
const ink = '#172033';
const grey = '#64748b';
const pale = '#dbeafe';

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
    .small { font-size: 18px; }
    .tiny { font-size: 16px; }
    .axis { stroke: ${ink}; stroke-width: 2.5; }
    .grid { stroke: #e5e7eb; stroke-width: 1.2; }
    .blue { stroke: ${blue}; stroke-width: 4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .blue-thin { stroke: ${blue}; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .grey { stroke: ${grey}; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .dash { stroke-dasharray: 10 10; }
    .shade { fill: ${pale}; opacity: 0.72; }
    .dot { fill: ${blue}; stroke: #fff; stroke-width: 3; }
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

function arrow(x1, y1, x2, y2, color = blue, width = 3) {
  const id = `arrow-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}`.replace(/-/g, 'm');
  return `
    <defs><marker id="${id}" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 Z" fill="${color}"/></marker></defs>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#${id})"/>
  `;
}

function axes(x0 = 100, y0 = 440, x1 = 860, y1 = 70) {
  return [
    line(x0, y0, x1, y0),
    line(x0, y0, x0, y1),
    text(x1 - 15, y0 + 34, 'x', 'small'),
    text(x0 - 34, y1 + 10, 'y', 'small'),
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
      const ox = 380, oy = 305, sx = 95, sy = 40;
      const px = (x) => ox + x * sx;
      const py = (y) => oy - y * sy;
      return svg([
        ...axes(80, oy, 840, 70),
        poly(graphPoints((x) => Math.abs(x + 2), -3.1, 2.5, sx, sy, ox, oy), 'blue'),
        `<path d="${pathD(graphPoints((x) => Math.abs(3 * x), -1.5, 1.8, sx, sy, ox, oy))}" stroke="${grey}" stroke-width="4" fill="none"/>`,
        line(px(-0.5), oy, px(-0.5), py(1.5), 'grey dash'),
        line(px(1), oy, px(1), py(3), 'grey dash'),
        `<circle cx="${px(-0.5)}" cy="${py(1.5)}" r="8" class="dot"/>`,
        `<circle cx="${px(1)}" cy="${py(3)}" r="8" class="dot"/>`,
        text(px(-0.8), oy + 32, 'x=-1/2', 'tiny'),
        text(px(0.8), oy + 32, 'x=1', 'tiny'),
        text(585, 115, 'y=|3x|', 'small'),
        text(135, 130, 'y=|x+2|', 'small'),
        line(180, 470, 780, 470),
        line(340, 458, 340, 482),
        line(520, 458, 520, 482),
        line(190, 470, 330, 470, 'blue'),
        line(530, 470, 770, 470, 'blue'),
        text(310, 508, '-1/2', 'tiny'),
        text(510, 508, '1', 'tiny'),
        text(300, 440, 'solution: x<-1/2 or x>1', 'small'),
      ]);
    },
  },
  {
    file: 'logarithmic-and-exponential-functions/log_graph_inverse.png',
    draw() {
      const ox = 220, oy = 410, sx = 110, sy = 70;
      const xp = (x) => ox + x * sx;
      const yp = (y) => oy - y * sy;
      return svg([
        ...axes(90, oy, 850, 70),
        `<path d="${pathD(graphPoints((x) => 2 ** x, -1.2, 2.25, sx, sy, ox, oy, 120))}" stroke="${blue}" stroke-width="4" fill="none"/>`,
        `<path d="${pathD(graphPoints((x) => Math.log2(x), 0.12, 4.2, sx, sy, ox, oy, 160))}" stroke="${grey}" stroke-width="4" fill="none"/>`,
        line(120, 510, 830, -200, 'grey dash'),
        line(ox, 470, ox, 80, 'grey dash'),
        ...[[0, 1], [1, 0], [1, 2], [2, 1]].map(([x, y]) => `<circle cx="${xp(x)}" cy="${yp(y)}" r="7" class="dot"/>`),
        text(540, 120, 'y=2^x', 'small'),
        text(590, 360, 'y=log₂x', 'small'),
        text(690, 185, 'y=x', 'small'),
        text(440, 70, 'inverse reflection: (a,b) → (b,a)', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_reciprocal_functions.png',
    draw() {
      const ox = 110, oy = 270, sx = 110, sy = 72;
      const xEnd = ox + Math.PI * 2 * sx;
      const cosPts = graphPoints(Math.cos, 0, Math.PI * 2, sx, sy, ox, oy, 180);
      const secPath = (a, b) => pathD(graphPoints((x) => 1 / Math.cos(x), a, b, sx, sy, ox, oy, 80).filter(([, y]) => y > 40 && y < 500));
      return svg([
        ...axes(70, oy, 850, 60),
        `<path d="${pathD(cosPts)}" stroke="#94a3b8" stroke-width="3" fill="none"/>`,
        `<path d="${secPath(0, Math.PI / 2 - 0.18)}" class="blue"/>`,
        `<path d="${secPath(Math.PI / 2 + 0.18, 3 * Math.PI / 2 - 0.18)}" class="blue"/>`,
        `<path d="${secPath(3 * Math.PI / 2 + 0.18, 2 * Math.PI)}" class="blue"/>`,
        line(ox + Math.PI / 2 * sx, 65, ox + Math.PI / 2 * sx, 475, 'grey dash'),
        line(ox + 3 * Math.PI / 2 * sx, 65, ox + 3 * Math.PI / 2 * sx, 475, 'grey dash'),
        ...['0', 'π/2', 'π', '3π/2', '2π'].map((label, i) => text(ox + i * Math.PI / 2 * sx - 15, oy + 34, label, 'tiny')),
        text(575, 105, 'y=sec x = 1/cos x', 'small'),
        text(545, 385, 'y=cos x', 'small'),
        text(300, 520, 'asymptotes where cos x=0', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_double_angle_interval_solutions.png',
    draw() {
      const cx = 230, cy = 250, r = 125;
      const ox = 500, oy = 330, sx = 55, sy = 135;
      const graph = graphPoints(Math.sin, 0, Math.PI * 2, sx, sy, ox, oy, 180);
      const p1 = [cx + r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6)];
      const p2 = [cx + r * Math.cos(5 * Math.PI / 6), cy - r * Math.sin(5 * Math.PI / 6)];
      return svg([
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#94a3b8" stroke-width="3"/>`,
        line(cx - 160, cy, cx + 160, cy),
        line(cx, cy + 160, cx, cy - 160),
        arrow(cx, cy, p1[0], p1[1]),
        arrow(cx, cy, p2[0], p2[1]),
        `<circle cx="${p1[0]}" cy="${p1[1]}" r="7" class="dot"/>`,
        `<circle cx="${p2[0]}" cy="${p2[1]}" r="7" class="dot"/>`,
        text(p1[0] + 10, p1[1] - 12, 'π/6', 'small'),
        text(p2[0] - 70, p2[1] - 12, '5π/6', 'small'),
        ...axes(465, oy, 890, 90),
        `<path d="${pathD(graph)}" class="blue"/>`,
        line(ox, oy - 0.5 * sy, ox + Math.PI * 2 * sx, oy - 0.5 * sy, 'grey dash'),
        `<circle cx="${ox + Math.PI / 6 * sx}" cy="${oy - 0.5 * sy}" r="7" class="dot"/>`,
        `<circle cx="${ox + 5 * Math.PI / 6 * sx}" cy="${oy - 0.5 * sy}" r="7" class="dot"/>`,
        text(520, 110, 'y=sin x', 'small'),
        text(775, 255, 'y=1/2', 'small'),
        text(545, 485, '0≤x<2π: keep interval solutions', 'small'),
      ]);
    },
  },
  {
    file: 'trigonometry/trig_r_form_transformations.png',
    draw() {
      const ox = 110, oy = 285, sx = 90, sy = 30;
      const ref = graphPoints(Math.sin, 0, Math.PI * 2, sx, sy * 2, ox, oy, 180);
      const shifted = graphPoints((x) => 5 * Math.sin(x + 0.93), 0, Math.PI * 2, sx, sy, ox, oy, 180);
      return svg([
        ...axes(70, oy, 700, 70),
        `<path d="${pathD(ref)}" stroke="#94a3b8" stroke-width="3" fill="none"/>`,
        `<path d="${pathD(shifted)}" class="blue"/>`,
        line(170, oy, 170, oy - 150, 'blue-thin'),
        text(180, oy - 80, 'R=5', 'small'),
        line(194, 440, 274, 440, 'grey dash'),
        text(205, 470, 'α', 'small'),
        text(245, 95, '3 sin x + 4 cos x = 5 sin(x+α)', 'small'),
        text(280, 140, 'tan α = 4/3', 'small'),
        `<polygon points="755,370 855,370 755,250" fill="none" stroke="${ink}" stroke-width="3"/>`,
        text(805, 398, '3', 'small'),
        text(720, 315, '4', 'small'),
        text(815, 300, '5', 'small'),
        text(720, 230, 'coefficient triangle', 'small'),
      ]);
    },
  },
  {
    file: 'differentiation/p3_diff_stationary_tangent_normal.png',
    draw() {
      const curve = [[80, 390], [160, 320], [260, 250], [370, 260], [480, 330], [610, 300], [760, 180], [870, 155]];
      return svg([
        ...axes(75, 430, 870, 70),
        `<path d="M80 390 C170 295, 245 245, 350 255 C450 265, 495 365, 610 300 C720 235, 760 165, 870 155" class="blue"/>`,
        `<circle cx="610" cy="300" r="8" class="dot"/>`,
        line(505, 350, 720, 250, 'blue-thin'),
        line(565, 205, 655, 395, 'grey'),
        text(630, 286, 'P(a,f(a))', 'small'),
        text(710, 250, "tangent gradient f'(a)", 'small'),
        text(660, 405, "normal gradient -1/f'(a)", 'small'),
        `<circle cx="345" cy="255" r="8" class="dot"/>`,
        line(260, 255, 430, 255, 'grey'),
        text(255, 225, "stationary point: f'(x)=0", 'small'),
      ]);
    },
  },
  {
    file: 'differentiation/derivatives_parametric.png',
    draw() {
      return svg([
        ...axes(80, 430, 860, 70),
        `<path d="M120 390 C230 210, 380 150, 520 240 C655 325, 730 270, 830 120" class="blue"/>`,
        `<circle cx="520" cy="240" r="8" class="dot"/>`,
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
      const ox = 110, oy = 410, sx = 100, sy = 55;
      const fn = (x) => 0.22 * (x - 3) ** 2 + 1.3;
      const pts = graphPoints(fn, 0, 5.5, sx, sy, ox, oy, 160);
      const area = graphPoints(fn, 1, 4.4, sx, sy, ox, oy, 120);
      const top = pathD(area);
      return svg([
        ...axes(75, oy, 700, 95),
        `<path d="${top} L ${ox + 4.4 * sx} ${oy} L ${ox + 1 * sx} ${oy} Z" class="shade"/>`,
        `<path d="${pathD(pts)}" class="blue"/>`,
        line(ox + 1 * sx, oy, ox + 1 * sx, oy - fn(1) * sy, 'grey'),
        line(ox + 4.4 * sx, oy, ox + 4.4 * sx, oy - fn(4.4) * sy, 'grey'),
        text(ox + 88, oy + 35, 'x=a', 'small'),
        text(ox + 420, oy + 35, 'x=b', 'small'),
        text(290, 190, '∫ₐᵇ f(x) dx = positive area', 'small'),
        `<rect x="700" y="115" width="190" height="170" fill="#fff" stroke="#d1d5db"/>`,
        `<path d="M720 255 C760 175, 820 165, 875 130" stroke="${blue}" stroke-width="3" fill="none"/>`,
        `<path d="M720 245 C760 235, 815 225, 875 205" stroke="${grey}" stroke-width="3" fill="none"/>`,
        `<path d="M742 225 C775 190, 830 178, 865 150 L865 205 C825 220, 775 232, 742 240 Z" class="shade"/>`,
        text(704, 315, 'area between curves', 'tiny'),
      ]);
    },
  },
  {
    file: 'numerical-solution-of-equations/iteration_graph_root_proof.png',
    draw() {
      const ox = 120, oy = 410, sx = 150, sy = 110;
      const f = (x) => x ** 3 + 2 * x;
      return svg([
        ...axes(80, oy, 850, 80),
        `<path d="${pathD(graphPoints(f, -0.1, 2.2, sx, sy, ox, oy, 150))}" class="blue"/>`,
        line(ox - 5, oy - sy, 850, oy - sy, 'grey'),
        line(ox + 0.35 * sx, 80, ox + 0.35 * sx, oy, 'grey dash'),
        line(ox + 0.55 * sx, 80, ox + 0.55 * sx, oy, 'grey dash'),
        `<rect x="${ox + 0.35 * sx}" y="80" width="${0.2 * sx}" height="${oy - 80}" class="shade"/>`,
        `<circle cx="${ox + 0.453 * sx}" cy="${oy - sy}" r="8" class="dot"/>`,
        text(520, 155, 'graph intersection = root', 'small'),
        text(575, oy - sy - 10, 'y=1', 'small'),
        text(460, 300, 'y=x³+2x', 'small'),
        text(290, 485, 'bracket [a,b]: f(a)<0, f(b)>0', 'small'),
      ]);
    },
  },
  {
    file: 'vectors/vectors_intersect_parallel_skew.png',
    draw() {
      return svg([
        text(100, 75, 'intersecting', 'small'),
        line(80, 210, 270, 90, 'blue'),
        line(90, 95, 260, 215, 'grey'),
        `<circle cx="176" cy="149" r="7" class="dot"/>`,
        text(190, 148, 'P', 'small'),
        text(410, 75, 'parallel', 'small'),
        arrow(385, 115, 585, 170),
        arrow(370, 210, 570, 265),
        text(420, 305, 'd₂ = k d₁', 'small'),
        text(715, 75, 'skew', 'small'),
        line(680, 135, 865, 185, 'blue'),
        line(710, 285, 855, 220, 'grey'),
        line(735, 140, 735, 275, 'grey dash'),
        text(675, 330, 'not parallel and no common point', 'small'),
      ]);
    },
  },
  {
    file: 'vectors/vectors_point_to_line_distance.png',
    draw() {
      return svg([
        line(130, 360, 820, 165, 'blue'),
        arrow(465, 265, 590, 230),
        `<circle cx="455" cy="268" r="7" class="dot"/>`,
        `<circle cx="455" cy="120" r="8" class="dot"/>`,
        line(455, 120, 455, 268, 'grey'),
        `<path d="M455 250 L475 245 L480 264" stroke="${ink}" stroke-width="2.2" fill="none"/>`,
        line(250, 320, 455, 268, 'grey dash'),
        arrow(250, 320, 455, 268, grey, 3),
        text(740, 165, 'line l: r=a+λd', 'small'),
        text(590, 224, 'd', 'small'),
        text(468, 118, 'P', 'small'),
        text(468, 272, 'Q foot of perpendicular', 'small'),
        text(318, 192, 'distance = |PQ|', 'small'),
        text(255, 350, 'projection onto line', 'small'),
        text(430, 505, 'PQ ⟂ d', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/modulus_argument.png',
    draw() {
      const ox = 470, oy = 310;
      const p = [330, 175];
      return svg([
        line(120, oy, 840, oy),
        line(ox, 470, ox, 70),
        text(825, oy + 35, 'Re z', 'small'),
        text(ox - 55, 80, 'Im z', 'small'),
        arrow(ox, oy, p[0], p[1]),
        line(p[0], p[1], p[0], oy, 'grey dash'),
        line(p[0], oy, ox, oy, 'grey dash'),
        `<circle cx="${p[0]}" cy="${p[1]}" r="8" class="dot"/>`,
        `<path d="M545 310 A75 75 0 0 0 418 253" class="blue-thin"/>`,
        text(p[0] - 45, p[1] - 15, 'z=x+iy', 'small'),
        text(380, 230, 'r=|z|', 'small'),
        text(505, 260, 'θ=arg z', 'small'),
        text(345, 345, 'x', 'small'),
        text(300, 250, 'y', 'small'),
        text(540, 105, 'quadrant decides argument', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/locus.png',
    draw() {
      const ox = 150, oy = 420, sx = 90, sy = 70;
      const xp = (x) => ox + x * sx;
      const yp = (y) => oy - y * sy;
      return svg([
        line(75, oy, 875, oy),
        line(ox, 485, ox, 70),
        text(820, oy + 34, 'Re z', 'small'),
        text(ox - 58, 82, 'Im z', 'small'),
        `<rect x="75" y="70" width="${xp(3) - 75}" height="415" class="shade"/>`,
        line(xp(3), 70, xp(3), 485, 'blue-thin'),
        `<circle cx="${xp(4)}" cy="${yp(3)}" r="${2 * sx}" fill="none" stroke="${blue}" stroke-width="4"/>`,
        line(xp(0.5), yp(-1.5), xp(5.6), yp(2.1), 'grey'),
        text(xp(3) + 10, 100, 'Re z ≤ 3', 'small'),
        text(xp(4.8), yp(5.2), '|z-(4+3i)|≤2', 'small'),
        text(xp(1.1), yp(-1.2), 'perpendicular bisector', 'small'),
        text(380, 505, 'shaded valid region', 'small'),
      ]);
    },
  },
  {
    file: 'complex-numbers/roots.png',
    draw() {
      const cx = 480, cy = 275, r = 160;
      const angles = [-35, 85, 205].map((d) => d * Math.PI / 180);
      return svg([
        line(150, cy, 820, cy),
        line(cx, 470, cx, 65),
        text(790, cy + 34, 'Re z', 'small'),
        text(cx - 55, 80, 'Im z', 'small'),
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#bfdbfe" stroke-width="5"/>`,
        ...angles.map((a, i) => {
          const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
          return `${arrow(cx, cy, x, y, blue, 3)}<circle cx="${x}" cy="${y}" r="8" class="dot"/>${text(x + 8, y - 8, `z${i}`, 'small')}`;
        }),
        `<path d="M545 275 A65 65 0 0 0 507 216" class="blue-thin"/>`,
        `<path d="M507 216 A65 65 0 0 0 421 243" class="blue-thin"/>`,
        text(585, 120, 'roots equally spaced', 'small'),
        text(600, 160, 'add 2π/n each time', 'small'),
        text(165, 500, 'zₖ = r^(1/n) cis((θ+2kπ)/n)', 'small'),
        text(585, 330, 'radius r^(1/n)', 'small'),
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
