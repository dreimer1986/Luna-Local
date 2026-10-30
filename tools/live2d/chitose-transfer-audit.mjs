// Run native-arm-server.mjs first. Private inputs: dist/Chitose and dist/ChitoseArm.
import {chromium} from 'playwright-core';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const integrated=process.argv.includes('--integrated');
const jointCorrection=process.argv.includes('--joint-correction');
const out=fileURLToPath(new URL(integrated?'./dist/chitose-integration-check/':'./dist/chitose-check/',import.meta.url));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8792/tests/'+(integrated?'luna-native-wave.html':'chitose-study.html?isolated'));await page.waitForFunction(()=>window.ready);
 if(integrated)await page.evaluate(()=>{animate=false;useAdapter=false;amount=1;parameters={ParamEyeLOpen:1,ParamEyeROpen:1}});
 const report=await page.evaluate(async ({integrated,jointCorrection})=>{
  const load=async path=>{const moc=Live2DCubismCore.Moc.fromArrayBuffer(await(await fetch(path)).arrayBuffer());return {moc,model:Live2DCubismCore.Model.fromMoc(moc)}};
  const oa=await load('../tools/live2d/dist/Chitose/chitose.moc3'),ob=await load(integrated?'../tools/live2d/dist/ChitoseIntegration/luna.moc3':'../tools/live2d/dist/ChitoseArm/chitose-arm.moc3'),a=oa.model,b=ob.model;
  try{
   const meshes=b.drawables.ids.map((id,i)=>({id,i,j:a.drawables.ids.indexOf(id)})).filter(m=>!integrated||m.id.startsWith('D_ARM_R_B_'));
   if(meshes.length!==5||meshes.some(m=>!/^D_ARM_R_B_0[0-4]$/.test(m.id)||m.j<0||a.drawables.vertexCounts[m.j]!==b.drawables.vertexCounts[m.i]))throw Error('Unexpected mesh identity/topology');
   const ai=a.parameters.ids.indexOf('PARAM_ARM_R_B'),bi=b.parameters.ids.indexOf('PARAM_ARM_R_B');
   if(ai<0||bi<0||a.parameters.minimumValues[ai]!==b.parameters.minimumValues[bi]||a.parameters.maximumValues[ai]!==b.parameters.maximumValues[bi])throw Error('Parameter range changed');
   a.update();b.update();let unchanged=null;
   if(integrated){
    unchanged=[];
    for(const [folder,wanted] of [['LunaV9',null],['IntactIntegration',['ArtMesh149','ArtMesh150','ArtMesh151','ArtMesh152']]]){
     const old=await load(`../tools/live2d/dist/${folder}/luna.moc3`);old.model.update();let error=0,count=0;
     try{for(let i=0;i<old.model.drawables.count;i++){const id=old.model.drawables.ids[i];if(wanted&&!wanted.includes(id))continue;const j=b.drawables.ids.indexOf(id);if(j<0)throw Error('Existing mesh missing: '+id);const x=old.model.drawables.vertexPositions[i],y=b.drawables.vertexPositions[j];if(x.length!==y.length)throw Error('Existing topology changed');for(let k=0;k<x.length;k++){
      // Static 2026-10-30 artwork corrections, never donor joint keyforms.
      let delta=0;
      if(jointCorrection&&folder==='LunaV9'){
       if(id==='ArtMesh2')delta=k%2?.00561995:-.00187343;
       if(id==='ArtMesh7')delta=k%2?.00561995:.00187330;
       if(id==='ArtMesh10'&&k===28)delta=-.0337198;
      }
      error=Math.max(error,Math.abs(x[k]+delta-y[k]));
     };count++;}unchanged.push({folder,count,maxError:error});if(error>.000001)throw Error('Existing geometry changed');}finally{old.model.release();old.moc._release()}
    }
    if(b.drawables.count!==40)throw Error('Unexpected total mesh count');
   }
   const pairs=meshes.flatMap(m=>Array.from({length:b.drawables.vertexCounts[m.i]},(_,k)=>[...a.drawables.vertexPositions[m.j].slice(2*k,2*k+2),...b.drawables.vertexPositions[m.i].slice(2*k,2*k+2)]));
   const means=[0,1,2,3].map(k=>pairs.reduce((s,p)=>s+p[k],0)/pairs.length);
   let numerator=0,denominator=0;
   for(const p of pairs)for(let k=0;k<2;k++){numerator+=(p[k]-means[k])*(p[k+2]-means[k+2]);denominator+=(p[k]-means[k])**2}
   // Fit once at neutral. Never compensate for altered forms at other values.
   const scale=numerator/denominator,offset=[0,1].map(k=>means[k+2]-scale*means[k]);let error=0;
   for(let value=-10;value<=10;value++){
    a.parameters.values[ai]=value;b.parameters.values[bi]=value;a.update();b.update();
    for(const m of meshes){const x=a.drawables.vertexPositions[m.j],y=b.drawables.vertexPositions[m.i];for(let k=0;k<x.length;k++)error=Math.max(error,Math.abs(y[k]-scale*x[k]-offset[k%2]));}
   }
   return {meshes:meshes.map(m=>m.id),scale,offset,samples:21,maxErrorSourcePixels:error/Math.abs(scale)*a.canvasinfo.PixelsPerUnit,unchanged};
  }finally{a.release();b.release();oa.moc._release();ob.moc._release()}
 },{integrated,jointCorrection});
 for(const value of [-10,0,10]){await page.evaluate(value=>armValue=value,value);await page.waitForTimeout(100);await page.locator('canvas').screenshot({path:out+`isolated-${value}.png`})}
 await writeFile(out+'transfer-check.json',JSON.stringify({...report,errors},null,2)+'\n');console.log({...report,errors});
 if(errors.length||report.maxErrorSourcePixels>.1)throw Error('Original motion not preserved');
}finally{await browser.close()}
