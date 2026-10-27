import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'../..');
const rate=16000, samples=rate*3, wave=Buffer.alloc(44+samples*2);
wave.write('RIFF');wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(rate,24);wave.writeUInt32LE(rate*2,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(samples*2,40);
for(let i=0;i<samples;i++)wave.writeInt16LE(Math.round(7000*Math.sin(i/rate*220*Math.PI*2)*(i%8000<5500?1:0)),44+i*2);
const server=createServer(async(req,res)=>{
  try{
    if(req.url==='/api/tts_proxy/room.wav'){res.writeHead(200,{'Content-Type':'audio/wav'});res.end(wave);return;}
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
 await page.goto(`http://127.0.0.1:${server.address().port}/tests/room-playback-preview.html`);
 await page.waitForFunction(()=>window.ready,{timeout:30000});
 await page.evaluate(()=>window.start());
 await page.waitForFunction(()=>window.mouth.some(v=>v>.3),{timeout:10000});
 await page.evaluate(()=>window.stop());await page.waitForTimeout(100);
 const result=await page.evaluate(()=>({maxMouth:Math.max(...mouth),stoppedMouth:mouth.at(-1),audibleContexts}));
 console.log(result);
 if(result.stoppedMouth!==0||result.audibleContexts!==0||errors.length)throw Error(errors.join('\n')||'Room mirror failed');
}finally{await browser.close();server.close();}
