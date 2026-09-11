import { chromium } from '@playwright/test';
const b = await chromium.launch();
const routes=['/','/projects','/projects/merchant-assistant','/blog','/blog/streaming-is-a-state-machine','/resume','/404'];
let n=0, bad=[];
for (const w of [320,360,390,414,768,900,1000,1024,1280,1440]) {
  const ctx=await b.newContext({viewport:{width:w,height:800}});
  const p=await ctx.newPage();
  for (const r of routes) {
    await p.goto('http://localhost:4396'+r,{waitUntil:'networkidle'});
    await p.evaluate(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,15));}scrollTo(0,0);await new Promise(r=>setTimeout(r,200));});
    const o=await p.evaluate(async()=>{const d=document.documentElement;scrollTo(500,0);await new Promise(r=>setTimeout(r,80));const sx=scrollX;scrollTo(0,0);return {cw:d.clientWidth,sw:d.scrollWidth,sx};});
    n++;
    if(o.cw!==w||o.sw>o.cw||o.sx>0) bad.push({w,r,...o});
  }
  await ctx.close();
}
console.log('combos',n,'bad',JSON.stringify(bad));
await b.close();
