// node tools/check-ui.mjs: drive key interactions in Chromium and check the page state.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW || 'playwright');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const ro = async k => page.evaluate(k => [...document.querySelectorAll('.readouts > div')].find(d => d.querySelector('dt').textContent === k)?.querySelector('dd').textContent, k);
const click = async t => page.locator('button', { hasText: t }).first().click();
const base = `http://localhost:${process.env.PORT || 8765}/`;

await page.goto(base + '#magnet'); await page.waitForTimeout(800);
await click('Place magnet'); await page.waitForTimeout(3000);
ok((await ro('Mode now')) === 'DOO', `Biotronik Auto: DOO first (${await ro('Mode now')})`);
await page.waitForTimeout(6000);
ok((await ro('Mode now')) === 'DDD', `Biotronik Auto: back to DDD after 10 beats (${await ro('Mode now')})`);

await page.selectOption('#c-magnet-maker', 'mdt'); await page.waitForTimeout(300);
await click('Place magnet'); await page.waitForTimeout(7000);
ok((await ro('Mode now')) === 'DOO' && /8[45]/.test(await ro('Ventricular rate')), `Medtronic: DOO at 85 (${await ro('Ventricular rate')})`);

await page.selectOption('#c-magnet-maker', 'micra'); await page.waitForTimeout(300);
await click('Place magnet'); await page.waitForTimeout(2000);
ok((await ro('Mode now')) === 'VVI', `Micra: no change (${await ro('Mode now')})`);

await page.goto(base + '#intraop'); await page.waitForTimeout(800);
await click('Ventricular fibrillation'); await page.waitForTimeout(4000);
ok((await ro('Rhythm')) === 'VF', 'Intraop: VF with magnet persists');
await click('Remove magnet'); await page.waitForTimeout(10000);
ok((await ro('Rhythm')) !== 'VF', `Intraop: ICD shocks after magnet removed (${await ro('Rhythm')})`);

await page.goto(base + '#emi'); await page.waitForTimeout(800);
await page.selectOption('#c-emi-dev', 'icd2'); await page.locator('#c-emi-dep').uncheck();
await page.locator('#c-emi-burst').fill('9'); await page.waitForTimeout(14000);
ok(+(await ro('Shocks')) >= 1, `EMI: ICD, 9-s bursts shock (${await ro('Shocks')})`);

await page.goto(base + '#plan'); await page.waitForTimeout(500);
await page.locator('.flow .node.click').first().click(); await page.waitForTimeout(200);
ok((await page.locator('.info .verdict').first().textContent()).includes('Identify'), 'Plan: clicking a box opens its note');

await page.goto(base + '#code'); await page.waitForTimeout(500);
await page.locator('#btn-play').click(); await page.waitForTimeout(1500);
ok((await page.locator('.live').textContent()).includes('VVI'), 'Tour: first step applied');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
ok(page.url().endsWith('#modes'), 'Arrow key: next chapter');

await page.locator('#btn-refs').click(); await page.waitForTimeout(300);
ok(await page.locator('#dlg-refs').evaluate(d => d.open), 'Sources dialog opens');
const missing = await page.evaluate(() => [...document.querySelectorAll('.cite')].filter(c => !c.textContent.trim()).length);
ok(missing === 0, `all citations numbered (${missing} empty)`);

console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
process.exit(fails || errs.length ? 1 : 0);
