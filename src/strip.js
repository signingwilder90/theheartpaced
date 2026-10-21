// The monitor strip: surface ECG above, the device's marker channel below, drawn as a
// sweeping trace on a dark panel. One Strip draws one Sim.

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const PULSE_DELAY = 180;   // ms from ventricular depolarization to the start of the pleth upstroke
const NO_PULSE_MS = 2500;  // pleth alarm after this long without a pulse

// Time since the last pulse the pleth would show, for readouts.
export function msSincePulse(sim) {
  const v = sim.vdeps[sim.vdeps.length - 1];
  return v ? Math.max(0, sim.t - v.t - PULSE_DELAY) : sim.t;
}

export class Strip {
  constructor(host, sim, opts = {}) {
    this.sim = sim;
    this.opts = { window: 8000, title: 'ECG II · MARKER CHANNEL', sub: () => '', markers: true, units: 'mV', ...opts };
    this.wrap = document.createElement('div');
    this.wrap.className = 'strip';
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', opts.label || 'Simulated ECG with the device marker channel');
    this.wrap.appendChild(this.canvas);
    host.appendChild(this.wrap);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.wrap);
    this.resize();
  }

  resize() {
    const r = this.wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(200, r.width); this.h = Math.max(140, r.height);
    this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // a narrow strip shows fewer seconds so complexes stay legible
    this.win = this.w < 520 ? Math.min(this.opts.window, 5000) : this.opts.window;
    this.draw();
  }

  destroy() { this.ro.disconnect(); this.wrap.remove(); }

  draw() {
    const { ctx, w, h, sim } = this;
    if (!ctx) return;
    const C = {
      bg: css('--screen'), grid: css('--screen-grid'), grid2: css('--screen-grid-2'),
      trace: css('--trace'), sense: css('--sense'), pace: css('--pace'), text: css('--screen-text'),
      dim: css('--screen-dim'), alarm: css('--alarm'), band: css('--screen-band'), mag: css('--magnet'), pleth: css('--pleth'),
    };
    const W = this.win, T = sim.t;
    const top = 26, markH = this.opts.markers ? Math.min(78, h * 0.34) : 0, bottom = 18;
    const plethH = this.opts.pleth ? Math.max(46, h * 0.22) : 0;
    const ecgTop = top, ecgH = h - top - markH - plethH - bottom;
    const mid = ecgTop + ecgH * 0.58;
    const mvPx = Math.min(ecgH * 0.36, 70);           // pixels per mV
    const x = t => ((t % W) + W) % W / W * w;
    const gap = W * 0.035;                              // erase bar ahead of the sweep
    const t0 = T - W + gap;

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // grid: 200 ms and 0.5 mV
    ctx.lineWidth = 1;
    for (let ms = 0; ms <= W; ms += 200) {
      const gx = Math.round(ms / W * w) + 0.5;
      ctx.strokeStyle = ms % 1000 === 0 ? C.grid2 : C.grid;
      ctx.beginPath(); ctx.moveTo(gx, ecgTop); ctx.lineTo(gx, ecgTop + ecgH); ctx.stroke();
    }
    for (let mv = -2; mv <= 2; mv += 0.5) {
      const gy = Math.round(mid - mv * mvPx) + 0.5;
      if (gy < ecgTop || gy > ecgTop + ecgH) continue;
      ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // shaded bands (EMI, magnet)
    for (const b of sim.bands) {
      const a = Math.max(b.t0, t0), z = Math.min(b.t1, T);
      if (z <= a) continue;
      this.span(a, z, (xa, xb) => {
        ctx.fillStyle = b.kind === 'magnet' ? C.mag : C.band;
        ctx.fillRect(xa, ecgTop, xb - xa, h - ecgTop - bottom);
      });
      const lx = x(a) + 4;
      ctx.fillStyle = C.dim; ctx.font = `600 10px ${css('--mono')}`;
      if (z - a > 600) ctx.fillText({ magnet: 'MAGNET', emi: 'EMI', tcp: 'EXTERNAL PACING' }[b.kind] || '', lx, ecgTop + 12);
    }

    // ECG trace, clipped to its area
    ctx.save(); ctx.beginPath(); ctx.rect(0, ecgTop, w, ecgH); ctx.clip();
    ctx.strokeStyle = C.trace; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath();
    let prevX = null;
    for (let t = Math.max(0, Math.ceil(t0 / 2) * 2); t <= T; t += 2) {
      const px = x(t), py = mid - sim.ecgAt(t) * mvPx;
      if (prevX === null || px < prevX) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      prevX = px;
    }
    ctx.stroke();
    ctx.restore();

    // erase bar
    const ex = x(T);
    ctx.fillStyle = C.bg;
    ctx.fillRect(ex + 1, 0, gap / W * w, h);

    // header (after the erase bar so it is never cut)
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, top - 4);
    ctx.fillStyle = C.text; ctx.font = `500 11px ${css('--mono')}`; ctx.textBaseline = 'middle';
    ctx.fillText(w < 520 && this.opts.short ? this.opts.short : this.opts.title, 10, 13);
    let sub = '';
    try { sub = this.opts.sub(sim) || ''; } catch { /* chapter not ready on the first draw */ }
    ctx.textAlign = 'right'; ctx.fillText(sub, w - 10, 13); ctx.textAlign = 'left';

    // pacing spikes on the ECG
    const evs = sim.events.filter(e => e.t >= t0 && e.t <= T);
    for (const e of evs) {
      if (e.code !== 'AP' && e.code !== 'VP') continue;
      const px = Math.round(x(e.t)) + 0.5;
      ctx.strokeStyle = C.pace; ctx.lineWidth = 1.4;
      const hgt = e.code === 'VP' ? 0.9 : 0.6;
      ctx.beginPath(); ctx.moveTo(px, mid + 4); ctx.lineTo(px, mid - hgt * mvPx); ctx.stroke();
    }

    // pulse oximeter plethysmogram: one pulse after each beat that captures the ventricle.
    // Electrical noise does not reach it, so it shows perfusion when the ECG cannot.
    if (this.opts.pleth) {
      const py0 = ecgTop + ecgH + 4, pH = plethH - 8, base = py0 + pH - 4;
      const beats = sim.vdeps.filter(d => d.t > t0 - 1200 && d.t <= T);
      const amp = d => (d.kind === 'pvc' ? 0.5 : 1);
      const pv = t => {
        let v = 0;
        for (const d of beats) {
          const u = t - d.t - PULSE_DELAY;
          if (u > 0 && u < 900) v += amp(d) * (Math.exp(-0.5 * ((u - 120) / 55) ** 2) + 0.35 * Math.exp(-0.5 * ((u - 330) / 70) ** 2));
        }
        return v;
      };
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, py0 - 2.5); ctx.lineTo(w, py0 - 2.5); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(0, py0, w, pH); ctx.clip();
      ctx.strokeStyle = C.pleth; ctx.lineWidth = 1.6; ctx.beginPath();
      let prev = null;
      for (let t = Math.max(0, Math.ceil(t0 / 4) * 4); t <= T; t += 4) {
        const px = x(t), py = base - Math.min(pv(t), 1.25) * (pH - 10);
        if (prev === null || px < prev) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        prev = px;
      }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = C.bg; ctx.fillRect(x(T) + 1, py0, gap / W * w, pH);
      const since = msSincePulse(sim);
      const label = (txt, col, font, lx) => {
        ctx.font = font; const tw = ctx.measureText(txt).width;
        ctx.fillStyle = C.bg; ctx.globalAlpha = 0.85; ctx.fillRect(lx - 3, py0 + 1, tw + 6, 13); ctx.globalAlpha = 1;
        ctx.fillStyle = col; ctx.fillText(txt, lx, py0 + 9);
        return lx + tw + 10;
      };
      ctx.textAlign = 'left';
      const nx = label('SpO2 PLETH', C.pleth, `600 10px ${css('--mono')}`, 8);
      if (since > NO_PULSE_MS && T > NO_PULSE_MS) label(`NO PULSE ${(since / 1000).toFixed(1)} s`, C.alarm, `700 11px ${css('--mono')}`, nx);
    }

    // marker channel
    if (this.opts.markers) {
      const my = h - bottom - markH * 0.5;
      ctx.strokeStyle = C.dim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, my + 0.5); ctx.lineTo(w, my + 0.5); ctx.stroke();
      ctx.font = `600 10px ${css('--mono')}`; ctx.textAlign = 'center';
      let lastNoiseX = -99;
      for (const e of evs) {
        const px = Math.round(x(e.t)) + 0.5;
        if (e.ch === 'A' || e.ch === 'V') {
          const up = e.ch === 'A';
          const paced = e.code[1] === 'P';
          const noise = e.src === 'N' || e.src === 'VF';
          let col = paced ? C.pace : C.sense;
          if (e.code === 'AR') col = C.dim;
          const len = paced ? 14 : 10;
          ctx.strokeStyle = col; ctx.lineWidth = paced ? 1.6 : 1.2;
          ctx.beginPath(); ctx.moveTo(px, my); ctx.lineTo(px, up ? my - len : my + len); ctx.stroke();
          if (noise) { // label noise once per cluster
            if (px - lastNoiseX > 60) { ctx.fillStyle = C.sense; ctx.fillText(e.src === 'VF' ? 'VS' : 'noise', px, up ? my - 24 : my + 24); lastNoiseX = px; }
            continue;
          }
          let label = e.code;
          if (e.src === 'T') label = 'VS (T)';
          ctx.fillStyle = col;
          ctx.fillText(label, px, up ? my - 22 : my + 23);
          if (paced && e.cap === false) {
            ctx.fillStyle = e.onT ? C.alarm : C.dim;
            ctx.fillText(e.onT ? 'on T' : 'no capture', px, up ? my - 33 : my + 33);
          }
        } else if (e.ch === 'X' && !e.quiet) {
          ctx.textAlign = 'left';
          ctx.fillStyle = e.shock ? C.alarm : C.text;
          ctx.font = `700 10.5px ${css('--mono')}`;
          if (e.shock) {
            ctx.strokeStyle = C.alarm; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px, ecgTop + 4); ctx.lineTo(px, h - bottom); ctx.stroke();
          }
          ctx.fillText(e.code, px + 4, ecgTop + 26 + (e.code === 'Charging' ? 12 : 0));
          ctx.font = `600 10px ${css('--mono')}`; ctx.textAlign = 'center';
        }
      }
      ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = `500 9.5px ${css('--mono')}`;
      ctx.fillText('A', 4, my - 8); ctx.fillText('V', 4, my + 10);
    }

    // scale note
    ctx.fillStyle = C.dim; ctx.font = `500 9.5px ${css('--mono')}`; ctx.textAlign = 'right';
    ctx.fillText('grid 200 ms · 0.5 mV', w - 8, h - 6); ctx.textAlign = 'left';
  }

  // call f(xa, xb) for each on-screen piece of [a, b] (a sweep can wrap)
  span(a, b, f) {
    const W = this.win, w = this.w;
    let s = a;
    while (s < b) {
      const segEnd = Math.min(b, (Math.floor(s / W) + 1) * W);
      f((s % W) / W * w, segEnd === (Math.floor(s / W) + 1) * W ? w : (segEnd % W) / W * w);
      s = segEnd;
    }
  }
}
