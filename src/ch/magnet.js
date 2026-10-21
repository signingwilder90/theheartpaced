import { el, liveStrip } from '../ui.js';

// Magnet responses. Each entry: what the device does with a magnet over it.
// pacing: 'async' (with mode, seq of [beats, rate], then), 'none' (no change), 'unchanged' (ICD: pacing left as programmed)
const MAKERS = {
  mdt: { label: 'Medtronic', types: ['pm', 'icd', 'evicd'] },
  abbott: { label: 'Abbott (St. Jude)', types: ['pm', 'icd'] },
  bsc: { label: 'Boston Scientific', types: ['pm', 'icd', 'sicd'] },
  bio: { label: 'Biotronik', types: ['pm', 'icd'] },
  micro: { label: 'MicroPort (Sorin)', types: ['pm', 'icd'] },
  micra: { label: 'Micra (Medtronic, leadless)', types: ['lp'] },
  aveir: { label: 'AVEIR (Abbott, leadless)', types: ['lp'] },
};
const TYPES = { pm: 'Pacemaker / CRT-P', icd: 'ICD / CRT-D', sicd: 'S-ICD', evicd: 'EV-ICD', lp: 'Leadless pacemaker' };
const SETTINGS = {
  'abbott.pm': [['battery', 'Battery test (default)'], ['off', 'Off'], ['dc', 'Data collection'], ['dcbt', 'Data collection + battery test']],
  'abbott.icd': [['normal', 'Normal (default)'], ['off', 'Off']],
  'bsc.pm': [['async', 'Asynchronous (default)'], ['off', 'Off'], ['egm', 'Store EGM / patient-triggered monitor']],
  'bsc.icd': [['on', 'On (default)'], ['off', 'Off']],
  'bsc.sicd': [['on', 'Therapy On (default)'], ['off', 'Therapy Off']],
  'bio.pm': [['auto', 'Auto (default)'], ['async', 'Asynchronous'], ['sync', 'Synchronous']],
  'mdt.pm': [['most', 'Most models'], ['azure', 'Azure, Percepta, Serena, Solara']],
  'aveir.lp': [['vr', 'AVEIR VR (ventricle)'], ['ar', 'AVEIR AR (atrium only)'], ['dr', 'AVEIR DR (both)']],
};
const BATT = { bol: 'Normal battery', mid: 'Mid-life (Boston: 90)', eri: 'ERI / RRT (replacement)' };

function response(st) {
  const key = `${st.maker}.${st.type}`, eri = st.batt === 'eri', A = (o) => ({ pacing: 'async', therapy: 'n/a', tone: '', notes: [], refs: [], ...o });
  switch (key) {
    case 'mdt.pm': {
      const first = st.setting === 'azure' ? 5 : 3;
      return eri ? A({ mode: 'VOO', seq: [], then: 65, refs: ['mdt2020', 'card'], notes: ['At ERI: VOO at 65 per minute.'] })
        : A({ mode: 'DOO', seq: [[first, 100]], then: 85, refs: st.setting === 'azure' ? ['card'] : ['mdt2020'],
          notes: [st.setting === 'azure' ? 'Azure, Percepta, Serena and Solara: the first 5 beats at 100, then 85 (Medtronic magnet letter 2024, on the bedside card).' : 'First 3 beats at 100, then 85 (2020 review); EnRhythm and SureScan models are exceptions.',
            'During the first 7 beats one or more ventricular pulses may be at reduced amplitude or width, as a threshold margin test.',
            'The 2020 review lists no programmable magnet settings for transvenous Medtronic pacemakers.'] });
    }
    case 'mdt.icd': return { pacing: 'unchanged', therapy: 'suspended', tone: 'Some models emit a tone for 15 to 30 s; it may persist after the magnet is removed, so it does not confirm placement.', notes: ['Pacing settings are unchanged.'], refs: ['mdt2020'] };
    case 'mdt.evicd': return { pacing: 'none', therapy: 'suspended', tone: '', notes: ['EV-ICD (extravascular): the magnet is ineffective during a wand session.', 'No sustained bradycardia pacing; Pause Prevention ships as Monitor and is not affected by the magnet.', 'The card also notes "no tone 6 h after implant" and that strong EMI can reset it, so interrogate afterwards.'], refs: ['card'] };
    case 'abbott.pm':
      if (st.setting === 'off') return { pacing: 'none', therapy: 'n/a', notes: ['Magnet response programmed off: no response.'], refs: ['sj2018'] };
      if (st.setting === 'dc') return { pacing: 'none', therapy: 'n/a', notes: ['No change in pacing; the device collects event snapshots.'], refs: ['sj2018'] };
      return A({ mode: 'DOO', seq: [], then: eri ? 86 : 100, delay: st.setting === 'dcbt' ? 5000 : 0, refs: ['sj2018', 'card'],
        notes: [eri ? 'At ERI the rate falls to about 86 per minute (86.3 in the 2018 review’s Table 1; 86.1 in its summary; the bedside card gives 85).' : 'Asynchronous at 100 per minute (98.6 in older models).',
          st.setting === 'dcbt' ? 'Data collection + battery test: a 2-s application stores an electrogram; 5 s or longer starts the battery test, which paces asynchronously.' : 'Battery test is the default; the response can be disabled.'] });
    case 'abbott.icd':
      return st.setting === 'off' ? { pacing: 'unchanged', therapy: 'active', notes: ['Magnet response off: no effect on therapies or pacing.'], refs: ['sj2018'] }
        : { pacing: 'unchanged', therapy: 'suspended', tone: 'No tone confirms placement.', notes: ['Pacing settings are unchanged.'], refs: ['sj2018'] };
    case 'bsc.pm':
      if (st.setting === 'off') return { pacing: 'none', therapy: 'n/a', notes: ['Magnet response off: no response.'], refs: ['bsc2019'] };
      if (st.setting === 'egm') return { pacing: 'none', therapy: 'n/a', notes: ['No change in pacing; the device stores an electrogram. After one is stored, the response reverts to asynchronous.'], refs: ['bsc2019'] };
      return A({ mode: 'DOO', seq: [], then: eri ? 85 : st.batt === 'mid' ? 90 : 100, av: 100, refs: ['bsc2019', 'card'],
        notes: ['Rate by battery: 100, 90 or 85 (85 = replacement), per the 2021 Boston Scientific bulletin on the card. The 2019 review gives 100, falling to 85 at ERI and below 85 at end of life.', 'Fixed AV delay of 100 ms; in CRT-P devices the LV offset becomes 0 ms, which can change synchrony and cardiac output.'] });
    case 'bsc.icd':
      return st.setting === 'off' ? { pacing: 'unchanged', therapy: 'active', tone: 'No beep.', notes: ['Magnet has no effect.'], refs: ['bsc2019'] }
        : { pacing: 'unchanged', therapy: 'suspended', tone: 'Beeps (once per second, per the bedside card).', notes: ['Pacing settings are unchanged; a CRT-D needs programming for asynchronous pacing.'], refs: ['bsc2019', 'card'] };
    case 'bsc.sicd':
      return { pacing: 'none', therapy: st.setting === 'off' ? 'off' : 'suspended', tone: 'Beeps with each R wave for 60 s (expected, not guaranteed); the tones then stop and therapy stays inhibited.',
        notes: ['Post-shock pacing is disabled.', 'Place the magnet over the header or the lower edge of the generator, usually at the left midaxillary line, 6th intercostal space.', 'A deep implant or previous MRI exposure can prevent the tones.'], refs: ['bsc2019', 'card'] };
    case 'bio.pm':
      if (st.setting === 'sync') return { pacing: 'none', therapy: 'n/a', notes: ['Synchronous: pacing continues in the programmed mode at the lower rate with an AV delay of 100 ms; no asynchronous pacing.', 'At end of life: VDD or VVI with the lower rate reduced by 11%.'], refs: ['bio2019'] };
      if (st.setting === 'async') return A({ mode: eri ? 'VOO' : 'DOO', seq: [], then: eri ? 80 : 90, av: 100, refs: ['bio2019', 'card'], notes: ['Asynchronous: sustained at 90 per minute; 80 in VOO at ERI or end of life.', 'AV delay 100 ms or the programmed AV delay, whichever is shorter.'] });
      return A({ mode: eri ? 'VOO' : 'DOO', seq: [[10, eri ? 80 : 90]], restore: eri ? 0.89 : 1, av: 100, refs: ['bio2019', 'card'],
        notes: ['Auto (the default): 10 asynchronous beats at 90, then back to the programmed settings at the lower rate, with the magnet still on.', 'At ERI: 10 beats at 80 in VOO, then VDD or VVI with the lower rate reduced by 11%.', 'A magnet on a Biotronik pacemaker in Auto does not give sustained asynchronous pacing.'] });
    case 'bio.icd': return { pacing: 'unchanged', therapy: 'suspended', tone: 'No tone.', notes: ['Pacing is unchanged.', 'Therapies resume after 8 h with the magnet on (bedside card).'], refs: ['bio2019', 'card'] };
    case 'micro.pm': return A({ mode: 'DOO', seq: [], then: eri ? 80 : 96, refs: ['card'], confirm: true, notes: ['96 per minute, 80 at replacement, per the bedside card, which marks these values as unconfirmed.'] });
    case 'micro.icd': return { pacing: 'unchanged', therapy: 'suspended', tone: '', notes: ['MicroPort Platinium DR: with a magnet the pacing output goes to 6 V at 1 ms (possible diaphragmatic capture); rate and mode are unchanged (bedside card).'], refs: ['card'] };
    case 'micra.lp': return { pacing: 'none', therapy: 'n/a', notes: ['Micra has no magnet response. If asynchronous pacing is needed, it must be programmed (VOO).'], refs: ['wan2024', 'card'] };
    case 'aveir.lp': {
      const mode = st.setting === 'ar' ? 'AOO' : 'VOO';
      return A({ mode, seq: [[5, 100]], then: eri ? 65 : 85, refs: ['aveir', 'card'], confirm: st.setting === 'dr',
        notes: ['100 per minute for 5 cycles, then 85 to 100 per minute according to the remaining battery; 65 at the recommended replacement time. The figure shows 85.',
          st.setting === 'ar' ? 'AOO with only an AR implanted: no ventricular support.' : st.setting === 'dr' ? 'With a VR present the response is VOO; the card notes that the AHA statement describes DOO for DR and marks this as unconfirmed.' : 'VOO with a VR.',
          'Place the VR magnet over the heart. If one magnet gives no response, place a second magnet on top or press firmly.', 'Magnet response is ON at nominal settings.'] });
    }
  }
  return { pacing: 'none', therapy: 'n/a', notes: [], refs: [] };
}

function baseDev(st) {
  if (st.type === 'sicd' || st.type === 'evicd') return { mode: 'OOO', icd: true, lrl: 60, suspend: false, tachy: true };
  if (st.type === 'lp') return { mode: st.maker === 'aveir' && st.setting === 'ar' ? 'AAI' : 'VVI', icd: false, lrl: 60, suspend: false };
  return { mode: 'DDD', icd: st.type === 'icd', lrl: 60, pav: 200, suspend: false, tachy: true };
}

export default {
  key: 'magnet', num: '06', part: 'III', title: 'The magnet', short: 'Magnet', kicker: 'What a magnet does, device by device',
  dek: 'A magnet over a pacemaker usually starts asynchronous pacing; over an ICD it usually suspends tachyarrhythmia detection and therapy and leaves pacing unchanged. The response, rate and duration vary by manufacturer, model, programming and battery, and some devices do not respond at all.',
  state: { maker: 'bio', type: 'pm', setting: 'auto', batt: 'bol', dep: true },
  controls: [
    { t: 'select', k: 'maker', label: 'Manufacturer', opts: Object.entries(MAKERS).map(([k, v]) => [k, v.label]) },
    { t: 'seg', k: 'type', label: 'Device', opts: Object.entries(TYPES).map(([k, v]) => [k, v]) },
    { t: 'select', k: 'setting', label: 'Programmed magnet response / model', opts: [], when: s => !!SETTINGS[`${s.maker}.${s.type}`] },
    { t: 'seg', k: 'batt', label: 'Battery', opts: Object.entries(BATT).map(([k, v]) => [k, v]) },
    { t: 'check', k: 'dep', label: 'Pacing-dependent patient (complete heart block, no escape)' },
    { t: 'act', label: 'Magnet', items: [['on', 'Place magnet'], ['off', 'Remove magnet']] },
  ],
  steps: [
    { set: { maker: 'bio', type: 'pm', setting: 'auto', batt: 'bol', dep: true }, act: 'on', note: '<b>Biotronik, Auto.</b> Ten beats at 90, then the device returns to its programmed DDD at 60 with the magnet still on. Electrocautery would now inhibit it.', ms: 12000 },
    { set: { maker: 'mdt', type: 'pm', setting: 'most' }, act: 'on', note: '<b>Medtronic pacemaker.</b> Three beats at 100, then DOO at 85.', ms: 9000 },
    { set: { maker: 'bsc', type: 'icd', setting: 'on' }, act: 'on', note: '<b>Boston Scientific ICD.</b> Therapies suspended with a beep; pacing unchanged.', ms: 8000 },
    { set: { maker: 'micra', type: 'lp' }, act: 'on', note: '<b>Micra.</b> No magnet response at all.', ms: 7000 },
  ],
  prose: `
<h3>Not just a magnet</h3>
<p>The HRS/ASA statement says that placing a magnet without analyzing the patient’s situation is no longer acceptable<span class="cite" data-ref="crossley2011,lecture"></span>. In general, a magnet makes a pacemaker pace asynchronously at a rate set by the manufacturer, and makes an ICD suspend tachyarrhythmia detection and therapy with no effect on the pacing mode<span class="cite" data-ref="lecture"></span>. Abbott, Boston Scientific and Biotronik pacemakers have a programmable magnet response, so the response must be confirmed before anyone relies on it<span class="cite" data-ref="sj2018,bsc2019,bio2019"></span>.</p>
<h3>Rates at a glance</h3>
<div class="tablewrap"><table>
<tr><th>Pacemaker</th><th>Nominal response</th><th>Replacement</th></tr>
<tr><td>Medtronic</td><td>85 (first 3 or 5 beats at 100)</td><td>65, VOO</td></tr>
<tr><td>Abbott</td><td>100 (98.6 older models); can be disabled</td><td>≈86 (card: 85)</td></tr>
<tr><td>Boston Scientific</td><td>100; 90 at mid-life; programmable</td><td>85</td></tr>
<tr><td>Biotronik</td><td>Auto: 10 beats at 90, then programmed settings</td><td>Auto: 10 at 80, VOO</td></tr>
<tr><td>Biotronik, Asynchronous</td><td>90, sustained</td><td>80, VOO</td></tr>
<tr><td>MicroPort / Sorin <span class="tag confirm">confirm</span></td><td>96</td><td>80</td></tr>
<tr><td>Micra</td><td>none</td><td>none</td></tr>
<tr><td>AVEIR</td><td>100 × 5, then 85–100 by battery</td><td>65</td></tr>
</table></div>
<p class="note">Sources: the 2018–2020 reviews<span class="cite" data-ref="sj2018,bsc2019,bio2019,mdt2020"></span>, the AVEIR tip card<span class="cite" data-ref="aveir"></span> and the bedside card<span class="cite" data-ref="card"></span>. The lecture’s table (St. Jude 100/85, Medtronic 85/65, Boston Scientific 100/85, Biotronik 90/80) gives the sustained rates; for Biotronik these apply only when the response is programmed to Asynchronous<span class="cite" data-ref="lecture,bio2019"></span>.</p>
<h3>Why the rate matters</h3>
<p>The magnet rate falls as the battery depletes, so a rate at the replacement value is itself a finding<span class="cite" data-ref="sj2018,bsc2019"></span>. Magnet settings rarely match the patient’s programming: Boston Scientific pacemakers use a fixed AV delay of 100 ms, and CRT-P devices lose their LV offset, which can change synchrony and output<span class="cite" data-ref="bsc2019"></span>.</p>
<h3>ICDs</h3>
<p>A magnet on an ICD suspends shocks and ATP only. It gives no pacing protection and never makes the device asynchronous<span class="cite" data-ref="card,mdt2020,bio2019"></span>. Tones are unreliable confirmation; palpation confirms only position. Tape the magnet, keep it reachable and recheck it after repositioning; it may fail in obese or prone patients<span class="cite" data-ref="card"></span>.</p>
<h3>Key points</h3>
<ol class="steps">
<li>Know the manufacturer, the programmed magnet response and the battery state before relying on a magnet.</li>
<li>Biotronik "Auto" gives only 10 asynchronous beats; Micra gives none.</li>
<li>An ICD magnet suspends therapies; it does not change pacing.</li>
</ol>`,
  quiz: [
    { q: 'A Biotronik pacemaker with the default magnet response is used for a carotid endarterectomy. What does a magnet do?', a: ['Sustained DOO at 90', '10 asynchronous beats at 90, then the programmed mode', 'Nothing'], c: 1, why: 'The default is Auto: 10 beats, then a return to the programmed settings at the lower rate.<span class="cite" data-ref="bio2019"></span>' },
    { q: 'A Medtronic pacemaker paces at 65 with a magnet. What does this mean?', a: ['Normal response', 'Elective replacement indicator', 'Magnet response programmed off'], c: 1, why: 'At ERI the Medtronic magnet response is VOO at 65.<span class="cite" data-ref="mdt2020"></span>' },
    { q: 'What does a magnet do to a Micra leadless pacemaker?', a: ['VOO at 85', 'VOO at 100 for 5 beats', 'Nothing; it has no magnet response'], c: 2, why: 'Micra has no magnet response; asynchronous pacing must be programmed.<span class="cite" data-ref="wan2024,card"></span>' },
  ],
  figClass: 'two',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const ls = liveStrip(host, baseDev(st), st.dep ? { sinus: 75, av: 'chb', escape: 0 } : { sinus: 75, av: 'normal', escape: 0 }, {
      title: 'ECG II · MARKER CHANNEL', sub: () => `${ls.sim.dev.mode} ${ls.sim.dev.mode === 'OOO' ? '' : ls.sim.dev.lrl}${ls.sim.dev.icd ? (ls.sim.dev.suspend ? ' · tachy SUSPENDED' : ' · tachy ON') : ''}${on ? ' · MAGNET' : ''}`,
    });
    let on = false, tOn = 0, R = response(st);
    const fixSetting = () => {
      const opts = SETTINGS[`${st.maker}.${st.type}`];
      if (!MAKERS[st.maker].types.includes(st.type)) st.type = MAKERS[st.maker].types[0];
      const o2 = SETTINGS[`${st.maker}.${st.type}`];
      if (o2 && !o2.some(o => o[0] === st.setting)) st.setting = o2[0][0];
      if (st.batt === 'mid' && st.maker !== 'bsc') st.batt = 'bol';
      // rebuild the setting list and disable device types this maker does not make
      const sel = document.querySelector('#c-magnet-setting');
      if (sel) { sel.textContent = ''; for (const [v, l] of (o2 || [])) sel.append(el('option', { value: v }, l)); sel.value = st.setting; }
      document.querySelectorAll('.control .seg button').forEach(b => {
        if (b.closest('.control').querySelector('.label')?.textContent === 'Device') b.disabled = !MAKERS[st.maker].types.includes(b.dataset.val);
        if (b.closest('.control').querySelector('.label')?.textContent === 'Battery' && b.dataset.val === 'mid') b.disabled = st.maker !== 'bsc';
      });
      return opts;
    };
    const magnet = v => {
      on = v; tOn = ls.sim.t;
      ls.sim.band('magnet', false); if (on) ls.sim.band('magnet', true);
      if (!on) ls.sim.set({ ...baseDev(st), rr: false });
      else if (R.therapy === 'suspended') ls.sim.set({ suspend: true });
      render();
    };
    const render = () => {
      const D = MAKERS[st.maker];
      const pacingTxt = R.pacing === 'async' ? `${R.mode}${R.seq?.length ? `, ${R.seq.map(([b, r]) => `${b} beats at ${r}`).join(', ')}, then` : ' at'} ${R.restore ? `the programmed settings${R.restore < 1 ? ' (lower rate −11%)' : ''}` : `${R.then} /min`}${R.delay ? ` after ${R.delay / 1000} s` : ''}`
        : R.pacing === 'unchanged' ? 'Unchanged (as programmed)' : 'No change';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
        <div class="verdict" style="margin:0">${D.label} · ${TYPES[st.type]}${R.confirm ? ' <span class="tag confirm">confirm</span>' : ''}</div>
        <div style="font:600 .8rem var(--sans);color:${on ? 'var(--accent)' : 'var(--ink-3)'}">${on ? 'MAGNET ON' : 'magnet off'} ${on && R.tone && !/^No/.test(R.tone) ? '<span class="tone"><i></i><i></i><i></i></span>' : ''}</div></div>
        <div class="grid2" style="padding:10px 0 0">
          <div class="box hl"><h5>Pacing with the magnet</h5>${pacingTxt}${R.av ? `<br>AV delay ${R.av} ms${st.maker === 'bio' ? ' (or the programmed delay if shorter)' : ''}` : ''}</div>
          <div class="box ${R.therapy === 'active' ? 'red' : ''}"><h5>Tachy therapies</h5>${{ suspended: 'Suspended while the magnet is on', active: 'NOT suspended', off: 'Programmed off', 'n/a': 'Not applicable (no defibrillator)' }[R.therapy]}</div>
          <div class="box"><h5>Confirmation</h5>${R.tone || (R.pacing === 'async' ? 'The paced rate and mode on the monitor' : 'None')}</div>
        </div>
        <ul style="margin-top:10px">${R.notes.map(n => `<li>${n}</li>`).join('')}</ul>
        <div style="color:var(--ink-3);font-size:.78rem">Sources: <span class="cite" data-ref="${R.refs.join(',')}"></span></div>`;
      ctx.cites?.(card);
    };
    fixSetting(); render();
    return {
      update(k) {
        fixSetting(); R = response(st);
        if (k === 'dep') ls.sim.set(null, st.dep ? { sinus: 75, av: 'chb', escape: 0 } : { sinus: 75, av: 'normal', escape: 0 });
        on = false; ls.sim.band('magnet', false); ls.sim.set({ ...baseDev(st), rr: false });
        render();
      },
      action(a) { magnet(a === 'on'); },
      tick(dt) {
        if (on && R.pacing === 'async') {
          const el2 = ls.sim.t - tOn;
          if (el2 >= (R.delay || 0)) {
            const ch = R.mode[0] === 'A' ? 'AP' : 'VP';
            const n = ls.sim.events.filter(e => e.code === ch && e.t >= tOn + (R.delay || 0)).length;
            let rate = null, acc = 0;
            for (const [b, r] of R.seq) { acc += b; if (n < acc) { rate = r; break; } }
            if (rate !== null) ls.sim.set({ mode: R.mode, lrl: rate, pav: R.av || 100, rr: false });
            else if (R.restore) ls.sim.set({ ...baseDev(st), lrl: Math.round(60 * R.restore) });
            else ls.sim.set({ mode: R.mode, lrl: R.then, pav: R.av || 100, rr: false });
          }
        }
        ls.tick(dt);
      },
      destroy: () => ls.destroy(),
      sim: ls.sim,
      readouts: () => [
        { k: 'Mode now', v: ls.sim.dev.mode },
        { k: 'Ventricular rate', v: ls.sim.vRate(4000), u: '/min' },
        { k: 'Therapies', v: ls.sim.dev.icd ? (ls.sim.dev.suspend ? 'suspended' : 'active') : 'n/a', f: ls.sim.dev.icd && !ls.sim.dev.suspend && on ? 'flag' : '' },
      ],
      live: () => {
        if (!on) return 'Press <b>Place magnet</b> to see the response on the strip.';
        if (R.pacing === 'none' && st.type !== 'sicd' && st.type !== 'evicd') return '<b>No asynchronous pacing.</b> With this device and setting, a magnet does not protect a pacing-dependent patient from inhibition.';
        if (R.restore) return ls.sim.dev.mode === 'DOO' || ls.sim.dev.mode === 'VOO' ? '<b>Asynchronous</b> for the first 10 beats…' : '<b>Back to the programmed mode</b> with the magnet still on: the patient is unprotected from inhibition.';
        if (R.pacing === 'unchanged') return '<b>ICD magnet.</b> Therapies are suspended; pacing continues exactly as programmed.';
        return `<b>${ls.sim.dev.mode} at ${ls.sim.dev.lrl}.</b> The device ignores intrinsic beats while the magnet is on.`;
      },
    };
  },
};
