import { el } from '../ui.js';

const P = {
  abbott: {
    name: 'Abbott (St. Jude): Merlin Patient Care System', ref: 'sj2018',
    keys: [],
    tasks: {
      start: ['Power cable (in the storage compartment) into the back left; switch on at the left side; open the screen with the front-right latch.', 'Place the wand over the generator and touch Interrogate. Radiofrequency telemetry works within about 6 feet of RF-capable devices after an inductive connection.', 'Print the FastPath Summary and Parameters before changing anything.'],
      magnet: ['Parameters → Basic Operation shows the magnet response (Battery Test, Off, Data Collection, or Data Collection + Battery Test for pacemakers; Normal or Off for ICDs). Change it here and press Program.'],
      async: ['Touch the displayed mode (or Parameters → Basic Operation / Rates), choose the asynchronous mode and rate, press Program, then confirm on the surface ECG and marker channel.'],
      rr: ['Change DDDR to DDD, or turn the sensor (accelerometer) off, then Program.'],
      tachy: ['On the summary screen touch Tachy Therapies → Disable Therapy; it is confirmed in two places. Re-enable from the same button after surgery. External pads must be available while therapies are off.'],
      dep: ['Tests → Temporary Pacing: VVI at 30 per minute (or the lowest rate) shows the underlying rhythm without changing the permanent settings.'],
    },
  },
  bsc: {
    name: 'Boston Scientific: Zoom Latitude (Model 3120, then 3300)', ref: 'bsc2019',
    keys: ['STAT SHOCK: press twice; maximum energy, committed but can be diverted', 'DIVERT THERAPY: press twice to cancel a shock; it does not stop STAT PACE', 'STAT PACE: press twice; VVI at 60 (biventricular with an active LV lead). Cancel via View Changes → Load Initials → Program.'],
    tasks: {
      start: ['Power cable into the back left; switch on; open the screen with the front latch; connect the wand on the right side.', 'Wand over the generator; press Quick Start.', 'Print an initial report (Reports tab).'],
      magnet: ['Device Settings report, “Magnet and Beeper”. Pacemakers: Pace Async (default), Off, or Store EGM. ICDs: On (default, tone) or Off.'],
      async: ['Settings tab → Brady/CRT Normal Settings: mode and lower rate; press Program.', 'Electrocautery Protection Mode (Tachy Mode screen) gives asynchronous pacing at the programmed outputs and lower rate and suspends tachy detection, but only if bradycardia pacing is on.'],
      rr: ['Change DDDR to DDD, or set the accelerometer to Passive, then Program. Minute-ventilation sensors deserve particular attention.'],
      tachy: ['Tachy Mode → Off → Apply Changes; or Electrocautery Protection. Re-enable Tachy Mode at the end and print a report.'],
      dep: ['Check the underlying rhythm and percentage paced before pacing asynchronously; the S-ICD has its own programmer (Model 3200) and wand (3203).'],
    },
  },
  mdt: {
    name: 'Medtronic: CareLink Encore (and CareLink)', ref: 'mdt2020',
    keys: ['Emergency VVI button: for the Azure XT DR MRI, VVI at 70, 6 V, 1.5 ms. It stops only when the device is reprogrammed.'],
    tasks: {
      start: ['Runs on its battery; power button at the top right; programming head in the right rear compartment; tethered stylus.', 'The Encore has no internal printer: print over Bluetooth or USB, or save to a flash drive. The older CareLink has a printer and the same software.'],
      magnet: ['Tests → Magnet tab. The review lists no programmable magnet settings for transvenous Medtronic devices: pacemakers 85 (65 at ERI); ICDs suspend therapy.'],
      async: ['Params → Parameters/Therapy: click the mode (e.g. AAIR<=>DDDR), choose DOO or VOO, set the lower rate, then PROGRAM. A CRT device may first need a non-adaptive setting.'],
      rr: ['Choose a non-R mode (e.g. DDD) and PROGRAM.'],
      tachy: ['Do not rely on “Suspend” in the status bar: it holds only while the telemetry link lasts.', 'Program VF, FVT and VT detection OFF, the “Detection (V.)…” row OFF, and AT/AF detection to Monitor or OFF; then PROGRAM. Turn each back on afterwards and check intervals and therapies against the printed settings.'],
      dep: ['Quick Look shows the percentage paced; Medtronic managed ventricular pacing (MVP) switches AAI(R)⇄DDD(R) and keeps ventricular pacing low.'],
    },
  },
  bio: {
    name: 'Biotronik: Renamic', ref: 'bio2019',
    keys: ['Emergency (safe program) pacing button, lower left: VVI at 80, 7.5 V, 1.5 ms, for pacemakers and ICDs. Stop it by programming the desired settings.', 'Emergency shock button, lower left (ICDs only, connection needed): confirm in a dialogue; a synchronized, maximum-energy, committed biphasic shock.'],
    tasks: {
      start: ['Release the latches on both sides; power cord from the rear compartment into the back left near the power button; untethered stylus.', 'Wand over the generator; the Follow-up tab shows patient, device, mode, rate, battery and percentage paced. Print before changes.'],
      magnet: ['Parameters → Basic rate/Night rate → magnet response: Auto (default), Async or Sync. “Magnet cycles 1–10” are the asynchronous beats in Auto.'],
      async: ['Parameters tab: choose the mode; select “All modes” to reach the asynchronous modes; set the rate; Program.'],
      rr: ['Choose a non-rate-adaptive mode: Biotronik offers accelerometer (R) or closed loop stimulation (CLS) modes, not both.'],
      tachy: ['Main screen: tachyarrhythmia therapy Off; Program. Reprogram On before discharge from the PACU. Biotronik ICDs give no tone with a magnet.'],
      dep: ['Check the indication, underlying rhythm and percentage paced in the Follow-up tab.'],
    },
  },
};
const TASKS = { start: 'Start and interrogate', magnet: 'Check the magnet response', async: 'Asynchronous pacing', rr: 'Rate response off', tachy: 'Suspend tachy therapies', dep: 'Dependence and rhythm' };

export default {
  key: 'programmers', num: '16', part: 'V', title: 'The programmers', short: 'Programmers', kicker: 'Four manufacturers, four machines',
  dek: 'Each manufacturer’s programmer talks only to its own devices. The basic tasks are the same everywhere (interrogate and print, check the magnet response, change mode and rate, disable rate response, suspend tachy therapies) but the steps and the emergency keys differ.',
  state: { brand: 'mdt', task: 'tachy' },
  controls: [
    { t: 'seg', k: 'brand', label: 'Manufacturer', opts: [['abbott', 'Abbott'], ['bsc', 'Boston Scientific'], ['mdt', 'Medtronic'], ['bio', 'Biotronik']] },
    { t: 'select', k: 'task', label: 'Task', opts: Object.entries(TASKS) },
  ],
  steps: [
    { set: { brand: 'mdt', task: 'tachy' }, note: '<b>Medtronic ICD.</b> “Suspend” lasts only while telemetry is linked; program each detection zone off instead.' },
    { set: { brand: 'bsc', task: 'async' }, note: '<b>Boston Scientific.</b> Electrocautery Protection Mode: asynchronous pacing and tachy detection off, if bradycardia pacing is on.' },
    { set: { brand: 'bio', task: 'magnet' }, note: '<b>Biotronik.</b> The magnet response lives under Basic rate/Night rate.' },
  ],
  prose: `
<h3>Who programs</h3>
<p>The review series does not support programming by untrained practitioners; it describes basic programming (mode, rate, rate response, magnet response and tachy therapies) as something anesthesiologists can learn with formal education and institutional support<span class="cite" data-ref="sj2018,bsc2019,mdt2020"></span>. Formal certification exists through the International Board of Heart Rhythm Examiners (IBHRE), but it is not focused on perioperative care<span class="cite" data-ref="sj2018"></span>.</p>
<h3>Every time</h3>
<ol class="steps">
<li>Print (or save) a report before any change and after the last one<span class="cite" data-ref="sj2018,bsc2019,mdt2020"></span>.</li>
<li>Press Program; a selection that is not programmed changes nothing<span class="cite" data-ref="sj2018,bsc2019"></span>.</li>
<li>Confirm the change on the surface ECG and the marker channel<span class="cite" data-ref="sj2018"></span>.</li>
<li>External pads and a defibrillator whenever tachy therapies are off<span class="cite" data-ref="sj2018,bsc2019,bio2019"></span>.</li>
</ol>
<p>Parameters such as sensitivity, pulse amplitude, refractory and blanking periods, delays, hysteresis and mode switching should be left to practitioners with advanced training, even in emergencies<span class="cite" data-ref="sj2018"></span>.</p>`,
  figClass: 'strip-only',
  fig(host, st, ctx) {
    const card = el('div', { class: 'card info' });
    host.append(card);
    const render = () => {
      const B = P[st.brand];
      card.innerHTML = `<div class="verdict" style="color:var(--accent)">${B.name}</div>
        <div class="grid2" style="padding:6px 0 0">
          <div class="box hl"><h5>${TASKS[st.task]}</h5><ol>${B.tasks[st.task].map(x => `<li>${x}</li>`).join('')}</ol></div>
          <div class="box red"><h5>Emergency keys</h5>${B.keys.length ? `<ul>${B.keys.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p>Not described in the review.</p>'}</div>
        </div>
        <div style="color:var(--ink-3);font-size:.78rem;margin-top:10px">Source <span class="cite" data-ref="${B.ref}"></span></div>`;
      ctx.cites(card);
    };
    render();
    return { update: render };
  },
};
