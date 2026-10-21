// The chapter engine: chapter bar, panel and controls, readouts, citations, the tour,
// keys, theme and dialogs.
import { CHAPTERS, PARTS } from './chapters.js';
import { REFS, REF_INDEX } from './refs.js';
import { el } from './ui.js';

const $ = id => document.getElementById(id);
const panel = $('panel'), stage = $('stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

const states = new Map();      // chapter key -> state object (kept while the page is open)
let cur = null;                // { ch, fig, state }
let roTimer = 0;

// ------------------------------------------------------------------ chapter bar
function buildBar() {
  const host = $('chapters');
  for (const p of PARTS) {
    const list = el('div', { class: 'part-list' });
    for (const ch of CHAPTERS.filter(c => c.part === p.id)) {
      list.append(el('button', { class: 'chap', type: 'button', 'data-key': ch.key, onclick: () => go(ch.key, true) },
        el('span', { class: 'n' }, ch.num), el('span', { class: 't' }, ch.short || ch.title)));
    }
    host.append(el('div', { class: 'part' }, el('span', { class: 'part-name' }, p.name), list));
  }
}

// ------------------------------------------------------------------ citations
function cites(root) {
  root.querySelectorAll('.cite[data-ref]').forEach(c => {
    const keys = c.dataset.ref.split(',').map(k => k.trim());
    c.textContent = '';
    keys.forEach((k, i) => {
      const n = REF_INDEX[k];
      if (!n) { console.warn('missing ref', k); return; }
      if (i) c.append(',');
      c.append(el('a', { href: '#', onclick: e => { e.preventDefault(); openRefs(k); } }, String(n)));
    });
  });
}
function openRefs(key) {
  const list = $('refs-list');
  list.querySelectorAll('li').forEach(li => li.classList.toggle('hit', li.dataset.key === key));
  $('dlg-refs').showModal();
  if (key) list.querySelector(`[data-key="${key}"]`)?.scrollIntoView({ block: 'center' });
}
function buildRefs() {
  const list = $('refs-list');
  for (const r of REFS) {
    const li = el('li', { 'data-key': r.key }, r.text + ' ');
    if (r.doi) li.append(el('a', { href: `https://doi.org/${r.doi}`, target: '_blank', rel: 'noopener' }, `doi:${r.doi}`));
    else if (r.url) li.append(el('a', { href: r.url, target: '_blank', rel: 'noopener' }, 'PubMed'));
    list.append(li);
  }
}

// ------------------------------------------------------------------ controls
function control(c, st, onChange) {
  const wrap = el('div', { class: 'control' });
  const id = `c-${cur.ch.key}-${c.k || c.label.replace(/\W+/g, '')}`;
  if (c.t === 'seg') {
    wrap.append(el('span', { class: 'label' }, c.label));
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': c.label });
    for (const [v, lab] of c.opts) {
      const b = el('button', { type: 'button', 'data-val': v, 'aria-pressed': String(st[c.k] === v), onclick: () => onChange(c.k, v) }, lab);
      seg.append(b);
    }
    wrap.append(seg);
    wrap.sync = () => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === String(st[c.k]))));
  } else if (c.t === 'range') {
    const out = el('output', { for: id });
    const lab = el('label', { class: 'lab', for: id }, c.label, out);
    const inp = el('input', { type: 'range', id, min: c.min, max: c.max, step: c.step || 1, value: st[c.k] });
    inp.addEventListener('input', () => onChange(c.k, +inp.value));
    wrap.append(lab, inp);
    wrap.sync = () => { inp.value = st[c.k]; out.textContent = c.fmt ? c.fmt(st[c.k], st) : st[c.k]; };
  } else if (c.t === 'check') {
    const inp = el('input', { type: 'checkbox', id });
    inp.addEventListener('change', () => onChange(c.k, inp.checked));
    wrap.append(el('label', { class: 'check', for: id }, inp, c.label));
    wrap.sync = () => { inp.checked = !!st[c.k]; };
  } else if (c.t === 'select') {
    const sel = el('select', { class: 'sel', id });
    for (const [v, lab] of c.opts) sel.append(el('option', { value: v }, lab));
    sel.addEventListener('change', () => onChange(c.k, sel.value));
    wrap.append(el('label', { class: 'lab', for: id }, c.label), sel);
    wrap.sync = () => { sel.value = st[c.k]; };
  } else if (c.t === 'act') {
    if (c.label) wrap.append(el('span', { class: 'label' }, c.label));
    const acts = el('div', { class: 'acts' });
    for (const [a, lab, cls] of c.items) acts.append(el('button', { type: 'button', class: cls || '', onclick: () => { stopTour(); cur.fig.action?.(a); refresh(); } }, lab));
    wrap.append(acts);
    wrap.sync = () => {};
  }
  wrap.cond = c.when;
  return wrap;
}

// ------------------------------------------------------------------ mount
function go(key, user) {
  const ch = CHAPTERS.find(c => c.key === key) || CHAPTERS[0];
  if (user) stopTour();
  if (cur?.ch === ch) return;
  if (cur?.fig?.destroy) cur.fig.destroy();
  panel.textContent = ''; stage.textContent = '';
  if (!states.has(ch.key)) states.set(ch.key, structuredClone(ch.state || {}));
  const st = states.get(ch.key);
  cur = { ch, state: st, fig: null, ctrls: [] };

  panel.append(el('div', { class: 'ch-head' },
    el('span', { class: 'ch-num', 'aria-hidden': 'true' }, ch.num),
    el('div', {}, el('h2', { class: 'ch-title' }, ch.title), el('p', { class: 'ch-kicker' }, ch.kicker))));
  panel.append(el('p', { class: 'dek', html: ch.dek }));
  const ctr = el('div', { class: 'controls' });
  for (const c of ch.controls || []) { const w = control(c, st, set); cur.ctrls.push(w); ctr.append(w); }
  if (ch.controls?.length) panel.append(ctr);
  const ro = el('dl', { class: 'readouts' }); cur.ro = ro; panel.append(ro);
  const live = el('p', { class: 'live', 'aria-live': 'polite' }); cur.live = live; panel.append(live);
  panel.append(el('div', { class: 'prose', html: ch.prose }));
  if (ch.quiz?.length) panel.append(quiz(ch.quiz));
  cites(panel);
  panel.scrollTop = 0;

  const fig = el('div', { class: `fig ${ch.figClass || ''}` });
  stage.append(fig);
  cur.fig = ch.fig(fig, st, { reduced, cites }) || {};
  cites(fig);
  syncControls();
  if (reduced) cur.fig.tick?.(8000);
  refresh();

  document.querySelectorAll('.chap').forEach(b => b.setAttribute('aria-current', String(b.dataset.key === ch.key)));
  document.querySelector(`.chap[data-key="${ch.key}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  if (location.hash.slice(1) !== ch.key) history.replaceState(null, '', '#' + ch.key);
  document.title = `${ch.title} · The Heart, Paced`;
  store.set('cied-ch', ch.key);
}

function set(k, v, fromTour) {
  if (!fromTour) stopTour();
  cur.state[k] = v;
  cur.fig.update?.(k, v);
  syncControls();
  if (reduced) cur.fig.tick?.(8000);
  refresh();
}

function syncControls() {
  for (const w of cur.ctrls) { w.sync(); w.hidden = w.cond ? !w.cond(cur.state) : false; }
}

function refresh() {
  if (!cur) return;
  const rows = cur.fig.readouts?.() || [];
  cur.ro.textContent = '';
  cur.ro.hidden = !rows.length;
  for (const r of rows) {
    const dd = el('dd', {}, r.v == null ? '—' : String(r.v));
    if (r.u) dd.append(el('small', {}, r.u));
    cur.ro.append(el('div', { class: r.f || '' }, el('dt', {}, r.k), dd));
  }
  const live = tour.on && tour.note ? tour.note : cur.fig.live?.();
  if (live != null && cur.live.dataset.html !== live) { cur.live.innerHTML = live; cur.live.dataset.html = live; cites(cur.live); }
  cur.live.hidden = !live;
}

function quiz(items) {
  const box = el('div', { class: 'quiz' }, el('h3', {}, 'Check yourself'));
  items.forEach(it => {
    const q = el('div', { class: 'q' }, el('p', { html: it.q }));
    const why = el('div', { class: 'why', hidden: '' });
    it.a.forEach((txt, i) => {
      const b = el('button', { type: 'button', html: txt, onclick: () => {
        q.querySelectorAll('button').forEach((x, j) => { x.classList.remove('right', 'wrong'); if (j === it.c) x.classList.add('right'); });
        if (i !== it.c) b.classList.add('wrong');
        why.hidden = false; why.innerHTML = (i === it.c ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + it.why; cites(why);
      } });
      q.append(b);
    });
    q.append(why);
    box.append(q);
  });
  return box;
}

// ------------------------------------------------------------------ tour
const tour = { on: false, step: 0, until: 0, note: '' };
function playBtn() {
  $('btn-play').setAttribute('aria-pressed', String(tour.on));
  $('btn-play').querySelector('.i-play').hidden = tour.on;
  $('btn-play').querySelector('.i-pause').hidden = !tour.on;
}
function startTour() { tour.on = true; tour.step = 0; tour.until = 0; playBtn(); }
function stopTour() { if (!tour.on) return; tour.on = false; tour.note = ''; playBtn(); refresh(); }
function tourTick(now) {
  if (!tour.on || now < tour.until) return;
  const steps = cur.ch.steps || [];
  if (tour.step >= steps.length) {
    const i = CHAPTERS.indexOf(cur.ch);
    if (i === CHAPTERS.length - 1) { stopTour(); return; }
    go(CHAPTERS[i + 1].key); tour.step = 0; tour.until = 0; return;
  }
  const st = steps[tour.step++];
  for (const [k, v] of Object.entries(st.set || {})) set(k, v, true);
  if (st.act) cur.fig.action?.(st.act);
  tour.note = st.note; tour.until = now + (st.ms || 7000);
  refresh();
}

// ------------------------------------------------------------------ loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(100, now - last); last = now;
  if (!reduced && cur?.fig?.tick && !document.hidden) cur.fig.tick(dt);
  tourTick(now);
  if (now - roTimer > 300) { roTimer = now; refresh(); }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ theme, dialogs, keys
function effectiveDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function themeLabel() { $('theme-label').textContent = effectiveDark() ? 'Light' : 'Dark'; }
$('btn-theme').addEventListener('click', () => {
  const next = effectiveDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; store.set('cied-theme', next); themeLabel();
  cur?.fig?.redraw?.();
});
const saved = store.get('cied-theme');
if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
themeLabel();

$('btn-refs').addEventListener('click', () => openRefs(null));
$('btn-about').addEventListener('click', () => $('dlg-about').showModal());
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
$('btn-play').addEventListener('click', () => (tour.on ? stopTour() : startTour()));
document.addEventListener('keydown', e => {
  if (e.target.closest('input, select, textarea, dialog')) return;
  const i = CHAPTERS.indexOf(cur.ch);
  if (e.key === 'ArrowRight' && i < CHAPTERS.length - 1) go(CHAPTERS[i + 1].key, true);
  else if (e.key === 'ArrowLeft' && i > 0) go(CHAPTERS[i - 1].key, true);
  else if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); tour.on ? stopTour() : startTour(); }
});
['pointerdown', 'wheel'].forEach(t => panel.addEventListener(t, () => stopTour(), { passive: true }));
stage.addEventListener('pointerdown', () => stopTour(), { passive: true });
window.addEventListener('hashchange', () => go(location.hash.slice(1), true));

buildBar();
buildRefs();
const first = location.hash.slice(1);
go(CHAPTERS.some(c => c.key === first) ? first : (store.get('cied-ch') && CHAPTERS.some(c => c.key === store.get('cied-ch')) ? store.get('cied-ch') : CHAPTERS[0].key));
requestAnimationFrame(frame);
