# The Heart, Paced.

An illustrated, interactive guide to the perioperative management of cardiac implantable electronic devices (CIEDs). Eighteen chapters in five parts and a bonus part follow the cardiothoracic fellowship lecture on CIEDs, from the NBG code to the postoperative device check. A companion in form to [The Heart by Ultrasound](https://github.com/douyang/echodemo): text on the left, a live figure on the right, a chapter bar below.

Every strip is simulated by one timing model of a pacemaker and defibrillator. Every value carries its source.

## Chapters

| Part | Chapter | The figure |
| --- | --- | --- |
| I Pacing | 01 The NBG code | Build a five-letter code; the strip paces a patient with complete heart block in that mode |
| | 02 Pacing modes | AOO to DDD in four patients: sinus node disease, sinus rhythm, heart block with and without an escape rhythm |
| | 03 Timing | SAV, PVARP, TARP and the upper rate interval; 1:1 tracking, pacemaker Wenckebach and 2:1 block as the sinus rate rises |
| | 04 Programmed features | Hysteresis (70/50), rate response with a minute-ventilation sensor, pacemaker-mediated tachycardia and its termination by a magnet, sleep rate |
| II Interference | 05 Electromagnetic interference | Operative site, energy, return pad and burst length on a torso; the bedside card's EMI risk; inhibition, noise tracking and inappropriate ICD shocks on the strip |
| III Magnet | 06 The magnet | Magnet responses of Medtronic, Abbott, Boston Scientific, Biotronik, MicroPort, Micra and AVEIR, by setting and battery |
| | 07 Magnet or reprogram? | Prerequisites for a magnet and the card's list of devices to reprogram |
| IV Perioperative care | 08 Identify the device | A schematic chest radiograph of ten systems, with a quiz mode |
| | 09 Reading the interrogation report | An editable report graded against each manufacturer's limits and two interrogation windows |
| | 10 The perioperative plan | The bedside card's flowchart, lit by four answers, with its nine notes |
| | 11 In the operating room | VF with an ICD magnet, VF with therapies off, a pacemaker magnet that slips during cautery |
| | 12 After surgery | HRS/ASA 2011, ASA 2011 and the bedside card side by side for the same events |
| | 13 No time to evaluate | The lecture's emergency protocol |
| V Devices | 14 The subcutaneous ICD | Sensing vectors, magnet position, deep implant, cautery |
| | 15 Temporary pacing | An external generator in mA and mV with the lecture's troubleshooting chart |
| | 16 The programmers | Merlin, Zoom Latitude, CareLink Encore and Renamic: tasks and emergency keys |
| B Bonus | B1 MRI and the device | MR safe, conditional, unsafe and nonconditional |
| | B2 Cases | Prone spine surgery with an ICD; the Biotronik carotid case; an unknown pacemaker in an emergency |

## Use

- **Chapters.** The bar at the bottom, the ← and → keys, or an address such as `#magnet` or `#emi`.
- **Play.** Plays each chapter's steps in order and moves on; any click or key pauses it.
- **Figures.** The controls on the left change the figure. Strips run in real time; with reduced motion they redraw on each change.
- **Sources** opens the reference list; each superscript number opens its entry.
- **Phones.** The figure stays in view above the text; the chapter bar stays at the bottom.

## How it works

- **One timing model** (`src/pace.js`) runs at 1-ms resolution. The heart has a sinus node, AV conduction (normal, first-degree or complete block), an optional ventricular escape rhythm, retrograde VA conduction and ventricular fibrillation. The device has the AOO, VOO, DOO, AAI, VVI, DDD and VDD modes with lower and upper rates, paced and sensed AV delays, PVARP and post-ventricular atrial blanking, a ventricular refractory period, hysteresis, rate response, capture thresholds and programmable sensitivity. An ICD layer counts ventricular intervals (VF zone 188 per minute, 8 of 10 intervals), charges for 6 s and reconfirms before it shocks; a return of normal intervals during charging diverts the charge. Electromagnetic interference is a train of signals on the atrial and ventricular leads with noise on the ECG.
- **The strip** (`src/strip.js`) draws the ECG and the marker channel (AS, AP, AR, VS, VP, noise, detection, charge, shock) as a sweeping monitor trace.
- **The values** in the text and tables come from the sources below. Where the bedside card (2026) and the 2018–2020 reviews differ, both are shown with their sources. Items the card marks *[confirm]* carry a *confirm* tag.
- **The model's intervals** are typical values chosen so that each behavior appears for the right reason. They are not any manufacturer's algorithm.

## Sources

- The cardiothoracic fellowship lecture *Perioperative Management of Cardiac Implantable Electronic Devices* (simulation session slides).
- Cronin B, Essandoh MK, et al. Perioperative interrogation of St. Jude (2018), Boston Scientific (2019), Biotronik (2019) and Medtronic (2020) CIEDs: a guide for anesthesiologists. *J Cardiothorac Vasc Anesth.*
- The two-sided CIED peri-operative bedside card (draft for discussion, 7 October 2026), and the Abbott AVEIR DR magnet tip card.
- Crossley GH, et al. HRS/ASA expert consensus statement, *Heart Rhythm* 2011; the ASA practice advisories (2011, 2020); Wan EY, et al. AHA scientific statement, *Circulation* 2024; Bernstein AD, et al. revised NBG code, *PACE* 2002; Indik JH, et al. HRS MRI statement, *Heart Rhythm* 2017.

The full list, with DOI or PubMed links, is in `src/refs.js` and opens from **Sources** on the page. A DOI appears only where it was read from the article or confirmed by search.

**Corrections to the lecture.** The site follows the sources where the lecture slides differ:
- The NBG table on the slides is the pre-2002 version; positions IV and V were redefined in 2002.
- Biotronik's default magnet response (Auto) gives only 10 asynchronous beats; the slide's 90/80 applies only to the Asynchronous setting.
- The separate S-ICD programmer and wand belong to the Boston Scientific EMBLEM S-ICD, not Medtronic.

The bedside card is a draft and is not approved. This guide is for education; it does not replace the device's manual, the manufacturer, the patient's CIED team or local policy.

## Run it

```
python3 -m http.server 8000
```

Open <http://localhost:8000/>. There is no build step: ES modules, canvas and SVG, no libraries. Fonts load from Google Fonts with system fallbacks.

## Code

```
index.html          the page shell and dialogs
styles.css          tokens (light and dark), layout, figures
src/main.js         the chapter engine: bar, panel, controls, readouts, citations, tour, keys, theme
src/chapters.js     chapter order and parts
src/ch/*.js         one module per chapter: text, controls, Play steps, quiz and figure
src/pace.js         the pacemaker/ICD timing model
src/strip.js        the ECG and marker-channel renderer
src/ui.js           flowchart, torso schematic and device drawings, live strip
src/refs.js         references
tools/              checks
```

## Checks

| Command | What it checks |
| --- | --- |
| `node tools/check-pace.mjs` | The timing model: VVI and DDD timing, 1:1 tracking, Wenckebach, 2:1 block, EMI inhibition, asynchronous pacing, ICD detection and shock, magnet suspension, hysteresis, PMT and its termination, T-wave oversensing, loss of capture |
| `node tools/audit.mjs` | In Chromium: 100 teaching scenarios across the chapters, each run on the figure's own simulation (for example Wenckebach at 135, the Biotronik Auto magnet's 10 beats, an ICD shocked by 9-s bursts but not by 4-s bursts, S-ICD magnet position, temporary-pacer undersensing) |
| `node tools/check-ui.mjs` | In Chromium (with the site served on port 8765): magnet responses, VF and ICD therapy, EMI shocks, the plan flowchart, the tour, keys, the Sources dialog and citation numbering |
| `node tools/shot.mjs <dir> <keys…> [--w= --h= --dark]` | Screenshots of chapters, with console errors and horizontal overflow |
