import { el, s, torso, drawDevice, liveStrip } from '../ui.js';

const TIP = [31.6, 16.5], RING = [31.6, 31.5], CAN = [47.5, 35];
const VEC = { primary: [RING, CAN], secondary: [TIP, CAN], alternate: [TIP, RING] };
const MAG = { off: null, header: [46.4, 31.2], lower: [47.6, 38.4], sternum: [31.6, 26] };

export default {
  key: 'sicd', num: '14', part: 'V', title: 'The subcutaneous ICD', short: 'S-ICD', kicker: 'Sensing vectors, magnet and EMI',
  dek: 'The S-ICD senses and shocks through one subcutaneous electrode and a can in the left mid-axillary line. It has no bradycardia or antitachycardia pacing, and its wide sensing field makes it more susceptible to interference than a transvenous ICD.',
  state: { vec: 'primary', mag: 'off', deep: false },
  controls: [
    { t: 'seg', k: 'vec', label: 'Sensing vector', opts: [['primary', 'Primary'], ['secondary', 'Secondary'], ['alternate', 'Alternate']] },
    { t: 'seg', k: 'mag', label: 'Magnet', opts: [['off', 'Off'], ['header', 'Over the header'], ['lower', 'Over the lower edge'], ['sternum', 'Over the sternum']] },
    { t: 'check', k: 'deep', label: 'Deep implant (or tones disabled / previous MRI)' },
    { t: 'act', label: 'Events', items: [['emi', 'Monopolar burst, 10 s'], ['vf', 'Ventricular fibrillation'], ['shock', 'External shock', 'danger']] },
  ],
  steps: [
    { set: { mag: 'off' }, act: 'emi', note: '<b>No magnet.</b> Ten seconds of cautery noise is counted as VF and shocked.', ms: 14000 },
    { set: { mag: 'lower' }, note: '<b>Magnet over the lower edge.</b> The device beeps with each R wave for 60 s, and therapy is suspended.', ms: 7000 },
    { set: { mag: 'sternum' }, note: '<b>Magnet in the wrong place.</b> No tones and no suspension.', ms: 6000 },
  ],
  prose: `
<h3>The system</h3>
<p>The Boston Scientific EMBLEM S-ICD has a pulse generator and a single subcutaneous electrode. It senses, detects and treats malignant ventricular tachyarrhythmias with a synchronized biphasic 80-J shock in patients who need no bradycardia or antitachycardia pacing. After a shock it can pace transiently at 50 per minute for up to 30 s, but post-shock pacing can be programmed on or off<span class="cite" data-ref="bsc2019"></span>. It senses along one of three vectors between the two electrode sensing points and the can.</p>
<h3>Magnet</h3>
<p>A standard doughnut magnet over the header or the lower edge of the generator, usually at the 6th intercostal space in the left mid-axillary line, suspends therapy. Correct placement is signalled by a beep with each R wave for 60 s, an expected but not guaranteed response. A deep implant, previous exposure to a strong magnetic field or disabled tones can prevent the beeps; the lack of a tone may mean the magnet is not interacting, or only that the tone is defective. Removing the magnet restores detection and therapy<span class="cite" data-ref="bsc2019"></span>. On the bedside card: tones up to 60 s, then they stop and therapy stays inhibited<span class="cite" data-ref="card"></span>.</p>
<p>Because of its wide sensing region, its susceptibility to EMI and the uncertainty of magnet placement, the authors of the Boston Scientific review prefer to program the S-ICD to Therapy Off for surgery, with an external defibrillator available<span class="cite" data-ref="bsc2019"></span>. Its EMI zone reaches the groin<span class="cite" data-ref="card"></span>.</p>
<h3>Programming and reports</h3>
<ul>
<li>The S-ICD needs its own programmer (Model 3200, a tablet) and telemetry wand (Model 3203), not the Zoom Latitude used for transvenous devices. The programmer is MR unsafe, and only the approved printer works with it<span class="cite" data-ref="bsc2019"></span>.</li>
<li>Modes: Shelf (storage), Therapy On, Therapy Off and MRI Protection<span class="cite" data-ref="bsc2019"></span>.</li>
<li>Two programmable zones: a shock zone (170–250 per minute) and a conditional shock zone (170–240) with enhanced discrimination<span class="cite" data-ref="bsc2019"></span>.</li>
<li>The electrode impedance is checked weekly; below 400 Ω is “OK”. Battery life depends on shocks: about 7.3 years with 3 full charges a year; after ERI, about 3 months remain<span class="cite" data-ref="bsc2019"></span>.</li>
</ul>
<p class="note">The lecture says the S-ICD needs a different programmer wand “for Medtronic”; in the Boston Scientific review it is the EMBLEM S-ICD that needs a separate programmer and wand. Medtronic’s extravascular ICD (EV-ICD) is a different device: on the bedside card, its magnet is ineffective during a wand session and its EMI map covers the left axilla, lateral chest, sternum and subxiphoid region<span class="cite" data-ref="lecture,bsc2019,card"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>No pacing support: a pacing-dependent patient needs another device and its own plan.</li>
<li>Magnet over the header or lower edge; listen for a beep with each R wave.</li>
<li>Programming Therapy Off is more reliable than a magnet; pads on.</li>
</ol>`,
  quiz: [
    { q: 'Where is the magnet placed on an S-ICD?', a: ['Over the sternum', 'Over the header or lower edge of the generator', 'Anywhere on the left chest'], c: 1, why: 'Over the header or the lower edge of the pulse generator, usually in the left mid-axillary line.<span class="cite" data-ref="bsc2019"></span>' },
    { q: 'What pacing does an S-ICD provide?', a: ['Bradycardia and ATP', 'None, except optional post-shock pacing at 50 per minute for up to 30 s', 'VVI at 40'], c: 1, why: 'It lacks bradycardia and antitachycardia pacing.<span class="cite" data-ref="bsc2019"></span>' },
  ],
  figClass: 'side',
  fig(host, st) {
    const T = torso(host, { cap: 'S-ICD · sensing vectors and magnet' });
    const info = el('div', { class: 'card info' });
    host.append(info);
    const ls = liveStrip(host, { mode: 'OOO', icd: true, tachy: true, suspend: false, vSens: 1.5 }, { sinus: 72, av: 'normal' }, {
      title: 'ECG II · S-ICD MARKERS', sub: () => (ls.sim.dev.suspend ? 'therapy SUSPENDED (magnet)' : 'Therapy On'),
    });
    let tOn = null;
    const active = () => st.mag === 'header' || st.mag === 'lower';
    const render = () => {
      T.layer.textContent = '';
      const g = s('g', {}, T.layer);
      for (const [k, [a, b]] of Object.entries(VEC)) {
        s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: `vec${k === st.vec ? ' on' : ''}` }, g);
      }
      drawDevice(g, 'sicd');
      s('circle', { cx: TIP[0], cy: TIP[1], r: 0.9, fill: 'var(--ink)' }, g);
      s('circle', { cx: RING[0], cy: RING[1], r: 0.9, fill: 'var(--ink)' }, g);
      s('text', { x: TIP[0] - 1.6, y: TIP[1] + 0.8, 'text-anchor': 'end', class: 'lbl', text: 'distal tip' }, g);
      s('text', { x: RING[0] - 1.6, y: RING[1] + 0.8, 'text-anchor': 'end', class: 'lbl', text: 'proximal' }, g);
      s('text', { x: CAN[0], y: CAN[1] + 6, 'text-anchor': 'middle', class: 'lbl', text: 'can' }, g);
      if (MAG[st.mag]) { const [x, y] = MAG[st.mag]; s('circle', { cx: x, cy: y, r: 3.4, class: 'magnet' }, g); s('circle', { cx: x, cy: y, r: 1.2, class: 'magnet' }, g); }
      const suspended = active() && !st.deep;
      const toneLeft = tOn !== null && suspended ? Math.max(0, 60 - (ls.sim.t - tOn) / 1000) : 0;
      info.innerHTML = `<div class="verdict ${suspended ? 'low' : st.mag === 'off' ? '' : 'high'}">${st.mag === 'off' ? 'No magnet' : suspended ? 'Therapy suspended' : st.deep && active() ? 'No tones: placement uncertain' : 'Magnet not over the generator'}</div>
        <p>${suspended ? `Beeping with each R wave ${toneLeft > 0 ? `<span class="tone"><i></i><i></i><i></i></span> for another ${Math.ceil(toneLeft)} s` : '(the 60 s of tones are over; therapy stays suspended)'}.` : st.deep && active() ? 'A deep implant can stop the magnet from working. Without tones there is no confirmation: program Therapy Off instead.' : st.mag === 'sternum' ? 'Over the electrode, not the generator: no effect.' : 'Detection and shocks are active.'}</p>
        <p style="color:var(--ink-2)"><b>${st.vec[0].toUpperCase() + st.vec.slice(1)} vector:</b> ${{ primary: 'proximal sensing electrode to the can', secondary: 'distal tip to the can', alternate: 'distal tip to the proximal electrode' }[st.vec]}.</p>`;
      ls.sim.set({ suspend: suspended });
    };
    render();
    let last = 0;
    return {
      update(k) {
        if (k === 'mag' || k === 'deep') { ls.sim.band('magnet', false); tOn = null; if (st.mag !== 'off') { ls.sim.band('magnet', true); tOn = ls.sim.t; } }
        render();
      },
      action(a) {
        if (a === 'emi') ls.sim.addEMI(ls.sim.t, ls.sim.t + 10000, 0, 3, 0.6);
        if (a === 'vf') ls.sim.inject('vf');
        if (a === 'shock') ls.sim.inject('shock', { label: 'External shock' });
      },
      tick(dt) { ls.tick(dt); if (ls.sim.t - last > 1000) { last = ls.sim.t; render(); } },
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [
        { k: 'Rhythm', v: ls.sim.vf ? 'VF' : 'sinus', f: ls.sim.vf ? 'flag' : '' },
        { k: 'Therapy', v: ls.sim.dev.suspend ? 'suspended' : 'on' },
        { k: 'Shocks', v: ls.sim.recent(30000).filter(e => e.shock).length },
      ],
    };
  },
};
