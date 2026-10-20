import { el } from '../ui.js';

const MAKER = {
  abbott: { label: 'Abbott (St. Jude)', p: 1.5, r: 4, hv: [25, 125], pages: 'FastPath Summary and Parameters pages', magnet: 'Parameters page, basic operation', ref: 'sj2018' },
  bsc: { label: 'Boston Scientific', p: 2, r: 5, hv: [20, 200], pages: 'Device Follow-Up, Patient Data and Device Settings pages', magnet: 'Device Settings, “Magnet and Beeper”', ref: 'bsc2019' },
  mdt: { label: 'Medtronic', p: 1, r: 4, hv: null, pages: 'Session Summary and Quick Look pages', magnet: 'Tests section, Magnet tab', ref: 'mdt2020' },
  bio: { label: 'Biotronik', p: 1.5, r: 4, hv: null, pages: 'Follow-up and “Parameters – bradycardia” pages', magnet: '“Parameters – bradycardia”, first section', ref: 'bio2019' },
};
const TYPE = { pm: 'Pacemaker', crtp: 'CRT-P', icd: 'ICD', crtd: 'CRT-D', lp: 'Leadless pacemaker' };

function windowMonths(st) {
  if (st.guide === 'card') return ['icd', 'crtd', 'lp'].includes(st.type) ? 3 : 6;
  return st.type === 'pm' || st.type === 'lp' ? 12 : st.type === 'crtp' || st.type === 'crtd' ? 6 : 6;
}

function grade(st) {
  const M = MAKER[st.maker], isICD = st.type === 'icd' || st.type === 'crtd', R = [];
  const add = (label, value, f, why, ref) => R.push({ label, value, f, why, ref });
  const win = windowMonths(st);
  add('Last interrogation', `${st.lastInt} months ago`, st.lastInt <= win ? 'ok' : 'flag',
    `${st.guide === 'card' ? 'Bedside card (local policy)' : 'HRS/ASA 2011'}: within ${win} months for ${/^[AEIOU]/.test(TYPE[st.type]) ? 'an' : 'a'} ${TYPE[st.type]}.${st.guide === 'hrs' && (st.type === 'crtp' || st.type === 'crtd') ? ' The lecture gives 3–6 months for CRT.' : ''}${st.lastInt > win ? ' Outdated but usable for a low-risk case: do not delay; baseline ECG, magnet ready. Otherwise involve the CIED team.' : ''}`, st.guide === 'card' ? 'card' : 'sj2018,bsc2019');
  add('Battery longevity', `${st.batt} months`, st.batt > 3 ? 'ok' : 'flag', 'HRS: more than 3 months.', 'sj2018,bsc2019');
  if (st.type !== 'lp') add('Lead age', `${st.leadAge} months`, st.leadAge > 3 ? 'ok' : 'warn', 'HRS/ASA: leads mature (more than 3 months) before elective surgery.', 'sj2018');
  add('Ventricular capture threshold', `${st.vThr} V @ 0.5 ms`, st.vThr < 3 ? 'ok' : 'flag', 'Chronic threshold below 3.0 V.', 'sj2018,mdt2020,bsc2019');
  const margin = st.vOut / st.vThr;
  add('Output : threshold', `${st.vOut} V : ${st.vThr} V = ${margin.toFixed(1)} : 1`, margin >= 2 ? 'ok' : 'flag', 'With a fixed output, a safety margin of at least 2:1 (devices with automatic capture adjust their own margin).', 'sj2018,mdt2020');
  if (st.type !== 'lp') add('P wave', `${st.p} mV`, st.p > M.p || (st.maker === 'mdt' && st.p >= 1) ? 'ok' : 'flag', st.maker === 'mdt' ? 'Commonly > 1.5 mV chronic; the Azure manual accepts 1 mV or more for chronic leads.' : `${M.label}: above ${M.p} mV.`, M.ref);
  add('R wave', `${st.r} mV`, st.r > M.r ? 'ok' : 'flag', `${M.label}: above ${st.maker === 'mdt' ? '4–5' : M.r} mV; smaller signals risk undersensing.`, M.ref);
  add('Pacing lead impedance', `${st.imp} Ω`, st.imp >= 300 && st.imp <= 1200 ? 'ok' : 'flag', '300–1,200 Ω. Low suggests an insulation breach; high suggests a fracture or a poor connection (or a pin plug in an unused port).', 'sj2018,mdt2020');
  if (isICD) add('Shock (HV) impedance', `${st.hv} Ω`, M.hv ? (st.hv >= M.hv[0] && st.hv <= M.hv[1] ? 'ok' : 'flag') : 'warn',
    M.hv ? `${M.label}: ${M.hv[0]}–${M.hv[1]} Ω. An acute rise also needs investigation.` : 'The review gives no range for this manufacturer; check the report’s own alerts.', M.ref);
  add('Ventricular paced', `${st.pctV} %`, st.pctV >= 50 ? 'warn' : 'ok', st.pctV >= 50 ? 'Pacing before most beats: treat as potentially dependent until reviewed. No percentage defines dependence.' : 'Mostly intrinsic beats; confirm the underlying rhythm.', 'card,mdt2020');
  add('Magnet response', st.magnet, st.magnet === 'enabled' ? 'ok' : 'flag', `Confirm it before relying on a magnet. Found in: ${M.magnet}.`, M.ref);
  add('Rate response', st.rr ? 'on' : 'off', st.rr ? 'warn' : 'ok', st.rr ? 'Suspend for surgery.' : 'Off.', 'card,bsc2019');
  if (isICD) add('Tachy events since last check', `${st.events}`, st.events > 0 ? 'warn' : 'ok', st.events > 0 ? 'Recent arrhythmia: weigh programming versus a magnet, and monitoring afterwards.' : 'None recorded.', 'sj2018,bsc2019');
  return R;
}

export default {
  key: 'report', num: '09', part: 'IV', title: 'Reading the interrogation report', short: 'Report', kicker: 'What to check before surgery',
  dek: 'Most of what anesthesia needs is on two or three pages of an interrogation report: the device and indication, the date, battery, leads, thresholds, sensing, impedances, the percentage paced, the magnet response and rate response.',
  state: { maker: 'abbott', type: 'icd', guide: 'card', lastInt: 4, batt: 60, leadAge: 40, vThr: 1.25, vOut: 2.5, p: 3, r: 9, imp: 580, hv: 70, pctV: 12, magnet: 'enabled', rr: true, events: 0 },
  controls: [
    { t: 'select', k: 'maker', label: 'Manufacturer', opts: Object.entries(MAKER).map(([k, v]) => [k, v.label]) },
    { t: 'seg', k: 'type', label: 'Device', opts: Object.entries(TYPE) },
    { t: 'seg', k: 'guide', label: 'Interrogation window', opts: [['card', 'Bedside card'], ['hrs', 'HRS/ASA 2011']] },
  ],
  steps: [
    { set: { guide: 'hrs', lastInt: 4, type: 'icd' }, note: '<b>HRS/ASA 2011.</b> An ICD checked 4 months ago is within 6 months.' },
    { set: { guide: 'card' }, note: '<b>The bedside card.</b> For an ICD the local window is 3 months, so the same report is outdated.' },
  ],
  prose: `
<h3>Where to look</h3>
<ul>
<li><b>Abbott (St. Jude):</b> the FastPath Summary and Parameters pages; the magnet response is on the Parameters page under basic operation<span class="cite" data-ref="sj2018"></span>.</li>
<li><b>Boston Scientific:</b> Device Follow-Up, Patient Data and Device Settings; the magnet response is under “Magnet and Beeper”. The S-ICD Summary Report holds the mode, battery, electrode impedance, post-shock pacing and episodes<span class="cite" data-ref="bsc2019"></span>.</li>
<li><b>Medtronic:</b> Session Summary and Quick Look; percentage paced is in Quick Look<span class="cite" data-ref="mdt2020"></span>.</li>
<li><b>Biotronik:</b> Follow-up and “Parameters – bradycardia”, which holds the magnet response, mode and basic rate; tachy zones are under “Parameters – overview”<span class="cite" data-ref="bio2019"></span>.</li>
</ul>
<h3>How recent?</h3>
<p>HRS/ASA 2011: a pacemaker within 12 months and an ICD within 6 months of elective surgery<span class="cite" data-ref="crossley2011,sj2018"></span>. The lecture gives 3–6 months for CRT devices<span class="cite" data-ref="lecture"></span>. The bedside card sets the local windows at 3 months for an ICD, CRT-D or leadless device and 6 months for a pacemaker or CRT-P. When a report is outdated but usable, it advises not delaying low-risk cases (baseline ECG, magnet ready), and referring to the device nurse or EP when there is no report, the device or its function is unknown, malfunction is suspected, or a dependent patient faces high-risk EMI<span class="cite" data-ref="card"></span>.</p>
<h3>The numbers</h3>
<ul>
<li><b>Capture threshold</b>: the least stimulus that reliably captures, usually reported in volts at a pulse width of 0.4–0.6 ms. Chronic values below 3.0 V at 0.5 ms; with a fixed output, a 2:1 margin<span class="cite" data-ref="sj2018,mdt2020"></span>. Boston Scientific notes that a chronic threshold above 3 V can lead to loss of capture<span class="cite" data-ref="bsc2019"></span>.</li>
<li><b>Sensing</b>: the larger the intrinsic signal, the more reliably it is sensed. Acceptable chronic P waves are above 1.5 mV and R waves above 4 mV (Abbott); Boston Scientific gives 2 mV and 5 mV<span class="cite" data-ref="sj2018,bsc2019"></span>. The programmed sensitivity (for example 0.5 mV atrial, 2.0 mV ventricular) sets the smallest signal the device will count; an excessively sensitive setting risks inhibition<span class="cite" data-ref="sj2018"></span>.</li>
<li><b>Impedance</b>: pacing leads 300–1,200 Ω at 0.5 ms. Low suggests an insulation breach; high suggests a fracture, a poor connection or a pin plug in an unused port<span class="cite" data-ref="sj2018,mdt2020"></span>. Shock coil: 25–125 Ω (Abbott) or 20–200 Ω (Boston Scientific)<span class="cite" data-ref="sj2018,bsc2019"></span>. The S-ICD electrode is “OK” below 400 Ω<span class="cite" data-ref="bsc2019"></span>.</li>
<li><b>Battery</b>: more than 3 months remaining<span class="cite" data-ref="sj2018,bsc2019"></span>.</li>
</ul>
<h3>Dependence</h3>
<p>No percentage defines pacing dependence<span class="cite" data-ref="mdt2020"></span>. Use, in order, the interrogation, the ECG or telemetry, and the patient’s report; pacing before most or all beats, or an unknown answer, means potentially dependent until reviewed. Anesthesia can increase dependence<span class="cite" data-ref="card"></span>. The underlying rhythm can be tested by temporarily programming VVI at 30 per minute<span class="cite" data-ref="sj2018"></span>.</p>
<h3>Who interrogates?</h3>
<p>Industry-employed allied professionals interrogate and reprogram only at the request and direction of a physician; when an anesthesiologist requests their support without another physician involved, the anesthesiologist is the responsible physician<span class="cite" data-ref="bio2019"></span>. The HRS states that the perioperative prescription should not be determined and delivered by an industry representative, and that the best prescription comes from the patient’s CIED team<span class="cite" data-ref="lecture,crossley2011"></span>.</p>`,
  quiz: [
    { q: 'A pacing lead impedance of 3,400 Ω most suggests:', a: ['An insulation breach', 'A lead fracture, poor connection or pin plug', 'Normal function'], c: 1, why: 'High impedance suggests a fracture or poor connection; in the Medtronic example it was a pin plug sealing an unused port.<span class="cite" data-ref="mdt2020,sj2018"></span>' },
    { q: 'Fixed output 2.0 V, ventricular threshold 1.5 V. Is the safety margin adequate?', a: ['Yes', 'No: it is below 2:1'], c: 1, why: '2.0 ÷ 1.5 ≈ 1.3:1; the accepted margin for a fixed output is 2:1.<span class="cite" data-ref="sj2018"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card report' });
    host.append(card);
    const FIELDS = [
      ['lastInt', 'Last interrogation (months ago)', 0, 36, 1], ['batt', 'Battery longevity (months)', 0, 150, 1], ['leadAge', 'Lead age (months)', 0, 200, 1],
      ['vThr', 'Ventricular threshold (V)', 0.25, 6, 0.25], ['vOut', 'Ventricular output (V)', 0.5, 7.5, 0.25], ['p', 'P wave (mV)', 0.2, 8, 0.1], ['r', 'R wave (mV)', 0.5, 25, 0.5],
      ['imp', 'Pacing impedance (Ω)', 100, 4000, 10], ['hv', 'Shock impedance (Ω)', 5, 300, 1], ['pctV', 'Ventricular paced (%)', 0, 100, 1], ['events', 'VT/VF episodes since last check', 0, 20, 1],
    ];
    const render = () => {
      const G = grade(st), flags = G.filter(g => g.f === 'flag').length;
      card.innerHTML = `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b>${MAKER[st.maker].label} · ${TYPE[st.type]}</b><span style="color:${flags ? 'var(--flag)' : 'var(--ok)'}">${flags ? `${flags} item${flags > 1 ? 's need' : ' needs'} attention` : 'No red flags'}</span></div>
        <div style="color:var(--ink-3);font:400 .78rem var(--sans);margin-top:4px">Report pages: ${MAKER[st.maker].pages}. Edit the values; each is graded as you type.</div>`;
      const ed = el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:12px 0' });
      for (const [k, lab, mn, mx, stp] of FIELDS) {
        if ((k === 'hv' || k === 'events') && !(st.type === 'icd' || st.type === 'crtd')) continue;
        if ((k === 'p' || k === 'leadAge') && st.type === 'lp') continue;
        const id = `rep-${k}`;
        const inp = el('input', { type: 'number', id, min: mn, max: mx, step: stp, value: st[k] });
        inp.addEventListener('change', () => { const v = parseFloat(inp.value); if (!Number.isNaN(v)) { st[k] = v; render(); } });
        ed.append(el('label', { for: id, style: 'display:grid;gap:3px;font:500 .7rem var(--sans);color:var(--ink-2)' }, lab, inp));
      }
      const sel = el('select', { id: 'rep-magnet' }, ...['enabled', 'disabled', 'unknown'].map(v => el('option', { value: v }, v)));
      sel.value = st.magnet; sel.addEventListener('change', () => { st.magnet = sel.value; render(); });
      const rr = el('select', { id: 'rep-rr' }, el('option', { value: '1' }, 'on'), el('option', { value: '0' }, 'off'));
      rr.value = st.rr ? '1' : '0'; rr.addEventListener('change', () => { st.rr = rr.value === '1'; render(); });
      ed.append(el('label', { for: 'rep-magnet', style: 'display:grid;gap:3px;font:500 .7rem var(--sans);color:var(--ink-2)' }, 'Magnet response', sel),
        el('label', { for: 'rep-rr', style: 'display:grid;gap:3px;font:500 .7rem var(--sans);color:var(--ink-2)' }, 'Rate response', rr));
      ed.querySelectorAll('input,select').forEach(i => { i.style.cssText = 'width:100%;border:1px solid var(--rule);background:var(--paper);border-radius:5px;padding:4px 6px;font:500 .85rem var(--mono)'; });
      card.append(ed);
      for (const g of G) {
        card.append(el('div', { class: 'row' }, el('span', {}, g.label), el('b', {}, g.value),
          el('span', { class: `verdict ${g.f}`, html: `${g.f === 'ok' ? '✓' : g.f === 'flag' ? '✗' : '!'} ${g.why}<span class="cite" data-ref="${g.ref}"></span>` })));
      }
      ctx.cites(card);
    };
    render();
    return {
      update: render,
      readouts: () => {
        const G = grade(st);
        return [
          { k: 'Interrogation window', v: windowMonths(st), u: 'months' },
          { k: 'Red flags', v: G.filter(g => g.f === 'flag').length, f: G.some(g => g.f === 'flag') ? 'flag' : 'ok' },
          { k: 'To review', v: G.filter(g => g.f === 'warn').length, f: G.some(g => g.f === 'warn') ? 'warn' : '' },
        ];
      },
    };
  },
};
