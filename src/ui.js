// Shared figure pieces: DOM helpers, the flowchart, the torso schematic and the live strip.
import { Sim } from './pace.js';
import { Strip } from './strip.js';

export const NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'html') e.innerHTML = v;
    else if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const k of kids) if (k != null) e.append(k);
  return e;
}

export function s(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}

// Multi-line SVG text centred at (x, y).
export function stext(parent, x, y, lines, attrs = {}) {
  const t = s('text', { x, y, 'text-anchor': 'middle', ...attrs }, parent);
  const arr = Array.isArray(lines) ? lines : [lines];
  const lh = attrs.lh || 14;
  arr.forEach((ln, i) => s('tspan', { x, dy: i === 0 ? -(arr.length - 1) * lh / 2 + 4 : lh, text: ln }, t));
  return t;
}

// ------------------------------------------------------------------ flowchart
// nodes: {id, x, y, w, h, text: [lines], dec: bool, tone: 'red'|'green'|'amber', badge}
// edges: {id, d: 'M..', label, lx, ly}
export function flowchart(host, { w, h, nodes, edges, cap }) {
  const card = el('div', { class: 'card' });
  if (cap) card.append(el('span', { class: 'cap' }, cap));
  const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, class: 'flow', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  const defs = s('defs', {}, svg);
  const uid = 'f' + Math.random().toString(36).slice(2, 7);
  for (const [id, col] of [['arr', 'var(--rule)'], ['arr-on', 'var(--accent)']]) {
    const mk = s('marker', { id: `${uid}-${id}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs);
    s('path', { d: 'M0,0 L10,5 L0,10 z', style: `fill:${col}` }, mk);
  }
  const E = {}, N = {};
  for (const e of edges) {
    const g = s('g', { class: 'edge' }, svg);
    s('path', { d: e.d, 'marker-end': `url(#${uid}-arr)` }, g);
    if (e.label) s('text', { x: e.lx, y: e.ly, text: e.label, 'text-anchor': e.anchor || 'middle' }, g);
    E[e.id] = g;
  }
  for (const n of nodes) {
    const g = s('g', { class: `node${n.dec ? ' dec' : ''}${n.tone ? ' ' + n.tone : ''}` }, svg);
    if (n.dec) {
      const { x, y, w: nw, h: nh } = n;
      s('polygon', { points: `${x},${y - nh / 2} ${x + nw / 2},${y} ${x},${y + nh / 2} ${x - nw / 2},${y}` }, g);
    } else s('rect', { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: 6 }, g);
    stext(g, n.x, n.y, n.text, { lh: 14 });
    if (n.badge) {
      const b = s('g', { class: 'badge' }, g);
      const bx = n.x + n.w / 2 - 9, by = n.y - n.h / 2 + 9;
      s('circle', { cx: bx, cy: by, r: 7 }, b);
      s('text', { x: bx, y: by + 3, 'text-anchor': 'middle', text: n.badge }, b);
    }
    N[n.id] = g;
  }
  card.append(svg);
  host.append(card);
  return {
    card, svg, N, E,
    light(nodeIds, edgeIds) {
      for (const [k, g] of Object.entries(N)) g.classList.toggle('on', nodeIds.includes(k));
      for (const [k, g] of Object.entries(E)) {
        const on = edgeIds.includes(k);
        g.classList.toggle('on', on);
        g.querySelector('path').setAttribute('marker-end', `url(#${uid}-${on ? 'arr-on' : 'arr'})`);
      }
    },
  };
}

// ------------------------------------------------------------------ torso
// Front view in centimetres: x 0..60 (patient's right on the viewer's left), y -16..104.
export const BODY = {
  notch: [30, 12], umb: [30, 50], xiphoid: [30, 36],
  gen: { lpec: [40, 17.5], rpec: [20, 17.5], sicd: [47.5, 35], abd: [38, 56], evicd: [47, 31] },
  heart: [33, 30],
};

export function torso(host, { cap, view = '0 -16 60 120' } = {}) {
  const card = el('div', { class: 'card' });
  if (cap) card.append(el('span', { class: 'cap' }, cap));
  const svg = s('svg', { viewBox: view, class: 'body', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  const skin = 'M24,6 C24,2 22,-1 22,-6 A8,9 0 1 1 38,-6 C38,-1 36,2 36,6 C44,7 52,9 55,14 C57,24 56,40 53,46 C52,52 50,56 49,62 C51,66 51,70 50,74 L48,104 L33,104 L31,76 L29,76 L27,104 L12,104 L10,74 C9,70 9,66 11,62 C10,56 8,52 7,46 C4,40 3,24 5,14 C8,9 16,7 24,6 Z';
  s('path', { d: skin, class: 'skin' }, svg);
  // clavicles, sternum, ribs
  s('path', { d: 'M30,12 C24,11 18,10 11,12 M30,12 C36,11 42,10 49,12', class: 'bone' }, svg);
  s('path', { d: 'M30,12 L30,36', class: 'bone', 'stroke-width': 1.2 }, svg);
  for (let i = 0; i < 7; i++) {
    const y = 15 + i * 3.6;
    s('path', { d: `M30,${y} C24,${y + 1} 15,${y + 2} 10.5,${y + 4 + i * 0.6} M30,${y} C36,${y + 1} 45,${y + 2} 49.5,${y + 4 + i * 0.6}`, class: 'bone' }, svg);
  }
  s('path', { d: 'M27,22 C24,24 25,33 29,36 C33,39 38,37 40,33 C42,28 38,22 33,22 C31,21 29,21 27,22 Z', class: 'heart' }, svg);
  // umbilicus line
  s('line', { x1: 6, y1: 50, x2: 54, y2: 50, class: 'umb' }, svg);
  s('circle', { cx: 30, cy: 50, r: 0.6, fill: 'var(--ink-3)' }, svg);
  s('text', { x: 54, y: 49, class: 'lbl', 'text-anchor': 'end', text: 'umbilicus' }, svg);
  s('text', { x: 3, y: 10, class: 'lbl b', text: 'R' }, svg);
  s('text', { x: 57, y: 10, class: 'lbl b', 'text-anchor': 'end', text: 'L' }, svg);
  card.append(svg);
  host.append(card);
  const layer = s('g', {}, svg);
  return { card, svg, layer };
}

// Draw a device system into an SVG group. Returns the generator and lead geometry.
export function drawDevice(g, kind) {
  const G = BODY.gen, lead = [], out = { gen: null, leads: lead };
  const P = (pts, cls = 'lead') => { s('path', { d: 'M' + pts.map(p => p.join(',')).join(' L'), class: cls }, g); lead.push(...pts); };
  const can = (x, y, w = 5.5, h = 4.6, r = 1.6) => { s('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: r, class: 'gen' }, g); out.gen = [x, y]; };
  const vein = (x, y) => [[x, y], [33, 13], [26.5, 14.5], [26, 18]];
  if (kind === 'none') return out;
  if (kind === 'sicd') {
    can(G.sicd[0], G.sicd[1], 4.4, 6.2, 2);
    P([G.sicd, [40, 38.5], [31.6, 38.5], [31.6, 30]]);
    P([[31.6, 30], [31.6, 19]], 'coil');
    P([[31.6, 19], [31.6, 16.5]]);
    return out;
  }
  if (kind === 'evicd') {
    can(G.evicd[0], G.evicd[1], 4.4, 6.2, 2);
    P([G.evicd, [40, 39], [30.6, 39], [30.6, 31]]);
    P([[30.6, 31], [30.6, 20]], 'coil');
    P([[30.6, 20], [30.6, 17]]);
    return out;
  }
  if (kind === 'micra' || kind === 'aveirvr') {
    s('rect', { x: 33.3, y: 30.5, width: 2.2, height: 4.2, rx: 1, class: 'gen', transform: 'rotate(-35 34.4 32.6)' }, g);
    out.gen = [34.4, 32.6];
    return out;
  }
  if (kind === 'aveirdr') {
    s('rect', { x: 33.3, y: 30.5, width: 2.2, height: 4.2, rx: 1, class: 'gen', transform: 'rotate(-35 34.4 32.6)' }, g);
    s('rect', { x: 25.6, y: 22.2, width: 2, height: 3.6, rx: 1, class: 'gen', transform: 'rotate(20 26.6 24)' }, g);
    out.gen = [34.4, 32.6];
    return out;
  }
  const at = kind.startsWith('r') ? G.rpec : kind === 'abd' ? G.abd : G.lpec;
  const base = kind.startsWith('r') ? [[at[0], at[1]], [26, 14], [26, 18]] : kind === 'abd' ? [[at[0], at[1]], [37, 44], [35, 37]] : vein(at[0], at[1]);
  can(at[0], at[1]);
  if (kind === 'abd') { P([...base, [36, 33]]); return out; }  // epicardial lead to the ventricle
  const ra = [...base, [26, 22], [27, 24.5]];
  const rv = [...base, [26, 25], [29, 31], [35, 34]];
  const cs = [...base, [26, 25], [29, 28.5], [36, 28], [39.5, 31]];
  if (/pm1|icd1|lpm1|ricd1|rpm1/.test(kind)) P(rv);
  if (/pm2|icd2|crt/.test(kind)) { P(ra); P(rv); }
  if (/crt/.test(kind)) P(cs);
  if (/icd|crtd/.test(kind)) {
    // shock coil in the right ventricle (and a proximal coil in the SVC on some leads)
    s('path', { d: 'M27.2,26.4 L29,31 L33.5,33.4', class: 'coil' }, g);
  }
  return out;
}

export function distToPath(p, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[i + 1] || pts[i];
    best = Math.min(best, distSeg(p, a, b));
  }
  return best;
}
export function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
// shortest distance between segment ab and a polyline
export function segToPath(a, b, pts) {
  let best = Infinity;
  for (let i = 0; i <= 20; i++) {
    const p = [a[0] + (b[0] - a[0]) * i / 20, a[1] + (b[1] - a[1]) * i / 20];
    best = Math.min(best, distToPath(p, pts));
  }
  return best;
}

// ------------------------------------------------------------------ live strip
// A Sim drawn by a Strip; tick() advances it in real time.
export function liveStrip(host, dev, pat, opts = {}) {
  const sim = new Sim(dev, pat, opts.seed || 7);
  const strip = new Strip(host, sim, opts);
  sim.advance(opts.prime ?? strip.win);
  strip.draw();
  return {
    sim, strip,
    tick(dt) { sim.advance(sim.t + dt); strip.draw(); },
    destroy() { strip.destroy(); },
  };
}
