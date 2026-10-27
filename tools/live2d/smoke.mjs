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
}finally{await browser.close();server.close();}
