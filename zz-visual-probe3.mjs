// Temporary: scroll-state screenshots and geometry. Delete before finishing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const BASE = 'http://localhost:4396';
const OUT = '/tmp/vis-scroll';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const out = {};

async function mk(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const s = document.createElement('style');
    s.textContent = 'astro-dev-toolbar{display:none !important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  return { ctx, page };
}
async function settle(page) {
  await page.evaluate(async () => {
    const hh = document.documentElement.scrollHeight;
    for (let y = 0; y < hh; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300));
  });
}

// note + case: mid-scroll sticky rail check
for (const [name, route] of [['note', '/blog/streaming-is-a-state-machine'], ['case', '/projects/merchant-assistant']]) {
  const { ctx, page } = await mk(1440, 900);
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await settle(page);
  out[name] = { steps: [] };
  for (const y of [800, 1400, 2000, 2600]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}-1440-y${y}.png` });
    out[name].steps.push(await page.evaluate((yy) => {
      const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
      const pos = document.querySelector('[data-rail-pos]');
      return { y: yy, rail: g('.article-rail'), gutter: g('.article-gutter'), prose: g('.prose'), pos: pos ? pos.textContent : null, progressRail: (() => { const e = document.querySelector('.progress-rail'); if (!e) return null; const cs = getComputedStyle(e); return { name: cs.animationName, timeline: cs.animationTimeline, transform: cs.transform, w: Math.round(e.getBoundingClientRect().width) }; })() };
    }, y));
  }
  await ctx.close();
}

// note at widths for rail geometry
out.railWidths = {};
for (const w of [1440, 1280, 1120, 1024, 900, 768, 390]) {
  const { ctx, page } = await mk(w, 900);
  await page.goto(BASE + '/blog/streaming-is-a-state-machine', { waitUntil: 'networkidle' });
  await settle(page);
  out.railWidths[w] = await page.evaluate(() => {
    const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top + window.scrollY) }; };
    const p = document.querySelector('.prose p');
    const h2 = document.querySelector('.prose h2');
    return { vw: innerWidth, prose: g('.prose'), rail: g('.article-rail'), gutter: g('.article-gutter'), para: p ? Math.round(p.getBoundingClientRect().width) : null, h2w: h2 ? Math.round(h2.getBoundingClientRect().width) : null };
  });
  await page.screenshot({ path: `${OUT}/note-${w}-top.png` });
  await ctx.close();
}

// homepage tail sections at 1440 with toolbar hidden
{
  const { ctx, page } = await mk(1440, 900);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  const secs = await page.evaluate(() => [...document.querySelectorAll('section[id]')].map((s) => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) })));
  out.homeSecs = secs;
  out.homeH = await page.evaluate(() => document.documentElement.scrollHeight);
  for (const s of secs) {
    for (const off of [0, 700]) {
      if (off > 0 && s.h < 700) continue;
      await page.evaluate((y) => window.scrollTo(0, y), s.top - 20 + off);
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${OUT}/home-sec-${s.id}${off ? '-b' : ''}.png` });
    }
  }
  // fold shot clean
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/home-1440-fold-clean.png` });
  await ctx.close();
}

// bone band + RequestPath detail
{
  const { ctx, page } = await mk(1440, 900);
  for (const [name, route] of [['home', '/'], ['case', '/projects/merchant-assistant'], ['projects', '/projects']]) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await settle(page);
    const info = await page.evaluate(() => {
      const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top + scrollY), bg: cs.backgroundColor, color: cs.color }; };
      return { bone: g('.band-bone'), rp: g('.rp'), rpBars: document.querySelectorAll('.rp-bar').length, rpAny: document.querySelectorAll('[class^="rp-"]').length };
    });
    out['bone_' + name] = info;
    for (const sel of ['.band-bone', '.rp']) {
      const el = page.locator(sel).first();
      if (await page.locator(sel).count()) {
        try { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await el.screenshot({ path: `${OUT}/${name}${sel.replace(/[.\[\]]/g, '')}.png` }); } catch (e) { console.log('ERR', name, sel, e.message.slice(0, 60)); }
      }
    }
  }
  await ctx.close();
}

await browser.close();
fs.writeFileSync('/tmp/vis-scroll.json', JSON.stringify(out, null, 2));
console.log('done');
