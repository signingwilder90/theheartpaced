import { liveStrip } from '../ui.js';

const PATIENTS = {
  ssn: { label: 'Sinus bradycardia 40, AV conduction intact', p: { sinus: 40, av: 'normal', escape: 0 } },
  nsr: { label: 'Sinus rhythm 75, normal conduction', p: { sinus: 75, av: 'normal', escape: 0 } },
  chb: { label: 'Sinus 75, complete heart block, escape 35', p: { sinus: 75, av: 'chb', escape: 35 } },
  dep: { label: 'Sinus 75, complete heart block, no escape', p: { sinus: 75, av: 'chb', escape: 0 } },
};

function explain(m, pt, competing) {
  const asyncM = m[1] === 'O';
  if ((m === 'AAI' || m === 'AOO') && pt === 'dep') return '<b>Ventricular standstill.</b> Atrial pacing captures the atrium, but nothing reaches the ventricle: an atrial-only mode gives no ventricular support in heart block.';
  if ((m === 'AAI' || m === 'AOO') && pt === 'chb') return '<b>Escape rhythm only.</b> The atrial pulses capture, but the P waves are blocked; the ventricle beats at its escape rate.';
  if (asyncM && competing) return '<b>Competition.</b> The device paces at a fixed rate whatever the heart does. Pulses that fall soon after an intrinsic beat do not capture; a pulse marked <i>on T</i> falls in the vulnerable period (R on T).';
  if (asyncM) return '<b>Asynchronous pacing.</b> The device paces at a fixed rate and senses nothing. Here the paced rate is above the intrinsic rate, so the pulses capture and do not compete.';
  if (m === 'VVI' && (pt === 'chb' || pt === 'dep' || pt === 'ssn')) return '<b>VVI.</b> The ventricle is paced at the lower rate without regard to the P waves, so AV synchrony is lost.';
  if (m === 'DDD' && (pt === 'chb' || pt === 'dep')) return '<b>Tracking.</b> Each P wave is sensed (AS) and followed by a paced ventricular beat (VP) after the AV delay: AV synchrony is restored.';
  if (m === 'DDD' && pt === 'ssn') return '<b>Atrial pacing with intrinsic conduction.</b> The atrium is paced at the lower rate (AP) and the impulse conducts, so the ventricular output is inhibited (VS).';
  if (m === 'AAI' && pt === 'ssn') return '<b>AAI in sinus node disease.</b> The atrium is paced at the lower rate and AV conduction does the rest.';
  if (pt === 'nsr') return '<b>Backup only.</b> The intrinsic rate is above the lower rate, so every event is sensed and every output inhibited.';
  return '';
}

export default {
  key: 'modes', num: '02', part: 'I', title: 'Pacing modes', short: 'Modes', kicker: 'How a pacemaker paces and senses',
  dek: 'A pacemaker paces a chamber when the interval since the last event exceeds its lower-rate interval, and an intrinsic event it senses resets that interval. Asynchronous modes sense nothing and pace at a fixed rate.',
  state: { mode: 'DDD', pt: 'chb', lrl: 60 },
  controls: [
    { t: 'seg', k: 'mode', label: 'Mode', opts: ['AOO', 'VOO', 'DOO', 'AAI', 'VVI', 'DDD'].map(m => [m, m]) },
    { t: 'select', k: 'pt', label: 'Patient', opts: Object.entries(PATIENTS).map(([k, v]) => [k, v.label]) },
    { t: 'range', k: 'lrl', label: 'Lower rate limit', min: 40, max: 100, step: 5, fmt: v => `${v} /min` },
  ],
  steps: [
    { set: { pt: 'ssn', mode: 'AAI', lrl: 60 }, note: '<b>Sinus node disease, AAI.</b> Atrial pacing at 60; each paced P wave conducts.' },
    { set: { pt: 'chb', mode: 'DDD' }, note: '<b>Heart block, DDD.</b> Sensed P waves are tracked, so the ventricles follow the sinus rate.' },
    { set: { pt: 'chb', mode: 'VVI' }, note: '<b>Heart block, VVI.</b> Ventricular pacing at 60 regardless of the P waves.' },
    { set: { pt: 'dep', mode: 'AAI' }, note: '<b>No escape rhythm, atrial pacing.</b> The ventricle stands still.', ms: 6000 },
    { set: { pt: 'nsr', mode: 'VOO', lrl: 60 }, note: '<b>Asynchronous pacing in sinus rhythm.</b> Competition: some pulses fall on T waves.' },
    { set: { pt: 'nsr', mode: 'DDD' }, note: '<b>DDD in sinus rhythm.</b> Everything is sensed; the pacemaker waits.' },
  ],
  prose: `
<h3>Timing from the last event</h3>
<p>A demand (inhibited) pacemaker measures time from the last sensed or paced event in the chamber it times. If the lower-rate interval passes with no event, it paces; if an intrinsic event is sensed first, the interval restarts<span class="cite" data-ref="lecture,ramsdale2012"></span>. In an asynchronous mode the device senses nothing and paces at its fixed rate<span class="cite" data-ref="lecture"></span>.</p>
<h3>Asynchronous pacing is not benign</h3>
<p>When the intrinsic rate approaches the paced rate, asynchronous pulses compete with intrinsic beats. A pulse delivered during repolarization (R on T) may induce ventricular tachycardia or fibrillation; most reports involve temporary pacemakers, but it can occur with any asynchronous pacing or loss of sensing<span class="cite" data-ref="bsc2019"></span>. The mode and underlying rhythm should be assessed before a patient is paced asynchronously<span class="cite" data-ref="bsc2019"></span>.</p>
<h3>Indications</h3>
<ul>
<li><b>Pacemaker</b>: bradycardia, including sinus node dysfunction, acquired AV block, chronic bifascicular block, hypersensitive carotid sinus syndrome, neurocardiogenic syncope and after acute myocardial infarction<span class="cite" data-ref="bsc2019,lecture"></span>.</li>
<li><b>ICD</b>: secondary prevention after ventricular arrhythmia; primary prevention of sudden death in cardiomyopathy or a familial condition with a high risk of sudden death<span class="cite" data-ref="lecture"></span>.</li>
<li><b>CRT</b> (biventricular pacing): a reduced ejection fraction with a wide QRS; the aim is to synchronize LV contraction<span class="cite" data-ref="bsc2019"></span>.</li>
</ul>
<h3>Key points</h3>
<ol class="steps">
<li>Inhibited modes pace only when the heart does not beat in time.</li>
<li>Atrial-only modes give no ventricular support if AV conduction fails.</li>
<li>Asynchronous modes compete with intrinsic beats; check the underlying rhythm first.</li>
</ol>`,
  quiz: [
    { q: 'A patient in sinus rhythm at 75 is programmed to VOO at 60. What is the main hazard?', a: ['Pacemaker-mediated tachycardia', 'Pulses falling on T waves (R on T)', 'Rate-response tachycardia'], c: 1, why: 'Asynchronous pulses compete with the intrinsic rhythm; a pulse in the vulnerable period can induce VT or VF.<span class="cite" data-ref="bsc2019"></span>' },
    { q: 'In DDD mode, what happens after the device senses a P wave?', a: ['The atrial output is triggered', 'It starts the AV delay and paces the ventricle at its end unless a QRS is sensed', 'It switches to VVI'], c: 1, why: 'DDD tracks: a sensed P wave starts the sensed AV delay; a sensed QRS inhibits the ventricular output.' },
  ],
  figClass: 'strip-only',
  fig(host, st) {
    const ls = liveStrip(host, { mode: st.mode, lrl: st.lrl, url: 120 }, PATIENTS[st.pt].p, {
      title: 'ECG II · MARKER CHANNEL',
      sub: () => `${st.mode} ${st.lrl} · ${PATIENTS[st.pt].label}`,
    });
    return {
      update(k, v) {
        if (k === 'pt') ls.sim.set(null, PATIENTS[v].p);
        else ls.sim.set({ mode: st.mode, lrl: st.lrl });
      },
      tick: dt => ls.tick(dt),
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => {
        const r = ls.sim.vRate(), lp = ls.sim.longestPause(6000);
        return [
          { k: 'Ventricular rate', v: r, u: '/min', f: r === 0 ? 'flag' : '' },
          { k: 'Atrial paced', v: ls.sim.pct('AP'), u: '%' },
          { k: 'Ventricular paced', v: ls.sim.pct('VP'), u: '%' },
          { k: 'Longest pause', v: (lp / 1000).toFixed(1), u: 's', f: lp > 3000 ? 'flag' : '' },
          { k: 'Pulses on T', v: ls.sim.recent(8000).filter(e => e.onT).length, f: ls.sim.recent(8000).some(e => e.onT) ? 'flag' : '' },
        ];
      },
      live: () => explain(st.mode, st.pt, ls.sim.recent(8000).some(e => (e.code === 'AP' || e.code === 'VP') && e.cap === false)),
    };
  },
};
