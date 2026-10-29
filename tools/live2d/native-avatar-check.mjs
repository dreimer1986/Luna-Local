import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {nativeAvatarFrame} from './native-avatar.mjs';

const url=process.env.LUNA_NATIVE_URL||'http://127.0.0.1:8792/tests/luna-native-wave.html';
const out=new URL('./dist/chitose-integration-check/',import.meta.url);
await mkdir(out,{recursive:true});
for(const amount of [0,.25,.5,.75,1]){
 const f=nativeAvatarFrame({ParamLunaWave:amount},1);
 assert.equal(f.partOpacities.PartArmRB+f.partOpacities.PartLunaWaveR,1);
 assert.equal(f.partOpacities.PartLunaWaveR,amount);
}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1200}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(url);await page.waitForFunction(()=>window.ready);
 assert.equal(await page.evaluate(()=>player.profile),'native-donors-v1');
 await page.evaluate(()=>{animate=false;parameters={ParamEyeLOpen:1,ParamEyeROpen:1};amount=0;render()});
 const shot=async name=>{await page.waitForTimeout(100);return page.locator('canvas').screenshot({path:new URL(name+'.png',out).pathname})};
 const rest=await shot('runtime-rest');
 await page.evaluate(()=>{amount=1;armValue=0;render()});
 const wave=await shot('runtime-wave');assert.notDeepEqual(rest,wave);
 await page.evaluate(()=>{armValue=8;render()});
 const moved=await shot('runtime-wave-moved');assert.notDeepEqual(wave,moved);
 await page.evaluate(()=>{parameters.ParamMouthOpenY=.65;render()});
 const mouth=await shot('runtime-mouth');assert.notDeepEqual(moved,mouth);
 await page.evaluate(()=>{parameters.ParamEyeLOpen=parameters.ParamEyeROpen=0;render()});
 assert.notDeepEqual(mouth,await shot('runtime-blink'));
 await page.evaluate(()=>{parameters={ParamEyeLOpen:1,ParamEyeROpen:1};amount=0;armValue=null;render()});
 assert.deepEqual(rest,await shot('runtime-return'));
 await page.evaluate(()=>{amount=1;parameters={ParamEyeLOpen:1,ParamEyeROpen:1,ParamAngleX:2.5,ParamAngleY:1.5,ParamAngleZ:.8,ParamBodyAngleX:.8,ParamBodyAngleZ:.35,ParamBreath:1};render()});
 await shot('runtime-body');
 await page.evaluate(()=>{animate=true;target=1});
 const moving=await shot('runtime-animated-a');await page.waitForTimeout(400);
 assert.notDeepEqual(moving,await shot('runtime-animated-b'));
 assert.deepEqual(errors,[]);
 const report={url,profile:'native-donors-v1',checks:['part-opacity-complement','wave-visible','native-arm-moves','mouth','blink','exact-rest-return','animation'],errors};
 await writeFile(new URL('runtime-check.json',out),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close()}
