import { el, liveStrip } from '../ui.js';

const CASES = {
  spine: {
    title: 'Prone spine surgery with an ICD', ref: 'lecture',
    intro: 'A 75-year-old woman with a cardiomyopathy (EF 30%) and a transvenous ICD for primary prevention is scheduled for a two-level lumbar fusion, prone. She is not pacing dependent. The surgeon and anesthesiologist agree to use bipolar cautery only.',
    dev: { mode: 'DDD', lrl: 50, icd: true, tachy: true }, pat: { sinus: 72, av: 'normal' },
    qs: [
      { q: 'What is the plan for the ICD?', a: ['Nothing: bipolar only, so EMI risk is low', 'Program tachy therapies off before positioning; pads on, away from the generator', 'Tape a magnet over the generator after turning her prone'], c: 1,
        why: 'Once she is prone, a magnet cannot be watched or adjusted, and spinal surgery is on the card’s list where shocks may be suspended even at low EMI risk because of movement from a shock. Plans also change: a second surgeon may use monopolar cautery.', ref: 'card,lecture', act: null },
      { q: 'A second surgeon arrives and uses monopolar cautery. The therapies were left on. What happens?', a: ['Nothing: the ICD ignores cautery', 'The noise is counted as VF and the ICD shocks', 'The ICD paces asynchronously'], c: 1,
        why: 'In the lecture’s case, inappropriate discharges followed. Prolonged noise on the lead is detected as VF.', ref: 'lecture', act: 'burst' },
      { q: 'Had a magnet been used and slipped off, how would anyone have known?', a: ['The paced rate would change', 'Only by checking the magnet’s position or the device; an ICD magnet does not change the ECG', 'A continuous tone would stop'], c: 1,
        why: 'An ICD magnet leaves pacing unchanged and tones are unreliable; palpation confirms position only. This is why programming is preferred when the generator cannot be seen.', ref: 'card', act: null },
    ],
  },
  carotid: {
    title: 'Carotid endarterectomy, Biotronik pacemaker', ref: 'bio2019',
    intro: 'An 88-year-old man with second-degree AV block and bifascicular block has a Biotronik Eluna 8 DR-T pacemaker (atrial pacing 28%, ventricular pacing 98%). On a cardiologist’s advice, a magnet is placed over the generator for a right carotid endarterectomy with SSEP and EEG monitoring.',
    dev: { mode: 'DDD', lrl: 60, url: 110 }, pat: { sinus: 55, av: 'chb', escape: 0 },
    qs: [
      { q: 'With the magnet on, the monitor shows pacing at 60, not 90. Why?', a: ['The battery is at ERI', 'The magnet response is Auto: 10 asynchronous beats, then the programmed settings', 'The magnet is not over the generator'], c: 1,
        why: 'Auto is the Biotronik default. Neither the anesthesia team nor the cardiologist knew the response was programmable.', ref: 'bio2019', act: 'magnet' },
      { q: 'An hour later the paced rate jumps to 110 as SSEP monitoring begins. The magnet is still in place. What is the likeliest mechanism?', a: ['Rate response', 'Ventricular tracking of the SSEP stimuli sensed as atrial activity', 'Pacemaker-mediated tachycardia'], c: 1,
        why: 'The programmed settings had no rate response; the proposed mechanism was tracking of SSEPs as atrial activity. Reducing the SSEP frequency and power restored pacing at 60.', ref: 'bio2019', act: 'ssep' },
      { q: 'What would have been the best management?', a: ['A stronger magnet', 'Interrogate and program an asynchronous mode (or confirm and program the magnet response to Asynchronous at an appropriate rate)', 'Stop the neuromonitoring'], c: 1,
        why: 'The review’s authors favor perioperative interrogation and programming; a magnet works only if its response is Asynchronous and the rate suits the patient.', ref: 'bio2019', act: 'program' },
    ],
  },
  femur: {
    title: 'Unknown pacemaker, open femur fracture', ref: 'lecture',
    intro: 'A 97-year-old woman with an open femur fracture after a car crash says, through her 12-year-old grandson, that she had a pacemaker placed “in the valley” a month ago. There is no record or card.',
    dev: { mode: 'DDD', lrl: 60 }, pat: { sinus: 80, av: 'chb', escape: 0 },
    qs: [
      { q: 'What comes first?', a: ['Put a magnet on and go', 'Pulse monitoring and pads; identify the device from the radiograph and the manufacturers’ databases; involve the CIED team', 'Delay surgery until her cardiologist is found'], c: 1,
        why: 'Unknown device, unknown function and a recent implant call for the device nurse or EP; in the meantime the emergency protocol applies.', ref: 'lecture,card', act: null },
      { q: 'The ECG shows ventricular pacing before every beat. How do you treat dependence?', a: ['Not dependent until proven', 'Potentially dependent until reviewed', 'Dependent only if the rate is below 40'], c: 1,
        why: 'Pacing before most or all beats, or an unknown answer, counts as potentially dependent.', ref: 'card', act: null },
      { q: 'A central line is needed. What is the concern?', a: ['None for pacemakers', 'A guidewire can dislodge leads, especially in the first months after implant, or cause oversensing', 'The line will reprogram the device'], c: 1,
        why: 'Monitor the ECG and pulse during placement; her leads are a month old.', ref: 'lecture', act: null },
      { q: 'After surgery the device was never interrogated. What now?', a: ['Routine follow-up', 'Interrogate before she leaves monitored care: emergency surgery without adequate evaluation', 'Interrogate at 6 months'], c: 1,
        why: 'Emergency surgery without adequate device evaluation is an indication to interrogate after surgery.', ref: 'card,bio2019', act: null },
    ],
  },
};

export default {
  key: 'cases', num: 'B2', part: 'B', title: 'Cases', short: 'Cases', kicker: 'From the lecture and the literature',
  dek: 'Three patients, each a decision at a time: an ICD in a prone patient, a Biotronik pacemaker with a magnet that did not do what was expected, and an unknown pacemaker in an emergency.',
  state: { case: 'carotid', step: 0 },
  controls: [
    { t: 'select', k: 'case', label: 'Case', opts: Object.entries(CASES).map(([k, v]) => [k, v.title]) },
    { t: 'act', label: '', items: [['restart', 'Restart the case']] },
  ],
  prose: `
<h3>The cases</h3>
<ul>
<li><b>Prone spine surgery with an ICD</b>: the lecture’s case of a planned bipolar-only spinal fusion in which monopolar cautery caused inappropriate shocks<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Carotid endarterectomy with a Biotronik pacemaker</b>: the case report in the Biotronik review<span class="cite" data-ref="bio2019"></span>.</li>
<li><b>Unknown pacemaker, open femur fracture</b>: from the lecture<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<p>Choose an answer in the figure; each answer explains itself and plays the matching event on the strip.</p>
<h3>Lessons</h3>
<ol class="steps">
<li>Agree a plan with the surgeons and the CIED team before the case, and plan for it to change.</li>
<li>Know the programmed magnet response before relying on a magnet.</li>
<li>Unknown devices are potentially dependent until reviewed; check them after emergency surgery.</li>
</ol>`,
  figClass: 'two',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    let C = CASES[st.case], chosen = null, magnetCycles = null;
    const ls = liveStrip(host, C.dev, C.pat, { title: 'ECG II · MARKER CHANNEL', sub: () => `${ls.sim.dev.mode} ${ls.sim.dev.lrl}${magnetCycles !== null ? ' · MAGNET' : ''}` });
    const play = act => {
      const sim = ls.sim;
      if (act === 'burst') sim.addEMI(sim.t, sim.t + 9000, 0, 3, 0.6);
      if (act === 'magnet') { magnetCycles = sim.t; sim.band('magnet', true); sim.set({ mode: 'DOO', lrl: 90, pav: 100 }); }
      if (act === 'ssep') sim.addEMI(sim.t, sim.t + 12000, 1.0, 0, 0.05);
      if (act === 'program') { sim.set({ mode: 'DOO', lrl: 70, pav: 150 }); for (const w of sim.emi) if (w.t1 > sim.t) w.t1 = sim.t; }
    };
    const render = () => {
      const q = C.qs[st.step];
      card.innerHTML = `<div class="verdict" style="color:var(--accent)">${C.title}</div><p style="margin:0 0 10px">${C.intro}</p>`;
      if (!q) { card.innerHTML += '<p><b>End of case.</b> Choose another case, or restart.</p>'; return; }
      const box = el('div', { class: 'q' }, el('p', {}, `${st.step + 1} of ${C.qs.length}. ${q.q}`));
      q.a.forEach((txt, i) => {
        const b = el('button', { type: 'button', onclick: () => { chosen = i; if (i === q.c && q.act) play(q.act); render(); } }, txt);
        if (chosen !== null && (i === q.c || i === chosen)) b.classList.add(i === q.c ? 'right' : 'wrong');
        box.append(b);
      });
      if (chosen !== null) {
        box.append(el('div', { class: 'why', html: `${chosen === q.c ? '<b>Correct.</b> ' : '<b>Not quite.</b> '}${q.why}<span class="cite" data-ref="${q.ref}"></span>` }));
        if (chosen === q.c) box.append(el('div', { class: 'acts', style: 'margin-top:8px' }, el('button', { type: 'button', onclick: () => { st.step++; chosen = null; render(); } }, st.step + 1 < C.qs.length ? 'Next question' : 'Finish')));
      }
      card.append(box);
      ctx.cites(card);
    };
    const reset = () => {
      C = CASES[st.case]; st.step = 0; chosen = null; magnetCycles = null;
      ls.sim.band('magnet', false); for (const w of ls.sim.emi) if (w.t1 > ls.sim.t) w.t1 = ls.sim.t;
      ls.sim.set({ icd: false, tachy: true, suspend: false, url: 120, pav: 200, ...C.dev }, { escape: 0, ...C.pat });
      render();
    };
    reset();
    return {
      update(k) { if (k === 'case') reset(); },
      action(a) { if (a === 'restart') reset(); },
      tick(dt) {
        // Biotronik Auto: 10 asynchronous beats at 90, then the programmed DDD at 60 with the magnet still on
        if (magnetCycles !== null && st.case === 'carotid' && ls.sim.dev.mode === 'DOO' && ls.sim.dev.lrl === 90) {
          if (ls.sim.events.filter(e => e.code === 'VP' && e.t >= magnetCycles).length >= 10) ls.sim.set({ mode: 'DDD', lrl: 60, pav: 200 });
        }
        ls.tick(dt);
      },
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [{ k: 'Ventricular rate', v: ls.sim.vRate(5000), u: '/min' }, { k: 'Shocks', v: ls.sim.recent(30000).filter(e => e.shock).length }],
    };
  },
};
