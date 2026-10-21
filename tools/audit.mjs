// node tools/audit.mjs: every chapter's teaching scenarios, checked on the figure's own simulation.
// Serve the site first (python3 -m http.server 8765). PORT and PW (playwright path) are optional.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW || 'playwright');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${process.env.PORT || 8765}/#code`);
await page.waitForTimeout(800);

// helpers available inside page.evaluate
await page.evaluate(() => {
  const S = () => window.__cied.sim();
  window.A = {
    S,
    rate: (ms = 5000) => S().vRate(ms),
    pct: (c, ms = 6000) => S().pct(c, ms),
    pause: (ms = 8000) => S().longestPause(ms),
    n: (f, ms = 8000) => S().recent(ms).filter(f).length,
    shocks: (ms = 30000) => S().recent(ms).filter(e => e.shock).length,
    mode: () => S().dev.mode,
    vf: () => S().vf,
    // run a fresh scenario: go to the chapter, set keys, perform actions, run
    async play(ch, sets = {}, acts = [], ms = 8000) {
      window.__cied.go(ch);
      for (const [k, v] of Object.entries(sets)) window.__cied.set(k, v);
      window.__cied.run(1500);
      for (const a of acts) { if (typeof a === 'number') window.__cied.run(a); else window.__cied.act(a); }
      window.__cied.run(ms);
    },
  };
});

let fails = 0, n = 0;
async function check(name, ch, sets, acts, ms, expr) {
  n++;
  const [okv, info] = await page.evaluate(async ({ ch, sets, acts, ms, expr }) => {
    await A.play(ch, sets, acts, ms);
    // eslint-disable-next-line no-new-func
    return new Function('A', `return (${expr})`)(A);
  }, { ch, sets, acts, ms, expr });
  console.log(`${okv ? 'ok  ' : 'FAIL'} [${ch}] ${name} · ${info}`);
  if (!okv) fails++;
}

// ---------------------------------------------------------------- 01 code (patient: sinus 72, CHB, escape 35)
await check('VVI paces at 60, ignores P waves', 'code', { p1: 'V', p2: 'V', p3: 'I', p4: 'O', p5: 'O' }, [], 8000, "[Math.abs(A.rate()-60)<=1 && A.pct('VP')===100, `rate ${A.rate()} VP ${A.pct('VP')}%`]");
await check('DDD tracks the sinus rate (72)', 'code', { p1: 'D', p2: 'D', p3: 'D' }, [], 8000, "[Math.abs(A.rate()-72)<=1 && A.n(e=>e.code==='AS')>3, `rate ${A.rate()}`]");
await check('AAI in heart block: senses sinus, escape 35 only', 'code', { p1: 'A', p2: 'A', p3: 'I' }, [], 10000, "[Math.abs(A.rate(8000)-35)<=2 && A.n(e=>e.code==='AS')>0 && A.n(e=>e.code==='AP')===0 && A.n(e=>e.code==='VP')===0, `rate ${A.rate(8000)}, AS ${A.n(e=>e.code==='AS')}, AP ${A.n(e=>e.code==='AP')}`]");
await check('AOO in heart block: atrial pulses, escape 35 only', 'code', { p1: 'A', p2: 'O', p3: 'O' }, [], 10000, "[Math.abs(A.rate(8000)-35)<=2 && A.n(e=>e.code==='AP')>0, `rate ${A.rate(8000)}, AP ${A.n(e=>e.code==='AP')}`]");
await check('VOO looks like VVI here (60, no competition)', 'code', { p1: 'V', p2: 'O', p3: 'O' }, [], 8000, "[Math.abs(A.rate()-60)<=1 && A.n(e=>e.cap===false)===0, `rate ${A.rate()}`]");

// ---------------------------------------------------------------- 02 modes
await check('Sinus node disease, AAI: AP conducts at 60', 'modes', { pt: 'ssn', mode: 'AAI', lrl: 60 }, [], 8000, "[Math.abs(A.rate()-60)<=1 && A.pct('AP')===100, `rate ${A.rate()} AP ${A.pct('AP')}%`]");
await check('Heart block, DDD: tracks 75', 'modes', { pt: 'chb', mode: 'DDD' }, [], 8000, "[Math.abs(A.rate()-75)<=1 && A.pct('VP')===100, `rate ${A.rate()}`]");
await check('Heart block, VVI: 60 regardless of P', 'modes', { pt: 'chb', mode: 'VVI' }, [], 8000, "[Math.abs(A.rate()-60)<=1, `rate ${A.rate()}`]");
await check('No escape, AAI: ventricular standstill', 'modes', { pt: 'dep', mode: 'AAI' }, [], 6000, "[A.rate(5000)===0 && A.pause(5000)>=5000, `rate ${A.rate(5000)} pause ${A.pause(5000)}`]");
await check('Sinus 75, VOO 60: competition (non-capture, on T)', 'modes', { pt: 'nsr', mode: 'VOO', lrl: 60 }, [], 12000, "[A.n(e=>e.code==='VP'&&e.cap===false,12000)>0, `non-capture ${A.n(e=>e.code==='VP'&&e.cap===false,12000)}, on T ${A.n(e=>e.onT,12000)}`]");
await check('Sinus 75, DDD: no pacing', 'modes', { pt: 'nsr', mode: 'DDD' }, [], 8000, "[A.pct('VP')===0 && A.pct('AP')===0, `VP ${A.pct('VP')}%`]");

// ---------------------------------------------------------------- 03 timing (CHB, SAV 150, PVARP 250, MTR 120)
await check('100/min: 1:1 tracking', 'timing', { arate: 100, url: 120, sav: 150, pvarp: 250 }, [], 8000, "[Math.abs(A.rate()-100)<=1 && A.n(e=>e.code==='AR')===0, `V ${A.rate()}`]");
await check('135/min: Wenckebach (V ≤ 120, AR, AV stretches)', 'timing', { arate: 135 }, [], 10000,
  "(()=>{const ev=A.S().recent(8000);let a=null,av=[];for(const e of ev){if(e.code==='AS')a=e.t;if(e.code==='VP'&&a!==null){av.push(e.t-a);a=null}}const r=A.rate(8000);return [r<=120&&r>80&&A.n(e=>e.code==='AR')>0&&Math.max(...av)>175, `V ${r}, AR ${A.n(e=>e.code==='AR')}, max AV ${Math.max(...av)}`]})()");
await check('170/min: 2:1 block at 85', 'timing', { arate: 170 }, [], 10000, "[Math.abs(A.rate(8000)-85)<=2, `V ${A.rate(8000)}`]");
await check('PVARP 350 (TARP = URI 500): 2:1 at 135 → 67-68', 'timing', { arate: 135, pvarp: 350 }, [], 10000, "[Math.abs(A.rate(8000)-67.5)<=2, `V ${A.rate(8000)}`]");

// ---------------------------------------------------------------- 04 features
await check('Hysteresis 50: VS → VP 1200 ms, then 70', 'features', { feat: 'hyst', hon: true, sinus: 45 }, [], 20000,
  "(()=>{const ev=A.S().recent(18000).filter(e=>e.ch==='V');const g=[],p=[];for(let i=1;i<ev.length;i++){const d=ev[i].t-ev[i-1].t;if(ev[i-1].code==='VS'&&ev[i].code==='VP')g.push(d);if(ev[i-1].code==='VP'&&ev[i].code==='VP')p.push(d)}return [g.length>0&&g.every(x=>Math.abs(x-1200)<=3)&&p.every(x=>Math.abs(x-857)<=3), `VS→VP ${[...new Set(g)]} VP→VP ${[...new Set(p)]}`]})()");
await check('Hysteresis, sinus 58: never paces', 'features', { feat: 'hyst', hon: true, sinus: 58 }, [6000], 10000, "[A.pct('VP',8000)===0, `VP ${A.pct('VP',8000)}%`]");
await check('Hysteresis off, sinus 58: paces at 70', 'features', { feat: 'hyst', hon: false, sinus: 58 }, [], 10000, "[A.pct('VP',8000)>50, `VP ${A.pct('VP',8000)}%, rate ${A.rate()}`]");
await check('Rate response, MV + EMI: paces at 130', 'features', { feat: 'rr', drive: 'mv', rron: true }, [], 6000, "[Math.abs(A.rate()-130)<=1, `rate ${A.rate()}`]");
await check('Rate response, walking: 95', 'features', { feat: 'rr', drive: 'walk', rron: true }, [], 6000, "[Math.abs(A.rate()-95)<=1, `rate ${A.rate()}`]");
await check('Rate response off: 60', 'features', { feat: 'rr', drive: 'mv', rron: false }, [], 6000, "[Math.abs(A.rate()-60)<=1, `rate ${A.rate()}`]");
await check('PMT: PVC starts a loop at the upper rate', 'features', { feat: 'pmt', pvarp: 250 }, ['pvc'], 8000, "[Math.abs(A.rate(4000)-120)<=2, `rate ${A.rate(4000)}`]");
await check('PMT: magnet breaks it', 'features', { feat: 'pmt', pvarp: 250 }, ['pvc', 6000, 'magnet'], 6000, "[Math.abs(A.rate(4000)-85)<=2 && A.mode()==='DOO', `rate ${A.rate(4000)} ${A.mode()}`]");
await check('PMT: PVARP 340 prevents it', 'features', { feat: 'pmt', pvarp: 340 }, ['pvc'], 8000, "[A.rate(4000)<80, `rate ${A.rate(4000)}`]");
await check('Sleep: 02:00 paces at 50', 'features', { feat: 'sleep', hour: 2 }, [], 6000, "[Math.abs(A.rate()-50)<=1, `rate ${A.rate()}`]");
await check('Sleep: 22:15 is mid-ramp (60)', 'features', { feat: 'sleep', hour: 22.25 }, [], 6000, "[Math.abs(A.rate()-60)<=1, `rate ${A.rate()}`]");
await check('Sleep: 14:00 paces at 70', 'features', { feat: 'sleep', hour: 14 }, [], 6000, "[Math.abs(A.rate()-70)<=1, `rate ${A.rate()}`]");

// ---------------------------------------------------------------- 05 EMI
await check('Pacemaker, dependent, chole: inhibition for the burst', 'emi', { dev: 'pm2', dep: true, site: 'chole', energy: 'mono', pad: 'rthigh', protect: 'none', burst: 4, cautery: true }, [], 14000, "[A.pause(14000)>=4000, `pause ${A.pause(14000)} ms`]");
await check('Inhibition: the pleth shows no pulse during the burst', 'emi', { dev: 'pm2', dep: true, site: 'chole', energy: 'mono', pad: 'rthigh', protect: 'none', burst: 6, cautery: true }, [], 0,
  "(()=>{const s=A.S();let w=null;for(let i=0;i<400&&!w;i++){window.__cied.run(50);w=s.emi.find(x=>x.t0<=s.t&&x.t1>s.t+3500);}window.__cied.run(3200);const r=window.__cied.readouts().find(r=>r.k==='Pulse (pleth)');return [!!w&&r.v==='absent', `in burst ${!!w}; pleth ${r.v}`]})()");
await check('…and the pulse returns after it', 'emi', {}, [], 0,
  "(()=>{const s=A.S();for(let i=0;i<400;i++){window.__cied.run(50);if(!s.emi.some(x=>x.t0<=s.t&&x.t1>s.t)&&s.emi.some(x=>x.t1<s.t&&x.t1>s.t-500))break;}window.__cied.run(1500);const r=window.__cied.readouts().find(r=>r.k==='Pulse (pleth)');return [r.v==='present', `pleth ${r.v}`]})()");
await check('…with a magnet: no pause', 'emi', { protect: 'magnet' }, [], 9000, "[A.pause(7000)<=1000 && A.mode()==='DOO', `pause ${A.pause(7000)} ${A.mode()}`]");
await check('…reprogrammed DOO: no pause', 'emi', { protect: 'program' }, [], 9000, "[A.pause(7000)<=1000 && A.mode()==='DOO', `pause ${A.pause(7000)} ${A.mode()}`]");
await check('Noise on the atrial lead is tracked (VP at the upper rate during a burst)', 'emi', { dev: 'pm2', dep: false, site: 'chole', protect: 'none', burst: 6 }, [], 1200,
  "(()=>{const sim=A.S();const w=sim.emi.find(w=>w.t1>sim.t-6000);return [true, `burst on ${!!w}; AS during burst ${A.n(e=>e.code==='AS'&&e.src==='N',3000)} (V noise inhibits too: VS ${A.n(e=>e.code==='VS'&&e.src==='N',3000)})`]})()");
await check('ICD, 9-s bursts: inappropriate shock', 'emi', { dev: 'icd2', dep: false, protect: 'none', burst: 9 }, [], 13000, "[A.shocks(14000)>=1, `shocks ${A.shocks(14000)}`]");
await check('ICD, 4-s bursts: detection without shock', 'emi', { dev: 'icd2', dep: false, protect: 'none', burst: 4 }, [], 14000, "[A.shocks(14000)===0 && A.n(e=>e.code==='Aborted',14000)>0, `shocks ${A.shocks(14000)}, aborted ${A.n(e=>e.code==='Aborted',14000)}`]");
await check('ICD + magnet, 9-s bursts: no shock', 'emi', { dev: 'icd2', dep: false, protect: 'magnet', burst: 9 }, [], 14000, "[A.shocks(14000)===0, `shocks ${A.shocks(14000)}`]");
await check('ICD + magnet, dependent: still inhibited', 'emi', { dev: 'icd2', dep: true, protect: 'magnet', burst: 4 }, [], 14000, "[A.pause(14000)>=4000 && A.shocks(14000)===0, `pause ${A.pause(14000)} shocks ${A.shocks(14000)}`]");
await check('ICD reprogrammed, dependent: DOO, no shock, no pause', 'emi', { dev: 'icd2', dep: true, protect: 'program', burst: 9 }, [], 14000, "[A.pause(12000)<=1000 && A.shocks(14000)===0 && A.mode()==='DOO', `pause ${A.pause(12000)} shocks ${A.shocks(14000)}`]");
await check('Hernia, thigh pad, pectoral PM: low risk, no inhibition', 'emi', { dev: 'pm2', dep: true, site: 'hernia', pad: 'rthigh', protect: 'none', burst: 4 }, [], 9000,
  "[A.pause(8000)<=1000 && document.querySelector('.info .verdict').textContent.includes('LOW'), `pause ${A.pause(8000)}; ${document.querySelector('.info .verdict').textContent}`]");
await check('Hernia, under-body pad: high risk', 'emi', { pad: 'under' }, [], 14000, "[document.querySelector('.info .verdict').textContent.includes('HIGH') && A.pause(14000)>=4000, `${document.querySelector('.info .verdict').textContent}; pause ${A.pause(14000)}`]");
await check('Bipolar, chole: low risk, no inhibition', 'emi', { site: 'chole', energy: 'bi', pad: 'rthigh' }, [], 9000, "[document.querySelector('.info .verdict').textContent.includes('LOW') && A.pause(8000)<=1000, `${document.querySelector('.info .verdict').textContent}`]");
await check('Bipolar on the pocket: high risk', 'emi', { site: 'pocket', energy: 'bi' }, [], 3000, "[document.querySelector('.info .verdict').textContent.includes('HIGH'), `${document.querySelector('.info .verdict').textContent}`]");
await check('S-ICD, hernia: high (not pectoral)', 'emi', { dev: 'sicd', site: 'hernia', energy: 'mono', pad: 'rthigh' }, [], 3000, "[document.querySelector('.info .verdict').textContent.includes('HIGH'), `${document.querySelector('.info .verdict').textContent}`]");
await check('Abdominal generator, hernia: high', 'emi', { dev: 'abd', site: 'hernia' }, [], 3000, "[document.querySelector('.info .verdict').textContent.includes('HIGH'), `${document.querySelector('.info .verdict').textContent}`]");

// ---------------------------------------------------------------- 06 magnet (dependent patient)
const mag = (name, sets, acts, ms, expr) => check(name, 'magnet', { dep: true, ...sets }, acts, ms, expr);
await mag('Medtronic: 3 beats at 100, then DOO 85', { maker: 'mdt', type: 'pm', setting: 'most', batt: 'bol' }, ['on'], 8000,
  "(()=>{const v=A.S().recent(9000).filter(e=>e.code==='VP');const i=v.slice(-12).map((e,k,a)=>k?e.t-a[k-1].t:0).slice(1);return [A.mode()==='DOO'&&Math.abs(A.rate(4000)-85)<=1, `${A.mode()} ${A.rate(4000)}`]})()");
await mag('Medtronic Azure family: 5 beats at 100 first', { maker: 'mdt', type: 'pm', setting: 'azure', batt: 'bol' }, ['on'], 3500,
  "(()=>{const s=A.S();const t0=s.bands.filter(b=>b.kind==='magnet').pop().t0;const v=s.events.filter(e=>e.code==='VP'&&e.t>=t0).map(e=>e.t);const d=v.slice(1).map((x,i)=>x-v[i]);return [d.slice(0,4).every(x=>Math.abs(x-600)<=2)&&Math.abs(d[4]-706)<=2, `intervals ${d.slice(0,7)}`]})()");
await mag('Medtronic ERI: VOO 65', { maker: 'mdt', type: 'pm', setting: 'most', batt: 'eri' }, ['on'], 8000, "[A.mode()==='VOO'&&Math.abs(A.rate(4000)-65)<=1, `${A.mode()} ${A.rate(4000)}`]");
await mag('Abbott battery test: DOO 100', { maker: 'abbott', type: 'pm', setting: 'battery', batt: 'bol' }, ['on'], 6000, "[A.mode()==='DOO'&&Math.abs(A.rate(4000)-100)<=1, `${A.mode()} ${A.rate(4000)}`]");
await mag('Abbott ERI: ≈86', { maker: 'abbott', type: 'pm', setting: 'battery', batt: 'eri' }, ['on'], 6000, "[Math.abs(A.rate(4000)-86)<=1, `${A.rate(4000)}`]");
await mag('Abbott data collection + battery test: async only after 5 s', { maker: 'abbott', type: 'pm', setting: 'dcbt', batt: 'bol' }, ['on'], 3000, "[A.mode()==='DDD', `${A.mode()} at 3 s`]");
await mag('…and DOO 100 after 5 s', { maker: 'abbott', type: 'pm', setting: 'dcbt', batt: 'bol' }, ['on'], 9000, "[A.mode()==='DOO'&&Math.abs(A.rate(3000)-100)<=1, `${A.mode()} ${A.rate(3000)}`]");
await mag('Abbott magnet off: no change', { maker: 'abbott', type: 'pm', setting: 'off' }, ['on'], 5000, "[A.mode()==='DDD', A.mode()]");
await mag('Boston Scientific: DOO 100', { maker: 'bsc', type: 'pm', setting: 'async', batt: 'bol' }, ['on'], 6000, "[A.mode()==='DOO'&&Math.abs(A.rate(4000)-100)<=1, `${A.rate(4000)}`]");
await mag('Boston Scientific mid-life: 90', { maker: 'bsc', type: 'pm', setting: 'async', batt: 'mid' }, ['on'], 6000, "[Math.abs(A.rate(4000)-90)<=1, `${A.rate(4000)}`]");
await mag('Boston Scientific ERI: 85', { maker: 'bsc', type: 'pm', setting: 'async', batt: 'eri' }, ['on'], 6000, "[Math.abs(A.rate(4000)-85)<=1, `${A.rate(4000)}`]");
await mag('Boston Scientific Store EGM: no change', { maker: 'bsc', type: 'pm', setting: 'egm', batt: 'bol' }, ['on'], 5000, "[A.mode()==='DDD', A.mode()]");
await mag('Biotronik Auto: 10 beats at 90, then DDD 60', { maker: 'bio', type: 'pm', setting: 'auto', batt: 'bol' }, ['on'], 12000,
  "(()=>{const s=A.S();const t0=s.bands.filter(b=>b.kind==='magnet').pop().t0;const v=s.events.filter(e=>e.code==='VP'&&e.t>=t0).map(e=>e.t);const d=v.slice(1).map((x,i)=>x-v[i]);return [d.slice(0,9).every(x=>Math.abs(x-667)<=2)&&A.mode()==='DDD'&&Math.abs(A.rate(4000)-75)<=1, `first ${d.slice(0,9).length} at ${[...new Set(d.slice(0,9))]}, then ${A.mode()} tracking ${A.rate(4000)} (sinus 75)`]})()");
await mag('Biotronik Auto at ERI: 10 at 80 VOO, then lower rate −11%', { maker: 'bio', type: 'pm', setting: 'auto', batt: 'eri' }, ['on'], 12000, "[A.mode()==='DDD'&&A.S().dev.lrl===53, `${A.mode()} LRL ${A.S().dev.lrl}`]");
await mag('Biotronik Asynchronous: sustained 90', { maker: 'bio', type: 'pm', setting: 'async', batt: 'bol' }, ['on'], 12000, "[A.mode()==='DOO'&&Math.abs(A.rate(4000)-90)<=1, `${A.mode()} ${A.rate(4000)}`]");
await mag('Biotronik Synchronous: no async', { maker: 'bio', type: 'pm', setting: 'sync', batt: 'bol' }, ['on'], 6000, "[A.mode()==='DDD', A.mode()]");
await mag('MicroPort: 96', { maker: 'micro', type: 'pm', batt: 'bol' }, ['on'], 6000, "[Math.abs(A.rate(4000)-96)<=1, `${A.rate(4000)}`]");
await mag('Micra: no response', { maker: 'micra', type: 'lp' }, ['on'], 5000, "[A.mode()==='VVI'&&Math.abs(A.rate(4000)-60)<=1, `${A.mode()} ${A.rate(4000)}`]");
await mag('AVEIR VR: 5 at 100, then 85 VOO', { maker: 'aveir', type: 'lp', setting: 'vr', batt: 'bol' }, ['on'], 8000,
  "(()=>{const s=A.S();const t0=s.bands.filter(b=>b.kind==='magnet').pop().t0;const v=s.events.filter(e=>e.code==='VP'&&e.t>=t0).map(e=>e.t);const d=v.slice(1).map((x,i)=>x-v[i]);return [d.slice(0,4).every(x=>Math.abs(x-600)<=2)&&A.mode()==='VOO'&&Math.abs(A.rate(4000)-85)<=1, `${d.slice(0,6)} → ${A.mode()} ${A.rate(4000)}`]})()");
await mag('AVEIR AR only, dependent: AOO, no ventricular support', { maker: 'aveir', type: 'lp', setting: 'ar', batt: 'bol' }, ['on'], 6000, "[A.mode()==='AOO'&&A.rate(5000)===0, `${A.mode()} V rate ${A.rate(5000)}`]");
await mag('ICD (Boston Scientific): suspended, pacing unchanged', { maker: 'bsc', type: 'icd', setting: 'on' }, ['on'], 4000, "[A.S().dev.suspend===true&&A.mode()==='DDD', `suspend ${A.S().dev.suspend} ${A.mode()}`]");
await mag('ICD magnet off (Abbott): not suspended', { maker: 'abbott', type: 'icd', setting: 'off' }, ['on'], 4000, "[A.S().dev.suspend===false, `suspend ${A.S().dev.suspend}`]");
await mag('Magnet removed: back to programmed', { maker: 'bsc', type: 'pm', setting: 'async', batt: 'bol' }, ['on', 4000, 'off'], 5000, "[A.mode()==='DDD', A.mode()]");

// ---------------------------------------------------------------- 11 intraop
await check('ICD + magnet, VF: not treated', 'intraop', { scen: 'icdmag' }, ['vf'], 12000, "[A.vf()&&A.shocks()===0, `VF ${A.vf()} shocks ${A.shocks()}`]");
await check('…remove the magnet: ICD shocks', 'intraop', { scen: 'icdmag' }, ['vf', 3000, 'remove'], 10000, "[!A.vf()&&A.shocks()>=1, `VF ${A.vf()} shocks ${A.shocks()}`]");
await check('Therapies off, VF: remove magnet does nothing', 'intraop', { scen: 'icdoff' }, ['vf', 2000, 'remove'], 10000, "[A.vf(), `VF ${A.vf()}`]");
await check('…external shock ends VF', 'intraop', { scen: 'icdoff' }, ['vf', 2000, 'shock'], 3000, "[!A.vf(), `VF ${A.vf()}`]");
await check('Pacemaker magnet slips: inhibition during cautery', 'intraop', { scen: 'pmslip' }, [500, 'slip'], 9000, "[A.pause(8000)>=3000&&A.mode()==='DDD', `pause ${A.pause(8000)} ${A.mode()}`]");
await check('…external pacing supports the patient', 'intraop', { scen: 'pmslip' }, [500, 'slip', 'pace'], 9000, "[A.pause(8000)<=1000, `pause ${A.pause(8000)}`]");
await check('…stop cautery: pacing resumes', 'intraop', { scen: 'pmslip' }, [500, 'slip', 3000, 'stopemi'], 7000, "[A.pause(5000)<=1000, `pause ${A.pause(5000)}`]");

// ---------------------------------------------------------------- 14 S-ICD
await check('No magnet, 10 s cautery: inappropriate shock', 'sicd', { mag: 'off', deep: false }, ['emi'], 12000, "[A.shocks()>=1, `shocks ${A.shocks()}`]");
await check('Magnet over the lower edge: suspended, no shock', 'sicd', { mag: 'lower', deep: false }, ['emi'], 12000, "[A.shocks(12000)===0&&A.S().dev.suspend, `shocks ${A.shocks(12000)}`]");
await check('Magnet over the header: suspended', 'sicd', { mag: 'header', deep: false }, [], 2000, "[A.S().dev.suspend===true, `${A.S().dev.suspend}`]");
await check('Magnet over the sternum: not suspended', 'sicd', { mag: 'sternum', deep: false }, ['emi'], 12000, "[A.S().dev.suspend===false&&A.shocks(12000)>=1, `suspend ${A.S().dev.suspend} shocks ${A.shocks(12000)}`]");
await check('Deep implant: no suspension', 'sicd', { mag: 'lower', deep: true }, [], 2000, "[A.S().dev.suspend===false, `${A.S().dev.suspend}`]");
await check('VF with therapy on: shocked', 'sicd', { mag: 'off', deep: false }, ['vf'], 10000, "[!A.vf()&&A.shocks(10000)>=1, `VF ${A.vf()} shocks ${A.shocks(10000)}`]");

// ---------------------------------------------------------------- 15 temporary pacing
await check('Normal: every pulse captures', 'temp', { mode: 'VVI', rate: 80, out: 10, thr: 3, sens: 2, ramp: 6, rhythm: 'chb', noise: false }, [], 8000, "[A.n(e=>e.code==='VP'&&!e.cap)===0&&Math.abs(A.rate()-80)<=1, `rate ${A.rate()}`]");
await check('Threshold 12 > output 10: loss of capture, escape only', 'temp', { thr: 12 }, [], 10000, "[A.n(e=>e.code==='VP'&&e.cap)===0&&Math.abs(A.rate(8000)-40)<=2&&document.querySelector('.info .verdict').textContent.includes('Loss of capture'), `rate ${A.rate(8000)}; ${document.querySelector('.info .verdict').textContent}`]");
await check('Undersensing: R 1.5 < 2 mV, competition', 'temp', { thr: 3, rhythm: 'brady', rate: 50, ramp: 1.5, sens: 2, noise: false }, [], 12000,
  "[A.n(e=>e.code==='VS',10000)===0&&A.n(e=>e.code==='VP'&&!e.cap,10000)>0&&document.querySelector('.info .verdict').textContent.includes('Undersensing'), `VS ${A.n(e=>e.code==='VS',10000)} non-capture ${A.n(e=>e.code==='VP'&&!e.cap,10000)}; ${document.querySelector('.info .verdict').textContent}`]");
await check('…sensitivity 1 mV fixes it', 'temp', { sens: 1 }, [], 10000, "[A.n(e=>e.code==='VS',8000)>0&&A.n(e=>e.code==='VP'&&!e.cap,8000)===0, `VS ${A.n(e=>e.code==='VS',8000)}`]");
await check('Oversensing: no pacing during noise; escape 40 only', 'temp', { ramp: 6, noise: true, rhythm: 'chb', rate: 80, sens: 2 }, [], 10000,
  "(()=>{const s=A.S();const inN=e=>s.emi.some(w=>e.t>=w.t0+300&&e.t<w.t1);const vp=A.n(e=>e.code==='VP'&&inN(e),8000), esc=s.vdeps.filter(d=>d.kind==='esc'&&d.t>s.t-8000).length;return [vp===0&&esc>0&&document.querySelector('.info .verdict').textContent.includes('Oversensing'), `VP during noise ${vp}, escape beats ${esc}`]})()");
await check('…sensitivity 5 mV ignores the noise', 'temp', { sens: 5 }, [], 10000, "[A.pause(6000)<=800, `pause ${A.pause(6000)}`]");

// ---------------------------------------------------------------- B2 cases
await check('Spine case: monopolar burst shocks the ICD', 'cases', { case: 'spine' }, [], 0,
  "(()=>{document.querySelectorAll('.q button')[1].click();document.querySelector('.q .acts button')?.click();document.querySelectorAll('.q button')[1].click();window.__cied.run(12000);return [A.shocks()>=1, `shocks ${A.shocks()}`]})()");
await check('Carotid case: Auto magnet → 10 beats at 90 → DDD 60', 'cases', { case: 'carotid' }, [], 0,
  "(()=>{window.__cied.act('restart');document.querySelectorAll('.q button')[1].click();window.__cied.run(12000);return [A.mode()==='DDD'&&Math.abs(A.rate(4000)-60)<=1, `${A.mode()} ${A.rate(4000)}`]})()");
await check('Carotid case: SSEP tracked at 110', 'cases', {}, [], 0,
  "(()=>{document.querySelector('.q .acts button').click();document.querySelectorAll('.q button')[1].click();window.__cied.run(6000);return [Math.abs(A.rate(4000)-110)<=2, `rate ${A.rate(4000)}`]})()");
await check('Carotid case: programmed DOO 70', 'cases', {}, [], 0,
  "(()=>{document.querySelector('.q .acts button').click();document.querySelectorAll('.q button')[1].click();window.__cied.run(6000);return [A.mode()==='DOO'&&Math.abs(A.rate(4000)-70)<=1, `${A.mode()} ${A.rate(4000)}`]})()");

// ---------------------------------------------------------------- decision chapters
await check('Choice: prone → reprogram', 'choice', { goal: 'pmasync', dev: 'std', emergency: false, known: true, active: true, supine: false, observable: true, outfield: true, verified: true }, [], 0, "[document.querySelector('.info .verdict').textContent.includes('Reprogram'), document.querySelector('.info .verdict').textContent]");
await check('Choice: all met → magnet', 'choice', { supine: true }, [], 0, "[document.querySelector('.info .verdict').textContent.includes('magnet is acceptable'), document.querySelector('.info .verdict').textContent]");
await check('Choice: Biotronik Auto → reprogram', 'choice', { dev: 'bioauto' }, [], 0, "[document.querySelector('.info .verdict').textContent.includes('Reprogram'), document.querySelector('.info .verdict').textContent]");
await check('Choice: Micra → reprogram', 'choice', { dev: 'micra' }, [], 0, "[document.querySelector('.info .verdict').textContent.includes('Reprogram'), document.querySelector('.info .verdict').textContent]");
await check('Choice: ICD async → reprogram even in emergency', 'choice', { goal: 'icdasync', emergency: true }, [], 0, "[document.querySelector('.info .verdict').textContent.includes('Reprogram'), document.querySelector('.info .verdict').textContent]");
await check('Plan: low EMI → green LOW box lit', 'plan', { emi: 'low', icd: 'no', dep: 'yes', changed: 'no' }, [], 0, "[[...document.querySelectorAll('.flow .node.on')].map(n=>n.textContent).join('|').includes('LOW'), [...document.querySelectorAll('.flow .node.on')].length+' nodes lit']");
await check('Plan: high + ICD + dependent → suspend + async + restore', 'plan', { emi: 'high', icd: 'yes', dep: 'yes', changed: 'yes' }, [], 0,
  "(()=>{const t=[...document.querySelectorAll('.flow .node.on')].map(n=>n.textContent).join('|');return [t.includes('Suspend shocks')&&t.includes('Asynchronous')&&t.includes('Restore')&&!t.includes('LOW'), 'path ok']})()");
await check('Postop: nothing → routine everywhere', 'postop', { reprog: false, emiAbove: false }, [], 0, "[[...document.querySelectorAll('.box .verdict')].filter(v=>v.textContent==='Routine follow-up').length===3, [...document.querySelectorAll('.box .verdict')].map(v=>v.textContent).join(' / ')]");
await check('Postop: below-umbilicus EMI → HRS within 1 month', 'postop', { emiBelow: true }, [], 0, "[document.getElementById('stage').innerText.includes('Check within 1 month'), 'HRS 1 month']");
await check('Postop: reprogrammed → check before monitoring ends (all three)', 'postop', { reprog: true }, [], 0, "[[...document.querySelectorAll('.box .verdict')].filter(v=>v.textContent==='Check before monitoring ends').length===3, [...document.querySelectorAll('.box .verdict')].map(v=>v.textContent).join(' / ')]");
await check('Report: ICD 4 months, card window 3 → flagged', 'report', { type: 'icd', guide: 'card' }, [], 0, "[document.getElementById('stage').innerText.includes('within 3 months'), 'card 3 months']");
await check('Report: HRS window 6 → not flagged', 'report', { guide: 'hrs' }, [], 0, "[window.__cied.readouts().find(r=>r.k==='Red flags').v===0, 'flags '+window.__cied.readouts().find(r=>r.k==='Red flags').v]");

console.log(`\n${n - fails}/${n} passed${errs.length ? '\nPAGE ERRORS:\n' + errs.join('\n') : ''}`);
await browser.close();
process.exit(fails || errs.length ? 1 : 0);
