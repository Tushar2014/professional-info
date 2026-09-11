// Temporary: element close-ups. Delete before finishing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const BASE = 'http://localhost:4396';
const OUT = '/tmp/vis-zoom';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function zoom(route, sel, name, w, h, scale = 2, nth = 0) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const hh = document.documentElement.scrollHeight;
    for (let y = 0; y < hh; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300));
  });
  const el = page.locator(sel).nth(nth);
  const n = await page.locator(sel).count();
  if (n === 0) { console.log('MISS', name, sel); await ctx.close(); return; }
  try { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await el.screenshot({ path: `${OUT}/${name}.png` }); }
  catch (e) { console.log('ERR', name, e.message.slice(0, 80)); }
  await ctx.close();
}

await zoom('/', '.plate-portrait', 'plate-hero-1440', 1440, 900);
await zoom('/', '.plate-portrait', 'plate-hero-1120', 1120, 900);
await zoom('/', '.plate-portrait', 'plate-hero-768', 768, 1024);
await zoom('/', '.plate-portrait', 'plate-hero-390', 390, 844);
await zoom('/projects/merchant-assistant', '.plate-banner', 'plate-banner-1440', 1440, 900);
await zoom('/projects/merchant-assistant', '.plate-banner', 'plate-banner-390', 390, 844);
await zoom('/projects', 'article', 'card-1440', 1440, 900);
await zoom('/', '#credentials .plate-figure', 'plate-cred-1440', 1440, 900);
await zoom('/', '#stack', 'stack-1440', 1440, 900);
await zoom('/', '#writing', 'writing-1440', 1440, 900);
await zoom('/', '#contact', 'contact-1440', 1440, 900);
await zoom('/', '#outcomes', 'outcomes-1440', 1440, 900, 1);
await zoom('/', '#layers', 'layers-1440', 1440, 900, 1);
await zoom('/blog', 'main', 'blogmain-1440', 1440, 900, 1);
await zoom('/blog/streaming-is-a-state-machine', '.rail, [class*="rail"]', 'rail-1440', 1440, 900);
await zoom('/resume', 'main', 'resumemain-1440', 1440, 900, 1);
await browser.close();
console.log('done');
