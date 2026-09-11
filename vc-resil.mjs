// Temporary visual-critic resilience helper. Deleted before finishing.
import { chromium } from '@playwright/test';
const BASE = 'http://localhost:4396';
const OUT = '/tmp/vc-shots';
const b = await chromium.launch();
const out = {};

// A. IntersectionObserver removed so motion.ts throws
out.throwing = {};
for (const [n, u] of [['home', '/'], ['projects', '/projects'], ['note', '/blog/streaming-is-a-state-machine'], ['case', '/projects/merchant-assistant'], ['blog', '/blog'], ['resume', '/resume']]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await c.addInitScript(() => { delete window.IntersectionObserver; Object.defineProperty(window, 'IntersectionObserver', { get() { throw new Error('boom'); } }); });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + u, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  out.throwing[n] = await p.evaluate(() => {
    const rev = [...document.querySelectorAll('.reveal')];
    const zero = rev.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05).length;
    const invisible = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e);
      return parseFloat(cs.opacity) < 0.05 && (e.innerText || '').trim().length > 10;
    }).length;
    return { reveals: rev.length, revealZero: zero, invisibleTextBlocks: invisible, docH: document.documentElement.scrollHeight, bodyText: document.body.innerText.length };
  });
  out.throwing[n].errs = errs.slice(0, 2);
  await p.screenshot({ path: `${OUT}/throw-${n}.png` });
  await c.close();
}

// B. JS disabled
out.nojs = {};
for (const [n, u] of [['home', '/'], ['note', '/blog/streaming-is-a-state-machine'], ['projects', '/projects'], ['case', '/projects/merchant-assistant']]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await c.newPage();
  await p.goto(BASE + u, { waitUntil: 'load' });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/nojs-${n}.png`, fullPage: n === 'home' ? false : false });
  const pb = await p.locator('.prose').first().boundingBox().catch(() => null);
  out.nojs[n] = { proseBox: pb };
  await c.close();
}

// C. print media
out.print = {};
for (const [n, u] of [['home', '/'], ['note', '/blog/streaming-is-a-state-machine'], ['resume', '/resume']]) {
  const c = await b.newContext({ viewport: { width: 794, height: 1123 } });
  const p = await c.newPage();
  await p.goto(BASE + u, { waitUntil: 'networkidle' });
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(300);
  out.print[n] = await p.evaluate(() => ({
    bodyColor: getComputedStyle(document.body).color,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    para: (() => { const e = document.querySelector('p'); return e ? getComputedStyle(e).color : null; })(),
  }));
  await p.screenshot({ path: `${OUT}/print-${n}.png` });
  await c.close();
}

// D. fold unit list at 1440x900
{
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  out.foldUnits = await p.evaluate(() => {
    const res = [];
    const seen = new Set();
    const walk = (el) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        if (r.top >= 900 || r.height < 3) continue;
        const own = [...c.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
        const svg = c.tagName === 'SVG';
        if (svg) { res.push({ what: 'SVG plate ' + Math.round(r.width) + 'x' + Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }); continue; }
        if (own && own.length > 1) {
          const k = own.slice(0, 40);
          if (!seen.has(k)) { seen.add(k); res.push({ what: c.tagName + ' "' + own.replace(/\s+/g, ' ').slice(0, 60) + '"', top: Math.round(r.top), bottom: Math.round(r.bottom) }); }
        }
        walk(c);
      }
    };
    walk(document.querySelector('body'));
    const hl = document.querySelector('.hero-left');
    const hp = document.querySelector('[class*="identity"], .hero-panel');
    const bx = e => e ? { top: Math.round(e.getBoundingClientRect().top + scrollY), bottom: Math.round(e.getBoundingClientRect().bottom + scrollY), cls: e.className.toString().slice(0, 40) } : null;
    return { units: res.sort((a, x) => a.top - x.top), heroLeft: bx(hl), heroPanel: bx(hp) };
  });
  await c.close();
}

await b.close();
console.log(JSON.stringify(out, null, 2));
