import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
for (const [route,ys,tag] of [['/',[937,1150],'home'],['/blog/streaming-is-a-state-machine',[800],'note']]) {
  await p.goto('http://localhost:4396'+route, { waitUntil: 'networkidle' });
  await p.evaluate(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
  for (const y of ys) {
    await p.evaluate((yy)=>scrollTo(0,yy), y);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `/tmp/vis-scroll/hdr-${tag}-${y}.png`, clip: { x: 0, y: 0, width: 900, height: 75 } });
  }
}
await b.close();
console.log('ok');
