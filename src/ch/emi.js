import { el, s, torso, drawDevice, distToPath, segToPath, liveStrip, BODY } from '../ui.js';

const DEVICES = {
  pm2: { label: 'Dual-chamber pacemaker, left pectoral', icd: false, pectoral: true },
  rpm2: { label: 'Dual-chamber pacemaker, right pectoral', icd: false, pectoral: true },
  icd2: { label: 'Dual-chamber ICD, left pectoral', icd: true, pectoral: true },
  crtd: { label: 'CRT-D, left pectoral', icd: true, pectoral: true },
  sicd: { label: 'Subcutaneous ICD (S-ICD)', icd: true, pectoral: false, nopace: true },
  abd: { label: 'Abdominal pacemaker, epicardial lead', icd: false, pectoral: false },
};
const SITES = {
  crani: { label: 'Craniotomy', p: [30, -8] },
  carotid: { label: 'Carotid endarterectomy (left)', p: [35, 4] },
  pocket: { label: 'Device pocket (generator change)', p: null },
  lbreast: { label: 'Left breast', p: [42, 24] },
  chole: { label: 'Cholecystectomy (right upper quadrant)', p: [22, 43] },
  hernia: { label: 'Right inguinal hernia', p: [21, 64] },
  pelvis: { label: 'Pelvic surgery', p: [30, 61] },
  knee: { label: 'Right knee', p: [20, 97] },
};
const PADS = {
  rthigh: { label: 'Right thigh', p: [20, 82] },
  lthigh: { label: 'Left thigh', p: [40, 82] },
  lflank: { label: 'Left flank', p: [52, 44] },
  under: { label: 'Under-body (mat) pad', p: null },
};

function geometry(st) {
  const g = s('g');
  const dev = drawDevice(g, st.dev);
  const site = st.site === 'pocket' ? dev.gen : SITES[st.site].p;
  const pad = PADS[st.pad].p;
  const pts = [dev.gen, ...dev.leads];
  const dGen = Math.hypot(site[0] - dev.gen[0], site[1] - dev.gen[1]);
  const dLead = dev.leads.length ? distToPath(site, dev.leads) : dGen;
  const dPath = st.energy !== 'mono' ? null : pad ? segToPath(site, pad, pts) : 0;
  return { dev, site, pad, dGen, dLead, dMin: Math.min(dGen, dLead), dPath, below: site[1] > BODY.umb[1] };
}

// The bedside card's definition (note 2). Low = all of the listed conditions; anything else is high.
function risk(st, G) {
  const D = DEVICES[st.dev];
  if (st.energy !== 'mono') {
    const onDevice = st.site === 'pocket' || G.dMin < 3;
    return { low: !onDevice, checks: [[`${st.energy === 'bi' ? 'Bipolar' : 'Ultrasonic'} energy`, true], ['Not used on the device or leads', !onDevice]] };
  }
  const checks = [
    ['Monopolar below the umbilicus', G.below],
    [`> 15 cm from generator and leads (${Math.round(G.dMin)} cm)`, G.dMin > 15],
    [`Current path away from them (${Math.round(G.dPath)} cm)`, G.dPath > 15],
    ['No under-body pad', st.pad !== 'under'],
    ['Pectoral device', D.pectoral],
  ];
  return { low: checks.every(c => c[1]), checks };
}

// Noise amplitude on the leads in the model, in mV (illustrative).
function noise(st, G, r) {
  if (st.energy !== 'mono') return st.site === 'pocket' ? 1.5 : 0;
  const k = st.dev === 'sicd' ? 1.5 : 1;
  if (st.pad === 'under' || G.dPath <= 15 || G.dMin <= 15) return 4 * k;
  if (!r.low) return 1.0 * k;
  return 0.2 * k;
}

const PATIENT = dep => (dep ? { sinus: 70, av: 'chb', escape: 0 } : { sinus: 70, av: 'normal', escape: 0 });

function program(st) {
  const D = DEVICES[st.dev], dep = st.dep && !D.nopace;
  const base = { mode: D.nopace ? 'OOO' : 'DDD', lrl: 60, url: 120, icd: D.icd, tachy: true, suspend: false, pav: 200, rr: false };
  if (st.protect === 'magnet') {
    if (D.icd) return { ...base, suspend: true };                   // ICD magnet: therapies only, pacing unchanged
    return { ...base, mode: 'DOO', lrl: 85, pav: 100 };             // pacemaker magnet (rate varies by maker: chapter 06)
  }
  if (st.protect === 'program') return { ...base, tachy: !D.icd, mode: D.nopace ? 'OOO' : dep ? 'DOO' : 'DDD', lrl: dep ? 70 : 60 };
  return base;
}

export default {
  key: 'emi', num: '05', part: 'II', title: 'Electromagnetic interference', short: 'EMI', kicker: 'Electrocautery and the device',
  dek: 'Monopolar electrocautery sends current from the active electrode to the return pad. A lead near that path can sense the current as cardiac activity: a pacemaker may withhold pacing, and an ICD may count the noise as ventricular fibrillation and shock.',
  state: { dev: 'pm2', dep: true, site: 'chole', energy: 'mono', pad: 'rthigh', burst: 4, protect: 'none', cautery: true },
  controls: [
    { t: 'select', k: 'dev', label: 'Device', opts: Object.entries(DEVICES).map(([k, v]) => [k, v.label]) },
    { t: 'check', k: 'dep', label: 'Pacing dependent (complete heart block, no escape)', when: s => !DEVICES[s.dev].nopace },
    { t: 'select', k: 'site', label: 'Operation', opts: Object.entries(SITES).map(([k, v]) => [k, v.label]) },
    { t: 'seg', k: 'energy', label: 'Energy', opts: [['mono', 'Monopolar'], ['bi', 'Bipolar'], ['ultra', 'Ultrasonic']] },
    { t: 'select', k: 'pad', label: 'Return pad', opts: Object.entries(PADS).map(([k, v]) => [k, v.label]), when: s => s.energy === 'mono' },
    { t: 'range', k: 'burst', label: 'Cautery burst', min: 1, max: 10, step: 1, fmt: v => `${v} s, every ${v + 3} s` },
    { t: 'seg', k: 'protect', label: 'Device management', opts: [['none', 'As programmed'], ['magnet', 'Magnet'], ['program', 'Reprogrammed']] },
    { t: 'check', k: 'cautery', label: 'Cautery in use' },
  ],
  steps: [
    { set: { dev: 'pm2', dep: true, site: 'chole', energy: 'mono', pad: 'rthigh', protect: 'none', burst: 4 }, note: '<b>Cholecystectomy, pacing-dependent patient.</b> The site is above the umbilicus and within reach of the leads; each burst inhibits pacing for its full length.', ms: 9000 },
    { set: { protect: 'magnet' }, note: '<b>Pacemaker magnet.</b> Asynchronous pacing ignores the noise.', ms: 7000 },
    { set: { dev: 'icd2', dep: false, protect: 'none', burst: 9 }, note: '<b>ICD, long bursts.</b> Nine seconds of noise is counted as VF; the device charges and shocks.', ms: 15000 },
    { set: { protect: 'magnet' }, note: '<b>ICD magnet.</b> Detection is suspended, so no shock. Pacing is unchanged.', ms: 8000 },
    { set: { dev: 'icd2', dep: true, protect: 'magnet', burst: 4 }, note: '<b>ICD magnet in a pacing-dependent patient.</b> Shocks are suspended but pacing is still inhibited: an ICD magnet gives no pacing protection.', ms: 9000 },
    { set: { dev: 'pm2', dep: true, site: 'hernia', pad: 'rthigh', protect: 'none', burst: 4 }, note: '<b>Inguinal hernia, thigh pad.</b> Below the umbilicus, far from the device, the path away from it: low risk on the bedside card.', ms: 8000 },
  ],
  prose: `
<h3>What interference does</h3>
<ul>
<li><b>Oversensing and inhibition.</b> The device reads noise as intrinsic beats and withholds pacing. A pacing-dependent patient becomes unstable; a CRT patient loses resynchronization and heart failure worsens<span class="cite" data-ref="lecture,bsc2019"></span>.</li>
<li><b>Tachy therapy.</b> An ICD may treat noise as VT or VF with antitachycardia pacing or a shock<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Tracking of noise.</b> Noise sensed on the atrial channel can be tracked, with ventricular pacing up to the upper rate<span class="cite" data-ref="lecture,bio2019"></span>.</li>
<li><b>Rate response.</b> A minute-ventilation sensor may drive pacing to its upper rate (chapter 04)<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Reset</b> of the generator to default settings is rare; damage to the generator or the lead–tissue interface is rarer<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<h3>Electrocautery</h3>
<p>Bipolar cautery causes less interference than monopolar. Bursts should be short (under 5 s), and the current path from the active electrode to the return pad kept away from the generator and leads. Surgery below the umbilicus is less likely to interfere<span class="cite" data-ref="lecture"></span>. The bedside card asks for monopolar current in short, irregular bursts under 5 s at the lowest effective energy<span class="cite" data-ref="card"></span>.</p>
<h3>The bedside card’s EMI risk</h3>
<p>Risk is judged relative to the generator <i>and</i> the leads<span class="cite" data-ref="card"></span>.</p>
<ul>
<li><b>Low</b> requires all of: monopolar below the umbilicus, more than 15 cm from the generator and leads, the current path away from them, no under-body pad, and a pectoral device. Bipolar or ultrasonic energy not used on the device or leads is also low risk.</li>
<li><b>High</b> is anything else: above the umbilicus, within 15 cm, an under-body pad, a path that crosses the device. If unsure, treat it as high.</li>
<li>Non-pectoral systems need their own map: an abdominal generator (lower abdominal surgery is high risk), an S-ICD (its zone reaches the groin) and an EV-ICD (left axilla, lateral chest, sternum, subxiphoid)<span class="cite" data-ref="card"></span>.</li>
<li>Even when risk is low, an ICD patient having intracranial, spinal or eye surgery may need shocks suspended, because movement from a shock is itself a hazard<span class="cite" data-ref="card,lecture"></span>.</li>
</ul>
<p class="note"><span class="tag confirm">confirm</span> The card marks the wording of its EMI-risk definition as unresolved. In the figure, "path away" is drawn as the straight line from the operative site to the pad, and the noise amplitudes on the leads are illustrative.</p>
<h3>Other sources</h3>
<p>Cardioversion, radiofrequency ablation, radiation therapy, electroconvulsive therapy, TENS units, nerve stimulators used for blocks, neuromonitoring (SSEP and MEP), radiofrequency scanners for retained surgical items and lithotripsy can all interfere<span class="cite" data-ref="lecture"></span>. In the Biotronik case report, a pacemaker paced at 110 per minute when somatosensory evoked potentials began; the proposed mechanism was tracking of the SSEP stimuli as atrial activity<span class="cite" data-ref="bio2019"></span>.</p>
<h3>Mechanical interference</h3>
<p>A guidewire during central line placement can move a lead or cause oversensing: an ICD may deliver inappropriate therapy and a pacemaker may be inhibited. Contact between a guidewire and a lead has caused an electrical short with irreversible damage. Bone-saw vibration can also interfere<span class="cite" data-ref="lecture"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>Judge risk by distance to the generator and the leads, and by the current path to the pad.</li>
<li>Bipolar where possible; monopolar in short bursts under 5 s.</li>
<li>An ICD magnet stops shocks but does not protect pacing.</li>
</ol>`,
  quiz: [
    { q: 'An ICD patient who is pacing-dependent has a magnet placed for a laparotomy. Cautery bursts begin. What is expected?', a: ['Asynchronous pacing and no shocks', 'No shocks, but pacing can be inhibited', 'Shocks and asynchronous pacing'], c: 1, why: 'An ICD magnet suspends shocks and ATP only; it gives no pacing protection and never makes the device asynchronous.<span class="cite" data-ref="card,sj2018"></span>' },
    { q: 'Which of these is low risk on the bedside card?', a: ['Monopolar cholecystectomy, thigh pad', 'Monopolar inguinal hernia repair, thigh pad, pectoral pacemaker', 'Bipolar cautery on the generator pocket'], c: 1, why: 'All the low-risk conditions hold: below the umbilicus, more than 15 cm away, path away from the device, no under-body pad, pectoral device.<span class="cite" data-ref="card"></span>' },
  ],
  figClass: 'side',
  fig(host, st, ctx) {
    const T = torso(host, { cap: 'Operative site, return pad and current path' });
    const info = el('div', { class: 'card info' });
    host.append(info);
    const ls = liveStrip(host, program(st), PATIENT(st.dep), { title: 'ECG II · MARKER CHANNEL', sub: () => `${ls.sim.dev.mode}${ls.sim.dev.icd ? (ls.sim.dev.tachy && !ls.sim.dev.suspend ? ' · tachy ON' : ' · tachy SUSPENDED') : ''}` });
    let G, R, nextBurst = ls.sim.t + 1000, amp = 0;
    const draw = () => {
      T.layer.textContent = '';
      G = geometry(st); R = risk(st, G); amp = noise(st, G, R);
      const g = s('g', {}, T.layer);
      s('circle', { cx: G.dev.gen[0], cy: G.dev.gen[1], r: 15, class: 'zone' }, g);
      const devG = s('g', {}, g); drawDevice(devG, st.dev);
      if (st.energy === 'mono') {
        if (G.pad) {
          s('line', { x1: G.site[0], y1: G.site[1], x2: G.pad[0], y2: G.pad[1], class: 'path' }, g);
          s('rect', { x: G.pad[0] - 3, y: G.pad[1] - 2, width: 6, height: 4, rx: 1, class: 'pad' }, g);
          s('text', { x: G.pad[0], y: G.pad[1] + 5.2, 'text-anchor': 'middle', class: 'lbl', text: 'pad' }, g);
        } else {
          s('rect', { x: 9, y: 6, width: 42, height: 64, rx: 6, class: 'pad', opacity: 0.18 }, g);
          s('text', { x: 30, y: 72.5, 'text-anchor': 'middle', class: 'lbl', text: 'under-body pad' }, g);
        }
      }
      s('circle', { cx: G.site[0], cy: G.site[1], r: 1.6, class: 'tip' }, g);
      s('text', { x: G.site[0] + 2.4, y: G.site[1] - 2, class: 'lbl b', text: 'site' }, g);
      s('text', { x: G.dev.gen[0], y: G.dev.gen[1] - 16, 'text-anchor': 'middle', class: 'lbl', text: '15 cm' }, g);
      info.innerHTML = `<div class="verdict ${R.low ? 'low' : 'high'}">EMI risk: ${R.low ? 'LOW' : 'HIGH'}</div>
        <ul>${R.checks.map(([t, ok]) => `<li class="${ok ? 'pass' : 'fail'}">${ok ? '✓' : '✗'} ${t}</li>`).join('')}</ul>
        <div style="margin-top:6px;color:var(--ink-2)">${R.low ? 'Proceed; magnet in the room.' : DEVICES[st.dev].icd ? 'Suspend shocks and ATP (magnet or reprogram), pads on; then decide on pacing.' : 'If pacing dependent: asynchronous pacing by reprogramming or a verified pacemaker magnet.'}<span class="cite" data-ref="card"></span>${st.site === 'crani' && DEVICES[st.dev].icd ? '<br><b>Intracranial surgery with an ICD:</b> consider suspending shocks even if EMI risk is low.' : ''}${DEVICES[st.dev].nopace ? '<br>The S-ICD has no bradycardia pacing.' : ''}</div>`;
      ctx.cites(info);
    };
    const reprogram = () => { ls.sim.set(program(st), PATIENT(st.dep && !DEVICES[st.dev].nopace)); };
    draw();
    return {
      update(k) {
        if (k === 'protect' || k === 'dev' || k === 'dep') {
          ls.sim.band('magnet', false);
          if (st.protect === 'magnet') ls.sim.band('magnet', true);
          reprogram();
        }
        // stop any burst now running so the new geometry applies to the next one
        for (const w of ls.sim.emi) if (w.t1 > ls.sim.t) { w.t1 = ls.sim.t; }
        for (const b of ls.sim.bands) if (b.kind === 'emi' && b.t1 > ls.sim.t) b.t1 = ls.sim.t;
        nextBurst = ls.sim.t + 800;
        draw();
      },
      tick(dt) {
        if (st.cautery && ls.sim.t >= nextBurst) {
          const len = st.burst * 1000;
          ls.sim.addEMI(ls.sim.t, ls.sim.t + len, amp * 0.6, amp, amp > 0.5 ? 0.7 : amp > 0 ? 0.3 : 0.1);
          nextBurst = ls.sim.t + len + 3000;
        }
        ls.tick(dt);
      },
      destroy: () => ls.destroy(),
      readouts: () => {
        const sim = ls.sim, lp = sim.longestPause(10000), shocks = sim.recent(20000).filter(e => e.shock).length;
        return [
          { k: 'To generator', v: Math.round(G.dGen), u: 'cm', f: G.dGen <= 15 ? 'flag' : '' },
          { k: 'To nearest lead', v: Math.round(G.dLead), u: 'cm', f: G.dLead <= 15 ? 'flag' : '' },
          { k: 'Site', v: G.below ? 'below umbilicus' : 'above umbilicus' },
          { k: 'Ventricular rate', v: sim.vRate(), u: '/min' },
          { k: 'Longest pause', v: (lp / 1000).toFixed(1), u: 's', f: lp > 2000 ? 'flag' : '' },
          { k: 'Shocks', v: shocks, f: shocks ? 'flag' : '' },
        ];
      },
      live: () => {
        const sim = ls.sim, D = DEVICES[st.dev];
        const shocks = sim.recent(20000).filter(e => e.shock).length, lp = sim.longestPause(10000);
        if (!st.cautery) return 'Cautery is off.';
        if (amp < 0.5) return st.energy === 'mono' ? '<b>No interference sensed.</b> The noise reaching the leads stays below the programmed sensitivity.' : '<b>No interference.</b> Bipolar and ultrasonic devices keep the current local.';
        if (shocks) return '<b>Inappropriate shock.</b> The ICD counted the noise as VF, charged and, with noise still present at reconfirmation, delivered a shock.';
        if (D.icd && st.protect === 'magnet' && st.dep && !D.nopace) return '<b>Shocks suspended, pacing inhibited.</b> The ICD magnet does not change the pacing mode, so the dependent patient has a pause during every burst.';
        if (lp > 2000 && st.dep) return `<b>Pacing inhibited.</b> The device read the noise as intrinsic activity and withheld pacing; the pause lasted ${(lp / 1000).toFixed(1)} s.`;
        if (D.icd && st.protect === 'none' && st.burst <= 5) return '<b>Detection without therapy.</b> Short bursts may start detection and charging, but the noise has stopped by reconfirmation and the shock is aborted. Longer bursts are shocked.';
        if (st.protect !== 'none') return '<b>Protected.</b> ' + (D.icd ? 'Tachy therapies are off or suspended.' : 'Asynchronous pacing ignores the noise.');
        return '<b>Noise sensed.</b> Watch the marker channel: noise on the atrial lead is tracked, noise on the ventricular lead inhibits.';
      },
    };
  },
};
