import { el } from '../ui.js';

const EVENTS = [
  ['reprog', 'Device reprogrammed before or during surgery'],
  ['emiAbove', 'EMI above the umbilicus'],
  ['emiBelow', 'EMI below the umbilicus only'],
  ['emi15', 'EMI within 15 cm of the generator'],
  ['cardiac', 'Cardiothoracic surgery'],
  ['arrest', 'Cardiac arrest, CPR, VT or VF'],
  ['ext', 'External cardioversion or defibrillation'],
  ['icdTx', 'ICD shock or ATP delivered'],
  ['tempPace', 'Temporary pacing used'],
  ['rfa', 'Radiofrequency ablation or radiation therapy'],
  ['emerg', 'Emergency surgery without adequate device evaluation'],
  ['hemo', 'Hemodynamically challenging surgery'],
  ['blood', 'Blood products given'],
  ['devProb', 'Rate below programmed, capture or sensing problem, or suspected reset'],
];

function verdicts(st) {
  const e = k => !!st[k];
  // HRS/ASA 2011, as summarized in the 2019 Biotronik review and the lecture
  const hrsNow = e('reprog') || e('hemo') || e('arrest') || e('tempPace') || e('ext') || e('emerg') || e('emiAbove') || e('cardiac') || e('rfa');
  const hrs = hrsNow ? ['before', 'Before discharge or transfer from a monitored setting.']
    : e('emiBelow') || e('emi15') ? ['month', 'Within 1 month (most cases involving EMI).'] : ['routine', 'Routine follow-up.'];
  // ASA 2011: evaluation in PACU/ICU unless low risk
  const asaLow = !e('reprog') && !e('emiAbove') && !e('emiBelow') && !e('emi15') && !e('blood') && !e('arrest') && !e('ext') && !e('icdTx') && !e('emerg') && !e('devProb') && !e('tempPace');
  const asa = asaLow ? ['routine', 'Low risk: a postoperative evaluation may not be needed.'] : ['before', 'Interrogate in the PACU or ICU (the lecture adds: within 1 month if not done immediately).'];
  // bedside card note 9
  const cardNow = e('reprog') || e('emerg') || e('icdTx') || e('ext') || e('arrest') || e('devProb') || e('emiAbove') || e('emi15');
  const card = cardNow ? ['before', 'Restore all settings and interrogate before leaving monitored care.'] : ['routine', 'Remove the magnet; routine follow-up.'];
  return { hrs, asa, card };
}

export default {
  key: 'postop', num: '12', part: 'IV', title: 'After surgery', short: 'Postop', kicker: 'Restore, interrogate, document',
  dek: 'Every change made for surgery must be undone before the patient leaves monitoring, and some patients need their device checked even when nothing was changed. The guidelines differ in how they draw that line.',
  state: { reprog: true, emiAbove: true },
  controls: EVENTS.map(([k, t]) => ({ t: 'check', k, label: t })),
  steps: [
    { set: { reprog: false, emiAbove: false, emiBelow: true }, note: '<b>Hernia repair, nothing changed.</b> HRS: within a month; the card: routine follow-up.' },
    { set: { reprog: true }, note: '<b>Reprogrammed.</b> Every framework: check before monitoring ends.' },
  ],
  prose: `
<h3>Restore first</h3>
<p>Remove the magnet once EMI has ended. Restore every change (ICD therapies, pacing mode, rate response) and document it; until then keep telemetry, pads and rescue capability<span class="cite" data-ref="card"></span>. An ICD disabled for surgery must stay monitored (ECG and pulse oximetry) until its therapy is restored, and it should be re-enabled before discharge from the PACU<span class="cite" data-ref="lecture,bio2019"></span>. Perioperative programming always mandates a postoperative interrogation<span class="cite" data-ref="sj2018,bio2019"></span>.</p>
<h3>HRS/ASA 2011</h3>
<p>Three groups: evaluation before discharge or transfer from a monitored setting; evaluation within 1 month; routine follow-up. The device is checked before monitoring ends if it was reprogrammed; if surgery was hemodynamically challenging, emergent, or marked by cardiac arrest, temporary pacing or cardioversion; if EMI occurred above the umbilicus; if logistics would prevent a check within a month; and after cardiothoracic surgery, external cardioversion, radiofrequency ablation and therapeutic radiation<span class="cite" data-ref="bio2019,crossley2011"></span>. For most other cases involving EMI, interrogation can take place within one month<span class="cite" data-ref="lecture"></span>.</p>
<h3>ASA 2011</h3>
<p>The advisory suggests interrogation in the PACU or ICU, but accepts that it may not be needed in low-risk situations: no possibility of intraoperative EMI, no blood products, no programming, no complications and an appropriate preoperative evaluation<span class="cite" data-ref="bio2019,asa2011"></span>. The lecture quotes it: otherwise, interrogation should occur within one month<span class="cite" data-ref="lecture"></span>.</p>
<h3>The lecture’s postoperative chart</h3>
<p>Was the CIED reprogrammed? Did EMI occur? Any additional considerations? If any answer is yes, obtain a CIED check and restore as needed. For EMI within 15 cm of the generator, the check should be before discharge; for surgery below the umbilicus, or when only programming enhancements were disabled, it can be done as an outpatient up to 30 days later<span class="cite" data-ref="lecture"></span>.</p>
<h3>The bedside card</h3>
<p>Interrogate if the device was reprogrammed; after emergency surgery without adequate evaluation (any zone) or in a high-risk zone (local policy); after an ICD shock or ATP, an external shock, VT, VF or arrest; after significant EMI; or if the rate is unexpectedly below the programmed rate, there is a capture or sensing problem, or reset is suspected<span class="cite" data-ref="card"></span>.</p>
<p class="note">The figure treats "significant EMI" on the card as EMI above the umbilicus or within 15 cm. <span class="tag confirm">confirm</span> Who removes the magnet and who restores settings is unresolved on the card.</p>
<h3>Documentation</h3>
<p>Record any change to the pacing mode, rate response or ICD therapies in the medical record<span class="cite" data-ref="lecture"></span>, and print a report whenever settings change<span class="cite" data-ref="sj2018,bsc2019"></span>.</p>`,
  quiz: [
    { q: 'An ICD’s therapies were programmed off for surgery. When must they be restored?', a: ['At the next clinic visit', 'Before the patient leaves the monitored setting', 'Within 1 month'], c: 1, why: 'Reprogramming mandates a check and restoration before monitoring ends; until then, monitoring and an external defibrillator.<span class="cite" data-ref="bio2019,card"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const col = ([k, t], title, ref) => `<div class="box ${k === 'before' ? 'red' : k === 'month' ? '' : 'hl'}"><h5>${title}</h5><div class="verdict" style="font-size:1rem;color:${k === 'before' ? 'var(--flag)' : k === 'month' ? 'var(--warn)' : 'var(--ok)'}">${{ before: 'Check before monitoring ends', month: 'Check within 1 month', routine: 'Routine follow-up' }[k]}</div>${t}<span class="cite" data-ref="${ref}"></span></div>`;
    const render = () => {
      const V = verdicts(st);
      const on = EVENTS.filter(([k]) => st[k]).map(([, t]) => t);
      card.innerHTML = `<div class="verdict">Postoperative device check</div><p style="margin:0 0 10px;color:var(--ink-2)">${on.length ? on.join(' · ') : 'Nothing happened and nothing was changed.'}</p>
        <div class="grid2" style="padding:0">${col(V.hrs, 'HRS/ASA 2011', 'bio2019,lecture')}${col(V.asa, 'ASA 2011', 'bio2019,lecture')}${col(V.card, 'Bedside card (2026 draft)', 'card')}</div>`;
      ctx.cites(card);
    };
    render();
    return { update: render };
  },
};
