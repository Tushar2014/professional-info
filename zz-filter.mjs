import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto('http://localhost:4396/projects',{waitUntil:'networkidle'});
await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{
  const cell=document.querySelector('.work-cell');
  const card=document.querySelector('[data-project]');
  const out={cellFound:!!cell, cardFound:!!card, cellCls: cell&&cell.className, parentIsCell: card&&card.parentElement===cell, siblings: cell&&cell.children.length};
  out.beforeDisplay=cell&&getComputedStyle(cell).display;
  if(cell){ cell.hidden=true; }
  if(card){ card.hidden=true; }
  out.afterCellDisplay=cell&&getComputedStyle(cell).display;
  out.afterCellBox=cell&&JSON.stringify({w:Math.round(cell.getBoundingClientRect().width),h:Math.round(cell.getBoundingClientRect().height)});
  out.afterCardDisplay=card&&getComputedStyle(card).display;
  return JSON.stringify(out);
}));
// now real click on a non-matching tag: only tags present are llm/backend/python, all match the single card, so simulate by mutating data-tags first
await p.evaluate(()=>{document.querySelector('[data-project]').dataset.tags='zzz';});
await p.click('[data-tag="llm"]');
await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{
  const cell=document.querySelector('.work-cell'); const r=cell.getBoundingClientRect();
  return JSON.stringify({disp:getComputedStyle(cell).display,w:Math.round(r.width),h:Math.round(r.height),hidden:cell.hasAttribute('hidden'),count:document.querySelector('[data-count-plural]')?.textContent?.trim()});
}));
await p.screenshot({path:'/tmp/vis-scroll/filter-hidden.png'});
await b.close();
