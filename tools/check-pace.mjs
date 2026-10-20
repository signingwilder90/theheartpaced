// node tools/check-pace.mjs: the timing model shows each behaviour the text describes.
import { Sim } from '../src/pace.js';

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const intervals = (sim, code, from) => {
  const t = sim.events.filter(e => e.code === code && e.t >= from).map(e => e.t);
  return t.slice(1).map((x, i) => x - t[i]);
};
const near = (a, b, tol = 3) => Math.abs(a - b) <= tol;

{ // VVI at 60 in a patient with no escape rhythm paces every 1000 ms and captures
  const s = new Sim({ mode: 'VVI', lrl: 60 }, { sinus: 0, av: 'chb', escape: 0 });
  s.advance(10000);
  const iv = intervals(s, 'VP', 2000);
  ok(iv.length > 5 && iv.every(x => near(x, 1000)), `VVI 60: VP every 1000 ms (${iv.slice(0, 3)})`);
  ok(s.vRate() === 60, `VVI 60: ventricular rate ${s.vRate()}`);
}

{ // DDD with sinus 75 and normal conduction: atrial sensed, ventricular sensed (no pacing)
  const s = new Sim({ mode: 'DDD', lrl: 60 }, { sinus: 75, av: 'normal' });
  s.advance(10000);
  ok(s.pct('VP') === 0 && s.pct('AP') === 0, `DDD, sinus 75, normal AV: AP ${s.pct('AP')}% VP ${s.pct('VP')}%`);
}

{ // DDD with complete heart block tracks the sinus rate 1:1 below the upper rate
  const s = new Sim({ mode: 'DDD', lrl: 60, url: 120, sav: 150, pvarp: 250 }, { sinus: 90, av: 'chb' });
  s.advance(12000);
  ok(near(s.vRate(), 90, 1) && s.pct('VP') === 100, `DDD CHB sinus 90: tracked 1:1 at ${s.vRate()}`);
}

{ // Wenckebach between the upper rate (120) and the TARP rate (150 with SAV 150 + PVARP 250)
  const s = new Sim({ mode: 'DDD', lrl: 60, url: 120, sav: 150, pvarp: 250 }, { sinus: 135, av: 'chb' });
  s.advance(15000);
  const r = s.vRate(8000), ar = s.recent(8000).filter(e => e.code === 'AR').length;
  const avs = [];
  let lastAS = null;
  for (const e of s.recent(8000)) { if (e.code === 'AS') lastAS = e.t; if (e.code === 'VP' && lastAS !== null) { avs.push(e.t - lastAS); lastAS = null; } }
  ok(r <= 120 && r > 80 && ar > 0, `Wenckebach at sinus 135 (P-P 444, TARP 400): V rate ${r}, ${ar} AR markers`);
  ok(Math.max(...avs) > 150 + 20, `Wenckebach: AV interval lengthens (max ${Math.max(...avs)} ms)`);
}

{ // 2:1 block above the TARP rate
  const s = new Sim({ mode: 'DDD', lrl: 60, url: 120, sav: 150, pvarp: 250 }, { sinus: 170, av: 'chb' });
  s.advance(15000);
  ok(near(s.vRate(8000), 85, 2), `2:1 at sinus 170: V rate ${s.vRate(8000)} (expect 85)`);
}

{ // EMI on the ventricular lead inhibits pacing in a pacing-dependent patient
  const s = new Sim({ mode: 'DDD', lrl: 60 }, { sinus: 0, av: 'chb', escape: 0 });
  s.advance(3000); s.addEMI(3000, 7000, 3, 3); s.advance(9000);
  ok(s.longestPause(8000) >= 3900, `EMI 4 s, DDD, dependent: longest pause ${s.longestPause(8000)} ms`);
}

{ // the same EMI with the device in DOO: no inhibition
  const s = new Sim({ mode: 'DOO', lrl: 60 }, { sinus: 0, av: 'chb', escape: 0 });
  s.advance(3000); s.addEMI(3000, 7000, 3, 3); s.advance(9000);
  ok(s.longestPause(8000) <= 1001, `EMI 4 s, DOO: longest pause ${s.longestPause(8000)} ms`);
}

{ // ICD: 10 s of noise is detected as VF and shocked; a 3 s burst aborts or never detects
  const run = len => {
    const s = new Sim({ mode: 'VVI', lrl: 40, icd: true }, { sinus: 70 });
    s.advance(2000); s.addEMI(2000, 2000 + len, 0, 3); s.advance(16000);
    return s.events.filter(e => e.shock).length;
  };
  ok(run(10000) === 1, `ICD, 10 s EMI: inappropriate shock (${run(10000)})`);
  ok(run(3000) === 0, `ICD, 3 s EMI: no shock (${run(3000)})`);
  const s = new Sim({ mode: 'VVI', lrl: 40, icd: true, suspend: true }, { sinus: 70 });
  s.advance(2000); s.addEMI(2000, 12000, 0, 3); s.advance(16000);
  ok(s.events.filter(e => e.shock).length === 0, 'ICD with magnet, 10 s EMI: no shock');
}

{ // ICD treats real VF; with therapies suspended it does not
  const s = new Sim({ mode: 'VVI', lrl: 40, icd: true }, { sinus: 70 });
  s.advance(2000); s.inject('vf'); s.advance(14000);
  ok(!s.vf && s.events.some(e => e.shock), 'VF with therapies on: shock ends VF');
  const s2 = new Sim({ mode: 'VVI', lrl: 40, icd: true, suspend: true }, { sinus: 70 });
  s2.advance(2000); s2.inject('vf'); s2.advance(14000);
  ok(s2.vf, 'VF with magnet: VF continues');
}

{ // hysteresis: LR 70, hysteresis 50 -> first paced beat 1200 ms after a sensed beat
  const s = new Sim({ mode: 'VVI', lrl: 70, hyst: 50 }, { sinus: 45, av: 'normal' });
  s.advance(20000);
  const ev = s.events.filter(e => e.ch === 'V');
  const gaps = [];
  for (let i = 1; i < ev.length; i++) if (ev[i - 1].code === 'VS' && ev[i].code === 'VP') gaps.push(ev[i].t - ev[i - 1].t);
  const pp = intervals(s, 'VP', 0).filter(x => x < 900);
  ok(gaps.length > 0 && gaps.every(x => near(x, 1200)), `hysteresis: VS->VP ${gaps.slice(0, 3)} ms`);
  ok(pp.length > 0 && pp.every(x => near(x, 857, 2)), `hysteresis: VP->VP at 70 bpm (${pp.slice(0, 2)})`);
}

{ // PMT: a PVC with retrograde conduction starts a tachycardia at the upper rate
  const mk = pvarp => {
    const s = new Sim({ mode: 'DDD', lrl: 60, url: 120, sav: 170, pvarp }, { sinus: 70, av: 'chb', va: 280 });
    s.advance(6000);
    ok(s.vRate(4000) < 80, `PVARP ${pvarp}: no PMT before the PVC (rate ${s.vRate(4000)})`);
    s.inject('pvc'); s.advance(14000);
    return s;
  };
  const a = mk(250), b = mk(350);
  ok(near(a.vRate(5000), 120, 2), `PMT with PVARP 250 (VA 280): rate ${a.vRate(5000)}`);
  ok(b.vRate(5000) < 80, `no PMT with PVARP 350: rate ${b.vRate(5000)}`);
  a.set({ mode: 'DOO', lrl: 85, pav: 100 }); a.advance(18000);
  ok(near(a.vRate(4000), 85, 2), `magnet (DOO 85) ends PMT: rate ${a.vRate(4000)}`);
}

{ // T-wave oversensing: sensitivity below the T-wave amplitude adds pauses
  const s = new Sim({ mode: 'VVI', lrl: 70, vSens: 0.8 }, { sinus: 0, av: 'chb', escape: 0, tAmp: 1.5 });
  s.advance(10000);
  const iv = intervals(s, 'VP', 2000);
  ok(iv.every(x => near(x, 330 + 857, 3)), `T-wave oversensing: VP interval ${iv[0]} (857 + 330)`);
}

{ // loss of capture: output below threshold
  const s = new Sim({ mode: 'VVI', lrl: 70, vOut: 2 }, { sinus: 0, av: 'chb', escape: 30, vThr: 3 });
  s.advance(10000);
  ok(s.recent(8000).filter(e => e.code === 'VP').every(e => !e.cap), 'output 2 < threshold 3: no capture');
}

console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
