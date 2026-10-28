// Local-only study server. --check renders with an isolated headless browser.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep))throw Error('Outside root');
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png'})[extname(path)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
const check=process.argv.includes('--check');
await new Promise(r=>server.listen(check?0:8791,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/tests/mao-study.html`;
console.log(url);
if(check){
 let browser;
 try{
  const {chromium}=await import('playwright-core');
  browser=await chromium.launch({channel:process.env.LUNA_BROWSER_CHANNEL||(process.platform==='win32'?'msedge':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await mkdir(resolve(here,'dist/mao-check'),{recursive:true});
  for(const [name,width,height] of [['portrait',800,1200],['landscape',1600,900],['phone',390,844]]){
   await page.setViewportSize({width,height});await page.goto(url);
   await page.waitForFunction(()=>document.body.dataset.test==='ready',{timeout:30000});
   await page.waitForTimeout(700);
   await page.evaluate(()=>cancelAnimationFrame(window.frame));
   const result=await page.evaluate(()=>{
    const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl');
    window.player.draw(0,{reducedMotion:true});
    const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let left=canvas.width,right=0,bottom=canvas.height,top=0,count=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>50){count++;left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);}
    if(count<1000||left<=1||bottom<=1||right>=canvas.width-2||top>=canvas.height-2)throw Error('Model empty or clipped: '+JSON.stringify({left,right,bottom,top,count,w:canvas.width,h:canvas.height}));
    return {left,right,bottom,top,count};
   });
   await page.screenshot({path:resolve(here,`dist/mao-check/${name}.png`)});
   console.log(name,result);
  }
  await page.setViewportSize({width:1000,height:1100});
  const result=await page.evaluate(async()=>{
   const {LunaPerformance}=await import('../../custom_components/luna_local/frontend/performance.mjs');
   const {MaoStudy}=await import('../tools/live2d/mao-study.mjs');
   const player=window.player,canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl');
   const pixels=()=>{const a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
   const p=new LunaPerformance(),m=new MaoStudy();
   const session={phase:'speaking',generation:1,source:{},audioContext:{state:'running',currentTime:0},playbackStarted:0,expression:{name:'neutral',intensity:1},mouthCues:{generation:1,cues:[{start:0,end:2,shape:'sil'}]}};
   const render=()=>{for(let i=0;i<20;i++)player.draw(.05,m.sample(p.sample(session,0,.05,true),.05));return pixels();};
   const neutral=render(),changed={};
   for(const shape of ['A','I','U','E','O']){
    session.mouthCues.cues[0].shape=shape;const result=render();
    changed[shape]=result.reduce((n,v,i)=>n+(v!==neutral[i]?1:0),0);
    if(changed[shape]<20)throw Error('Vowel did not change pixels: '+shape);
   }
   session.phase='idle';const stopped=m.sample(p.sample(session,0,.05,true),.05);
   if(['A','I','U','E','O'].some(v=>stopped.parameters['Param'+v]!==0))throw Error('Mouth did not close on interruption');
   for(const emotion of ['laughing','shy','angry','sad']){
    session.expression.name=emotion;const result=render();changed[emotion]=result.reduce((n,v,i)=>n+(v!==neutral[i]?1:0),0);
    if(changed[emotion]<20)throw Error('Emotion did not change pixels: '+emotion);
   }
   for(const [group,count] of Object.entries(player.motionCounts))for(let motionIndex=0;motionIndex<count;motionIndex++)for(let i=0;i<30;i++)player.draw(.05,{group,motionIndex});
   return {changed,motions:player.motionCounts,parameters:player.parameterIds.length};
  });
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();server.close();}
}
