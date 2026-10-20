import { el, s, liveStrip } from '../ui.js';

const behavior = st => {
  const pp = 60000 / st.arate, uri = 60000 / st.url, tarp = st.sav + st.pvarp;
  if (pp >= uri) return { k: '1:1 tracking', why: 'The P-P interval is longer than the upper rate interval, so every P wave is tracked.' };
  if (pp > tarp && uri > tarp) return { k: 'Pacemaker Wenckebach', why: 'The atrial rate is above the upper rate but below the TARP rate. Each tracked beat waits for the upper rate interval, so the AV interval lengthens until a P wave falls in PVARP and is not tracked.' };
  return { k: '2:1 block', why: 'The P-P interval is shorter than the TARP, so every other P wave falls in PVARP and is not tracked.' };
};

export default {
  key: 'timing', num: '03', part: 'I', title: 'Timing cycles and upper rate behavior', short: 'Timing', kicker: 'AV delay, PVARP, TARP and the upper rate',
  dek: 'A dual-chamber pacemaker tracks sensed P waves up to its maximum tracking rate. Above that rate it lengthens the AV delay (pacemaker Wenckebach); above the rate set by the total atrial refractory period it tracks only every other P wave (2:1 block).',
  state: { arate: 100, url: 120, sav: 150, pvarp: 250 },
  controls: [
    { t: 'range', k: 'arate', label: 'Sinus (atrial) rate', min: 60, max: 200, step: 5, fmt: v => `${v} /min` },
    { t: 'range', k: 'url', label: 'Maximum tracking rate', min: 100, max: 160, step: 5, fmt: v => `${v} /min` },
    { t: 'range', k: 'sav', label: 'Sensed AV delay', min: 100, max: 250, step: 10, fmt: v => `${v} ms` },
    { t: 'range', k: 'pvarp', label: 'PVARP', min: 200, max: 400, step: 10, fmt: v => `${v} ms` },
  ],
  steps: [
    { set: { arate: 100, url: 120, sav: 150, pvarp: 250 }, note: '<b>1:1 tracking.</b> At 100 per minute every P wave is followed by a paced ventricular beat.' },
    { set: { arate: 135 }, note: '<b>Wenckebach.</b> At 135 the AV interval stretches to respect the upper rate of 120, until a P wave falls in PVARP (AR) and is skipped.', ms: 9000 },
    { set: { arate: 170 }, note: '<b>2:1 block.</b> The TARP is 400 ms (150 per minute). At 170 every other P wave falls in PVARP.', ms: 8000 },
    { set: { arate: 135, pvarp: 350 }, note: '<b>A long PVARP.</b> TARP 500 ms equals the upper rate interval, so the Wenckebach window disappears and block is 2:1 at once.', ms: 8000 },
  ],
  prose: `
<h3>The intervals</h3>
<ul>
<li><b>AV interval.</b> The paced AV delay (PAV) follows a paced atrial event; the sensed AV delay (SAV) follows a sensed one<span class="cite" data-ref="ramsdale2012"></span>.</li>
<li><b>VA interval</b> (atrial escape interval): from a paced or sensed ventricular event to the next atrial pulse<span class="cite" data-ref="ramsdale2012"></span>.</li>
<li><b>Ventricular refractory period (VRP)</b>: after a ventricular event, to prevent inhibition by signals such as T waves<span class="cite" data-ref="ramsdale2012"></span>.</li>
<li><b>Post-ventricular atrial refractory period (PVARP)</b>: after a ventricular event, to prevent tracking of retrograde P waves and so pacemaker-mediated tachycardia. A long PVARP limits the upper rate<span class="cite" data-ref="ramsdale2012"></span>.</li>
<li><b>Total atrial refractory period (TARP)</b> = AV interval + PVARP<span class="cite" data-ref="ramsdale2012"></span>.</li>
<li><b>Blanking periods</b> follow each output so the device does not sense its own pulse in the other chamber; a signal in the cross-talk window after an atrial pulse produces a safety ventricular pulse rather than inhibition<span class="cite" data-ref="ramsdale2012"></span>.</li>
</ul>
<h3>Upper rate behavior</h3>
<p>When the intrinsic atrial rate exceeds the maximum tracking rate (MTR), the device cannot follow every P wave. If the atrial rate exceeds both the MTR and the rate set by the TARP, multiblock (2:1) can occur<span class="cite" data-ref="lecture"></span>. Between the two rates, pacemaker Wenckebach (pseudo-Wenckebach) appears: the AV delay lengthens beat by beat until a P wave falls in the PVARP and is not followed by a ventricular event<span class="cite" data-ref="lecture"></span>.</p>
<p>The 2:1 rate is 60,000 ÷ TARP. With an SAV of 150 ms and a PVARP of 250 ms the TARP is 400 ms, and 2:1 block begins at 150 per minute. If the TARP is as long as the upper rate interval, there is no Wenckebach range.</p>
<p class="note">In the model the device senses a P wave 40 ms after its onset, so the sensed AV delay counts from that point, as it does on a marker channel.</p>
<h3>Key points</h3>
<ol class="steps">
<li>TARP = AV delay + PVARP; the 2:1 point is 60,000 ÷ TARP.</li>
<li>Between the MTR and the TARP rate: pacemaker Wenckebach. Above the TARP rate: 2:1 block.</li>
<li>A sudden halving of the paced rate during a sinus tachycardia is upper rate behavior, not device failure.</li>
</ol>`,
  quiz: [
    { q: 'SAV 150 ms and PVARP 300 ms. Above what atrial rate does 2:1 block begin?', a: ['120 /min', '133 /min', '150 /min'], c: 1, why: 'TARP = 150 + 300 = 450 ms; 60,000 ÷ 450 ≈ 133 per minute.' },
    { q: 'On the strip, the AV interval lengthens beat by beat and then a P wave is marked AR with no ventricular event. What is this?', a: ['Loss of capture', 'Pacemaker Wenckebach', 'Oversensing'], c: 1, why: 'The P wave fell in the PVARP after the AV delay had stretched to keep the ventricular rate at or below the upper rate.<span class="cite" data-ref="lecture"></span>' },
  ],
  figClass: 'two',
  fig(host, st) {
    const card = el('div', { class: 'card' });
    card.append(el('span', { class: 'cap' }, 'One tracked cycle · ms after the sensed P wave'));
    host.append(card);
    const ls = liveStrip(host, { mode: 'DDD', lrl: 60, url: st.url, sav: st.sav, pvarp: st.pvarp }, { sinus: st.arate, av: 'chb', escape: 0 }, {
      title: 'ECG II · MARKERS · COMPLETE HEART BLOCK',
      sub: () => `DDD 60/${st.url} · SAV ${st.sav} · PVARP ${st.pvarp}`,
    });
    const svg = s('svg', { viewBox: '0 0 760 250', preserveAspectRatio: 'xMidYMid meet' });
    card.append(svg);
    const draw = () => {
      svg.textContent = '';
      const X = ms => 60 + ms * 0.52, pp = 60000 / st.arate, uri = 60000 / st.url, tarp = st.sav + st.pvarp;
      const row = (y, a, b, label, color, op = 0.25) => {
        s('rect', { x: X(a), y: y - 11, width: Math.max(1, X(b) - X(a)), height: 22, rx: 3, fill: color, 'fill-opacity': op, stroke: color }, svg);
        s('text', { x: X(a) + 6, y: y + 4, class: 'svgtext', 'font-size': 12, 'font-weight': 600, text: label }, svg);
      };
      // axis
      s('line', { x1: X(0), y1: 210, x2: X(1300), y2: 210, stroke: 'var(--rule)' }, svg);
      for (let ms = 0; ms <= 1300; ms += 100) {
        s('line', { x1: X(ms), y1: 206, x2: X(ms), y2: 214, stroke: 'var(--rule)' }, svg);
        if (ms % 200 === 0) s('text', { x: X(ms), y: 230, 'text-anchor': 'middle', class: 'svgtext', 'font-size': 11, fill: 'var(--ink-3)', text: ms }, svg);
      }
      s('line', { x1: X(st.sav), y1: 30, x2: X(st.sav), y2: 200, stroke: 'var(--pace)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
      row(60, 0, st.sav, `SAV ${st.sav}`, 'var(--accent)');
      row(60, st.sav, tarp, `PVARP ${st.pvarp}`, 'var(--ink-3)');
      row(100, 0, tarp, `TARP ${tarp} ms → 2:1 at ${Math.round(60000 / tarp)}/min`, 'var(--warn)', 0.18);
      row(140, st.sav, st.sav + uri, `upper rate interval ${Math.round(uri)} ms (${st.url}/min)`, 'var(--flag)', 0.12);
      // the sensed P wave and the next one
      for (const k of [0, 1]) {
        const t = k * pp, inP = k === 1 && t < tarp, waits = k === 1 && !inP && t < uri;
        const col = k === 0 ? 'var(--accent)' : inP ? 'var(--ink-3)' : waits ? 'var(--warn)' : 'var(--ok)';
        const lab = k === 0 ? 'P (AS)' : inP ? 'next P in PVARP: not tracked' : waits ? `next P: VP waits ${Math.round(uri - t)} ms` : 'next P: tracked';
        s('line', { x1: X(t), y1: 172, x2: X(t), y2: 200, stroke: col, 'stroke-width': 3 }, svg);
        s('text', { x: X(t), y: 164, 'text-anchor': k === 0 ? 'middle' : 'start', class: 'svgtext', 'font-size': 11, 'font-weight': 600, fill: col, text: lab }, svg);
      }
      s('text', { x: X(st.sav), y: 24, 'text-anchor': 'middle', class: 'svgtext', 'font-size': 11, 'font-weight': 600, text: 'VP' }, svg);
      s('text', { x: 740, y: 24, 'text-anchor': 'end', class: 'svgtext', 'font-size': 12, 'font-weight': 600, fill: 'var(--accent)', text: `P-P ${Math.round(pp)} ms · ${behavior(st).k}` }, svg);
    };
    draw();
    return {
      update() { ls.sim.set({ url: st.url, sav: st.sav, pvarp: st.pvarp }, { sinus: st.arate }); draw(); },
      tick: dt => ls.tick(dt),
      destroy: () => ls.destroy(),
      readouts: () => {
        const tarp = st.sav + st.pvarp;
        return [
          { k: 'Atrial rate', v: st.arate, u: '/min' },
          { k: 'Ventricular rate', v: ls.sim.vRate(8000), u: '/min' },
          { k: 'Behavior', v: behavior(st).k, f: behavior(st).k === '1:1 tracking' ? 'ok' : 'warn' },
          { k: 'TARP', v: tarp, u: 'ms' },
          { k: '2:1 rate', v: Math.round(60000 / tarp), u: '/min' },
          { k: 'Upper rate', v: st.url, u: '/min' },
        ];
      },
      live: () => `<b>${behavior(st).k}.</b> ${behavior(st).why}`,
    };
  },
};
