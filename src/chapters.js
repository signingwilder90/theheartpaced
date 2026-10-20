// Chapter order and parts.
import code from './ch/code.js';
import modes from './ch/modes.js';
import timing from './ch/timing.js';
import features from './ch/features.js';
import emi from './ch/emi.js';
import magnet from './ch/magnet.js';
import choice from './ch/choice.js';
import identify from './ch/identify.js';
import report from './ch/report.js';
import plan from './ch/plan.js';
import intraop from './ch/intraop.js';
import postop from './ch/postop.js';
import emergency from './ch/emergency.js';
import sicd from './ch/sicd.js';
import temp from './ch/temp.js';
import programmers from './ch/programmers.js';
import mri from './ch/mri.js';
import cases from './ch/cases.js';

export const PARTS = [
  { id: 'I', name: 'Pacing' },
  { id: 'II', name: 'Interference' },
  { id: 'III', name: 'Magnet' },
  { id: 'IV', name: 'Perioperative care' },
  { id: 'V', name: 'Devices' },
  { id: 'B', name: 'Bonus' },
];

export const CHAPTERS = [code, modes, timing, features, emi, magnet, choice, identify, report, plan, intraop, postop, emergency, sicd, temp, programmers, mri, cases];
