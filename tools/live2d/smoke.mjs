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
 await page.goto(`http://127.0.0.1:${server.address().port}/tests/live2d-preview.html`);
 await page.waitForFunction(()=>document.body.dataset.test,{timeout:30000});
 console.log(await page.locator('#status').textContent());
 if(await page.locator('body').getAttribute('data-test')!=='passed'||errors.length)throw Error(errors.join('\n')||'Rendering failed');
 await page.screenshot({path:resolve(here,'dist/smoke.png')});
 const failures=await page.evaluate(async()=>{
   const {mountLuna}=await import('../tools/live2d/dist/runtime.mjs');
   const controller=new AbortController();controller.abort();
   const results=[];
   for(const [url,options] of [
     ['../tools/live2d/dist/Sample/Hiyori.model3.json',{signal:controller.signal}],
     ['../tools/live2d/dist/Sample/does-not-exist.model3.json',{}],
   ]){
     try{const p=await mountLuna(document.createElement('canvas'),url,options);p.dispose();results.push(false);}
     catch{results.push(true);}
   }
   return results;
 });
 if(!failures.every(Boolean))throw Error('Cancelled or missing model did not reject');
 await page.evaluate(()=>{window.player.dispose();window.player.dispose();});
 console.log('Cancellation, missing-file rejection and idempotent disposal passed.');
 await page.goto(`http://127.0.0.1:${server.address().port}/tests/live2d-session-preview.html`);
 await page.waitForFunction(()=>window.ready,{timeout:30000});
 const integration=await page.evaluate(async()=>{
   const assert=(ok,message)=>{if(!ok)throw Error(message);};
   assert(statuses.at(-1)?.state==='ready','Session rig did not load');
   cancelAnimationFrame(rig.frame);
   const player=rig.player, canvas=rig.canvas, gl=canvas.getContext('webgl');
   const pixels=()=>{const a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
   player.draw(.05,{parameters:{ParamMouthOpenY:0,ParamEyeLOpen:1,ParamEyeROpen:1},reducedMotion:true});
   await new Promise(resolve=>setTimeout(resolve,500));
   player.draw(.05,{parameters:{ParamMouthOpenY:0,ParamEyeLOpen:1,ParamEyeROpen:1},reducedMotion:true});
   const closed=pixels();
   const audio=new AudioContext();await audio.resume();
   const source=audio.createBufferSource();source.buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);source.connect(audio.destination);source.start();
   Object.assign(session,{phase:'speaking',source,audioContext:audio,playbackStarted:audio.currentTime,mouthCues:{generation:1,cues:[{start:0,end:2,shape:'A'}]}});
   for(let i=0;i<8;i++)player.draw(.05,rig.performance.sample(session,0,.05,true));
   const open=pixels();let changed=0;for(let i=0;i<open.length;i+=4)if(open[i]!==closed[i]||open[i+1]!==closed[i+1]||open[i+2]!==closed[i+2])changed++;
   assert(changed>20,`Speech controls did not change rendered pixels: ${changed}, mouth=${rig.performance.mouth}, audio=${audio.state}, time=${audio.currentTime-session.playbackStarted}, size=${canvas.width}x${canvas.height}`);
   session.generation++;session.phase='idle';session.source=null;
   assert(rig.performance.sample(session,0,.05,true).parameters.ParamMouthOpenY===0,'Interrupted mouth stayed open');
   source.stop();await audio.close();
   const lost=new Promise(resolve=>canvas.addEventListener('webglcontextlost',resolve,{once:true}));
   gl.getExtension('WEBGL_lose_context').loseContext();await lost;
   assert(statuses.at(-1)?.state==='error'&&host.querySelector('img'),'Context loss did not restore portrait');
   rig.destroy();rig.destroy();
   statuses.length=0;
   rig=makeRig({live2d_model:'/tools/live2d/dist/Sample/missing.model3.json'});await rig.ready;
   assert(statuses.at(-1)?.state==='error'&&host.querySelector('img'),'Missing model did not restore portrait');rig.destroy();
   statuses.length=0;rig=makeRig();rig.destroy();await rig.ready;
   assert(!statuses.some(s=>s.state==='ready'),'Destroyed rig mounted late');
   return {changedPixels:changed};
 });
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Session renderer: audio-clock mouth controls, interruption, context loss, fallback and teardown passed.',integration);
}finally{await browser.close();server.close();}
