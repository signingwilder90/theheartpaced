import { el, s, liveStrip } from '../ui.js';

const SENSOR = { rest: 60, walk: 95, mv: 130 };
const SENSOR_LBL = { rest: 'At rest', walk: 'Walking (accelerometer)', mv: 'Minute-ventilation sensor driven by cautery or ventilator' };

// sleep schedule: base 70, sleep 50, sleep 22:00, wake 07:00, 30-minute ramps
const sleepRate = h => {
  const base = 70, low = 50, ramp = 0.5;
  const sinceSleep = (h - 22 + 24) % 24, sinceWake = (h - 7 + 24) % 24;
  if (sinceSleep < 9) return sinceSleep < ramp ? base - (base - low) * sinceSleep / ramp : low;
  return sinceWake < ramp ? low + (base - low) * sinceWake / ramp : base;
};
const clock = h => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

const SETUP = {
  hyst: () => [{ mode: 'VVI', lrl: 70, hyst: 0, rr: false, url: 120, pvarp: 250 }, { sinus: 45, av: 'normal', escape: 0, va: 0 }],
  rr: () => [{ mode: 'VVI', lrl: 60, hyst: 0, rr: true, sensor: 60, url: 130 }, { sinus: 0, av: 'chb', escape: 0, va: 0 }],
  pmt: () => [{ mode: 'DDD', lrl: 60, hyst: 0, rr: false, url: 120, sav: 170, pvarp: 250 }, { sinus: 70, av: 'chb', escape: 0, va: 280 }],
  sleep: () => [{ mode: 'VVI', lrl: 70, hyst: 0, rr: false }, { sinus: 0, av: 'chb', escape: 0, va: 0 }],
};

export default {
  key: 'features', num: '04', part: 'I', title: 'Programmed features', short: 'Features', kicker: 'Hysteresis, rate response, PMT and sleep',
  dek: 'Rate response, hysteresis and sleep rates make a pacemaker’s rate differ from its lower rate on purpose. Pacemaker-mediated tachycardia is a re-entry loop that uses the device. Each can look like malfunction in the operating room.',
  state: { feat: 'hyst', hon: true, sinus: 45, drive: 'rest', rron: true, pvarp: 250, magnet: false, hour: 2 },
  controls: [
    { t: 'seg', k: 'feat', label: 'Feature', opts: [['hyst', 'Hysteresis'], ['rr', 'Rate response'], ['pmt', 'PMT'], ['sleep', 'Sleep rate']] },
    { t: 'check', k: 'hon', label: 'Hysteresis on (rate 50)', when: s => s.feat === 'hyst' },
    { t: 'range', k: 'sinus', label: 'Sinus rate', min: 40, max: 80, step: 1, fmt: v => `${v} /min`, when: s => s.feat === 'hyst' },
    { t: 'seg', k: 'drive', label: 'Sensor input', opts: [['rest', 'Rest'], ['walk', 'Walking'], ['mv', 'MV sensor + EMI']], when: s => s.feat === 'rr' },
    { t: 'check', k: 'rron', label: 'Rate response on (VVIR)', when: s => s.feat === 'rr' },
    { t: 'range', k: 'pvarp', label: 'PVARP', min: 200, max: 400, step: 10, fmt: v => `${v} ms`, when: s => s.feat === 'pmt' },
    { t: 'act', label: 'Events', items: [['pvc', 'Premature ventricular beat'], ['magnet', 'Magnet on / off']], when: s => s.feat === 'pmt' },
    { t: 'range', k: 'hour', label: 'Time of surgery', min: 0, max: 23.5, step: 0.25, fmt: v => clock(v), when: s => s.feat === 'sleep' },
  ],
  steps: [
    { set: { feat: 'hyst', hon: true, sinus: 45 }, note: '<b>Hysteresis.</b> Lower rate 70, hysteresis rate 50: after a sensed beat the device waits 1,200 ms; once it paces, it paces at 70.', ms: 9000 },
    { set: { feat: 'hyst', sinus: 58 }, note: '<b>Sinus at 58.</b> Every sinus beat arrives within 1,200 ms, so the device never paces even though the rate is below 70.' },
    { set: { feat: 'rr', drive: 'mv', rron: true }, note: '<b>Rate response.</b> A minute-ventilation sensor can read cautery or the ventilator as exercise and pace at the upper sensor rate.' },
    { set: { feat: 'rr', rron: false }, note: '<b>Rate response off.</b> The rate returns to the lower rate.' },
    { set: { feat: 'pmt', pvarp: 250 }, act: 'pvc', note: '<b>PMT.</b> A premature beat conducts back to the atrium; the retrograde P wave falls outside PVARP, is tracked, and the loop runs at the upper rate.', ms: 9000 },
    { set: { feat: 'pmt' }, act: 'magnet', note: '<b>Magnet.</b> Asynchronous pacing stops atrial tracking and breaks the loop.', ms: 7000 },
  ],
  prose: `
<h3>Hysteresis</h3>
<p>Hysteresis minimizes pacing in patients with intermittent, transient bradycardia or heart block. The rate at which the pacemaker takes over is lower than its pacing rate: with a pacing rate of 70 and hysteresis at 60, the device starts pacing only when the patient’s rate falls below 60, and then paces at 70<span class="cite" data-ref="lecture"></span>. The interval after a sensed beat is deliberately long to allow an intrinsic beat; it can be mistaken for pacemaker malfunction or an arrhythmia<span class="cite" data-ref="lecture,ramsdale2012"></span>.</p>
<h3>Rate response</h3>
<p>A rate-responsive pacemaker raises its rate with detected activity. Sensors include piezoelectric crystals and accelerometers, and thoracic impedance that tracks minute ventilation<span class="cite" data-ref="lecture,bsc2019"></span>. In the operating room the paced rate can rise inappropriately with mechanical hyperventilation, respiratory-rate monitoring, electrocautery, succinylcholine fasciculations and postoperative shivering<span class="cite" data-ref="bsc2019"></span>. Case reports describe minute-ventilation pacemakers pacing at their maximum, for example 130 per minute, during electrocautery, a rate that can cause myocardial ischemia or be mistaken for VT and treated<span class="cite" data-ref="lecture"></span>. The ASA consultants agree that rate response should be disabled perioperatively<span class="cite" data-ref="bsc2019,asa2011"></span>, and the bedside card says to suspend it<span class="cite" data-ref="card"></span>.</p>
<p>Biotronik closed loop stimulation (CLS) adapts the rate to intracardiac impedance at the ventricular lead tip, and the same precautions apply<span class="cite" data-ref="bio2019"></span>.</p>
<h3>Pacemaker-mediated tachycardia</h3>
<p>PMT is a rapid ventricular rate facilitated by the pacemaker. After a ventricular beat, retrograde conduction can depolarize the atrium; if the device senses that P wave outside the PVARP, it paces the ventricle again and the device acts as the re-entry path<span class="cite" data-ref="lecture"></span>. A magnet over a pacemaker terminates it<span class="cite" data-ref="lecture"></span>. A PVARP longer than the retrograde conduction time prevents it<span class="cite" data-ref="ramsdale2012"></span>.</p>
<p class="note">In the model, retrograde conduction takes 280 ms and the device senses the retrograde P wave 320 ms after the paced beat, so a PVARP of 330 ms or more blocks the loop.</p>
<h3>Sleep rate</h3>
<p>A pacemaker can be programmed to a lower rate during sleep. At a set time it lowers the rate over 30 minutes to the sleep rate, and at the wake time it raises it again. Surgery during those hours may meet an inappropriately low rate<span class="cite" data-ref="lecture"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>A pause longer than the lower-rate interval after a sensed beat may be hysteresis.</li>
<li>A paced rate above the lower rate may be rate response, tracking or PMT; disable rate response for surgery.</li>
<li>A magnet terminates PMT; a long PVARP prevents it.</li>
</ol>`,
  quiz: [
    { q: 'A VVI pacemaker set to 70 with hysteresis at 50. After a sinus beat, when does it pace?', a: ['After 857 ms', 'After 1,200 ms', 'After 1,000 ms'], c: 1, why: '60,000 ÷ 50 = 1,200 ms after a sensed beat; subsequent paced beats are at 70 (857 ms).<span class="cite" data-ref="lecture"></span>' },
    { q: 'During laparotomy, a pacemaker patient’s paced rate rises to 130 with cautery. What is the likeliest cause?', a: ['Rate response from a minute-ventilation sensor', 'Loss of capture', 'Hysteresis'], c: 0, why: 'Thoracic impedance (minute ventilation) sensors can read cautery and ventilation as exercise.<span class="cite" data-ref="lecture,bsc2019"></span>' },
  ],
  figClass: 'two',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card' });
    host.append(card);
    const [d0, p0] = SETUP[st.feat]();
    const ls = liveStrip(host, d0, p0, { title: 'ECG II · MARKER CHANNEL', sub: () => sub() });
    let magnetOn = false;
    const sub = () => {
      const m = ls.sim.dev;
      return `${m.mode}${m.rr ? 'R' : ''} ${m.lrl}${m.hyst ? ` · hysteresis ${m.hyst}` : ''}${st.feat === 'pmt' ? ` · PVARP ${m.pvarp} · VA 280` : ''}`;
    };
    const apply = () => {
      const sim = ls.sim;
      if (st.feat === 'hyst') sim.set({ hyst: st.hon ? 50 : 0 }, { sinus: st.sinus });
      if (st.feat === 'rr') sim.set({ rr: st.rron, sensor: SENSOR[st.drive] });
      if (st.feat === 'pmt' && !magnetOn) sim.set({ pvarp: st.pvarp });
      if (st.feat === 'sleep') sim.set({ lrl: Math.round(sleepRate(st.hour)) });
      drawCard();
    };
    const drawCard = () => {
      card.textContent = '';
      if (st.feat === 'sleep') {
        card.append(el('span', { class: 'cap' }, 'Programmed rate over 24 hours · lower rate 70, sleep rate 50, 22:00 to 07:00'));
        const svg = s('svg', { viewBox: '0 0 760 230' }); card.append(svg);
        const X = h => 50 + h * 28, Y = r => 200 - (r - 40) * 4.2;
        for (const r of [50, 60, 70]) { s('line', { x1: X(0), x2: X(24), y1: Y(r), y2: Y(r), stroke: 'var(--rule)', 'stroke-dasharray': '3 4' }, svg); s('text', { x: 40, y: Y(r) + 4, 'text-anchor': 'end', class: 'svgtext', 'font-size': 11, fill: 'var(--ink-3)', text: r }, svg); }
        for (let h = 0; h <= 24; h += 3) s('text', { x: X(h), y: 220, 'text-anchor': 'middle', class: 'svgtext', 'font-size': 11, fill: 'var(--ink-3)', text: clock(h) }, svg);
        let d = '';
        for (let h = 0; h <= 24; h += 0.05) d += `${d ? 'L' : 'M'}${X(h).toFixed(1)},${Y(sleepRate(h)).toFixed(1)} `;
        s('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5 }, svg);
        const r = sleepRate(st.hour);
        s('line', { x1: X(st.hour), x2: X(st.hour), y1: 30, y2: 200, stroke: 'var(--flag)', 'stroke-width': 2 }, svg);
        s('circle', { cx: X(st.hour), cy: Y(r), r: 5, fill: 'var(--flag)' }, svg);
        s('text', { x: X(st.hour) + 8, y: 40, class: 'svgtext', 'font-size': 12, 'font-weight': 600, fill: 'var(--flag)', text: `surgery at ${clock(st.hour)}: ${Math.round(r)} /min` }, svg);
        return;
      }
      const box = el('div', { class: 'grid2' });
      const B = (h, body, cls = '') => box.append(el('div', { class: `box ${cls}`, html: `<h5>${h}</h5>${body}` }));
      if (st.feat === 'hyst') {
        card.append(el('span', { class: 'cap' }, 'Hysteresis · after the lecture figure (lower rate 70, hysteresis 50)'));
        B('Lower rate', '70 /min · 857 ms between paced beats');
        B('Hysteresis rate', st.hon ? '50 /min · the device waits 1,200 ms after a sensed beat' : 'off · the device waits 857 ms after a sensed beat', st.hon ? 'hl' : '');
        B('The patient', `sinus ${st.sinus} /min (${Math.round(60000 / st.sinus)} ms), AV conduction intact`);
      } else if (st.feat === 'rr') {
        card.append(el('span', { class: 'cap' }, 'Rate response · VVIR, lower rate 60, upper sensor rate 130 · pacing-dependent patient'));
        B('Sensor', SENSOR_LBL[st.drive], st.drive === 'mv' ? 'red' : 'hl');
        B('Sensor-indicated rate', st.rron ? `${SENSOR[st.drive]} /min` : 'ignored (rate response off)');
        B('Perioperative advice', 'Disable rate response (DDDR → DDD, or the sensor off or passive).<span class="cite" data-ref="sj2018,bsc2019,card"></span>');
      } else {
        card.append(el('span', { class: 'cap' }, 'PMT · DDD 60/120 · retrograde VA conduction 280 ms'));
        B('Retrograde P wave', 'sensed 320 ms after the ventricular beat');
        B('PVARP', `${ls.sim.dev.pvarp} ms · ${ls.sim.dev.pvarp > 320 ? 'the retrograde P falls inside it (AR) and is ignored' : 'the retrograde P falls outside it and is tracked'}`, ls.sim.dev.pvarp > 320 ? 'hl' : 'red');
        B('Magnet', magnetOn ? 'ON · DOO at 85: no atrial sensing, no tracking' : 'off', magnetOn ? 'hl' : '');
      }
      card.append(box);
      ctx.cites(card);
    };
    apply();
    return {
      update(k) {
        if (k === 'feat') {
          magnetOn = false; ls.sim.band('magnet', false);
          const [d, p] = SETUP[st.feat](); ls.sim.set(d, p);
        }
        apply();
      },
      action(a) {
        if (a === 'pvc') ls.sim.inject('pvc');
        if (a === 'magnet') {
          magnetOn = !magnetOn;
          ls.sim.band('magnet', magnetOn);
          ls.sim.set(magnetOn ? { mode: 'DOO', lrl: 85, pav: 100 } : { mode: 'DDD', lrl: 60, pav: 200, pvarp: st.pvarp });
          drawCard();
        }
      },
      tick: dt => ls.tick(dt),
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [
        { k: 'Ventricular rate', v: ls.sim.vRate(5000), u: '/min' },
        { k: 'Ventricular paced', v: ls.sim.pct('VP', 6000), u: '%' },
        st.feat === 'sleep' ? { k: 'Programmed rate now', v: Math.round(sleepRate(st.hour)), u: '/min' }
          : st.feat === 'pmt' ? { k: 'Retrograde P waves', v: ls.sim.adeps.filter(a => a.kind === 'retro' && a.t > ls.sim.t - 6000).length }
            : { k: 'Longest pause', v: (ls.sim.longestPause(6000) / 1000).toFixed(2), u: 's' },
      ],
      live: () => {
        const r = ls.sim.vRate(5000);
        if (st.feat === 'hyst') return st.hon ? (st.sinus > 50 ? `<b>Sinus ${st.sinus} wins.</b> Each sinus beat comes within 1,200 ms, so the pacemaker stays silent although the rate is below 70.` : '<b>Hysteresis.</b> After each sensed beat the device waits 1,200 ms (50 per minute) before it paces, then paces at 70 until a sinus beat comes early enough to be sensed.') : '<b>Hysteresis off.</b> The device paces whenever 857 ms pass without a sensed beat.';
        if (st.feat === 'rr') return st.rron ? `<b>Rate response on.</b> The device paces at the sensor-indicated rate, ${SENSOR[st.drive]} per minute.` : '<b>Rate response off.</b> The device paces at its lower rate.';
        if (st.feat === 'pmt') return magnetOn ? '<b>Magnet on.</b> DOO pacing does not sense the atrium, so the loop cannot continue.' : r > 100 ? '<b>Pacemaker-mediated tachycardia</b> at the upper rate: each retrograde P wave is sensed and tracked.' : 'Press <b>Premature ventricular beat</b> to start the loop.';
        return `<b>${clock(st.hour)}.</b> The programmed rate is ${Math.round(sleepRate(st.hour))} per minute.`;
      },
    };
  },
};
