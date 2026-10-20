import { flowchart } from '../ui.js';

const NODES = [
  { id: 'n1', x: 380, y: 50, w: 440, h: 54, text: ['Pulse plethysmography OR arterial line', 'Transcutaneous pacing and defibrillation pads'] },
  { id: 'd1', x: 380, y: 150, w: 340, h: 84, dec: true, text: ['Is the patient pacemaker-dependent?', '(12-lead ECG or rhythm strip)'] },
  { id: 'ypm', x: 120, y: 290, w: 210, h: 84, tone: 'red', text: ['Pacemaker', 'Magnet over generator', 'Short bursts of', 'electrocautery'] },
  { id: 'yicd', x: 300, y: 290, w: 150, h: 84, tone: 'red', text: ['ICD / CRT-D', 'Magnet over generator', '(tachy suspended)', 'Short bursts until', 'reprogrammed'] },
  { id: 'npm', x: 470, y: 290, w: 150, h: 84, tone: 'amber', text: ['Pacemaker', 'Magnet available'] },
  { id: 'nicd', x: 640, y: 290, w: 150, h: 84, tone: 'red', text: ['ICD / CRT-D', 'Magnet over generator', '(tachy suspended)', 'Short bursts until', 'reprogrammed'] },
  { id: 'end', x: 380, y: 410, w: 440, h: 46, tone: 'green', text: ['Evaluate the device before leaving telemetry'] },
];
const EDGES = [
  { id: 'e1', d: 'M380,77 L380,106' },
  { id: 'eY', d: 'M250,150 L210,150 L210,240 L120,240 L120,246', label: 'Yes', lx: 225, ly: 142 },
  { id: 'eYi', d: 'M210,240 L300,240 L300,246' },
  { id: 'eN', d: 'M510,150 L555,150 L555,240 L470,240 L470,246', label: 'No', lx: 535, ly: 142 },
  { id: 'eNi', d: 'M555,240 L640,240 L640,246' },
  { id: 'eA', d: 'M120,332 L120,360 L380,360 L380,385' },
  { id: 'eB', d: 'M300,332 L300,360' },
  { id: 'eC', d: 'M470,332 L470,360' },
  { id: 'eD', d: 'M640,332 L640,360 L380,360' },
];

export default {
  key: 'emergency', num: '13', part: 'IV', title: 'No time to evaluate', short: 'Emergency', kicker: 'The emergency protocol',
  dek: 'In an emergency there may be no report and no time for interrogation. A pulse monitor, external pads and one question, whether the patient is pacing dependent, decide what to do with a magnet.',
  state: { dep: 'yes', dev: 'pm' },
  controls: [
    { t: 'seg', k: 'dep', label: 'Pacing dependent?', opts: [['yes', 'Yes'], ['no', 'No']] },
    { t: 'seg', k: 'dev', label: 'Device', opts: [['pm', 'Pacemaker'], ['icd', 'ICD / CRT-D']] },
  ],
  steps: [
    { set: { dep: 'yes', dev: 'pm' }, note: '<b>Dependent, pacemaker.</b> Magnet over the generator, short bursts of cautery.' },
    { set: { dep: 'yes', dev: 'icd' }, note: '<b>Dependent, ICD.</b> The magnet suspends tachy therapy but cannot protect pacing: short bursts until the device is reprogrammed.' },
    { set: { dep: 'no', dev: 'pm' }, note: '<b>Not dependent, pacemaker.</b> Keep a magnet available.' },
  ],
  prose: `
<h3>The protocol</h3>
<ol class="steps">
<li>Pulse plethysmography or an arterial line; transcutaneous pacing and defibrillation pads<span class="cite" data-ref="lecture"></span>.</li>
<li>Is the patient pacemaker-dependent? Use a 12-lead ECG or rhythm strip<span class="cite" data-ref="lecture"></span>.</li>
<li>Dependent: a pacemaker gets a magnet over the generator and short bursts of cautery; an ICD or CRT-D gets a magnet (tachy therapy suspended) and short bursts until it is reprogrammed<span class="cite" data-ref="lecture"></span>.</li>
<li>Not dependent: a pacemaker needs only a magnet available; an ICD or CRT-D gets a magnet and short bursts until it is reprogrammed<span class="cite" data-ref="lecture"></span>.</li>
<li>Evaluate the device before the patient leaves telemetry<span class="cite" data-ref="lecture"></span>.</li>
</ol>
<h3>Limits of the magnet</h3>
<p>A magnet over an ICD or CRT-D does not change pacing, so a dependent patient remains exposed to inhibition: short bursts until the device can be reprogrammed<span class="cite" data-ref="lecture,card"></span>. Some pacemakers give no sustained asynchronous pacing with a magnet (Biotronik Auto, Micra; chapter 06). Whatever the device does, never delay external pacing or a shock for programming or pad position<span class="cite" data-ref="card"></span>.</p>
<p>Emergency surgery without an adequate preoperative evaluation is itself an indication to interrogate the device afterwards<span class="cite" data-ref="crossley2011,bio2019,card"></span>.</p>`,
  quiz: [
    { q: 'An unidentified device, a trauma laparotomy, and the ECG shows 100% ventricular pacing. What comes first?', a: ['Wait for interrogation', 'Pulse monitoring and external pacing/defibrillation pads', 'Program DOO'], c: 1, why: 'The protocol starts with a pulse signal and external pads before the magnet decision.<span class="cite" data-ref="lecture"></span>' },
  ],
  figClass: 'strip-only',
  fig(host, st) {
    const F = flowchart(host, { w: 760, h: 450, nodes: NODES, edges: EDGES, cap: 'Emergency protocol for CIEDs · after the lecture' });
    const render = () => {
      const n = ['n1', 'd1', 'end'], e = ['e1'];
      if (st.dep === 'yes') { e.push('eY'); if (st.dev === 'pm') { n.push('ypm'); e.push('eA'); } else { n.push('yicd'); e.push('eYi', 'eB', 'eA'); } }
      else { e.push('eN'); if (st.dev === 'pm') { n.push('npm'); e.push('eC', 'eA'); } else { n.push('nicd'); e.push('eNi', 'eD', 'eA'); } }
      F.light(n, e);
    };
    render();
    return { update: render };
  },
};
