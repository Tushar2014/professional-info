// Temporary visual verification helper. Delete before finishing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:4396';
const OUT = '/tmp/vis-shots';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = {
  home: '/',
  projects: '/projects',
  case: '/projects/merchant-assistant',
  blog: '/blog',
  note: '/blog/streaming-is-a-state-machine',
  resume: '/resume',
  notfound: '/404',
};

const ACCENTS = ['rgb(238, 74, 148)', 'rgb(171, 58, 112)', 'rgb(150, 27, 80)'];

async function settle(page) {
  // scroll through the page so every reveal fires, then return to top
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 22));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
  });
}

async function shoot(page, name, opts = {}) {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
}

const browser = await chromium.launch();
const results = {};

// ---------- 1. screenshots ----------
for (const [w, h] of [[1440, 900], [1120, 900], [768, 1024], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, route] of Object.entries(ROUTES)) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await settle(page);
    await shoot(page, `${name}-${w}-fold`);
    if (w === 1440 || w === 390) {
      await settle(page);
      await shoot(page, `${name}-${w}-full`, { fullPage: true });
    }
  }
  await ctx.close();
}

// extra: home mid/deep scroll bands at 1440 for tail inspection
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('section[id], div[id]')].map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + window.scrollY }))
  );
  results.homeSections = { H, sections };
  for (const id of ['outcomes', 'layers', 'work', 'experience', 'stack', 'writing', 'credentials', 'contact']) {
    const s = sections.find((x) => x.id === id);
    if (!s) continue;
    await page.evaluate((y) => window.scrollTo(0, y), s.top - 40);
    await page.waitForTimeout(500);
    await shoot(page, `home-1440-sec-${id}`);
  }
  await ctx.close();
}

// ---------- 2. .prose geometry on article pages ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.prose = {};
  for (const [name, route] of [['note', ROUTES.note], ['case', ROUTES.case]]) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await settle(page);
    results.prose[name] = await page.evaluate(() => {
      const g = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top + window.scrollY) };
      };
      const h1 = document.querySelector('h1');
      const h1r = h1.getBoundingClientRect();
      // count h1 line boxes by distinct rect tops
      const rng = document.createRange();
      rng.selectNodeContents(h1);
      const tops = new Set([...rng.getClientRects()].map((r) => Math.round(r.top)));
      return {
        vw: window.innerWidth,
        pageH: document.documentElement.scrollHeight,
        prose: g('.prose'),
        rail: g('[class*="rail"]'),
        h1: { l: Math.round(h1r.left), r: Math.round(h1r.right), w: Math.round(h1r.width), lines: tops.size },
        quote: g('.pullquote, .quote-band, [class*="pullquote"], blockquote'),
        // widest empty horizontal run right of prose: compute occupied x-extents per y band
        rightSideOccupancy: (() => {
          const pr = document.querySelector('.prose').getBoundingClientRect();
          const top = pr.top + window.scrollY, bot = top + pr.height;
          let maxRight = 0;
          for (const e of document.querySelectorAll('main *')) {
            const r = e.getBoundingClientRect();
            const t = r.top + window.scrollY;
            if (r.width < 2 || r.height < 2) continue;
            if (t + r.height < top || t > bot) continue;
            if (r.right > maxRight) maxRight = r.right;
          }
          return { proseRight: Math.round(pr.right), maxRightInBand: Math.round(maxRight), vw: window.innerWidth };
        })(),
      };
    });
  }
  await ctx.close();
}

// ---------- 3. accent census per homepage section ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.accent = await page.evaluate((ACC) => {
    const isAcc = (v) => ACC.some((a) => v && v.includes(a));
    const out = {};
    const secs = [...document.querySelectorAll('section[id], div[id]')].filter((s) => s.getBoundingClientRect().height > 100);
    for (const s of secs) {
      let n = 0;
      const hits = [];
      for (const e of [s, ...s.querySelectorAll('*')]) {
        const cs = getComputedStyle(e);
        const probe = [cs.color, cs.backgroundColor, cs.backgroundImage, cs.borderTopColor, cs.borderLeftColor, cs.borderBottomColor, cs.borderRightColor, cs.fill, cs.stroke, cs.outlineColor];
        // only count borders if width nonzero
        const bw = [cs.borderTopWidth, cs.borderLeftWidth, cs.borderBottomWidth, cs.borderRightWidth];
        let hit = false;
        if (isAcc(cs.color) || isAcc(cs.backgroundColor) || isAcc(cs.backgroundImage) || isAcc(cs.fill) || isAcc(cs.stroke)) hit = true;
        if (!hit) {
          const names = ['borderTopColor', 'borderLeftColorX', 'borderBottomColor', 'borderRightColor'];
          if (isAcc(cs.borderTopColor) && parseFloat(cs.borderTopWidth) > 0) hit = true;
          if (isAcc(cs.borderLeftColor) && parseFloat(cs.borderLeftWidth) > 0) hit = true;
          if (isAcc(cs.borderBottomColor) && parseFloat(cs.borderBottomWidth) > 0) hit = true;
          if (isAcc(cs.borderRightColor) && parseFloat(cs.borderRightWidth) > 0) hit = true;
        }
        if (hit) { n++; hits.push(e.tagName + '.' + (e.className && e.className.toString ? e.className.toString().slice(0, 40) : '')); }
      }
      const r = s.getBoundingClientRect();
      out[s.id || s.tagName] = { count: n, top: Math.round(r.top + window.scrollY), h: Math.round(r.height), sample: hits.slice(0, 6) };
    }
    out.__doc = { h: document.documentElement.scrollHeight };
    // imagery census
    out.__figs = [...document.querySelectorAll('figure, svg')].map((e) => {
      const r = e.getBoundingClientRect();
      return { tag: e.tagName, cls: (e.className && e.className.toString ? e.className.toString() : '').slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY) };
    }).filter((x) => x.w > 60 && x.h > 60);
    return out;
  }, ACCENTS);
  await ctx.close();
}

// ---------- 4. fold at 1440x900 on / ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  results.fold = await page.evaluate(() => {
    const units = [];
    const walk = (root) => {
      for (const e of root.querySelectorAll('*')) {
        const r = e.getBoundingClientRect();
        if (r.height < 6 || r.width < 6) continue;
        if (r.top >= 900) continue;
        const cs = getComputedStyle(e);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const txt = (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70);
        units.push({ tag: e.tagName, cls: (e.className && e.className.toString ? e.className.toString() : '').slice(0, 34), top: Math.round(r.top), bot: Math.round(r.bottom), txt, fullyIn: r.bottom <= 900, fs: cs.fontSize });
      }
    };
    walk(document);
    const heroLeft = document.querySelector('.hero-left');
    const panel = document.querySelector('.identity-panel, [class*="identity"]');
    const box = (e) => e ? { t: Math.round(e.getBoundingClientRect().top + window.scrollY), b: Math.round(e.getBoundingClientRect().bottom + window.scrollY) } : null;
    return { units, heroLeft: box(heroLeft), panel: box(panel) };
  });
  await ctx.close();
}

// ---------- 5. plate/svg geometry across widths ----------
{
  results.plates = {};
  for (const w of [1440, 1120, 768, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    results.plates[w] = {};
    for (const [name, route] of Object.entries(ROUTES)) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      await settle(page);
      results.plates[w][name] = await page.evaluate(() =>
        [...document.querySelectorAll('svg')].map((s) => {
          const r = s.getBoundingClientRect();
          return {
            cls: (s.getAttribute('class') || '').slice(0, 30),
            par: s.getAttribute('preserveAspectRatio'),
            vb: s.getAttribute('viewBox'),
            w: Math.round(r.width), h: Math.round(r.height),
            ratio: r.height ? +(r.width / r.height).toFixed(3) : null,
            rects: s.querySelectorAll('rect').length,
            paths: s.querySelectorAll('path').length,
            lines: s.querySelectorAll('line').length,
            circles: s.querySelectorAll('circle').length,
            texts: s.querySelectorAll('text').length,
            role: s.getAttribute('role'), label: s.getAttribute('aria-label'), hidden: s.getAttribute('aria-hidden'),
          };
        }).filter((x) => x.w > 40 && x.h > 40)
      );
    }
    await ctx.close();
  }
}

// ---------- 6. overflow census ----------
{
  results.overflow = [];
  for (const w of [320, 360, 390, 414, 768, 900, 1000, 1024, 1280, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    for (const [name, route] of Object.entries(ROUTES)) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      await settle(page);
      const r = await page.evaluate(async () => {
        const d = document.documentElement;
        window.scrollTo(500, 0);
        await new Promise((res) => setTimeout(res, 90));
        const sx = window.scrollX;
        window.scrollTo(0, 0);
        // find widest offenders
        let worst = [];
        if (d.scrollWidth > d.clientWidth) {
          for (const e of document.querySelectorAll('body *')) {
            const rr = e.getBoundingClientRect();
            if (rr.right > d.clientWidth + 1) worst.push({ tag: e.tagName, cls: (e.className && e.className.toString ? e.className.toString() : '').slice(0, 40), right: Math.round(rr.right), txt: (e.textContent || '').trim().slice(0, 40) });
          }
        }
        return { sw: d.scrollWidth, cw: d.clientWidth, sx, worst: worst.slice(0, 5) };
      });
      if (r.sw > r.cw || r.sx > 0) results.overflow.push({ w, name, ...r });
    }
    await ctx.close();
  }
}

// ---------- 7. contrast census ----------
{
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.contrast = {};
  for (const [name, route] of Object.entries(ROUTES)) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await settle(page);
    const samples = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
      const bgOf = (e) => {
        let n = e;
        while (n && n !== document.documentElement) {
          const cs = getComputedStyle(n);
          const c = parse(cs.backgroundColor);
          if (c && c[3] > 0.5) return c.slice(0, 3);
          n = n.parentElement;
        }
        return [10, 12, 16];
      };
      const out = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.children.length && [...e.childNodes].every((n) => n.nodeType !== 3 || !n.textContent.trim())) continue;
        const t = (e.textContent || '').trim();
        if (!t) continue;
        const cs = getComputedStyle(e);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.5) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const fg = parse(cs.color); if (!fg) continue;
        out.push({ tag: e.tagName, cls: (e.className && e.className.toString ? e.className.toString() : '').slice(0, 34), fg: fg.slice(0, 3), bg: bgOf(e), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, txt: t.slice(0, 40) });
      }
      return out;
    });
    const fails = [];
    for (const s of samples) {
      const cr = ratio(s.fg, s.bg);
      const large = s.fs >= 24 || (s.fs >= 18.66 && +s.fw >= 700);
      const need = large ? 3 : 4.5;
      if (cr < need) fails.push({ ...s, cr: +cr.toFixed(2), need });
    }
    results.contrast[name] = { checked: samples.length, fails: fails.slice(0, 12), failCount: fails.length };
  }
  await ctx.close();
}

// ---------- 8. bone band + RequestPath ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.bone = {};
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.bone.home = await page.evaluate(() => {
    const b = document.querySelector('.band-bone, [class*="bone"]');
    const rp = document.querySelector('.rp, [class*="request-path"], [class*="rp-"]');
    const g = (e) => e ? { cls: e.className.toString().slice(0, 40), l: Math.round(e.getBoundingClientRect().left), r: Math.round(e.getBoundingClientRect().right), h: Math.round(e.getBoundingClientRect().height), bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color } : null;
    return { bone: g(b), rp: g(rp), rpCount: document.querySelectorAll('[class*="rp-bar"]').length };
  });
  for (const [name, route] of [['case', ROUTES.case], ['projects', ROUTES.projects]]) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await settle(page);
    results.bone[name] = await page.evaluate(() => {
      const rp = document.querySelector('[class*="rp"]');
      const g = (e) => e ? { cls: e.className.toString().slice(0, 40), l: Math.round(e.getBoundingClientRect().left), r: Math.round(e.getBoundingClientRect().right), h: Math.round(e.getBoundingClientRect().height) } : null;
      return { rp: g(rp), bars: document.querySelectorAll('[class*="rp-bar"]').length, bone: !!document.querySelector('.band-bone') };
    });
  }
  await ctx.close();
}

await browser.close();
fs.writeFileSync('/tmp/vis-results.json', JSON.stringify(results, null, 2));
console.log('done');
