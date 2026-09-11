// Temporary visual-critic probe. Deleted before finishing.
import { chromium } from '@playwright/test';
const BASE = 'http://localhost:4396';
const b = await chromium.launch();
const out = {};

// A. scroll spy state at top after returning
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const read = async () => p.evaluate(() => ({
    y: Math.round(window.scrollY),
    current: [...document.querySelectorAll('header a')].filter(a => a.getAttribute('aria-current')).map(a => a.textContent.trim() + '=' + a.getAttribute('aria-current')),
  }));
  out.spy = [];
  out.spy.push(['fresh', await read()]);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(600); out.spy.push(['bottom', await read()]);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(800); out.spy.push(['back to top', await read()]);
  await p.evaluate(() => window.scrollTo(0, 300));
  await p.waitForTimeout(600); out.spy.push(['y=300', await read()]);
  await ctx.close();
}

// B. article rail geometry, real: find element in cols 9-12
{
  out.rail = {};
  for (const [n, u] of [['note', '/blog/streaming-is-a-state-machine'], ['case', '/projects/merchant-assistant']]) {
    for (const w of [1440, 1280, 1120, 1024, 900, 768, 390]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      const p = await ctx.newPage();
      await p.goto(BASE + u, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => {
        const bx = (e) => e ? (() => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), t: Math.round(r.top + scrollY), h: Math.round(r.height) }; })() : null;
        const prose = document.querySelector('.prose');
        // any element whose left is >= prose.right and which contains text
        const pb = prose.getBoundingClientRect();
        let cands = [...document.querySelectorAll('body *')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.left >= pb.right - 2 && r.width > 40 && r.height > 40 && (e.innerText || '').trim().length > 3;
        });
        cands.sort((a, c) => c.getBoundingClientRect().height - a.getBoundingClientRect().height);
        const rail = cands.find(e => !e.querySelector('footer') && !['FOOTER', 'HEADER', 'BODY', 'HTML'].includes(e.tagName));
        return {
          prose: bx(prose),
          railTag: rail ? rail.tagName + '.' + (rail.className || '').toString().slice(0, 40) : null,
          rail: bx(rail),
          railText: rail ? (rail.innerText || '').replace(/\s+/g, ' ').slice(0, 160) : null,
          docH: document.documentElement.scrollHeight,
          vw: document.documentElement.clientWidth,
        };
      });
      out.rail[n + '@' + w] = r;
      await ctx.close();
    }
  }
}

// C. pixel emptiness: fraction of dark pixels in the right band of the note page
// done via screenshot elsewhere; here compute ink coverage per column band via elements
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  out.inkBands = {};
  for (const [n, u] of [['note', '/blog/streaming-is-a-state-machine'], ['case', '/projects/merchant-assistant']]) {
    await p.goto(BASE + u, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    out.inkBands[n] = await p.evaluate(() => {
      const H = document.documentElement.scrollHeight;
      const W = document.documentElement.clientWidth;
      // for each 50px vertical slice, record the rightmost inked x among text/graphic leaves
      const leaves = [...document.querySelectorAll('body *')].filter(e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = e.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        const isGfx = ['SVG', 'IMG'].includes(e.tagName) || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0;
        return hasText || isGfx;
      }).map(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, tag: e.tagName }; });
      const slices = [];
      for (let y = 0; y < H; y += 50) {
        let maxR = 0;
        for (const e of leaves) if (e.t <= y + 50 && e.b >= y && e.r > maxR && e.r <= W + 1) maxR = e.r;
        slices.push({ y, rightmost: Math.round(maxR) });
      }
      // how much of the page height has ink beyond x=900 (i.e. right 37%)
      const withRight = slices.filter(s => s.rightmost > 900).length;
      return { H, slices: slices.length, sliceWithInkPast900: withRight, pct: Math.round((withRight / slices.length) * 100), sample: slices.filter((_, i) => i % 8 === 0).slice(0, 20) };
    });
  }
  await ctx.close();
}

// D. bone band + requestpath
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  out.bone = await p.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter(e => /bone/.test((e.className || '').toString()));
    const rp = [...document.querySelectorAll('*')].filter(e => /(^|\s)rp\b|request/.test((e.className || '').toString()));
    const bx = e => { const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0, 50), l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top + scrollY), h: Math.round(r.height), bg: getComputedStyle(e).backgroundColor }; };
    return { bone: els.map(bx), rpCount: rp.length, rp: rp.slice(0, 3).map(bx) };
  });
  await p.goto(BASE + '/projects/merchant-assistant', { waitUntil: 'networkidle' });
  await p.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 20)); } scrollTo(0, 0); });
  await p.waitForTimeout(500);
  out.caseRp = await p.evaluate(() => {
    const rp = [...document.querySelectorAll('*')].filter(e => /(^|\s)rp/.test((e.className || '').toString()));
    const bx = e => { const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top + scrollY), h: Math.round(r.height) }; };
    return { count: rp.length, first: rp[0] ? bx(rp[0]) : null };
  });
  await ctx.close();
}

// E. progress rail live
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const r = async () => p.evaluate(() => { const e = document.querySelector('.progress-rail'); if (!e) return null; const cs = getComputedStyle(e); return { name: cs.animationName, tl: cs.animationTimeline, tf: cs.transform, w: Math.round(e.getBoundingClientRect().width) }; });
  out.progress = { top: await r() };
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2)); await p.waitForTimeout(400);
  out.progress.mid = await r();
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400);
  out.progress.end = await r();
  await ctx.close();
}

await b.close();
console.log(JSON.stringify(out, null, 2));
