import { chromium } from '@playwright/test';
const b = await chromium.launch();
// A) tag filter with one entry
{
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage();
 await p.goto('http://localhost:4396/projects',{waitUntil:'networkidle'});
 await p.waitForTimeout(500);
 const before=await p.evaluate(()=>({cells:[...document.querySelectorAll('.work-cell')].map(c=>{const r=c.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),hidden:c.hasAttribute('hidden'),disp:getComputedStyle(c).display}}),count:document.querySelector('[class*="count"]')?.textContent?.trim()}));
 console.log('FILTER before',JSON.stringify(before));
 // click a tag that matches (llm) then look for behaviour, then check structure
 const btns = await p.$$eval('[data-tag], .tag-filter button, .tag-filter a',es=>es.map(e=>({t:e.textContent.trim(),tag:e.getAttribute('data-tag'),tag2:e.dataset&&e.dataset.filter})));
 console.log('FILTER buttons',JSON.stringify(btns));
 await ctx.close();
}
// B) copy button size + h1 lines at widths
for (const w of [1440,1280,1120,1000,900,768,390]) {
 const ctx=await b.newContext({viewport:{width:w,height:900}});
 const p=await ctx.newPage();
 await p.goto('http://localhost:4396/',{waitUntil:'networkidle'});
 await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{
   const h1=document.querySelector('h1');
   const rng=document.createRange(); rng.selectNodeContents(h1);
   const tops=new Set([...rng.getClientRects()].map(r=>Math.round(r.top)));
   const spanLines=[...h1.querySelectorAll('.h1-line')].map(s=>{const rr=document.createRange();rr.selectNodeContents(s);return new Set([...rr.getClientRects()].map(x=>Math.round(x.top))).size;});
   const cb=[...document.querySelectorAll('button')].map(bt=>{const rr=bt.getBoundingClientRect();return {w:Math.round(rr.width),h:Math.round(rr.height),name:bt.getAttribute('aria-label')||bt.textContent.trim().slice(0,24)}});
   return {vw:innerWidth,h1Lines:tops.size,spanLines,h1H:Math.round(h1.getBoundingClientRect().height),buttons:cb};
 });
 console.log('H1',JSON.stringify(r));
 await ctx.close();
}
// C) POSITION readout truth table on the note
{
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage();
 await p.goto('http://localhost:4396/blog/streaming-is-a-state-machine',{waitUntil:'networkidle'});
 await p.evaluate(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
 const rows=[];
 for (const frac of [0,0.1,0.2,0.3,0.4,0.5,0.6,0.8,1]) {
   const y = await p.evaluate((f)=>{const max=document.documentElement.scrollHeight-innerHeight; const yy=Math.round(max*f); scrollTo(0,yy); return yy;}, frac);
   await p.waitForTimeout(350);
   const v=await p.evaluate(()=>{const e=document.querySelector('[data-rail-pos]');const pr=document.querySelector('.prose').getBoundingClientRect();return {shown:e?e.textContent:null, proseTopVp:Math.round(pr.top), trueReadFrac: Math.round(100*Math.min(1,Math.max(0,(-pr.top)/(pr.height-innerHeight+200)))) };});
   rows.push({y,...v});
 }
 console.log('POSITION table');
 rows.forEach(r=>console.log('  scrollY',String(r.y).padStart(5),'shown',String(r.shown).padStart(5),'trueReadPct~',r.trueReadFrac));
 await ctx.close();
}
await b.close();
