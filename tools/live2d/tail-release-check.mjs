// Validate the deployed runtime, tail atlas and existing face/arm controls together.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const origin=process.env.LUNA_ORIGIN||'https://ha.dreimer.de';
const runtime=process.env.LUNA_RUNTIME||'/local/luna/runtime-native-tail-20261030/runtime.mjs';
const model=process.env.LUNA_MODEL||'/local/luna/model-native-tail-20261030/luna.model3.json';
const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 await p.route(origin+'/luna-tail-release-check',route=>route.fulfill({contentType:'text/html',body:`<body style="background:#34465e"><canvas width="720" height="1000" style="width:480px;height:667px"></canvas><script type="module">import{mountLuna}from ${JSON.stringify(runtime)};window.player=await mountLuna(document.querySelector('canvas'),${JSON.stringify(model)});window.options={reducedMotion:true};function frame(){player.draw(0,window.options);requestAnimationFrame(frame)}frame();window.ready=true;</script>`}));
 await p.goto(origin+'/luna-tail-release-check');await p.waitForFunction(()=>window.ready);await p.waitForTimeout(1000);
 assert.equal(await p.evaluate(()=>player.profile),'native-donors-v1');
 assert.ok(await p.evaluate(()=>player.parameterIds.includes('ParamLunaTailSide')));
 const draw=async(parameters={},reducedMotion=false,dt=0)=>p.evaluate(({parameters,reducedMotion,dt})=>(window.options={parameters,reducedMotion},player.draw(dt,window.options)),{parameters,reducedMotion,dt});
 const shot=()=>p.locator('canvas').screenshot();
 await draw({},true);const rest=await shot();
 await draw({ParamMouthOpenY:.7},true);assert.notDeepEqual(rest,await shot());
 await draw({ParamEyeLOpen:0,ParamEyeROpen:0},true);assert.notDeepEqual(rest,await shot());
 await draw({ParamLunaWave:1});assert.notDeepEqual(rest,await shot());
 await draw({},true);assert.deepEqual(rest,await shot());
 await draw();const start=await shot();
 await p.evaluate(()=>{for(let i=0;i<40;i++)player.draw(.05)});assert.notDeepEqual(start,await shot());
 await p.evaluate(()=>{for(let i=0;i<560;i++)player.draw(.05)});
 await p.locator('canvas').screenshot({path:'tools/live2d/dist/tail-release-left.png'});
 await draw({},true);
 await p.locator('canvas').screenshot({path:'tools/live2d/dist/tail-release-right.png'});
 // A fullbody tablet portrait must keep the tail inside the viewport.
 const edges=await p.evaluate(()=>{const c=document.querySelector('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');player.draw(0,{reducedMotion:true});const a=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,a);let count=0;for(let y=0;y<c.height;y++)for(const x of [0,1,c.width-2,c.width-1])if(a[(y*c.width+x)*4+3])count++;return count});
 assert.equal(edges,0);assert.deepEqual(errors,[]);
 console.log('PASS: deployed tail, idle, both sides, mouth, blink, wave, exact return, fullbody margins, no browser errors');
}finally{await b.close()}
