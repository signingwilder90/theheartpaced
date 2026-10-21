import { el, liveStrip } from '../ui.js';

const POS = [
  { k: 'p1', name: 'Chamber paced', opts: [['O', 'None'], ['A', 'Atrium'], ['V', 'Ventricle'], ['D', 'Dual (A + V)']] },
  { k: 'p2', name: 'Chamber sensed', opts: [['O', 'None'], ['A', 'Atrium'], ['V', 'Ventricle'], ['D', 'Dual (A + V)']] },
  { k: 'p3', name: 'Response to sensing', opts: [['O', 'None'], ['T', 'Triggered'], ['I', 'Inhibited'], ['D', 'Dual (T + I)']] },
  { k: 'p4', name: 'Rate modulation', opts: [['O', 'None'], ['R', 'Rate modulation']] },
  { k: 'p5', name: 'Multisite pacing', opts: [['O', 'None'], ['A', 'Atrium'], ['V', 'Ventricle'], ['D', 'Dual (A + V)']] },
];
const SIM = ['AOO', 'VOO', 'DOO', 'AAI', 'VVI', 'DDD', 'VDD'];

const MEANING = {
  AOO: 'Asynchronous atrial pacing: the atrium is paced at a fixed rate and nothing is sensed.',
  VOO: 'Asynchronous ventricular pacing: the ventricle is paced at a fixed rate and nothing is sensed.',
  DOO: 'Asynchronous dual-chamber pacing: atrium, then ventricle, at a fixed rate and AV delay; nothing is sensed.',
  AAI: 'The atrium is paced and sensed; a sensed atrial event inhibits the atrial output.',
  VVI: 'The ventricle is paced and sensed; a sensed ventricular event inhibits the ventricular output.',
  DDD: 'Both chambers are paced and sensed. A sensed atrial event starts an AV delay and triggers a ventricular output if no ventricular event is sensed; sensed events inhibit outputs.',
  VDD: 'The ventricle is paced; both chambers are sensed. Sensed P waves are tracked, but the atrium is never paced.',
};

const code = s => s.p1 + s.p2 + s.p3;

export default {
  key: 'code', num: '01', part: 'I', title: 'The NBG code', short: 'Code', kicker: 'Naming a pacing mode',
  dek: 'A pacing mode is named by up to five letters. The first three describe the antibradycardia function: the chamber paced, the chamber sensed and the response to a sensed event. The fourth shows rate modulation and the fifth multisite pacing.',
  state: { p1: 'D', p2: 'D', p3: 'D', p4: 'O', p5: 'O' },
  controls: POS.map((p, i) => ({ t: 'seg', k: p.k, label: `${['I', 'II', 'III', 'IV', 'V'][i]} · ${p.name}`, opts: p.opts.map(([v]) => [v, v]) })),
  steps: [
    { set: { p1: 'V', p2: 'V', p3: 'I', p4: 'O', p5: 'O' }, note: '<b>VVI.</b> The ventricle is paced at the lower rate and inhibited by a sensed QRS. The P waves of the heart block march through and are ignored.' },
    { set: { p1: 'D', p2: 'D', p3: 'D' }, note: '<b>DDD.</b> Each sensed P wave starts an AV delay that ends in a ventricular pulse: the device restores AV synchrony across the block.' },
    { set: { p1: 'A', p2: 'A', p3: 'I' }, note: '<b>AAI in heart block.</b> The device senses the sinus P waves and stays silent; the P waves are blocked, and the ventricle beats only at its escape rate of 35 per minute.' },
    { set: { p1: 'V', p2: 'O', p3: 'O' }, note: '<b>VOO.</b> Pacing at 60 captures before the escape rhythm of 35 can fire, so nothing competes: this strip looks the same in VOO and VVI.' },
    { set: { p1: 'D', p2: 'D', p3: 'D', p4: 'R', p5: 'V' }, note: '<b>DDDRV.</b> A dual-chamber, rate-modulated, biventricular (CRT) pacemaker. The strip shows the DDD part.' },
  ],
  prose: `
<h3>The five positions</h3>
<p>The North American Society of Pacing and Electrophysiology (NASPE, now the Heart Rhythm Society) and the British Pacing and Electrophysiology Group (BPEG) publish the generic (NBG) code<span class="cite" data-ref="nbg2002"></span>. The first three positions name the chamber paced, the chamber sensed and the response to sensing. In the response position, <b>I</b> means a sensed event inhibits an output, <b>T</b> means it triggers one and <b>D</b> means both<span class="cite" data-ref="nbg2002,lecture"></span>.</p>
<p>The 2002 revision narrowed the last two positions. Position IV now shows only whether rate modulation is present (<b>R</b>) or absent (<b>O</b>). Position V shows only multisite pacing: in both atria, in both ventricles, or at more than one site in one chamber<span class="cite" data-ref="nbg2002"></span>. DDDR is dual-chamber rate-adaptive pacing without multisite pacing; DDDOV is dual-chamber pacing with multisite (biventricular) pacing and without rate modulation<span class="cite" data-ref="nbg2002"></span>.</p>
<p class="note">The NBG table in the lecture is the earlier version, in which position IV named programmability (P, M, C, R) and position V antitachycardia functions (P, S, D). Defibrillator functions are described by a separate NASPE/BPEG defibrillator code<span class="cite" data-ref="sj2018"></span>; in the revised pacemaker code, position V no longer describes shocks.</p>
<h3>Common modes</h3>
<ul>
<li><b>AOO, VOO, DOO</b>: asynchronous pacing at a fixed rate with no sensing<span class="cite" data-ref="lecture"></span>.</li>
<li><b>AAI, VVI</b>: one chamber paced and sensed; sensing inhibits pacing<span class="cite" data-ref="lecture"></span>.</li>
<li><b>DDD</b>: both chambers paced and sensed, with triggered and inhibited responses<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<p>The letters S (single chamber, A or V) appear in positions I and II on manufacturers' labels only<span class="cite" data-ref="lecture"></span>.</p>
<h3>Reading a strip</h3>
<p>A rhythm strip does not always identify the mode. A ventricular-paced strip with no intrinsic beats can be VOO or VVI; an atrial-paced strip with intrinsic conduction can be AAI or DDD; a strip with every beat AV-paced can be DDD or DOO. The mode shows only when the device meets an intrinsic beat<span class="cite" data-ref="lecture"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>Position I: chamber paced. II: chamber sensed. III: response to sensing.</li>
<li>Position IV is rate modulation (R); position V is multisite pacing.</li>
<li>An O in position II means the device senses nothing and paces asynchronously.</li>
</ol>`,
  quiz: [
    { q: 'What does the fourth letter of <b>DDDR</b> mean in the revised NBG code?', a: ['Remote monitoring', 'Rate modulation', 'Reprogrammable'], c: 1, why: 'Since 2002, position IV shows only whether rate modulation is present (R) or absent (O).<span class="cite" data-ref="nbg2002"></span>' },
    { q: 'A pacemaker-dependent patient has AAI pacing and new complete heart block. What happens?', a: ['The device switches to DDD', 'Nothing the device does reaches the ventricle; only an escape rhythm (if any) remains', 'Ventricular pacing continues at the lower rate'], c: 1, why: 'An AAI device paces and senses only the atrium, and in complete heart block no P wave, sensed or paced, conducts. The figure’s patient has complete heart block: choose A, A, I to see it.' },
  ],
  figClass: 'two',
  fig(host, st) {
    const top = el('div', { class: 'card' });
    host.append(top);
    const ls = liveStrip(host, { mode: 'DDD', lrl: 60, url: 120, sav: 150 }, { sinus: 72, av: 'chb', escape: 35 }, {
      title: 'ECG II · MARKERS · SINUS 72, COMPLETE HEART BLOCK, ESCAPE 35',
      sub: () => SIM.includes(code(st)) ? `${code(st)}${st.p4 === 'R' ? 'R' : ''} · LRL 60` : 'mode not drawn',
    });
    const render = () => {
      const c = code(st);
      top.textContent = '';
      const big = el('div', { style: 'display:flex;gap:10px;justify-content:center;padding:18px 12px 6px;flex-wrap:wrap' });
      POS.forEach((p, i) => {
        const v = st[p.k];
        const lab = p.opts.find(o => o[0] === v)[1];
        big.append(el('div', { style: 'text-align:center;min-width:86px;max-width:120px' },
          el('div', { style: `font:600 0.6rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)` }, ['I', 'II', 'III', 'IV', 'V'][i]),
          el('div', { style: `font:500 3.2rem/1 var(--mono);color:${i < 3 ? 'var(--accent)' : 'var(--ink-2)'}` }, v),
          el('div', { style: 'font:600 0.66rem/1.3 var(--sans);color:var(--ink-2);text-transform:uppercase;letter-spacing:.06em;margin-top:6px' }, p.name),
          el('div', { style: 'font:400 0.84rem/1.3 var(--sans);margin-top:2px' }, lab)));
      });
      top.append(big);
      const name = c + (st.p4 === 'R' ? 'R' : (st.p5 !== 'O' ? 'O' : '')) + (st.p5 !== 'O' ? st.p5 : '');
      const valid = !(c[1] === 'O' && c[2] !== 'O') && !(c[1] !== 'O' && c[2] === 'O') && !(c[0] === 'O' && c[2] === 'T');
      const msg = !valid ? 'This combination is not a working mode: a device that senses nothing cannot inhibit or trigger, and a device that senses must respond.'
        : MEANING[c] || 'This mode exists but is not drawn by the guide’s model, which draws AOO, VOO, DOO, AAI, VVI, DDD and VDD.';
      top.append(el('p', { style: 'text-align:center;font:500 1.5rem var(--mono);margin:10px 0 2px' }, name),
        el('p', { style: 'max-width:58ch;margin:4px auto 16px;text-align:center;font:400 0.95rem/1.45 var(--sans);color:var(--ink-2);padding:0 14px' }, msg));
      ls.sim.set({ mode: SIM.includes(c) ? c : 'OOO', rr: false });
    };
    render();
    return {
      update: render,
      tick: dt => ls.tick(dt),
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [
        { k: 'Ventricular rate', v: ls.sim.vRate(), u: '/min' },
        { k: 'Atrial paced', v: ls.sim.pct('AP'), u: '%' },
        { k: 'Ventricular paced', v: ls.sim.pct('VP'), u: '%' },
      ],
      live: () => {
        const c = code(st);
        if (c === 'AAI') return '<b>AAI in complete heart block.</b> The sinus rate (72) is above the lower rate, so the device only senses (AS) and never paces. Sensed or paced, the P waves are blocked: the ventricle beats only at its escape rate of 35.';
        if (c === 'AOO') return '<b>AOO in complete heart block.</b> Atrial pulses at 60 compete with the sinus rhythm; whether they capture or not, the P waves are blocked and the ventricle beats only at its escape rate of 35.';
        if (c === 'VOO' || c === 'DOO') return '<b>Asynchronous pacing.</b> Pacing at 60 captures before the escape rhythm of 35 can fire, so no intrinsic beat competes and the strip cannot tell VOO from VVI. Asynchronous pacing competes only when the intrinsic rate approaches the paced rate (chapter 02).';
        if (c === 'DDD' || c === 'VDD') return '<b>Tracking.</b> Each sensed P wave (AS) starts the AV delay, and the ventricle is paced (VP) after it: AV synchrony across the block.';
        if (c === 'VVI') return '<b>VVI.</b> The ventricle is paced at the lower rate, regardless of the P waves.';
        return SIM.includes(c) ? '' : 'The strip shows no pacing for this code.';
      },
    };
  },
};
