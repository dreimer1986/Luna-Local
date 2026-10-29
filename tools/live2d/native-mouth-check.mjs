import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('./dist/native-mouth-check/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:1500}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8792/tests/luna-native-wave.html');await page.waitForFunction(()=>window.ready);
 const result=await page.evaluate(async()=>{
  animate=false;render=()=>{};player.dispose();document.querySelector('canvas').remove();
  const {mountLuna}=await import('../tools/live2d/dist/runtime.mjs');
  const canvases=[0,1].map(()=>{const c=document.createElement('canvas');c.width=900;c.height=1350;c.style.width='900px';document.body.append(c);return c});
  const players=await Promise.all(['LunaV9','ChitoseIntegration'].map((dir,i)=>mountLuna(canvases[i],`../tools/live2d/dist/${dir}/luna.model3.json`)));
  const current=[{},{}];
  function draw(){players.forEach((player,i)=>player.draw(0,{reducedMotion:true,parameters:current[i]}));requestAnimationFrame(draw)}requestAnimationFrame(draw);
  for(let n=0;n<90;n++)await new Promise(requestAnimationFrame);
  const frame=(i,p)=>{current[i]=p;players[i].draw(0,{reducedMotion:true,parameters:p});const gl=canvases[i].getContext('webgl2')||canvases[i].getContext('webgl');const pixels=new Uint8Array(100*80*4);gl.readPixels(400,1070,100,80,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels};
  let worst=0;const cases=[];
  for(const open of [0,.2,.5,.85,1])for(const form of [-1,0,1]){
   const p={ParamMouthOpenY:open,ParamMouthForm:form,ParamEyeLOpen:1,ParamEyeROpen:1,ParamAngleX:2.5,ParamAngleY:1.5,ParamAngleZ:2,ParamBodyAngleX:.8,ParamBodyAngleZ:.35,ParamBrowLY:.3,ParamBrowRY:.3,ParamEyeBallX:.12,ParamEyeBallY:.2};
   const a=frame(0,p),b=frame(1,p);let max=0,sum=0,changed=0;if(!a.some((v,k)=>k%4===3&&v>0)||!b.some((v,k)=>k%4===3&&v>0))throw Error('Empty face render');for(let k=0;k<a.length;k++){const diff=Math.abs(a[k]-b[k]);max=Math.max(max,diff);sum+=diff;if(diff>2)changed++;}worst=Math.max(worst,max);cases.push({open,form,maxChannelDifference:max,meanDifference:sum/a.length,changedFraction:changed/a.length});
  }
  frame(0,{ParamMouthOpenY:.7,ParamMouthForm:0,ParamEyeLOpen:1,ParamEyeROpen:1});frame(1,{ParamMouthOpenY:.7,ParamMouthForm:0,ParamEyeLOpen:1,ParamEyeROpen:1});
  return {cases,worst};
 });
 await page.locator('canvas').nth(1).scrollIntoViewIfNeeded();
 const rect=await page.locator('canvas').nth(1).boundingBox();await page.screenshot({path:new URL('restored-mouth.png',out).pathname,clip:{x:rect.x+220,y:rect.y+40,width:440,height:330}});
 // V9 subdivides its skin/foreground mesh; allow small interpolation differences,
 // but reject displaced teeth, lip edges or shape changes.
 for(const c of result.cases){assert(c.maxChannelDifference<=16);assert(c.meanDifference<.25);assert(c.changedFraction<.02);}assert.deepEqual(errors,[]);
 await writeFile(new URL('report.json',out),JSON.stringify({...result,errors},null,2)+'\n');console.log({cases:result.cases.length,worst:result.worst,errors});
}finally{await browser.close()}
