// Temporary visual-critic helper. Deleted before finishing.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:4396';
const OUT = '/tmp/vc-shots';
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
  // scroll through so every reveal fires, then return to top
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
  });
  await page.waitForTimeout(400);
}

const results = {};

const browser = await chromium.launch();

// ---------- 1. screenshots ----------
const shotPlan = [
  ['home', 1440, 900, ['fold', 'full']],
  ['home', 1120, 900, ['fold']],
  ['home', 768, 1024, ['fold', 'full']],
  ['home', 390, 844, ['fold', 'full']],
  ['projects', 1440, 900, ['fold', 'full']],
  ['case', 1440, 900, ['fold', 'full']],
  ['case', 390, 844, ['fold']],
  ['blog', 1440, 900, ['fold', 'full']],
  ['note', 1440, 900, ['fold', 'full']],
  ['note', 768, 1024, ['fold']],
  ['note', 390, 844, ['fold']],
  ['resume', 1440, 900, ['fold', 'full']],
  ['notfound', 1440, 900, ['fold']],
];

for (const [name, w, h, kinds] of shotPlan) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + ROUTES[name], { waitUntil: 'networkidle' });
  await settle(page);
  for (const k of kinds) {
    await page.screenshot({
      path: `${OUT}/${name}-${w}x${h}-${k}.png`,
      fullPage: k === 'full',
    });
  }
  await ctx.close();
}

// ---------- 2. .prose geometry on article routes ----------
results.prose = {};
for (const name of ['note', 'case']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + ROUTES[name], { waitUntil: 'networkidle' });
  await settle(page);
  results.prose[name] = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
      };
    };
    const prose = document.querySelector('.prose');
    const rail = document.querySelector('[class*="rail"]');
    const h1 = document.querySelector('h1');
    // count h1 visual lines
    const lineCount = (el) => {
      if (!el) return null;
      const r = document.createRange();
      r.selectNodeContents(el);
      const tops = new Set([...r.getClientRects()].map((x) => Math.round(x.top)));
      return tops.size;
    };
    // widest empty horizontal run to the right of prose, sampled down the prose height
    const pb = prose.getBoundingClientRect();
    const py = pb.top + window.scrollY;
    let maxEmpty = 0;
    const vw = document.documentElement.clientWidth;
    for (let y = 0; y < pb.height; y += 60) {
      window.scrollTo(0, 0);
      // find rightmost element occupying that band right of prose
      let rightmost = pb.right;
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        const ay = r.top + window.scrollY;
        if (ay > py + y || ay + r.height < py + y) return;
        if (r.width < 2 || r.height < 2) return;
        if (r.left < pb.right - 1) return;
        if (r.right > rightmost) rightmost = r.right;
      });
      const empty = Math.round(vw - rightmost);
      // gap between prose right and next thing
      if (empty > maxEmpty) maxEmpty = empty;
    }
    return {
      prose: box(prose),
      railClass: rail ? rail.className : null,
      rail: box(rail),
      h1: box(h1),
      h1Lines: lineCount(h1),
      viewport: vw,
      pageHeight: document.documentElement.scrollHeight,
      trailingEmptyRight: maxEmpty,
    };
  });
  await ctx.close();
}

// ---------- 3. accent census per homepage section ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.accent = await page.evaluate((ACCENTS) => {
    const isAccent = (v) => ACCENTS.some((a) => v && v.includes(a));
    const sections = [...document.querySelectorAll('section[id], header[id], div[id]')].filter(
      (s) => s.id
    );
    const out = [];
    for (const s of sections) {
      let n = 0;
      const hits = [];
      for (const el of s.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        const probe = [
          cs.color,
          cs.backgroundColor,
          cs.backgroundImage,
          cs.borderTopColor === cs.color && cs.borderTopWidth === '0px' ? '' : cs.borderTopColor,
          cs.borderLeftColor,
          cs.fill,
          cs.stroke,
        ];
        // only count border colours if there is a border
        let hit = false;
        if (isAccent(cs.color)) hit = true;
        if (isAccent(cs.backgroundColor)) hit = true;
        if (isAccent(cs.backgroundImage)) hit = true;
        if (cs.borderTopWidth !== '0px' && isAccent(cs.borderTopColor)) hit = true;
        if (cs.borderLeftWidth !== '0px' && isAccent(cs.borderLeftColor)) hit = true;
        if (isAccent(cs.fill)) hit = true;
        if (isAccent(cs.stroke)) hit = true;
        if (hit) {
          n++;
          if (hits.length < 4) hits.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40));
        }
      }
      const r = s.getBoundingClientRect();
      out.push({
        id: s.id,
        accent: n,
        samples: hits,
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
        imgs: s.querySelectorAll('svg, img').length,
        bigFigures: [...s.querySelectorAll('figure, svg')].filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 500 && b.height > 250;
        }).length,
      });
    }
    return { sections: out, docHeight: document.documentElement.scrollHeight };
  }, ACCENTS);
  await ctx.close();
}

// ---------- 4. fold units at 1440x900 ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.fold = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const walk = (el) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        const txt = (c.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 70);
        if (r.height < 4 || r.width < 4) { walk(c); continue; }
        if (r.top >= 900) continue;
        // leaf-ish text units
        const hasTextChild = [...c.children].some((k) => (k.innerText || '').trim().length > 0);
        if (!hasTextChild && txt) {
          if (!seen.has(txt)) {
            seen.add(txt);
            out.push({ t: txt, top: Math.round(r.top), bottom: Math.round(r.bottom), tag: c.tagName, cls: (c.className||'').toString().slice(0,30) });
          }
        } else {
          walk(c);
        }
      }
    };
    walk(document.body);
    const cols = {};
    const l = document.querySelector('.hero-left');
    const p = document.querySelector('.hero-panel, .identity-panel, [class*="identity"]');
    const bx = (e) => e ? { top: Math.round(e.getBoundingClientRect().top + window.scrollY), bottom: Math.round(e.getBoundingClientRect().bottom + window.scrollY), cls: e.className } : null;
    cols.left = bx(l); cols.panel = bx(p);
    const h1 = document.querySelector('h1');
    const rg = document.createRange(); rg.selectNodeContents(h1);
    const h1lines = new Set([...rg.getClientRects()].map(x=>Math.round(x.top))).size;
    return { units: out.sort((a,b)=>a.top-b.top), cols, h1lines, h1h: Math.round(h1.getBoundingClientRect().height) };
  });
  await ctx.close();
}

// ---------- 5. overflow at many widths x routes ----------
results.overflow = [];
for (const w of [320, 360, 390, 414, 768, 900, 1000, 1024, 1280, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  for (const [name, url] of Object.entries(ROUTES)) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(120);
    const r = await page.evaluate(async () => {
      const d = document.documentElement;
      const over = d.scrollWidth - d.clientWidth;
      window.scrollTo(500, 0);
      await new Promise((r) => setTimeout(r, 60));
      const sx = Math.round(window.scrollX);
      window.scrollTo(0, 0);
      // widest offender
      let worst = null;
      if (over > 0) {
        let best = 0;
        document.querySelectorAll('body *').forEach((el) => {
          const b = el.getBoundingClientRect();
          if (b.right > d.clientWidth + 0.5 && b.right > best) {
            best = b.right;
            worst = el.tagName + '.' + (el.className || '').toString().slice(0, 50) + ' right=' + Math.round(b.right);
          }
        });
      }
      return { over, sx, worst };
    });
    if (r.over > 0 || r.sx > 0) results.overflow.push({ w, name, ...r });
  }
  await ctx.close();
}

// ---------- 6. contrast audit all routes ----------
function srgb(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function lum([r, g, b]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
results.contrast = {};
for (const [name, url] of Object.entries(ROUTES)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await settle(page);
  const samples = await page.evaluate(() => {
    const parse = (s) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((x) => parseFloat(x));
      return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
    };
    const bgOf = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        const c = parse(cs.backgroundColor);
        if (c && c.a > 0.95) return c.rgb;
        n = n.parentElement;
      }
      return [10, 12, 16];
    };
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.children.length > 0) {
        // only count direct text nodes
        const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!direct) return;
      }
      const txt = (el.textContent || '').trim();
      if (txt.length < 2) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.1) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const fg = parse(cs.color);
      if (!fg) return;
      out.push({
        txt: txt.slice(0, 45),
        fg: fg.rgb,
        a: fg.a,
        bg: bgOf(el),
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        sel: el.tagName + '.' + (el.className || '').toString().slice(0, 40),
      });
    });
    return out;
  });
  const fails = [];
  for (const s of samples) {
    if (s.a < 0.95) continue;
    const cr = ratio(s.fg, s.bg);
    const large = s.size >= 24 || (s.size >= 18.66 && parseInt(s.weight) >= 700);
    const need = large ? 3 : 4.5;
    if (cr < need - 0.005) fails.push({ ...s, cr: +cr.toFixed(2), need });
  }
  results.contrast[name] = { checked: samples.length, fails: fails.slice(0, 12), failCount: fails.length };
  await ctx.close();
}

// ---------- 7. bone band + RequestPath ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.bone = await page.evaluate(() => {
    const b = document.querySelector('.band-bone, [class*="bone"]');
    const rp = document.querySelector('[class*="rp-"], .request-path, #request-path');
    const bx = (e) => e ? { cls: e.className, left: Math.round(e.getBoundingClientRect().left), right: Math.round(e.getBoundingClientRect().right), h: Math.round(e.getBoundingClientRect().height), bg: getComputedStyle(e).backgroundColor } : null;
    const rpRoot = document.querySelector('.rp') || (rp && rp.closest('figure,section,div'));
    return { bone: bx(b), rpPresent: !!rp, rp: bx(rpRoot) };
  });
  results.boneOutcomes = await page.evaluate(() => {
    const s = document.querySelector('#outcomes');
    if (!s) return null;
    return { cls: s.className, bg: getComputedStyle(s).backgroundColor, inner: [...s.children].map(c=>c.className.toString().slice(0,40)) };
  });
  await ctx.close();
}

// ---------- 8. plate geometry at 4 widths ----------
results.plates = {};
for (const w of [1440, 1120, 768, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.plates[w] = await page.evaluate(() => {
    return [...document.querySelectorAll('svg')].map((s) => {
      const r = s.getBoundingClientRect();
      const rects = s.querySelectorAll('rect');
      const heights = {};
      rects.forEach((x) => {
        const h = Math.round(x.getBoundingClientRect().height * 100) / 100;
        heights[h] = (heights[h] || 0) + 1;
      });
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        ratio: +(r.width / r.height).toFixed(3),
        par: s.getAttribute('preserveAspectRatio'),
        viewBox: s.getAttribute('viewBox'),
        marks: s.querySelectorAll('*').length,
        rects: rects.length,
        paths: s.querySelectorAll('path, polyline, line').length,
        circles: s.querySelectorAll('circle').length,
        rectHeights: heights,
        hidden: s.getAttribute('aria-hidden'),
        role: s.getAttribute('role'),
        label: s.getAttribute('aria-label'),
        texts: s.querySelectorAll('text').length,
      };
    });
  });
  await ctx.close();
}

// ---------- 9. captions + misc leftovers ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.captions = {};
  for (const [name, url] of Object.entries(ROUTES)) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    results.captions[name] = await page.evaluate(() => ({
      figcaptions: [...document.querySelectorAll('figcaption')].map((f) => f.innerText.trim().slice(0, 90)),
      quoteAccent: (() => {
        const q = document.querySelector('[class*="pull"], blockquote');
        if (!q) return null;
        const r = q.getBoundingClientRect();
        return { left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), bg: getComputedStyle(q).backgroundColor, fs: getComputedStyle(q.querySelector('p,blockquote')||q).fontSize, accentSpan: !!q.querySelector('[class*="accent"], em, mark') };
      })(),
      railProgress: (() => {
        const p = document.querySelector('.progress-rail');
        if (!p) return null;
        const cs = getComputedStyle(p);
        return { animationName: cs.animationName, timeline: cs.animationTimeline, transform: cs.transform, w: Math.round(p.getBoundingClientRect().width) };
      })(),
      h1count: document.querySelectorAll('h1').length,
    }));
  }
  await ctx.close();
}

// ---------- 10. stack / credentials / contact detail at 1440 ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  results.tail = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#stack .matrix-row, #stack [class*="row"]')];
    return {
      stackRows: rows.slice(0, 10).map((r) => {
        const b = r.getBoundingClientRect();
        const kids = [...r.children].map((c) => Math.round(c.getBoundingClientRect().right));
        return { left: Math.round(b.left), right: Math.round(b.right), kidRights: kids, cls: r.className.toString().slice(0,40) };
      }),
      credentialsFigures: [...document.querySelectorAll('#credentials figure, #credentials svg')].map((e) => {
        const b = e.getBoundingClientRect();
        return { tag: e.tagName, w: Math.round(b.width), h: Math.round(b.height) };
      }),
      contactMail: (() => {
        const a = document.querySelector('#contact a[href^="mailto"]');
        if (!a) return null;
        const cs = getComputedStyle(a);
        return { fs: cs.fontSize, color: cs.color, text: a.innerText.trim() };
      })(),
    };
  });
  await ctx.close();
}

await browser.close();
fs.writeFileSync('/tmp/vc-results.json', JSON.stringify(results, null, 2));
console.log('DONE');
console.log(JSON.stringify({ prose: results.prose, overflow: results.overflow }, null, 2));
