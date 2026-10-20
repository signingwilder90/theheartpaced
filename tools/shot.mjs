// node tools/shot.mjs <outdir> [keys...] [--w=1440 --h=900 --dark]: screenshot chapters, report console errors.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PW || '/usr/local/lib/node_modules/playwright'); }
const args = process.argv.slice(2);
const out = args[0];
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const keys = args.slice(1).filter(a => !a.startsWith('--'));
const W = +(opt.w || 1440), H = +(opt.h || 900);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, colorScheme: opt.dark ? 'dark' : 'light' });
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => errs.push(`[pageerror] ${e.message}`));
for (const k of keys) {
  await page.goto(`http://localhost:${opt.port || 8765}/#${k}`);
  await page.waitForTimeout(+(opt.wait || 2500));
  await page.screenshot({ path: `${out}/${k}-${W}${opt.dark ? '-dark' : ''}.png` });
}
const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log('horizontal overflow:', over);
console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
