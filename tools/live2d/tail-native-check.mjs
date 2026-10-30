import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8792/tests/intact-arm-study.html');await page.waitForFunction(()=>window.ready);
 const report=await page.evaluate(async()=>{
 const load=async path=>{const moc=Live2DCubismCore.Moc.fromArrayBuffer(await(await fetch(path)).arrayBuffer());return Live2DCubismCore.Model.fromMoc(moc)};
 const base=await load('../tools/live2d/dist/tail-baseline.moc3'),m=await load('../tools/live2d/dist/TailLuna/luna.moc3');
 base.update();m.update();const diffs=[];
 for(let i=0;i<base.drawables.count;i++){
 const id=base.drawables.ids[i],j=m.drawables.ids.indexOf(id);
 if(j<0||base.drawables.vertexPositions[i].some((v,k)=>Math.abs(v-m.drawables.vertexPositions[j][k])>1e-6))diffs.push(id);
 }
 const samples=[];
 for(const side of [-1,-.5,0,.5,1])for(const lift of [0,.25,.5,1])for(const angry of [0,.5,1]){
 m.parameters.values.set(m.parameters.defaultValues);
 m.parameters.values[m.parameters.ids.indexOf('ParamLunaTailSide')]=side;
 m.parameters.values[m.parameters.ids.indexOf('PARAM_TAIL')]=lift;m.parameters.values[m.parameters.ids.indexOf('PARAM_TAIL_ANGRY')]=angry;m.update();
 const meshes=['D_TAIL_00','D_TAIL_03'].map(id=>{const i=m.drawables.ids.indexOf(id),v=Array.from(m.drawables.vertexPositions[i]);return {id,finite:v.every(Number.isFinite),minX:Math.min(...v.filter((_,k)=>k%2===0)),maxX:Math.max(...v.filter((_,k)=>k%2===0)),minY:Math.min(...v.filter((_,k)=>k%2)),maxY:Math.max(...v.filter((_,k)=>k%2)),order:m.drawables.drawOrders[i]}});samples.push({side,lift,angry,meshes});
 }
 return {originalMeshes:base.drawables.count,currentMeshes:m.drawables.count,changedOriginalMeshes:diffs,samples};
 });
 await writeFile('tools/live2d/dist/tail-integrated-audit.json',JSON.stringify(report,null,2));
 assert.deepEqual(report.changedOriginalMeshes,[]);assert(report.samples.every(s=>s.meshes.every(m=>m.finite)));assert(report.samples.every(s=>s.meshes.every(m=>m.order===0)));console.log(JSON.stringify({originalMeshes:report.originalMeshes,currentMeshes:report.currentMeshes,changedOriginalMeshes:report.changedOriginalMeshes,samples:report.samples.length,drawOrder:'all zero'}));
 await page.evaluate(async()=>{player.dispose?.();window.tail=await(await import('../tools/live2d/dist/runtime.mjs')).mountLuna(document.querySelector('canvas'),'../tools/live2d/dist/TailLuna/luna.model3.json')});
 for(const side of [-1,0,1])for(const lift of [0,.5,1]){
 await page.evaluate(({side,lift})=>tail.draw(0,{reducedMotion:true,parameters:{ParamLunaTailSide:side,PARAM_TAIL:lift}}),{side,lift});
 await page.locator('canvas').screenshot({path:`tools/live2d/dist/tail-combo-${side}-${lift}.png`});
 }
}finally{await browser.close()}
