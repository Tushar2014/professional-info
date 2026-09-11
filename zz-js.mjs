import { chromium } from '@playwright/test';
const b = await chromium.launch();
const routes=[['home','/'],['projects','/projects'],['case','/projects/merchant-assistant'],['blog','/blog'],['note','/blog/streaming-is-a-state-machine'],['resume','/resume']];
// A) IntersectionObserver removed so motion.ts throws
{
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,60)));
 await p.addInitScript(()=>{ try{ delete window.IntersectionObserver; Object.defineProperty(window,'IntersectionObserver',{get(){throw new Error('boom')}}); }catch(e){} });
 for (const [n,r] of routes) {
   await p.goto('http://localhost:4396'+r,{waitUntil:'networkidle'});
   await p.waitForTimeout(700);
   const res=await p.evaluate(()=>{
     const rev=[...document.querySelectorAll('.reveal')];
     const zero=rev.filter(e=>+getComputedStyle(e).opacity<0.05).length;
     const invis=[...document.querySelectorAll('main *')].filter(e=>{const cs=getComputedStyle(e);return +cs.opacity<0.05||cs.visibility==='hidden'}).length;
     return {reveals:rev.length,zero,invis,h:document.documentElement.scrollHeight};
   });
   console.log('THROW',n,JSON.stringify(res));
   await p.screenshot({path:`/tmp/vis-scroll/throw-${n}.png`});
 }
 console.log('pageerrors', errs.length, errs.slice(0,3));
 await ctx.close();
}
// B) JS disabled
{
 const ctx=await b.newContext({viewport:{width:1440,height:900}, javaScriptEnabled:false});
 const p=await ctx.newPage();
 for (const [n,r] of routes) {
   await p.goto('http://localhost:4396'+r,{waitUntil:'load'});
   await p.waitForTimeout(400);
   await p.screenshot({path:`/tmp/vis-scroll/nojs-${n}.png`});
   const bb = await p.locator('.prose, main').first().boundingBox();
   console.log('NOJS',n,JSON.stringify(bb));
 }
 await ctx.close();
}
await b.close();
