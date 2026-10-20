import { el } from '../ui.js';

export default {
  key: 'mri', num: 'B1', part: 'B', title: 'MRI and the device', short: 'MRI', kicker: 'MR conditional is not MR safe',
  dek: 'Every major manufacturer now makes MR-conditional generators and leads. "Conditional" means safe only under the conditions in the product labeling, with the device in its MRI mode and an institutional workflow around the scan.',
  state: { gen: true, leads: true, abandoned: false, epicardial: false, recent: false },
  controls: [
    { t: 'check', k: 'gen', label: 'Generator labeled MR conditional' },
    { t: 'check', k: 'leads', label: 'Leads labeled MR conditional, as a system with the generator' },
    { t: 'check', k: 'abandoned', label: 'Abandoned or fractured lead present' },
    { t: 'check', k: 'epicardial', label: 'Epicardial lead' },
    { t: 'check', k: 'recent', label: 'Implanted within the last 6 weeks' },
  ],
  steps: [
    { set: { gen: true, leads: true, abandoned: false, epicardial: false, recent: false }, note: '<b>MR-conditional system.</b> Scan under the labeling with the MRI mode on.' },
    { set: { abandoned: true }, note: '<b>Abandoned lead.</b> The system is treated as MR nonconditional.' },
  ],
  prose: `
<h3>Definitions</h3>
<div class="tablewrap"><table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td>MR safe</td><td>No hazard in any MR environment</td></tr>
<tr><td>MR conditional</td><td>No known hazard in a specified MR environment under specified conditions of use</td></tr>
<tr><td>MR unsafe</td><td>Known hazards in all MR environments</td></tr>
<tr><td>MR nonconditional</td><td>Any CIED not granted MR-conditional labeling</td></tr>
</table></div>
<p class="note">From the Medtronic review, after the 2017 HRS statement<span class="cite" data-ref="mdt2020,indik2017"></span>.</p>
<h3>MR-conditional devices</h3>
<p>Medtronic received the first FDA approval of an MR-conditional pacemaker in 2011. Conditional devices were generally approved for 1.5 T, a specific absorption rate up to 2 W/kg and gradients up to 200 T/m/s; newer devices may be approved for more. The product manual gives the device’s conditions, and MR-conditional generators carry a radiographic marker<span class="cite" data-ref="mdt2020"></span>.</p>
<p>The 2017 HRS statement permits MRI with an MR-conditional system when the labeling is followed, including the device’s MRI mode (for example Medtronic SureScan) and its scanning limits. It also recommends a standardized institutional workflow, ECG and pulse oximetry, staff with ACLS skills, someone able to program the device as institutional standards require, and an external defibrillator and programmer outside zone 4, because the programmers are MR unsafe. MRI soon after implantation of an MR-conditional device (within 6 weeks) may be reasonable when clinically needed<span class="cite" data-ref="mdt2020,indik2017"></span>.</p>
<p>Patients with abandoned, fractured or epicardial leads are treated as having MR-nonconditional systems. The statement gives specific conditions under which MRI may still be performed in a nonconditional system, including in a pacing-dependent patient<span class="cite" data-ref="mdt2020,indik2017"></span>.</p>
<h3>On the bedside card</h3>
<p>MRI follows a separate CIED MRI pathway, and magnets are not MRI-safe<span class="cite" data-ref="card"></span>. The S-ICD’s programmer is MR unsafe even though the EMBLEM MRI S-ICD is MR conditional<span class="cite" data-ref="bsc2019"></span>.</p>`,
  quiz: [
    { q: 'An MR-conditional generator is connected to an abandoned lead. How is the system treated?', a: ['MR conditional', 'MR nonconditional', 'MR safe'], c: 1, why: 'Abandoned, fractured and epicardial leads make the system MR nonconditional under the 2017 HRS statement.<span class="cite" data-ref="mdt2020,indik2017"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const render = () => {
      const cond = st.gen && st.leads && !st.abandoned && !st.epicardial;
      card.innerHTML = `<div class="verdict ${cond ? 'low' : 'high'}" style="font-size:1.4rem">${cond ? 'MR-conditional system' : 'Treat as MR nonconditional'}</div>
        <ul>${cond ? '<li>Scan only within the labeled conditions (field strength, SAR, gradients).</li><li>Program the device’s MRI mode beforehand; restore afterwards.</li>' + (st.recent ? '<li>Implanted within 6 weeks: the 2017 statement finds MRI reasonable when clinically needed.</li>' : '')
          : `${!st.gen || !st.leads ? '<li>The generator and leads are not labeled together as an MR-conditional system.</li>' : ''}${st.abandoned ? '<li>Abandoned or fractured lead.</li>' : ''}${st.epicardial ? '<li>Epicardial lead.</li>' : ''}<li>The 2017 HRS statement sets specific conditions for scanning nonconditional systems; the CIED team and radiology decide.</li>`}
        <li>ECG and pulse oximetry; ACLS-trained staff; programmer and external defibrillator outside zone 4.</li><li>Use the institution’s CIED MRI pathway; magnets are not MRI-safe.</li></ul>
        <div style="color:var(--ink-3);font-size:.78rem">Sources <span class="cite" data-ref="mdt2020,indik2017,card"></span></div>`;
      ctx.cites(card);
    };
    render();
    return { update: render };
  },
};
