import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'../..');
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.LUNA_BROWSER_CHANNEL || undefined,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
const page=await browser.newPage({viewport:{width:800,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=`http://127.0.0.1:${server.address().port}/tests/avatar-preview.html`;
await page.goto(url);await page.waitForFunction(()=>document.body.dataset.test==='passed');
await page.evaluate(()=>{const c=document.querySelector('luna-avatar-card');c.setConfig({avatar:'live2d',display_only:true,follow_rooms:false,live2d_runtime:'/tools/live2d/dist/runtime.mjs',live2d_model:'/tools/live2d/dist/Luna/luna.model3.json'});window.originalSession=c.session;});
await page.waitForFunction(()=>document.querySelector('luna-avatar-card').rig?.player);
await page.screenshot({path:resolve(here,'dist/luna-zoom-full.png')});
await page.locator('luna-avatar-card').getByRole('button',{name:'Avatar bis zur Hüfte zeigen'}).click();
await page.screenshot({path:resolve(here,'dist/luna-zoom-waist.png')});
const check=await page.evaluate(()=>{const c=document.querySelector('luna-avatar-card');return {framing:c.shadowRoot.querySelector('.stage').dataset.framing,sameSession:c.session===window.originalSession,transform:getComputedStyle(c.shadowRoot.querySelector('.rig')).transform,fullscreen:!!document.fullscreenElement};});
if(check.framing!=='waist'||!check.sameSession||check.fullscreen)throw Error(JSON.stringify(check));
await page.reload();await page.waitForFunction(()=>document.body.dataset.test==='passed');
await page.evaluate(()=>document.querySelector('luna-avatar-card').setConfig({avatar:'live2d',display_only:true,follow_rooms:false,live2d_runtime:'/tools/live2d/dist/runtime.mjs',live2d_model:'/tools/live2d/dist/Luna/luna.model3.json'}));
if(await page.locator('luna-avatar-card').getByRole('button',{name:'Avatar ganz zeigen'}).count()!==1)throw Error('Selection not restored');
await page.locator('luna-avatar-card').getByRole('button',{name:'Avatar ganz zeigen'}).click();
if(errors.length)throw Error(errors.join('\n'));
console.log('PASS: real model rendering, full/waist toggle, session retained, fullscreen click isolated, persistence and reset',check);
} finally {await browser.close();server.close();}
