import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const p=await b.newPage({viewport:{width:1100,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});await p.goto(process.env.LUNA_TAIL_URL||'http://127.0.0.1:8792/tests/luna-tail-study.html');await p.waitForFunction(()=>window.ready);
await p.locator('#idle').uncheck();const right=await p.locator('canvas').screenshot({path:'tools/live2d/dist/tail-preview-right.png'});
await p.locator('[data-side="-1"]').click();await p.waitForTimeout(2400);const left=await p.locator('canvas').screenshot({path:'tools/live2d/dist/tail-preview-left.png'});assert.notDeepEqual(right,left);
await p.locator('[data-side="0"]').click();await p.waitForTimeout(2400);const middle=await p.locator('canvas').screenshot({path:'tools/live2d/dist/tail-preview-middle.png'});assert.notDeepEqual(left,middle);
await p.locator('[data-side="1"]').click();await p.waitForTimeout(2400);assert.deepEqual(right,await p.locator('canvas').screenshot());
await p.locator('#idle').check();const a=await p.locator('canvas').screenshot();await p.waitForTimeout(700);assert.notDeepEqual(a,await p.locator('canvas').screenshot());assert.deepEqual(errors,[]);console.log('PASS: left/right/middle, exact return, animated idle, no browser errors');
}finally{await b.close()}
