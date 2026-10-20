import { el, flowchart } from '../ui.js';

const NOTES = {
  1: ['① Identify the device; interrogation', 'Type, manufacturer, model, generator site and lead course (card, records, chest radiograph). Telemetry with pacing recognition on. Interrogation window (local policy): ICD, CRT-D or leadless within 3 months; pacemaker or CRT-P within 6 months. Check the magnet response (enabled?), dependence, rate response and battery. Outdated but usable: do not delay low-risk cases; baseline ECG, magnet ready. No report, unknown device or function, suspected malfunction, or a dependent patient with high-risk EMI: device nurse or EP.'],
  2: ['② EMI risk, relative to the generator and the leads', 'Low = all of: monopolar below the umbilicus, more than 15 cm from the generator and leads, current path away from them, no under-body pad, pectoral device; or bipolar or ultrasonic energy not used on the device or leads. High = anything else (above the umbilicus, within 15 cm, an under-body pad, a path that crosses the device). Unsure = high. Re-map for an abdominal generator (lower abdomen high risk), an S-ICD (to the groin) and an EV-ICD (left axilla, lateral chest, sternum, subxiphoid). <span class="tag confirm">wording: confirm</span>'],
  3: ['③ Low-risk exception', 'ICD with intracranial, spinal or eye surgery: consider suspending shocks, because of movement from a shock.'],
  4: ['④ ICD magnet', 'Suspends shocks and ATP only: no pacing protection, never asynchronous. Use only if the response is known and enabled. Tones are unreliable; palpation confirms position only. Tape it, keep it reachable, recheck after repositioning; it may fail if the patient is obese or prone. Boston Scientific beeps once per second; Biotronik therapies resume after 8 h with the magnet on; MicroPort Platinium DR: output 6 V at 1 ms (diaphragm capture), rate and mode unchanged. S-ICD: tones up to 60 s, then stop, with therapy still inhibited. EV-ICD: the magnet is ineffective during a wand session.'],
  5: ['⑤ Pacing dependent?', 'Use, in order: interrogation, ECG or telemetry, patient report. Pacing before most or all beats, or unknown: potentially dependent until reviewed. Anesthesia can increase dependence.'],
  6: ['⑥ Asynchronous pacing (nominal magnet responses)', 'Reprogram: ICD or CRT-D, Micra, AVEIR, Biotronik (unless its response is Asynchronous), or when the magnet is not secure. Pacemaker magnet only if the response is known and enabled and sustained pacing, capture and a matching pulse are verified. Suspend rate response. Chapter 06 lists the rates.'],
  7: ['⑦ Technique', 'Pads on if the ICD is suspended or the patient is dependent: anterior–posterior, never over the generator, at least 15 cm from it when feasible, before draping. ECG and a continuous pulse signal (plethysmography, arterial line, Doppler). Bipolar preferred; monopolar in short, irregular bursts under 5 s at the lowest energy.'],
  8: ['⑧ Pacing inhibition / emergency', 'Stop EMI; check the pulse; support perfusion, and do not wait for the device. Pace externally or transvenously; call the CIED team. An ICD magnet does not prevent pacing inhibition. Never delay external pacing or shocks for programming or pad position.'],
  9: ['⑨ After surgery', 'Remove the magnet once EMI has ended. Restore every change (ICD therapies, pacing mode, rate response) and document it <span class="tag confirm">who removes / who restores: confirm</span>; until then, telemetry, pads and rescue capability. Interrogate if: reprogrammed; emergency surgery without adequate evaluation (any zone) or in a high-risk zone (local policy); an ICD shock or ATP; an external shock; VT, VF or arrest; significant EMI; a rate unexpectedly below the programmed rate; a capture or sensing problem; suspected reset.'],
};

const NODES = [
  { id: 'n1', x: 200, y: 40, w: 270, h: 50, text: ['Identify every device', 'Check recent interrogation ①'], note: 1 },
  { id: 'd1', x: 200, y: 122, w: 210, h: 62, dec: true, text: ['EMI risk? ②'], note: 2 },
  { id: 'low', x: 565, y: 122, w: 250, h: 50, tone: 'green', text: ['LOW → proceed', 'Magnet in room ③'], note: 3 },
  { id: 'd2', x: 200, y: 218, w: 210, h: 62, dec: true, text: ['ICD of any type?'] },
  { id: 'susp', x: 565, y: 218, w: 250, h: 50, tone: 'red', text: ['Suspend shocks / ATP', 'Magnet ④ or reprogram · pads ON'], note: 4 },
  { id: 'd3', x: 200, y: 318, w: 210, h: 62, dec: true, text: ['Pacing dependent? ⑤'], note: 5 },
  { id: 'async', x: 565, y: 318, w: 250, h: 56, tone: 'red', text: ['Asynchronous pacing', 'Reprogram, or verified', 'pacemaker magnet ⑥'], note: 6 },
  { id: 'noasync', x: 200, y: 405, w: 240, h: 46, tone: 'amber', text: ['No async pacing needed', 'ICD stays suspended'] },
  { id: 'all', x: 380, y: 488, w: 690, h: 64, text: ['ALL PATIENTS · DURING SURGERY', 'ECG + pulse monitoring · pads as planned · bipolar preferred, monopolar short bursts ⑦', 'Pacing inhibition → stop EMI, support perfusion, pace externally ⑧'], note: 7 },
  { id: 'd4', x: 200, y: 590, w: 230, h: 66, dec: true, text: ['Settings changed', 'or any event? ⑨'], note: 9 },
  { id: 'restore', x: 565, y: 590, w: 250, h: 50, tone: 'red', text: ['Restore all settings + interrogate', 'before leaving monitored care ⑨'], note: 9 },
  { id: 'remove', x: 200, y: 675, w: 240, h: 46, tone: 'green', text: ['Remove magnet', 'Routine follow-up'], note: 9 },
];
const EDGES = [
  { id: 'e1', d: 'M200,65 L200,90' },
  { id: 'eLow', d: 'M305,122 L438,122', label: 'Low', lx: 370, ly: 114 },
  { id: 'eLowAll', d: 'M690,122 L748,122 L748,470 L727,470' },
  { id: 'eHigh', d: 'M200,153 L200,186', label: 'High / unsure', lx: 210, ly: 175, anchor: 'start' },
  { id: 'eIcdY', d: 'M305,218 L438,218', label: 'Yes', lx: 370, ly: 210 },
  { id: 'eIcdN', d: 'M200,249 L200,286', label: 'No', lx: 210, ly: 270, anchor: 'start' },
  { id: 'eNext', d: 'M565,243 L565,266 L206,266', label: 'Next: check pacing', lx: 400, ly: 260 },
  { id: 'eDepY', d: 'M305,318 L438,318', label: 'Yes / unsure', lx: 370, ly: 310 },
  { id: 'eDepN', d: 'M200,349 L200,381', label: 'No', lx: 210, ly: 368, anchor: 'start' },
  { id: 'eNoAll', d: 'M200,428 L200,455' },
  { id: 'eAsyncAll', d: 'M565,346 L565,455' },
  { id: 'eAll', d: 'M200,520 L200,556' },
  { id: 'eChY', d: 'M315,590 L438,590', label: 'Yes / unsure', lx: 377, ly: 582 },
  { id: 'eChN', d: 'M200,623 L200,651', label: 'No', lx: 210, ly: 640, anchor: 'start' },
];

function path(st) {
  const n = ['n1', 'd1'], e = ['e1'];
  if (st.emi === 'low') { n.push('low'); e.push('eLow', 'eLowAll'); }
  else {
    e.push('eHigh'); n.push('d2');
    if (st.icd === 'yes') { n.push('susp', 'd3'); e.push('eIcdY', 'eNext'); } else { n.push('d3'); e.push('eIcdN'); }
    if (st.dep === 'no') { n.push('noasync'); e.push('eDepN', 'eNoAll'); } else { n.push('async'); e.push('eDepY', 'eAsyncAll'); }
  }
  n.push('all', 'd4'); e.push('eAll');
  if (st.changed === 'no') { n.push('remove'); e.push('eChN'); } else { n.push('restore'); e.push('eChY'); }
  return [n, e];
}

function plan(st) {
  const out = [];
  if (st.emi === 'low') out.push('Proceed; keep a magnet in the room.' + (st.icd === 'yes' ? ' For intracranial, spinal or eye surgery, consider suspending shocks.' : ''));
  else {
    if (st.icd === 'yes') out.push('Suspend shocks and ATP (magnet if its response is known and enabled, or reprogram), with pads on.');
    if (st.dep !== 'no') out.push(st.icd === 'yes' ? 'Asynchronous pacing by reprogramming: an ICD magnet cannot provide it.' : 'Asynchronous pacing: reprogram, or a pacemaker magnet with a verified response.');
    else out.push(st.icd === 'yes' ? 'No asynchronous pacing needed; the ICD stays suspended.' : 'No asynchronous pacing needed.');
    out.push('Suspend rate response.');
  }
  out.push('During surgery: ECG and a pulse signal; bipolar preferred, monopolar in short bursts.');
  out.push(st.changed === 'no' ? 'Afterwards: remove the magnet; routine follow-up.' : 'Afterwards: restore every setting and interrogate before the patient leaves monitored care.');
  return out;
}

export default {
  key: 'plan', num: '10', part: 'IV', title: 'The perioperative plan', short: 'Plan', kicker: 'The bedside card, step by step',
  dek: 'The bedside card turns the guidelines into four questions: how high is the EMI risk, is there an ICD, is the patient pacing dependent, and did anything change or happen? Each answer selects the protection needed.',
  state: { emi: 'high', icd: 'yes', dep: 'yes', changed: 'yes', note: 4 },
  controls: [
    { t: 'seg', k: 'emi', label: 'EMI risk (chapter 05)', opts: [['low', 'Low'], ['high', 'High'], ['unsure', 'Unsure']] },
    { t: 'seg', k: 'icd', label: 'ICD of any type?', opts: [['yes', 'Yes'], ['no', 'No']] },
    { t: 'seg', k: 'dep', label: 'Pacing dependent?', opts: [['yes', 'Yes'], ['unsure', 'Unsure'], ['no', 'No']] },
    { t: 'seg', k: 'changed', label: 'Settings changed or any event?', opts: [['yes', 'Yes'], ['unsure', 'Unsure'], ['no', 'No']] },
    { t: 'select', k: 'note', label: 'Note on the back of the card', opts: Object.entries(NOTES).map(([k, v]) => [Number(k), v[0]]) },
  ],
  steps: [
    { set: { emi: 'low', icd: 'no', dep: 'yes', changed: 'no', note: 2 }, note: '<b>Hernia repair, pectoral pacemaker.</b> Low risk: proceed with a magnet in the room.' },
    { set: { emi: 'high', icd: 'no', dep: 'yes', changed: 'yes', note: 6 }, note: '<b>Laparotomy, dependent pacemaker patient.</b> Asynchronous pacing by reprogramming or a verified magnet.' },
    { set: { emi: 'high', icd: 'yes', dep: 'yes', changed: 'yes', note: 4 }, note: '<b>Laparotomy, dependent ICD patient.</b> Suspend shocks and reprogram to asynchronous pacing.' },
    { set: { note: 9 }, note: '<b>After surgery.</b> Restore every change and interrogate before monitored care ends.' },
  ],
  prose: `
<h3>The card</h3>
<p>The front of the bedside card is the chart in the figure; the numbered notes are on its back. Choose a note to read it, or click a box in the chart. The card is a draft for discussion, not approved; items marked <span class="tag confirm">confirm</span> are unresolved<span class="cite" data-ref="card"></span>. Its sources are the ASA advisory (2020), the AHA statement (2024), the 2024 AHA/ACC guideline, the HRS/ASA statement (2011), the AVEIR tip card, the Boston Scientific magnet bulletin (2021), the Medtronic magnet letter (2024) and manuals<span class="cite" data-ref="card,asa2020,wan2024,crossley2011,aveir"></span>.</p>
<h3>The lecture’s versions</h3>
<p>The lecture gives two earlier charts. The perioperative management flowchart asks whether EMI is likely; if so, it disables high-voltage therapy in an ICD and enacts a plan for asynchronous pacing if the patient is pacing dependent. Its summary chart starts from EMI above the umbilicus, treats a source within 15 cm of the generator as a significant risk, assumes the magnet capability is enabled and asks for the CIED team’s advice for CRT devices<span class="cite" data-ref="lecture"></span>.</p>
<h3>The CIED team</h3>
<p>The HRS describes the CIED team as a heterogeneous group, led by an electrophysiologist, cardiologist, anesthesiologist or surgeon with expertise in CIED management. The best prescription comes when the patient’s CIED team is asked for advice and that advice is communicated to the procedural team<span class="cite" data-ref="lecture,crossley2011"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>EMI risk first: low risk needs no change beyond a magnet in the room.</li>
<li>Any ICD with high-risk EMI: suspend shocks and ATP, pads on.</li>
<li>Dependent or unsure: asynchronous pacing; an ICD needs programming for it.</li>
<li>Anything changed or any event: restore and interrogate before monitoring ends.</li>
</ol>`,
  quiz: [
    { q: 'High-risk EMI, a pacemaker, and the patient’s dependence is unknown. What does the card advise?', a: ['No asynchronous pacing', 'Treat as dependent: asynchronous pacing', 'Disable the pacemaker'], c: 1, why: 'Unknown dependence counts as potentially dependent; the path is “Yes / unsure”.<span class="cite" data-ref="card"></span>' },
    { q: 'Where should defibrillation pads go when an ICD is suspended?', a: ['Over the generator', 'Anterior–posterior, never over the generator, ≥15 cm from it when feasible', 'Wherever the drapes allow, after draping'], c: 1, why: 'Before draping, anterior–posterior, away from the generator.<span class="cite" data-ref="card"></span>' },
  ],
  figClass: 'pair',
  fig(host, st, ctx) {
    const F = flowchart(host, { w: 770, h: 710, nodes: NODES, edges: EDGES, cap: 'Bedside card · draft for discussion' });
    const notes = el('div', { class: 'card info' });
    host.append(notes);
    for (const n of NODES) if (n.note) {
      F.N[n.id].classList.add('click');
      F.N[n.id].addEventListener('click', () => { st.note = n.note; render(); });
    }
    const render = () => {
      const [n, e] = path(st);
      F.light(n, e);
      const [h, body] = NOTES[st.note];
      notes.innerHTML = `<div class="verdict" style="color:var(--accent)">${h}</div><p style="margin:4px 0 10px">${body}</p>
        <h4 style="font:600 .72rem var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);margin:10px 0 4px">This patient’s plan</h4>
        <ol>${plan(st).map(p => `<li>${p}</li>`).join('')}</ol><div style="color:var(--ink-3);font-size:.78rem">Source <span class="cite" data-ref="card"></span></div>`;
      ctx.cites(notes);
      const sel = document.getElementById('c-plan-note'); if (sel) sel.value = st.note;
    };
    render();
    return { update: render, live: () => `<b>Plan.</b> ${plan(st).join(' ')}` };
  },
};
