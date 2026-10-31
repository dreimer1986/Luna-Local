import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});await p.goto(process.env.LUNA_EMOTION_URL||'http://127.0.0.1:8792/tests/luna-emotions.html');await p.waitForFunction(()=>window.ready);await p.evaluate(()=>testMode=true);
const render=async text=>{await p.evaluate(text=>{clock=0;selectEmoji(text);for(let i=0;i<(text?100:500);i++){if(!text)clock=2.97;step(.03);}},text);await p.waitForTimeout(80);};
await render('');const neutral=await p.locator('canvas').screenshot({path:'tools/live2d/dist/emotion-neutral.png'});
for(const [name,text] of [['joy','😄'],['laugh','😂'],['shy','😊'],['surprise','😮'],['wave','👋']]){await render(text);const shot=await p.locator('canvas').screenshot({path:`tools/live2d/dist/emotion-${name}.png`});assert.notDeepEqual(shot,neutral,name+' must visibly change');console.log(name,await p.locator('#status').textContent());}
await render('');const returned=await p.locator('canvas').screenshot();assert.ok(returned.equals(neutral),'neutral must restore');
await render('😂');await p.evaluate(()=>speaking=true);const speaking=await p.locator('canvas').screenshot();assert.notDeepEqual(speaking,neutral);assert.deepEqual(errors,[]);console.log('PASS: emoji-to-render, five visible reactions, neutral restoration, speech mode, no browser errors');
}finally{await b.close()}
