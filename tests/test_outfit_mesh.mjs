import {moveFullBody} from '../tools/live2d/fullbody-motion.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {triangulate,outfitMesh,moveClothingMesh} from '../tools/live2d/outfits/mesh.mjs';
import {winterParts} from '../tools/live2d/outfits/winter.mjs';
const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1]},0)/2);
test('Clothing triangulation covers each concave material polygon exactly',()=>{
 for(const part of winterParts){const t=triangulate(part.points);assert.equal(t.length,(part.points.length-2)*3);let total=0;for(let i=0;i<t.length;i+=3)total+=area(t.slice(i,i+3).map(j=>part.points[j]));assert.ok(Math.abs(total-area(part.points))<1e-5);}
});
test('Refined clothing meshes stay finite, in source UV bounds and WebGL index range',()=>{
 for(const part of winterParts){const m=outfitMesh(part);assert.ok(m.vertices.every(Number.isFinite));assert.ok(m.uvs.every(v=>v>=0&&v<=1));assert.ok(m.indices.every(i=>i<m.vertices.length/2));assert.deepEqual(m.rest,m.vertices);}
});

test('Wrist rotation never moves the clothing shoulder',()=>{
 for(const part of winterParts.filter(p=>['ArtMesh0','ArtMesh5'].includes(p.id))){
  const m=outfitMesh(part),baseline=m.rest.slice(),p={ParamLunaWave:1,ParamLunaGestureTime:.1};
  moveFullBody(baseline,1,false,m.id,p);moveClothingMesh(m,1,false,p);
  for(let i=0;i<m.rest.length;i+=2)if(m.rest[i+1]>.1){assert.equal(m.vertices[i],baseline[i]);assert.equal(m.vertices[i+1],baseline[i+1]);}
  assert.ok(m.vertices.every(Number.isFinite));
 }
});
