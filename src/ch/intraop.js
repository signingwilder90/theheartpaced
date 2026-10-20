import { el, liveStrip } from '../ui.js';

const SCEN = {
  icdmag: { label: 'ICD with a magnet: VF starts', dev: { mode: 'DDD', lrl: 60, icd: true, tachy: true, suspend: true }, pat: { sinus: 72, av: 'normal', escape: 0 }, magnet: true },
  icdoff: { label: 'ICD therapies programmed off: VF starts', dev: { mode: 'DDD', lrl: 60, icd: true, tachy: false, suspend: false }, pat: { sinus: 72, av: 'normal', escape: 0 }, magnet: false },
  pmslip: { label: 'Dependent pacemaker patient, magnet slips during cautery', dev: { mode: 'DOO', lrl: 85, pav: 100, icd: false }, pat: { sinus: 75, av: 'chb', escape: 0 }, magnet: true, cautery: true },
};

export default {
  key: 'intraop', num: '11', part: 'IV', title: 'In the operating room', short: 'Intraop', kicker: 'Monitoring and emergencies',
  dek: 'During surgery the patient needs an ECG, a pulse signal that does not depend on the ECG, and a way to pace and defibrillate externally. When a device fails to protect the patient, stop the interference and treat the patient, not the device.',
  state: { scen: 'icdmag' },
  controls: [
    { t: 'select', k: 'scen', label: 'Scenario', opts: Object.entries(SCEN).map(([k, v]) => [k, v.label]) },
    { t: 'act', label: 'Events', items: [['vf', 'Ventricular fibrillation'], ['slip', 'Magnet slips off']] },
    { t: 'act', label: 'Your actions', items: [['remove', 'Remove magnet'], ['replace', 'Replace magnet'], ['stopemi', 'Stop cautery'], ['pace', 'External pacing'], ['shock', 'External shock', 'danger']] },
  ],
  steps: [
    { set: { scen: 'icdmag' }, act: 'vf', note: '<b>VF with the magnet on.</b> The ICD does not detect it while the magnet suspends therapy.', ms: 6000 },
    { act: 'remove', note: '<b>Remove the magnet.</b> Detection resumes; the ICD charges and shocks.', ms: 11000 },
    { set: { scen: 'icdoff' }, act: 'vf', note: '<b>Therapies programmed off.</b> Removing a magnet changes nothing.', ms: 6000 },
    { act: 'shock', note: '<b>External shock</b> through the pads placed before draping.', ms: 6000 },
    { set: { scen: 'pmslip' }, act: 'slip', note: '<b>The magnet slips.</b> The pacemaker returns to DDD and each cautery burst inhibits it.', ms: 9000 },
    { act: 'stopemi', note: '<b>Stop the cautery,</b> then replace the magnet or pace externally.', ms: 6000 },
  ],
  prose: `
<h3>Monitoring</h3>
<ul>
<li>ECG, after the device has been reprogrammed or a magnet applied<span class="cite" data-ref="lecture"></span>.</li>
<li>A continuous pulse signal: plethysmography, an arterial line or Doppler<span class="cite" data-ref="lecture,card"></span>. A pacing artefact on the ECG does not prove capture.</li>
<li>Defibrillation pads whenever an ICD is deactivated or the patient is dependent: anterior–posterior, never over the generator, at least 15 cm from it when feasible, placed before draping<span class="cite" data-ref="lecture,card"></span>.</li>
<li>If the ICD was not reprogrammed, keep a magnet available<span class="cite" data-ref="lecture"></span>.</li>
</ul>
<h3>Emergencies</h3>
<ul>
<li><b>Shockable rhythm with a magnet on an ICD:</b> remove the magnet to let the device treat; stop all EMI; if that fails, use the external defibrillator<span class="cite" data-ref="lecture"></span>.</li>
<li><b>Therapies programmed off:</b> treat with the external defibrillator; the ICD will not.</li>
<li><b>Pacing inhibition:</b> stop EMI, check the pulse and support perfusion without waiting for the device; pace externally or transvenously and call the CIED team. An ICD magnet does not prevent pacing inhibition. Never delay external pacing or shocks for programming or pad position<span class="cite" data-ref="card"></span>.</li>
</ul>
<h3>The lecture’s case</h3>
<p>A 75-year-old woman with a cardiomyopathy (EF 30%) and an ICD is having a two-level lumbar fusion. The anesthesiologist and surgeon agree on bipolar cautery only, but a second surgeon uses monopolar cautery and the ICD discharges inappropriately. Once she is prone, how will a magnet be placed or the device reprogrammed? If the magnet is dislodged, how will anyone know? The case calls for discussion and coordination between the surgical, anesthesia and EP or cardiology services before the case<span class="cite" data-ref="lecture"></span>.</p>
<h3>Line placement</h3>
<p>In theory, antitachyarrhythmia therapy should be suspended during central line placement; monitor the ECG and pulse. Leads can be dislodged, especially in the first months after implantation<span class="cite" data-ref="lecture"></span>.</p>
<p class="note">In the model, the ICD detects VF from 8 of 10 short intervals and charges for 6 s before reconfirming. Real detection and charge times vary by device and programming. External pads always terminate VF in the model.</p>`,
  quiz: [
    { q: 'An ICD patient with a magnet develops VF. What is the first device-related step?', a: ['Reprogram the ICD', 'Remove the magnet so the ICD can treat, and stop EMI', 'Replace the magnet'], c: 1, why: 'Removing the magnet restores detection and therapy; if that fails, shock externally.<span class="cite" data-ref="lecture"></span>' },
    { q: 'Why is a pulse oximeter or arterial line needed with a paced rhythm?', a: ['Pacing spikes can mask loss of capture on the ECG', 'Pacemakers interfere with blood pressure cuffs', 'The ECG is turned off during cautery'], c: 0, why: 'A spike on the monitor does not prove mechanical capture; a pulse signal independent of the ECG does.<span class="cite" data-ref="lecture,card"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st) {
    let sc = SCEN[st.scen], magnet = sc.magnet, cautery = !!sc.cautery, pacing = false, nextBurst = 0;
    const ls = liveStrip(host, sc.dev, sc.pat, {
      title: 'ECG II · MARKER CHANNEL',
      sub: () => `${ls.sim.dev.mode} ${ls.sim.dev.lrl}${ls.sim.dev.icd ? (ls.sim.dev.tachy && !ls.sim.dev.suspend ? ' · tachy ON' : ' · tachy OFF') : ''}${magnet ? ' · MAGNET' : ''}${pacing ? ' · EXTERNAL PACING 70' : ''}`,
    });
    const reset = () => {
      sc = SCEN[st.scen]; magnet = sc.magnet; cautery = !!sc.cautery; pacing = false;
      ls.sim.vf = false; ls.sim.band('magnet', false); ls.sim.band('tcp', false);
      ls.sim.set({ ...sc.dev }, { ...sc.pat });
      if (magnet) ls.sim.band('magnet', true);
      nextBurst = ls.sim.t + 1500;
    };
    reset();
    const setMagnet = on => {
      magnet = on; ls.sim.band('magnet', false); if (on) ls.sim.band('magnet', true);
      if (st.scen === 'pmslip') ls.sim.set(on ? { mode: 'DOO', lrl: 85, pav: 100 } : { mode: 'DDD', lrl: 60, pav: 200 });
      else ls.sim.set({ suspend: on });
    };
    return {
      update: reset,
      action(a) {
        const sim = ls.sim;
        if (a === 'vf') sim.inject('vf');
        if (a === 'slip' || a === 'remove') { if (magnet) setMagnet(false); }
        if (a === 'replace' && !magnet && sc.magnet !== false) setMagnet(true);
        if (a === 'stopemi') { cautery = false; for (const w of sim.emi) if (w.t1 > sim.t) w.t1 = sim.t; for (const b of sim.bands) if (b.kind === 'emi' && b.t1 > sim.t) b.t1 = sim.t; }
        if (a === 'pace') { pacing = !pacing; sim.band('tcp', false); if (pacing) sim.band('tcp', true); sim.set(null, { escape: pacing ? 70 : sc.pat.escape }); }
        if (a === 'shock') sim.inject('shock', { label: 'External shock' });
      },
      tick(dt) {
        if (cautery && ls.sim.t >= nextBurst) { ls.sim.addEMI(ls.sim.t, ls.sim.t + 3500, 2.5, 4, 0.6); nextBurst = ls.sim.t + 6000; }
        ls.tick(dt);
      },
      destroy: () => ls.destroy(),
      readouts: () => {
        const sim = ls.sim, lp = sim.longestPause(4000), noPulse = sim.vf || lp > 3000;
        return [
          { k: 'Rhythm', v: sim.vf ? 'VF' : lp > 3000 ? 'asystole' : sim.dev.mode === 'DOO' ? 'paced (DOO)' : 'organized', f: sim.vf || lp > 3000 ? 'flag' : 'ok' },
          { k: 'Pulse', v: noPulse ? 'absent' : 'present', f: noPulse ? 'flag' : 'ok' },
          { k: 'ICD therapy', v: sim.dev.icd ? (sim.dev.tachy && !sim.dev.suspend ? 'active' : sim.dev.tachy ? 'suspended (magnet)' : 'programmed off') : 'n/a' },
        ];
      },
      live: () => {
        const sim = ls.sim, ev = sim.recent(8000);
        if (ev.some(e => e.shock)) return sim.vf ? '<b>Shock delivered</b>, VF persists.' : '<b>Shock delivered.</b> VF terminated; the underlying rhythm returns.';
        if (sim.vf && st.scen === 'icdmag' && magnet) return '<b>VF.</b> The magnet keeps detection suspended. Remove it so the ICD can treat, or shock externally.';
        if (sim.vf && st.scen === 'icdmag') return '<b>Magnet off.</b> The ICD is detecting VF and charging…';
        if (sim.vf && st.scen === 'icdoff') return '<b>VF with therapies off.</b> Removing a magnet does nothing here: shock externally now.';
        if (st.scen === 'pmslip' && !magnet && cautery) return '<b>Magnet off during cautery.</b> Each burst inhibits pacing. Stop the cautery; replace the magnet or pace externally.';
        if (pacing) return '<b>External pacing</b> at 70 per minute supports the patient regardless of the device.';
        return 'Use the events and actions on the left.';
      },
    };
  },
};
