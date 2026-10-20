import { el, s, torso, drawDevice } from '../ui.js';

const DEV = {
  pm1: { label: 'Single-chamber pacemaker', ans: 'Pacemaker', cues: ['Pectoral generator', 'One thin lead to the right ventricle', 'No shock coil'] },
  pm2: { label: 'Dual-chamber pacemaker', ans: 'Pacemaker', cues: ['Pectoral generator', 'Right atrial lead (curving into the appendage) and right ventricular lead', 'No shock coil'] },
  icd1: { label: 'Single-chamber ICD', ans: 'ICD', cues: ['Larger pectoral generator', 'Right ventricular lead with a thick, radiopaque shock coil'] },
  icd2: { label: 'Dual-chamber ICD', ans: 'ICD', cues: ['Atrial lead and a right ventricular lead with a shock coil'] },
  crtp: { label: 'CRT-P (biventricular pacemaker)', ans: 'CRT-P', cues: ['Three leads: right atrium, right ventricle and coronary sinus (LV)', 'No shock coil'] },
  crtd: { label: 'CRT-D', ans: 'CRT-D', cues: ['Three leads including a coronary sinus lead', 'Shock coil on the right ventricular lead'] },
  sicd: { label: 'Subcutaneous ICD (S-ICD)', ans: 'S-ICD', cues: ['Generator in the left mid-axillary line, about the 6th intercostal space', 'One subcutaneous electrode along the left sternal border', 'No leads in the heart'] },
  evicd: { label: 'Extravascular ICD (EV-ICD)', ans: 'EV-ICD', cues: ['Generator in the left mid-axillary region', 'One lead running under the sternum', 'No leads in the heart'] },
  micra: { label: 'Leadless pacemaker', ans: 'Leadless', cues: ['A capsule in the right ventricle', 'No generator in the chest wall and no leads'] },
  abd: { label: 'Abdominal generator, epicardial lead', ans: 'Pacemaker', cues: ['Generator in the upper abdomen', 'Epicardial lead to the heart; no transvenous leads'] },
};
const ANSWERS = ['Pacemaker', 'ICD', 'CRT-P', 'CRT-D', 'S-ICD', 'EV-ICD', 'Leadless'];

export default {
  key: 'identify', num: '08', part: 'IV', title: 'Identify the device', short: 'Identify', kicker: 'Type, manufacturer and the chest radiograph',
  dek: 'Perioperative care starts with knowing which device the patient has: pacemaker or defibrillator, the manufacturer and model, where the generator sits and where its leads run. The chest radiograph answers much of this when no record is at hand.',
  state: { mode: 'explore', dev: 'crtd', q: 'icd2', answered: '' },
  controls: [
    { t: 'seg', k: 'mode', label: 'Mode', opts: [['explore', 'Explore'], ['quiz', 'Which device is this?']] },
    { t: 'select', k: 'dev', label: 'Device', opts: Object.entries(DEV).map(([k, v]) => [k, v.label]), when: s => s.mode === 'explore' },
    { t: 'act', label: 'Your answer', items: ANSWERS.map(a => [a, a]), when: s => s.mode === 'quiz' },
    { t: 'act', label: '', items: [['next', 'Next radiograph']], when: s => s.mode === 'quiz' },
  ],
  steps: [
    { set: { mode: 'explore', dev: 'pm2' }, note: '<b>Dual-chamber pacemaker.</b> Two thin leads, no coil.' },
    { set: { dev: 'icd2' }, note: '<b>ICD.</b> The thick shock coil on the right ventricular lead marks a defibrillator.' },
    { set: { dev: 'crtd' }, note: '<b>CRT-D.</b> A third lead in the coronary sinus paces the left ventricle.' },
    { set: { dev: 'sicd' }, note: '<b>S-ICD.</b> Lateral generator, parasternal electrode, nothing in the heart.' },
    { set: { dev: 'micra' }, note: '<b>Leadless pacemaker.</b> A capsule in the right ventricle.' },
  ],
  prose: `
<h3>Determining the device</h3>
<ol class="steps">
<li>Ask the patient, and look for the device identification card<span class="cite" data-ref="lecture,sj2018"></span>.</li>
<li>Check the medical record for the type, manufacturer, model, indication and last interrogation<span class="cite" data-ref="lecture,card"></span>.</li>
<li>Obtain a chest radiograph<span class="cite" data-ref="lecture"></span>.</li>
<li>Once the manufacturer is known, interrogate with that manufacturer’s programmer, or call the manufacturer, which may hold the patient in its database<span class="cite" data-ref="lecture"></span>.</li>
</ol>
<h3>What the radiograph shows</h3>
<p>A shock coil distinguishes an ICD from a pacemaker; a coronary sinus lead marks CRT<span class="cite" data-ref="bio2019,bsc2019"></span>. The generator’s characteristic shape and an alphanumeric code identify the manufacturer: Boston Scientific and Biotronik generators carry a code, and Medtronic generators an identifier symbol and an MRI-conditional marker<span class="cite" data-ref="bsc2019,bio2019,mdt2020"></span>. The radiograph also shows whether the generator is left or right, which affects magnet access and planning, and can reveal possible lead damage<span class="cite" data-ref="sj2018"></span>. Identify every device: an abdominal generator, an S-ICD, an EV-ICD or a second system each changes the EMI map<span class="cite" data-ref="card"></span>.</p>
<h3>Manufacturer numbers</h3>
<div class="tablewrap"><table>
<tr><th>Manufacturer</th><th>Number</th><th>Source</th></tr>
<tr><td>Abbott (St. Jude)</td><td>1-800-722-3423 (1-800-PACE-ID)</td><td>2018 review</td></tr>
<tr><td>Abbott technical services</td><td>800-722-3774 <span class="tag confirm">hours: confirm</span></td><td>bedside card</td></tr>
<tr><td>Boston Scientific</td><td>1-800-227-3422 (1-800-CARDIAC)</td><td>2019 review; card</td></tr>
<tr><td>Medtronic</td><td>1-800-633-8766</td><td>2020 review</td></tr>
<tr><td>Medtronic technical services, 24 h</td><td>800-505-4636 (pacemaker) · 800-723-4636 (ICD)</td><td>bedside card</td></tr>
<tr><td>Biotronik, 24 h</td><td>800-547-0394</td><td>2019 review; card</td></tr>
<tr><td>MicroPort</td><td>877-663-7674 <span class="tag confirm">confirm route</span></td><td>bedside card</td></tr>
</table></div>
<p class="note">Sources<span class="cite" data-ref="sj2018,bsc2019,mdt2020,bio2019,card"></span>. Numbers change; check them before use.</p>
<h3>Leads and timing</h3>
<p>The HRS/ASA statement prefers leads to be mature, more than 3 months old, before an elective procedure<span class="cite" data-ref="sj2018"></span>. A recently implanted lead can be dislodged by a central line guidewire<span class="cite" data-ref="lecture"></span>.</p>
<h3>From the lecture</h3>
<p>A 97-year-old woman with an open femur fracture says, through her grandson, that a pacemaker was placed one month ago at another hospital. The manufacturer is unknown, the leads are immature and there is no report: identify the device by radiograph and the manufacturers’ databases, and involve the CIED team<span class="cite" data-ref="lecture,card"></span>.</p>`,
  quiz: [
    { q: 'On a chest radiograph, what distinguishes an ICD from a pacemaker?', a: ['A coronary sinus lead', 'A shock coil on the lead', 'A right-sided generator'], c: 1, why: 'The high-voltage (shock) coil marks a defibrillator.<span class="cite" data-ref="bio2019"></span>' },
  ],
  figClass: 'side',
  fig(host, st) {
    const T = torso(host, { cap: 'Chest radiograph (schematic)' });
    T.card.classList.add('xray');
    const info = el('div', { class: 'card info' });
    host.append(info);
    const extra = el('div', { class: 'card info' });
    host.append(extra);
    let result = '';
    const keys = Object.keys(DEV);
    const render = () => {
      T.layer.textContent = '';
      const k = st.mode === 'explore' ? st.dev : st.q;
      const g = s('g', {}, T.layer);
      drawDevice(g, k);
      const D = DEV[k];
      if (st.mode === 'explore') {
        info.innerHTML = `<div class="verdict" style="color:var(--accent)">${D.label}</div><ul>${D.cues.map(c => `<li>${c}</li>`).join('')}</ul>`;
        extra.innerHTML = `<h4 style="font:600 .72rem var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);margin:0 0 6px">What it changes</h4>${{
          Pacemaker: 'Is the patient pacing-dependent? What does a magnet do with this manufacturer and setting (chapter 06)?',
          ICD: 'Shocks and ATP need suspending if EMI risk is high; a magnet gives no pacing protection.',
          'CRT-P': 'Near-100% biventricular pacing: inhibition costs cardiac output even with an adequate underlying rhythm.',
          'CRT-D': 'As CRT-P, and a magnet suspends shocks but cannot make it asynchronous: program if pacing protection is needed.',
          'S-ICD': 'No bradycardia pacing. Its wide sensing field makes it prone to EMI; its zone reaches the groin.',
          'EV-ICD': 'Map EMI to the left axilla, lateral chest, sternum and subxiphoid region.',
          Leadless: 'Micra has no magnet response; AVEIR responds to a magnet placed over the heart.',
        }[D.ans]}`;
      } else {
        info.innerHTML = result ? `<div class="verdict ${result === 'right' ? 'low' : 'high'}">${result === 'right' ? 'Correct' : 'Not quite'}: ${D.label}</div><ul>${D.cues.map(c => `<li>${c}</li>`).join('')}</ul>` : '<div class="verdict">Which device is this?</div><p>Choose an answer on the left.</p>';
        extra.innerHTML = '<p style="color:var(--ink-2)">Look for: the number of leads, a shock coil, a coronary sinus lead, and where the generator sits.</p>';
      }
    };
    render();
    return {
      update(k) { if (k === 'mode') result = ''; render(); },
      action(a) {
        if (a === 'next') { let n; do n = keys[Math.floor(Math.random() * keys.length)]; while (n === st.q); st.q = n; result = ''; }
        else result = DEV[st.q].ans === a ? 'right' : 'wrong';
        render();
      },
    };
  },
};
