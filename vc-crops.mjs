// Temporary visual-critic crop helper. Deleted before finishing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const BASE = 'http://localhost:4396';
const OUT = '/tmp/vc-shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 20)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 300));
  });
  await page.waitForTimeout(300);
}

const plan = JSON.parse(process.argv[2]);
for (const job of plan) {
  const ctx = await browser.newContext({ viewport: { width: job.w, height: job.vh || 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + job.url, { waitUntil: 'networkidle' });
  if (job.settle !== false) await settle(page);
  if (job.scrollTo !== undefined) { await page.evaluate((y) => window.scrollTo(0, y), job.scrollTo); await page.waitForTimeout(500); }
  await page.screenshot({
    path: `${OUT}/${job.name}.png`,
    fullPage: !!job.clip,
    clip: job.clip,
  });
  await ctx.close();
}
await browser.close();
console.log('CROPS DONE');
