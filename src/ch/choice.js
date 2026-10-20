import { el } from '../ui.js';

const GOALS = {
  pmasync: 'Pacemaker: asynchronous pacing for a dependent patient',
  icdshock: 'ICD / CRT-D: suspend shocks and ATP',
  icdasync: 'ICD / CRT-D: suspend shocks and pace asynchronously',
};
const DEVS = {
  std: 'Transvenous pacemaker, response enabled (Medtronic, Abbott, Boston Scientific)',
  bioauto: 'Biotronik pacemaker, magnet response Auto (default)',
  bioasync: 'Biotronik pacemaker, magnet response Asynchronous',
  micra: 'Micra leadless pacemaker',
  aveir: 'AVEIR leadless pacemaker',
};
const PREREQ = [
  ['known', 'Magnet response is known and can be confirmed (rate and mode change on the monitor, or tones from some ICDs)'],
  ['active', 'Magnet response (switch) is enabled'],
  ['supine', 'Patient will be supine'],
  ['observable', 'Magnet will be observable'],
  ['outfield', 'Magnet will not be in the surgical field'],
];

function decide(st) {
  const why = [];
  if (st.goal === 'icdasync') return { magnet: false, why: ['A magnet over an ICD never makes it asynchronous; asynchronous pacing in an ICD or CRT-D needs programming.'] };
  if (st.goal === 'pmasync') {
    if (st.dev === 'micra') return { magnet: false, why: ['Micra has no magnet response; program VOO.'] };
    if (st.dev === 'bioauto') return { magnet: false, why: ['Biotronik Auto gives only 10 asynchronous beats; reprogram (or program the response to Asynchronous).'] };
    if (st.dev === 'aveir') why.push('The bedside card lists AVEIR among devices to reprogram for asynchronous pacing.');
  }
  if (st.emergency) return { magnet: true, emergency: true, why: ['In a surgical emergency a magnet may be used without meeting every prerequisite; evaluate the device before the patient leaves telemetry.'] };
  for (const [k, t] of PREREQ) if (!st[k]) why.push(`Not met: ${t.toLowerCase()}.`);
  if (st.goal === 'pmasync' && !st.verified) why.push('Not verified: sustained asynchronous pacing with capture and a palpable or plethysmographic pulse at the magnet rate.');
  if (st.dev === 'aveir' && st.goal === 'pmasync') return { magnet: false, why };
  return { magnet: why.length === 0, why };
}

export default {
  key: 'choice', num: '07', part: 'III', title: 'Magnet or reprogram?', short: 'Choice', kicker: 'Choosing how to protect the patient',
  dek: 'A magnet is quick and reversible; programming is precise but must be undone. The choice depends on what protection is needed, what the device does with a magnet and whether the magnet can stay in place and in view.',
  state: { goal: 'pmasync', dev: 'std', emergency: false, known: true, active: true, supine: true, observable: true, outfield: true, verified: true },
  controls: [
    { t: 'select', k: 'goal', label: 'Protection needed', opts: Object.entries(GOALS) },
    { t: 'select', k: 'dev', label: 'Device', opts: Object.entries(DEVS), when: s => s.goal === 'pmasync' },
    { t: 'check', k: 'emergency', label: 'Surgical emergency (no time to evaluate)' },
    ...PREREQ.map(([k, t]) => ({ t: 'check', k, label: t, when: s => !s.emergency })),
    { t: 'check', k: 'verified', label: 'Sustained pacing, capture and a matching pulse verified with the magnet', when: s => !s.emergency && s.goal === 'pmasync' },
  ],
  steps: [
    { set: { goal: 'pmasync', dev: 'std', emergency: false, known: true, active: true, supine: true, observable: true, outfield: true, verified: true }, note: '<b>Supine, magnet in view, response confirmed.</b> A pacemaker magnet is acceptable.' },
    { set: { supine: false }, note: '<b>Prone spine surgery.</b> The magnet cannot be observed or adjusted: reprogram.' },
    { set: { supine: true, dev: 'bioauto' }, note: '<b>Biotronik Auto.</b> Ten beats only: reprogram.' },
    { set: { goal: 'icdasync' }, note: '<b>ICD in a pacing-dependent patient.</b> A magnet cannot provide asynchronous pacing: program.' },
  ],
  prose: `
<h3>Magnet or programming</h3>
<div class="tablewrap"><table>
<tr><th></th><th>Magnet</th><th>Programming</th></tr>
<tr><td>Ease</td><td>Easy, reversible</td><td>Complex; not readily reversed</td></tr>
<tr><td>Tachy therapy</td><td>Available again as soon as the magnet is removed; effective in essentially all ICDs</td><td>Must be programmed back on</td></tr>
<tr><td>Pacing</td><td>Effect varies; the response must be on</td><td>Controls mode, rate and rate response</td></tr>
</table></div>
<p class="note">After the lecture<span class="cite" data-ref="lecture"></span>.</p>
<h3>Prerequisites for using a magnet</h3>
<p>Either a surgical emergency, or all of: the magnet response is known and can be confirmed (rate and mode change on the monitor for a pacemaker, or tones confirming suspension in some ICDs); the magnet switch is active; the patient will be supine; the magnet will be observable; and the magnet will not be in the surgical field<span class="cite" data-ref="lecture"></span>. The perioperative management flowchart in the lecture gives the same conditions (switch active, supine, magnet observable and out of the field) for disabling high-voltage therapy with a magnet<span class="cite" data-ref="lecture"></span>.</p>
<h3>When to disable or reprogram</h3>
<ul>
<li>When EMI is likely: disable an ICD’s antitachyarrhythmia function; put a pacing-dependent patient’s ICD or pacemaker in an asynchronous mode<span class="cite" data-ref="lecture"></span>.</li>
<li>Regardless of EMI: when movement from a shock would endanger the patient or the surgeon, and to disable an active rate-response sensor<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<h3>The bedside card</h3>
<p>Reprogram for asynchronous pacing in an ICD or CRT-D, a Micra, an AVEIR, a Biotronik pacemaker (unless its response is Asynchronous), or whenever the magnet cannot be kept secure. Use a pacemaker magnet only if the response is known and enabled and sustained pacing, capture and a matching pulse have been verified. Suspend rate response<span class="cite" data-ref="card"></span>. For an ICD, the AHA statement advises programming detection off, with a magnet if no programmer is available, and re-enabling detection before the patient leaves a monitored setting<span class="cite" data-ref="wan2024"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>A magnet needs a known, enabled response and a supine patient with the magnet in view and out of the field.</li>
<li>Prone, lateral or draped-over generators favor programming.</li>
<li>Asynchronous pacing in an ICD always needs programming.</li>
</ol>`,
  quiz: [
    { q: 'A pacing-dependent patient with a CRT-D is having a laparotomy. How is asynchronous pacing achieved?', a: ['Magnet over the generator', 'Programming the device', 'Bipolar cautery'], c: 1, why: 'A magnet on a CRT-D suspends therapies but does not change pacing; programming is required.<span class="cite" data-ref="bsc2019,card"></span>' },
    { q: 'Which is NOT one of the prerequisites for relying on a magnet?', a: ['The patient will be supine', 'The magnet will be in the surgical field', 'The magnet response is known'], c: 1, why: 'The magnet must stay out of the surgical field.<span class="cite" data-ref="lecture"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const render = () => {
      const d = decide(st);
      card.innerHTML = `<div class="verdict ${d.magnet ? 'low' : 'high'}" style="font-size:1.5rem;margin:6px 0 4px">${d.magnet ? 'A magnet is acceptable' : 'Reprogram the device'}</div>
        <p style="margin:0 0 12px;color:var(--ink-2)">${GOALS[st.goal]}${st.goal === 'pmasync' ? ' · ' + DEVS[st.dev] : ''}</p>
        <div class="grid2" style="padding:0">
          <div class="box ${d.magnet ? 'hl' : ''}"><h5>Magnet</h5><ul><li>Easy and reversible</li><li>Tachy therapy returns when it is removed</li><li>Effect on pacing varies; response must be on</li></ul></div>
          <div class="box ${d.magnet ? '' : 'hl'}"><h5>Programming</h5><ul><li>Controls mode, rate and rate response</li><li>Must be reprogrammed afterwards</li><li>Pads on while therapies are off</li></ul></div>
        </div>
        <h4 style="font:600 .72rem var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);margin:16px 0 6px">Why</h4>
        <ul>${(d.why.length ? d.why : ['All prerequisites are met.']).map(w => `<li class="${d.magnet ? 'pass' : 'fail'}">${w}</li>`).join('')}</ul>
        <div style="color:var(--ink-3);font-size:.78rem;margin-top:10px">Sources <span class="cite" data-ref="lecture,card"></span></div>`;
      ctx.cites(card);
    };
    render();
    return { update: render, live: () => decide(st).emergency ? '<b>Emergency.</b> Magnet over the generator, short bursts of cautery, evaluate the device before leaving telemetry (chapter 13).' : '' };
  },
};
