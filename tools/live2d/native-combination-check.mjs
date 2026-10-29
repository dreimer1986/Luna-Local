import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('./dist/native-combinations/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:1200}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8792/tests/luna-native-wave.html');await page.waitForFunction(()=>window.ready);
 await page.evaluate(async()=>{
  animate=false;window.render=()=>{};
  const {LunaPerformance}=await import('/custom_components/luna_local/frontend/performance.mjs');
  const {markerExpression}=await import('/custom_components/luna_local/frontend/emotion-markers.mjs');
  window.runCombination=(reply,raised,reduced=false)=>{
   const perf=new LunaPerformance(),mood=markerExpression(reply)||{name:'neutral',intensity:0};
   const session={generation:1,phase:'speaking',config:{},expression:mood,source:{},audioContext:{state:'running',currentTime:1},playbackStarted:0,mouthCues:{generation:1,cues:[{start:0,end:10,shape:'aa'}]}};
   let frame;for(let n=0;n<90;n++){frame=perf.sample(session,n/60,1/60,reduced);frame.parameters.ParamLunaRaisedL=raised;player.draw(1/60,frame)}
   return {mood,parameters:frame.parameters};
  };
 });
 const cases=[['neutral','',0],['wave','👋',0],['both-arms','👋',1],['joy','😀',1],['shy','😊',1],['angry','😡',0],['sad','😢',0],['surprised','😮',0],['reduced','👋',1,true]],report=[];
 for(const [name,reply,raised,reduced] of cases){
  const result=await page.evaluate(([reply,raised,reduced])=>runCombination(reply,raised,reduced),[reply,raised,reduced]);
  assert(Object.values(result.parameters).every(Number.isFinite));
  if(name==='wave')assert(result.parameters.ParamLunaWave>.9);
  if(reduced)assert.equal(result.parameters.ParamLunaWave,0);
  await page.locator('canvas').screenshot({path:new URL(name+'.png',out).pathname});
  report.push({name,...result});
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('report.json',out),JSON.stringify({cases:report,errors},null,2)+'\n');
 console.log({cases:report.map(x=>x.name),errors});
}finally{await browser.close()}
