// One heart, one device. A millisecond timing model of a pacemaker or ICD and the
// rhythm it paces. Every strip on the site comes from this file.
//
// The model is a teaching model. Intervals, refractory periods and detection rules
// are set to typical values so that each chapter's behavior appears for the right
// reason; they are not any one manufacturer's algorithm.

export const DEV0 = {
  mode: 'DDD',      // AOO VOO DOO AAI VVI DDD VDD OOO
  rr: false,        // rate response (fourth NBG letter R)
  lrl: 60,          // lower rate limit, bpm
  url: 120,         // upper (maximum) tracking rate, bpm
  sensor: 0,        // sensor-indicated rate, bpm (used only with rr)
  pav: 200,         // paced AV delay, ms
  sav: 170,         // sensed AV delay, ms
  pvarp: 250,       // post-ventricular atrial refractory period, ms
  pvab: 50,         // post-ventricular atrial blanking, ms
  vrp: 250,         // ventricular refractory period, ms
  arp: 300,         // atrial refractory period (AAI), ms
  hyst: 0,          // hysteresis rate, bpm (0 = off)
  aOut: 3.5, vOut: 3.5,   // pacing output (V, or mA for a temporary pacer)
  aSens: 0.5, vSens: 2.0, // programmed sensitivity, mV (higher number = less sensitive)
  icd: false,       // device has tachyarrhythmia detection and therapy
  tachy: true,      // tachy therapies programmed on
  suspend: false,   // therapies suspended (magnet)
  vfRate: 188,      // VF zone, bpm
  detN: 8, detM: 10,// N of the last M intervals in the VF zone to detect
  charge: 6000,     // capacitor charge time, ms
  joules: 35,
};

export const PAT0 = {
  sinus: 70,        // sinus rate, bpm (0 = sinus arrest)
  av: 'normal',     // 'normal' | 'first' | 'chb'
  pr: 160,          // PR interval with normal conduction, ms
  escape: 0,        // ventricular escape rate, bpm (0 = none)
  aThr: 0.75, vThr: 1.0,  // capture thresholds (same unit as output)
  pAmp: 2.5, rAmp: 10, tAmp: 1.0, // electrogram amplitudes seen by the device, mV
  va: 0,            // retrograde VA conduction time, ms (0 = none)
};

const DT = 2;                 // ECG sample spacing, ms
const BUF_MS = 60000;         // ring buffer length, ms
const N = BUF_MS / DT;
const A_REF = 250;            // atrial myocardial refractoriness after depolarization, ms
const V_REF = 270;            // ventricular myocardial refractoriness, ms
const NODE_REF = 400;         // retrograde conduction fails this soon after an antegrade (sinus or paced) atrial beat, ms
const ICD_REF = 140;          // ICD sensing refractory, ms

// Seeded PRNG so strips are the same on every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const g = (x, mu, sd) => Math.exp(-0.5 * ((x - mu) / sd) ** 2);

// Waveform shapes, in mV, as a function of ms after depolarization.
const SHAPES = {
  P:      x => 0.16 * g(x, 45, 20),
  Pretro: x => -0.13 * g(x, 45, 20),
  Ppaced: x => 0.13 * g(x, 50, 22),
  cond:   x => -0.10 * g(x, 12, 5) + 1.25 * g(x, 28, 8) - 0.28 * g(x, 46, 7) + 0.30 * g(x, 290, 42),
  paced:  x => -0.95 * g(x, 55, 26) + 0.25 * g(x, 120, 22) + 0.38 * g(x, 330, 48),
  esc:    x => 0.85 * g(x, 55, 24) - 0.20 * g(x, 110, 20) - 0.28 * g(x, 350, 50),
  pvc:    x => 1.35 * g(x, 60, 26) - 0.30 * g(x, 120, 20) - 0.45 * g(x, 330, 50),
};
const SPAN = { P: 140, Pretro: 140, Ppaced: 140, cond: 520, paced: 560, esc: 560, pvc: 560 };

export class Sim {
  constructor(dev = {}, pat = {}, seed = 7) {
    this.dev = { ...DEV0, ...dev };
    this.pat = { ...PAT0, ...pat };
    this.rand = rng(seed);
    this.ecg = new Float32Array(N);
    this.cleared = 0;           // ECG slots are zero up to this time (exclusive)
    this.t = 0;
    this.events = [];           // markers: {t, code, ch, cap, onT, note}
    this.bands = [];            // shaded periods: {t0, t1, kind}
    this.adeps = []; this.vdeps = [];
    this.lastAdep = -1e9; this.lastAkind = ''; this.lastVdep = -1e9; this.lastVkind = '';
    this.nextSinus = 300;
    this.pending = [];          // physiology and sensing queue: {t, type, ...}
    this.inj = [];              // injected events: {t, type, ...}
    this.emi = [];              // EMI windows: {t0, t1, a, v, ecg}
    this.vf = false; this.vfNext = 0; this.vfPhase = 0;
    // device state
    this.d = { lastV: -1e9, lastA: -1e9, av: null, avKind: '', vSensed: false, aSensed: false,
      icdLast: -1e9, hist: [], charging: null, lastNoise: -1e9 };
  }

  set(dev, pat) {
    if (dev) Object.assign(this.dev, dev);
    if (pat) Object.assign(this.pat, pat);
  }

  // External events: {type:'pvc'|'vf'|'shock'|'band', ...}
  inject(type, opts = {}) { this.inj.push({ t: this.t + (opts.delay || 0), type, ...opts }); }
  addEMI(t0, t1, a, v, ecg = 1.2) { this.emi.push({ t0, t1, a, v, ecg }); this.bands.push({ t0, t1, kind: 'emi' }); }
  band(kind, on) {
    if (on) this.bands.push({ t0: this.t, t1: Infinity, kind });
    else for (const b of this.bands) if (b.kind === kind && b.t1 === Infinity) b.t1 = this.t;
  }

  // ---------------------------------------------------------------- ECG buffer
  slot(t) { return ((Math.round(t / DT) % N) + N) % N; }
  clearTo(t) {
    for (let x = this.cleared; x < t; x += DT) this.ecg[this.slot(x)] = 0;
    if (t > this.cleared) this.cleared = t;
  }
  addShape(name, t0) {
    const span = SPAN[name], f = SHAPES[name];
    this.clearTo(t0 + span + DT);
    for (let x = 0; x <= span; x += DT) this.ecg[this.slot(t0 + x)] += f(x);
  }
  ecgAt(t) { return this.ecg[this.slot(t)]; }

  mark(code, ch, extra = {}) { this.events.push({ t: this.t, code, ch, ...extra }); }

  // ---------------------------------------------------------------- physiology
  atrialDepol(kind) {
    const t = this.t, p = this.pat;
    this.lastAdep = t; this.lastAkind = kind; this.adeps.push({ t, kind });
    if (p.sinus > 0) this.nextSinus = t + 60000 / p.sinus;
    this.addShape(kind === 'retro' ? 'Pretro' : kind === 'paced' ? 'Ppaced' : 'P', t);
    if (kind !== 'paced') this.pending.push({ t: t + 40, type: 'sig', ch: 'A', amp: p.pAmp, src: 'P' });
    if (kind !== 'retro' && p.av !== 'chb') {
      const pr = p.av === 'first' ? 280 : p.pr;
      this.pending.push({ t: t + pr, type: 'cond' });
    }
  }

  ventDepol(kind) {
    const t = this.t, p = this.pat;
    this.lastVdep = t; this.lastVkind = kind; this.vdeps.push({ t, kind });
    this.addShape(kind, t);
    if (kind !== 'paced') this.pending.push({ t: t + (kind === 'cond' ? 30 : 50), type: 'sig', ch: 'V', amp: p.rAmp, src: 'R' });
    this.pending.push({ t: t + (kind === 'cond' ? 290 : 330), type: 'sig', ch: 'V', amp: p.tAmp, src: 'T' });
    // retrograde (VA) conduction, unless an antegrade atrial beat has just left the AV node refractory
    const nodeBusy = this.lastAkind !== 'retro' && t - this.lastAdep < NODE_REF;
    if (p.va > 0 && kind !== 'cond' && !nodeBusy) this.pending.push({ t: t + p.va, type: 'retro' });
  }

  physio() {
    const t = this.t, p = this.pat;
    // sinus node
    if (p.sinus > 0 && t >= this.nextSinus) {
      if (t - this.lastAdep >= A_REF) this.atrialDepol('sinus');
      else this.nextSinus = t + 60000 / p.sinus;
    }
    // ventricular escape rhythm
    if (!this.vf && p.escape > 0 && t - this.lastVdep >= 60000 / p.escape) this.ventDepol('esc');
    // ventricular fibrillation: chaotic signal on the ECG and on the ventricular lead
    if (this.vf) {
      this.vfPhase += DT / 1000;
      if (t % DT === 0) {
        this.clearTo(t + DT);
        const ph = this.vfPhase;
        const a = 0.35 + 0.2 * Math.sin(ph * 0.9) + 0.1 * Math.sin(ph * 2.3);
        this.ecg[this.slot(t)] += a * (Math.sin(ph * 2 * Math.PI * 5.1) * 0.7 + Math.sin(ph * 2 * Math.PI * 7.3 + 1) * 0.3);
      }
      if (t >= this.vfNext) {
        this.pending.push({ t, type: 'sig', ch: 'V', amp: p.rAmp * 0.45, src: 'VF' });
        this.vfNext = t + 150 + Math.floor(this.rand() * 90);
      }
    }
  }

  // ---------------------------------------------------------------- device
  rateInt() {
    const d = this.dev;
    const r = d.rr ? Math.max(d.lrl, Math.min(d.sensor || d.lrl, d.url)) : d.lrl;
    return 60000 / r;
  }

  sense(sig) {
    const t = this.t, dv = this.dev, s = this.d;
    const m = dv.mode, sensesA = m[1] === 'A' || m[1] === 'D', sensesV = m[1] === 'V' || m[1] === 'D';
    if (sig.ch === 'V' && dv.icd && sig.amp >= dv.vSens && t - s.icdLast >= ICD_REF) {
      if (s.icdLast > -1e8) { s.hist.push(t - s.icdLast); if (s.hist.length > dv.detM) s.hist.shift(); }
      s.icdLast = t;
    }
    if (sig.ch === 'A' && sensesA && sig.amp >= dv.aSens) {
      if (m === 'AAI') {
        if (t - s.lastA < dv.arp) return;
        s.lastA = t; s.aSensed = true; this.mark('AS', 'A', { src: sig.src });
        return;
      }
      if (t - s.lastV < dv.pvab) return;                         // blanked
      if (t - s.lastV < dv.pvarp) { this.mark('AR', 'A', { src: sig.src }); return; }
      if (s.av !== null) return;                                 // inside the AV interval
      s.lastA = t; s.av = t; s.avKind = 'S'; this.mark('AS', 'A', { src: sig.src });
      return;
    }
    if (sig.ch === 'V' && sensesV && sig.amp >= dv.vSens) {
      if (t - s.lastV < dv.vrp) return;                          // refractory
      if (s.av !== null && s.avKind === 'P' && t - s.av < 30) return; // blanking after AP
      s.lastV = t; s.av = null; s.vSensed = true;
      this.mark('VS', 'V', { src: sig.src });
    }
  }

  paceA() {
    const t = this.t, s = this.d, dv = this.dev, p = this.pat;
    s.lastA = t; s.aSensed = false;
    const cap = dv.aOut >= p.aThr && t - this.lastAdep >= A_REF;
    this.mark('AP', 'A', { cap });
    if (cap) this.atrialDepol('paced');
  }

  paceV() {
    const t = this.t, s = this.d, dv = this.dev, p = this.pat;
    s.lastV = t; s.av = null; s.vSensed = false;
    const since = t - this.lastVdep;
    const cap = !this.vf && dv.vOut >= p.vThr && since >= V_REF;
    // a pulse that falls on the T wave of the previous beat (vulnerable period)
    const onT = !cap && since >= 180 && since <= 400;
    this.mark('VP', 'V', { cap, onT });
    if (cap) this.ventDepol('paced');
  }

  brady() {
    const t = this.t, s = this.d, dv = this.dev, m = dv.mode;
    const ri = this.rateInt();
    if (m === 'OOO') return;
    if (m === 'VOO') { if (t - s.lastV >= ri) this.paceV(); return; }
    if (m === 'AOO') { if (t - s.lastA >= ri) this.paceA(); return; }
    if (m === 'DOO') {
      if (s.av === null && t - s.lastV >= ri - dv.pav) { this.paceA(); s.av = t; s.avKind = 'P'; }
      else if (s.av !== null && t - s.av >= dv.pav) this.paceV();
      return;
    }
    if (m === 'VVI') {
      const esc = dv.hyst && s.vSensed ? 60000 / dv.hyst : ri;
      if (t - s.lastV >= esc) this.paceV();
      return;
    }
    if (m === 'AAI') {
      const esc = dv.hyst && s.aSensed ? 60000 / dv.hyst : ri;
      if (t - s.lastA >= esc) this.paceA();
      return;
    }
    if (m === 'DDD' || m === 'VDD') {
      if (s.av === null) {
        if (m === 'DDD' && t - s.lastV >= ri - dv.pav) { this.paceA(); s.av = t; s.avKind = 'P'; }
        else if (m === 'VDD' && t - s.lastV >= ri) this.paceV();
        return;
      }
      const len = s.avKind === 'P' ? dv.pav : dv.sav;
      if (t - s.av >= len) {
        // upper rate behavior: a tracked beat waits until the upper rate interval ends
        if (s.avKind === 'S' && t - s.lastV < 60000 / dv.url) return;
        this.paceV();
      }
    }
  }

  icd() {
    const t = this.t, s = this.d, dv = this.dev;
    if (!dv.icd) return;
    const active = dv.tachy && !dv.suspend;
    if (!active) { if (s.charging !== null) { s.charging = null; this.mark('Abort', 'X'); } s.hist = []; return; }
    const fast = 60000 / dv.vfRate;
    if (s.charging === null) {
      const n = s.hist.filter(x => x < fast).length;
      if (s.hist.length >= dv.detM && n >= dv.detN && t - s.icdLast < 50) {
        s.charging = t; this.mark('VF det', 'X'); this.mark('Charging', 'X', { at: t });
      }
      return;
    }
    // non-committed: a return to slow intervals while charging diverts the charge
    const tail = s.hist.slice(-2);
    if (tail.length === 2 && tail.every(x => x >= fast) && s.hist.length >= 2 && t - s.charging > 500) {
      this.mark('Aborted', 'X'); s.charging = null; s.hist = []; return;
    }
    if (t - s.charging >= dv.charge) {
      const last = s.hist.slice(-4);
      const still = last.length === 4 && last.every(x => x < fast) && t - s.icdLast < 400;
      if (still) this.shock(`Shock ${dv.joules} J`, 'X');
      else this.mark('Aborted', 'X');
      s.charging = null; s.hist = [];
    }
  }

  shock(label, ch) {
    const t = this.t;
    this.mark(label, ch, { shock: true });
    this.clearTo(t + 80);
    for (let x = 0; x < 60; x += DT) this.ecg[this.slot(t + x)] += (x < 10 ? 3 : -1.5) * Math.exp(-x / 25);
    if (this.vf) { this.vf = false; }
    this.lastVdep = t; this.d.lastV = t; this.d.av = null; this.d.hist = [];
  }

  emiAt(t) { for (const w of this.emi) if (t >= w.t0 && t < w.t1) return w; return null; }

  step() {
    const t = this.t;
    // injected events
    for (let i = this.inj.length - 1; i >= 0; i--) {
      const e = this.inj[i];
      if (e.t > t) continue;
      // a PVC waits until the ventricle is excitable and the AV node is free, and until its
      // retrograde P wave (if any) can reach the atrium before the next sinus beat
      if (e.type === 'pvc' && (t - this.lastVdep < V_REF + 20 || t - this.lastAdep < NODE_REF
        || (this.pat.va > 0 && this.pat.sinus > 0 && t + this.pat.va > this.nextSinus - 20))) continue;
      this.inj.splice(i, 1);
      if (e.type === 'pvc' && t - this.lastVdep >= V_REF && !this.vf) { this.ventDepol('pvc'); this.mark('PVC', 'X', { quiet: true }); }
      if (e.type === 'vf') { this.vf = true; this.vfNext = t + 100; this.mark('VF', 'X', { quiet: true }); }
      if (e.type === 'shock') this.shock(e.label || 'External shock', 'X');
    }
    this.physio();
    // queued physiology and signals due now
    if (this.pending.length) {
      const due = this.pending.filter(e => e.t <= t);
      if (due.length) {
        this.pending = this.pending.filter(e => e.t > t);
        due.sort((a, b) => a.t - b.t);
        for (const e of due) {
          if (e.type === 'cond') { if (!this.vf && t - this.lastVdep >= 300) this.ventDepol('cond'); }
          else if (e.type === 'retro') { if (t - this.lastAdep >= A_REF) this.atrialDepol('retro'); }
          else if (e.type === 'sig') this.sense(e);
        }
      }
    }
    // electromagnetic interference: bursts of noise on the leads and the ECG
    const w = this.emiAt(t);
    if (w) {
      if (t % 25 === 0) {
        if (w.a) this.sense({ ch: 'A', amp: w.a, src: 'N' });
        if (w.v) this.sense({ ch: 'V', amp: w.v, src: 'N' });
      }
      if (t % DT === 0) { this.clearTo(t + DT); this.ecg[this.slot(t)] += (this.rand() - 0.5) * 2 * w.ecg; }
    }
    this.brady();
    this.icd();
  }

  advance(to) {
    to = Math.floor(to);
    while (this.t < to) { this.t += 1; this.step(); }
    this.clearTo(this.t + DT);
    // keep memory bounded
    const keep = this.t - BUF_MS + 2000;
    if (this.events.length > 4000) this.events = this.events.filter(e => e.t > keep);
    if (this.vdeps.length > 600) this.vdeps = this.vdeps.filter(e => e.t > keep);
    if (this.adeps.length > 600) this.adeps = this.adeps.filter(e => e.t > keep);
    if (this.bands.length > 200) this.bands = this.bands.filter(b => b.t1 > keep);
    if (this.emi.length > 100) this.emi = this.emi.filter(b => b.t1 > keep);
  }

  // ---------------------------------------------------------------- summaries
  // Ventricular rate over the last `ms` (from depolarizations, not markers).
  vRate(ms = 6000) {
    const v = this.vdeps.filter(e => e.t > this.t - ms);
    if (v.length < 2) return v.length && this.t - v[0].t < 2500 ? null : 0;
    return Math.round(60000 * (v.length - 1) / (v[v.length - 1].t - v[0].t));
  }
  longestPause(ms = 8000) {
    const v = this.vdeps.filter(e => e.t > this.t - ms).map(e => e.t);
    let lp = 0, prev = Math.max(this.t - ms, 0);
    for (const x of v) { lp = Math.max(lp, x - prev); prev = x; }
    return Math.max(lp, this.t - prev);
  }
  pct(code, ms = 8000) {
    const ev = this.events.filter(e => e.t > this.t - ms);
    const ch = code[0];
    const all = ev.filter(e => e.ch === ch && (e.code === ch + 'S' || e.code === ch + 'P')).length;
    return all ? Math.round(100 * ev.filter(e => e.code === code).length / all) : 0;
  }
  recent(ms) { return this.events.filter(e => e.t > this.t - ms); }
}

// Effective programming with a magnet over the generator, for a transvenous pacemaker.
// Returns the device fields to apply. Rates and durations come from chapter 06's table.
export function magnetPacing(base, rate, opts = {}) {
  const chambers = base.mode[0];
  const mode = opts.mode || (chambers === 'D' ? 'DOO' : chambers === 'A' ? 'AOO' : 'VOO');
  return { mode, lrl: rate, rr: false, pav: Math.min(opts.av || 100, base.pav) };
}
