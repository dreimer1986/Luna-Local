import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
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
 await page.goto(`http://127.0.0.1:${server.address().port}/tests/luna-model-preview.html`);
 await page.waitForFunction(()=>document.body.dataset.test,{timeout:30000});
 console.log(await page.locator('#status').textContent());
 if(await page.locator('body').getAttribute('data-test')!=='passed'||errors.length)throw Error(errors.join('\n')||'Rendering failed');
 const checks=await page.evaluate(()=>{
   const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl');
   const frame=(mouth,eyes,reduced=true,dt=0)=>{
     player.draw(dt,{reducedMotion:reduced,parameters:{ParamMouthOpenY:mouth,ParamMouthForm:0,ParamEyeLOpen:eyes,ParamEyeROpen:eyes}});
     const pixels=new Uint8Array(canvas.width*canvas.height*4);
     gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;
   };
   const changed=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4){if(Math.max(...[0,1,2,3].map(c=>Math.abs(a[i+c]-b[i+c])))>12)n++;}return n;};
   const closed=frame(0,1),open=frame(.65,1),blink=frame(0,0);
   const idleBefore=frame(0,1,false);for(let i=0;i<120;i++)frame(0,1,false,.05);
   const idleAfter=frame(0,1,false),restored=frame(0,1);
   return {mouthPixels:changed(closed,open),blinkPixels:changed(closed,blink),idlePixels:changed(idleBefore,idleAfter),restorationPixels:changed(closed,restored)};
 });
 console.log(checks);
 if(checks.mouthPixels<50||checks.blinkPixels<100||checks.idlePixels<100||checks.restorationPixels!==0)throw Error('Luna visual parameter/motion check failed');
 await page.screenshot({path:resolve(here,'dist/luna-smoke.png')});
}finally{await browser.close();server.close();}
