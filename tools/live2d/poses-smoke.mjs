import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const winter=process.argv.includes('--winter');
const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'../..');
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+sep))throw Error('outside root');
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png'})[extname(path)]||'application/octet-stream'});res.end(body);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const channel=process.env.LUNA_BROWSER_CHANNEL || (process.platform==='win32'?'msedge':undefined);
const browser=await chromium.launch({channel,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:900,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/tests/${winter?'winter-preview':'pose-preview'}.html`);
 await page.waitForFunction(()=>window.ready,{timeout:30000});
 await page.evaluate(()=>{window.testMode=true;});
 await page.evaluate(async()=>{for(let i=0;i<40;i++){step(0);await new Promise(requestAnimationFrame);}});
 const results={};
 for(const name of ['neutral','smile','angry','shy','wave','hips','crossed']){
  const check=await page.evaluate(name=>{
   setPose(name);let p;for(let n=0;n<65;n++)p=step(.05);
   const c=document.querySelector('canvas'),gl=c.getContext('webgl'),pixels=new Uint8Array(c.width*c.height*4);
   gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)visible++;
   window.posePixels??={};posePixels[name]=pixels;
   let changed=0;if(name!=='neutral')for(let i=0;i<pixels.length;i+=4)if(Math.max(...[0,1,2,3].map(k=>Math.abs(pixels[i+k]-posePixels.neutral[i+k])))>12)changed++;
   return {visible,changed,parameters:p.parameters};
  },name);
  results[name]={visible:check.visible,changed:check.changed};
  if(check.visible<10000||(name!=='neutral'&&check.changed<100))throw Error('Pose not visible: '+name);
  await page.screenshot({path:resolve(here,`dist/${winter?'winter-study':'v10'}-${name}.png`)});
 }
 const stopped=await page.evaluate(()=>{setPose('wave');for(let n=0;n<180;n++)step(.05);return step(.05).parameters.ParamLunaWave;});
 if(stopped>.001)throw Error('Wave did not finish');
 if(winter){
  const regression=await page.evaluate(()=>{
   const originalPlayer=player,canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl');
   const frame=(outfit,mouth=0,eye=1)=>{player.setOutfit(outfit);player.draw(0,{reducedMotion:true,parameters:{ParamMouthOpenY:mouth,ParamEyeLOpen:eye,ParamEyeROpen:eye}});const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
   const difference=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(Math.max(...[0,1,2,3].map(k=>Math.abs(a[i+k]-b[i+k])))>12)n++;return n;};
   const neutral=frame('winter'),mouth=frame('winter',1),blink=frame('winter',0,0),classic=frame('classic'),restored=frame('winter');
   let rejected=false;try{player.setOutfit('unavailable')}catch{rejected=true;}
   return {mouth:difference(neutral,mouth),blink:difference(neutral,blink),outfit:difference(neutral,classic),restored:difference(neutral,restored),samePlayer:player===originalPlayer,rejected};
  });
  if(regression.mouth<20||regression.blink<100||regression.outfit<1000||regression.restored!==0||!regression.samePlayer||!regression.rejected)throw Error(JSON.stringify(regression));
  console.log('Winter face and outfit regression:',JSON.stringify(regression));
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({poses:results,waveAfterNineSeconds:stopped},null,2));
}finally{await browser.close();server.close();}
