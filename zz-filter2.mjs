import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto('http://localhost:4396/projects',{waitUntil:'networkidle'});
await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{
  // build a .work-cell clone in the real page so the scoped attribute hash applies
  const featured=document.querySelector('.work-featured');
  const scoped=[...featured.attributes].map(a=>a.name).find(n=>n.startsWith('data-astro-cid'));
  const grid=document.createElement('div'); grid.className='card-grid work-rest'; if(scoped) grid.setAttribute(scoped,'');
  const cell=document.createElement('div'); cell.className='reveal work-cell'; if(scoped) cell.setAttribute(scoped,'');
  cell.style.minHeight='100px'; cell.textContent='x';
  grid.appendChild(cell); featured.parentElement.appendChild(grid);
  const before=getComputedStyle(cell).display;
  cell.hidden=true;
  const after=getComputedStyle(cell).display;
  const box=cell.getBoundingClientRect();
  return JSON.stringify({scoped,before,after,w:Math.round(box.width),h:Math.round(box.height)});
}));
await b.close();
