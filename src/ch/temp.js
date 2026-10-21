import { el, liveStrip } from '../ui.js';

const FIX = {
  locPresent: ['Loss of capture, pacing spike present', ['Increase output', 'Check cable connections', 'Unipolarize electrodes', 'Change battery']],
  locAbsentLED: ['Loss of capture, spike absent, output LED visible', ['Check cable connectors', 'Trace and inspect the leads', 'Unipolarize']],
  locAbsentNoLED: ['Loss of capture, spike absent, no output LED', ['Confirm power on', 'Reduce sensitivity', 'Change battery', 'Change pulse generator']],
  over: ['Oversensing', ['Reduce sensitivity (raise the mV value)', 'Unipolarize', 'Secure connectors', 'Adjust the permanent pacemaker', 'Check grounding / patient isolation']],
  under: ['Undersensing', ['Increase sensitivity (lower the mV value)', 'Increase sensitivity / overdrive', 'Unipolarize']],
};

export default {
  key: 'temp', num: '15', part: 'V', title: 'Temporary pacing', short: 'Temporary', kicker: 'Epicardial, transvenous and transcutaneous',
  dek: 'A temporary pacemaker treats a bradyarrhythmia or tachyarrhythmia until it resolves or definitive therapy is possible. The external generator’s output is set in milliamperes and its sensitivity in millivolts: a lower sensitivity number means a more sensitive device.',
  state: { mode: 'VVI', rate: 80, out: 10, thr: 3, sens: 2, ramp: 6, rhythm: 'chb', noise: false },
  controls: [
    { t: 'seg', k: 'mode', label: 'Mode', opts: [['VVI', 'VVI'], ['VOO', 'VOO'], ['DDD', 'DDD']] },
    { t: 'range', k: 'rate', label: 'Rate', min: 40, max: 120, step: 5, fmt: v => `${v} /min` },
    { t: 'range', k: 'out', label: 'Output', min: 0.5, max: 20, step: 0.5, fmt: v => `${v} mA` },
    { t: 'range', k: 'sens', label: 'Sensitivity', min: 0.5, max: 20, step: 0.5, fmt: v => `${v} mV` },
    { t: 'range', k: 'thr', label: 'Patient: capture threshold', min: 0.5, max: 20, step: 0.5, fmt: v => `${v} mA` },
    { t: 'range', k: 'ramp', label: 'Patient: R-wave amplitude at the wires', min: 0.5, max: 12, step: 0.5, fmt: v => `${v} mV` },
    { t: 'seg', k: 'rhythm', label: 'Patient: underlying rhythm', opts: [['chb', 'Heart block, escape 40'], ['brady', 'Sinus 60, conducting']] },
    { t: 'check', k: 'noise', label: 'Interference on the pacing wires' },
  ],
  steps: [
    { set: { mode: 'VVI', rate: 80, out: 10, thr: 3, sens: 2, ramp: 6, rhythm: 'chb', noise: false }, note: '<b>Normal function.</b> Output 10 mA, threshold 3 mA: every pulse captures.' },
    { set: { thr: 12 }, note: '<b>Rising threshold.</b> Output below threshold: spikes without capture. Increase the output.' },
    { set: { thr: 3, rhythm: 'brady', rate: 50, ramp: 1.5, sens: 2 }, note: '<b>Undersensing.</b> The 1.5-mV R wave is below the 2-mV setting, so the pacemaker competes with conducted beats. Increase sensitivity (lower the number).' },
    { set: { ramp: 6, noise: true, rhythm: 'chb', rate: 80 }, note: '<b>Oversensing.</b> Noise on the wires inhibits the output, and only the escape rhythm at 40 remains. Reduce sensitivity (raise the number).' },
  ],
  prose: `
<h3>Indications</h3>
<ul>
<li>Heart block, symptomatic sinus bradycardia, sinus arrest; suppression of atrial or ventricular ectopy; during generator or ICD exchange in a dependent patient<span class="cite" data-ref="lecture"></span>.</li>
<li>Perioperatively: prophylaxis after cardiac surgery for bradyarrhythmia or complete heart block, or to increase cardiac output (especially after heart transplantation); rapid pacing to reduce cardiac output during TAVR deployment or TEVAR; after TAVR for transient heart block, new LBBB or self-expanding valves, usually 24–48 h; after removal of an infected ICD, until a new device is implanted<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<h3>Types</h3>
<ul>
<li><b>Transvenous.</b> A balloon-tipped catheter, usually femoral, which can move with the legs; a pacing pulmonary artery catheter, most easily placed through the right internal jugular vein; or a temporary-permanent screw-in lead, very stable but costly, with a risk of tamponade from RV perforation<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Epicardial.</b> Teflon-insulated wires placed at surgery. By convention, atrial wires exit to the right of the sternum and ventricular wires to the left. All temporary pacing needs a pair of electrodes: bipolar pacing uses two myocardial electrodes; unipolar pacing uses one myocardial electrode as the cathode and a skin electrode as the anode<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Transcutaneous</b> pads<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<h3>Uses</h3>
<p>Pacing for relative bradycardia after open-heart surgery (an inappropriate sinus bradycardia with low output) or pathological bradycardia; overdrive pacing of an accelerated junctional or idioventricular rhythm; suppression of ectopy and of torsade de pointes; prevention of AF; and pacing termination of atrial flutter<span class="cite" data-ref="lecture"></span>. External generators usually run AAI, VVI or DDD. Asynchronous modes (AOO, VOO, DOO) carry the risk of R on T and are usually needed only for interference in the operating room<span class="cite" data-ref="lecture"></span>. Most reports of R on T with cardiac arrest involve temporary pacemakers<span class="cite" data-ref="bsc2019"></span>.</p>
<h3>Troubleshooting</h3>
<p>The figure applies the lecture’s troubleshooting chart to the problem on the strip<span class="cite" data-ref="lecture"></span>.</p>
<p class="note">Thresholds, outputs and amplitudes in the figure are illustrative.</p>`,
  quiz: [
    { q: 'A temporary pacemaker is inhibited by noise. Which change helps?', a: ['Change sensitivity from 2 mV to 5 mV', 'Change sensitivity from 2 mV to 0.8 mV', 'Lower the output'], c: 0, why: 'Raising the mV value makes the device less sensitive, so smaller signals (noise) are ignored.<span class="cite" data-ref="lecture"></span>' },
    { q: 'By convention, which epicardial wires exit to the left of the sternum?', a: ['Atrial', 'Ventricular'], c: 1, why: 'Atrial wires to the right, ventricular to the left.<span class="cite" data-ref="lecture"></span>' },
  ],
  figClass: 'two',
  fig(host, st) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const pat = () => ({ sinus: st.rhythm === 'chb' ? 70 : 60, av: st.rhythm === 'chb' ? 'chb' : 'normal', escape: st.rhythm === 'chb' ? 40 : 0, vThr: st.thr, aThr: st.thr, rAmp: st.ramp, tAmp: Math.min(1, st.ramp * 0.2), pAmp: 2.5 });
    const dev = () => ({ mode: st.mode, lrl: st.rate, vOut: st.out, aOut: st.out, vSens: st.sens, aSens: Math.min(st.sens, 1.5), url: 120 });
    const ls = liveStrip(host, dev(), pat(), { title: 'ECG II · TEMPORARY PACER MARKERS', sub: () => `${st.mode} ${st.rate} · ${st.out} mA · ${st.sens} mV` });
    let nextNoise = 0;
    const problem = () => {
      const ev = ls.sim.recent(6000);
      if (st.noise && st.mode !== 'VOO' && 3 >= st.sens) return 'over';
      if (ev.some(e => e.code === 'VS' && e.src === 'T')) return 'over';
      if (st.out < st.thr) return 'locPresent';
      if (st.mode !== 'VOO' && st.ramp < st.sens && ls.sim.vdeps.some(d => d.t > ls.sim.t - 6000 && d.kind !== 'paced')) return 'under';
      return null;
    };
    const render = () => {
      const p = problem();
      card.innerHTML = p ? `<div class="verdict high">${FIX[p][0]}</div><ol>${FIX[p][1].map(x => `<li>${x}</li>`).join('')}</ol>`
        : '<div class="verdict low">Pacing and sensing appropriate</div><p>Output above threshold; the sensitivity setting is below the R-wave amplitude and above the noise.</p>';
      if (p === 'locPresent') card.innerHTML += '<p style="color:var(--ink-2)">If no spikes appear at all, check whether the output LED flashes: with the LED, check connectors and leads; without it, confirm power, battery and generator.</p>';
    };
    render();
    let last = 0;
    return {
      update() { ls.sim.set(dev(), pat()); render(); },
      tick(dt) {
        if (st.noise && ls.sim.t >= nextNoise) { ls.sim.addEMI(ls.sim.t, ls.sim.t + 2500, 3, 3, 0.25); nextNoise = ls.sim.t + 4000; }
        ls.tick(dt);
        if (ls.sim.t - last > 500) { last = ls.sim.t; render(); }
      },
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [
        { k: 'Ventricular rate', v: ls.sim.vRate(5000), u: '/min' },
        { k: 'Output : threshold', v: (st.out / st.thr).toFixed(1), u: ': 1', f: st.out < st.thr ? 'flag' : st.out / st.thr < 2 ? 'warn' : 'ok' },
        { k: 'Captured pulses', v: (() => { const v = ls.sim.recent(6000).filter(e => e.code === 'VP'); return v.length ? `${v.filter(e => e.cap).length}/${v.length}` : '—'; })() },
      ],
    };
  },
};
