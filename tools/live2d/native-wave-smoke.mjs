import {chromium} from 'playwright-core';
import {resolve} from 'node:path';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LUNA_WAVE_TEST_URL||'http://127.0.0.1:8792/tests/native-wave-study.html?manual');
 await page.waitForFunction(()=>window.ready,{timeout:30000});
 const checks=await page.evaluate(()=>{
  const c=document.querySelector('canvas'),gl=c.getContext('webgl');
  const frame=(raise,wrist=0,face={})=>{drawPose(raise,wrist,face);const p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
  const changed=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if([0,1,2,3].some(k=>Math.abs(a[i+k]-b[i+k])>12))n++;return n;};
  const rest=frame(0),raised=frame(1),minus=frame(1,-30),plus=frame(1,10),mouth=frame(1,0,{mouth:.7}),blink=frame(1,0,{eyes:0});
  let occupiedMin=Infinity;
  for(let n=0;n<=70;n++){const pose=waveAt(n/10),p=frame(pose.raise,pose.wrist);let occupied=0;for(let i=3;i<p.length;i+=4)if(p[i]>32)occupied++;occupiedMin=Math.min(occupiedMin,occupied);if(pose.raise<1&&pose.wrist!==0)throw Error('Wrist moves before arm is raised');}
  return {raisePixels:changed(rest,raised),wristPixels:changed(minus,plus),mouthPixels:changed(raised,mouth),blinkPixels:changed(raised,blink),restorationPixels:changed(rest,frame(0)),occupiedMin};
 });
 for(const [r,w,name] of [[0,0,'rest'],[.25,0,'quarter'],[.5,0,'half'],[.75,0,'threequarter'],[1,0,'raised'],[1,-30,'wrist-left'],[1,10,'wrist-right']]){
  await page.evaluate(([r,w])=>drawPose(r,w),[r,w]);await page.locator('canvas').screenshot({path:resolve('tools/live2d/dist/native-wave-'+name+'.png')});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify(checks,null,2));
 if(checks.raisePixels<1000||checks.wristPixels<50||checks.mouthPixels<15||checks.blinkPixels<30||checks.restorationPixels!==0||checks.occupiedMin<5000)throw Error('Native wave render regression');
}finally{await browser.close();}
