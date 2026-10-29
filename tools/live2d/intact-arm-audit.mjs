// Compare transferred native geometry against the unmodified SDK Mao.
// Private inputs: dist/Mao and dist/IntactArm. Run native-arm-server.mjs first.
import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const integrated=process.argv.includes('--integrated');
const out=resolve(dirname(fileURLToPath(import.meta.url)),integrated?'dist/intact-integration-check':'dist/intact-arm-check');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8792/tests/intact-arm-study.html'+(integrated?'?integrated':''));await page.waitForFunction(()=>window.ready);
 const report=await page.evaluate(async integrated=>{
  const load=async path=>{const moc=Live2DCubismCore.Moc.fromArrayBuffer(await(await fetch(path)).arrayBuffer());return {moc,model:Live2DCubismCore.Model.fromMoc(moc)}};
  const oa=await load('../tools/live2d/dist/Mao/Mao.moc3'),ob=await load(integrated?'../tools/live2d/dist/IntactIntegration/luna.moc3':'../tools/live2d/dist/IntactArm/luna-left-arm-intact.moc3'),a=oa.model,b=ob.model;
  try{
   const ids=['ParamArmLB01','ParamArmLB02','ParamArmLB03','ParamHandLB'];
   const meshes=Array.from(b.drawables.ids).map((id,i)=>({id,i,j:a.drawables.ids.indexOf(id)})).filter(m=>['ArtMesh149','ArtMesh150','ArtMesh151','ArtMesh152'].includes(m.id));
   if(meshes.length!==4||meshes.some(m=>m.j<0||a.drawables.vertexCounts[m.j]!==b.drawables.vertexCounts[m.i]))throw Error('Mesh identity/topology mismatch');
   a.parameters.values.set(a.parameters.defaultValues);b.parameters.values.set(b.parameters.defaultValues);a.update();b.update();
   let untouched=null;
   if(integrated){
    const ov=await load('../tools/live2d/dist/LunaV9/luna.moc3'),v=ov.model;
    try{v.parameters.values.set(v.parameters.defaultValues);v.update();let error=0,common=0;
     for(let i=0;i<v.drawables.count;i++){const j=b.drawables.ids.indexOf(v.drawables.ids[i]);if(j<0)continue;const x=v.drawables.vertexPositions[i],y=b.drawables.vertexPositions[j];if(x.length!==y.length)throw Error('Existing mesh topology changed');for(let k=0;k<x.length;k++)error=Math.max(error,Math.abs(x[k]-y[k]));common++;}
     untouched={common,maxError:error,added:b.drawables.ids.filter(id=>!v.drawables.ids.includes(id)),removed:v.drawables.ids.filter(id=>!b.drawables.ids.includes(id))};
     if(common!==28||error!==0||untouched.added.length!==4||untouched.removed.slice().sort().join(',')!=='ArtMesh0,ArtMesh1,ArtMesh2')throw Error('Unexpected change outside the left arm');
    }finally{v.release();ov.moc._release();}
   }
   // Fit ONE uniform scale + translation at neutral. Never refit per frame:
   // changing/deleted keyforms must fail across the subsequent parameter grid.
   const pairs=meshes.flatMap(m=>Array.from({length:a.drawables.vertexCounts[m.j]},(_,k)=>[...a.drawables.vertexPositions[m.j].slice(2*k,2*k+2),...b.drawables.vertexPositions[m.i].slice(2*k,2*k+2)]));
   const means=[0,1,2,3].map(k=>pairs.reduce((s,p)=>s+p[k],0)/pairs.length);
   let numerator=0,denominator=0;for(const p of pairs)for(let k=0;k<2;k++){numerator+=(p[k]-means[k])*(p[k+2]-means[k+2]);denominator+=(p[k]-means[k])**2;}
   const scale=integrated?numerator/denominator:1,offset=[0,1].map(k=>means[k+2]-scale*means[k]);
   let maxError=0,samples=0;
   const axis=ids.map(id=>{const i=a.parameters.ids.indexOf(id),j=b.parameters.ids.indexOf(id);if(i<0||j<0||a.parameters.minimumValues[i]!==b.parameters.minimumValues[j]||a.parameters.maximumValues[i]!==b.parameters.maximumValues[j])throw Error('Parameter range mismatch');return {i,j,min:a.parameters.minimumValues[i],max:a.parameters.maximumValues[i]}});
   for(let sample=0;sample<625;sample++){
    let index=sample;for(const r of axis){const v=r.min+(r.max-r.min)*(index%5)/4;index=Math.floor(index/5);a.parameters.values[r.i]=v;b.parameters.values[r.j]=v;}a.update();b.update();
    for(const m of meshes){const x=a.drawables.vertexPositions[m.j],y=b.drawables.vertexPositions[m.i];for(let k=0;k<x.length;k++)maxError=Math.max(maxError,Math.abs(y[k]-scale*x[k]-offset[k%2]));}
    samples++;
   }
   return {samples,meshes:meshes.map(m=>m.id),constantScale:scale,constantTranslation:offset,maxErrorModelUnits:maxError,maxErrorSourcePixels:maxError/Math.abs(scale)*a.canvasinfo.PixelsPerUnit,untouched};
  }finally{a.release();b.release();oa.moc._release();ob.moc._release();}
 },integrated);
 for(const [name,values] of [['neutral',[0,0,0,0]],['shoulder-low',[-30,0,0,0]],['shoulder-high',[30,0,0,0]],['elbow-low',[0,-30,0,0]],['elbow-high',[0,30,0,0]],['wrist-low',[0,0,-30,0]],['wrist-high',[0,0,10,0]],['finger-low',[0,0,0,-10]],['finger-high',[0,0,0,10]]]){
  await page.evaluate(values=>{['ParamArmLB01','ParamArmLB02','ParamArmLB03','ParamHandLB'].forEach((id,i)=>parameters[id]=values[i]);render()},values);
  await page.locator('canvas').screenshot({path:resolve(out,name+'.png')});
 }
 await writeFile(resolve(out,'checks.json'),JSON.stringify({...report,errors},null,2)+'\n');console.log(JSON.stringify({...report,errors},null,2));
 if(errors.length||report.maxErrorSourcePixels>.1)throw Error('Original rig geometry was not preserved');
}finally{await browser.close()}
