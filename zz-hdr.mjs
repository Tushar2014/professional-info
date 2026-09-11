import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4396/', { waitUntil: 'networkidle' });
await p.evaluate(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
for (const y of [0, 937, 1200, 6200]) {
  await p.evaluate((yy)=>scrollTo(0,yy), y);
  await p.waitForTimeout(400);
  const r = await p.evaluate(()=>{
    const h=document.querySelector('.site-header'); const rr=h.getBoundingClientRect(); const cs=getComputedStyle(h);
    return {y:scrollY, top:Math.round(rr.top), bot:Math.round(rr.bottom), pos:cs.position, bg:cs.backgroundColor, bd:cs.backdropFilter, cls:h.className};
  });
  console.log(JSON.stringify(r));
}
await b.close();
