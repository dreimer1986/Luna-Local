import test from 'node:test';
import assert from 'node:assert/strict';
import {refineMesh} from '../tools/live2d/portrait-mesh.mjs';
test('mesh subdivision shares edge midpoints and retains UV registration',()=>{
 const source=new Float32Array([0,0,1,0,1,1,0,1]);
 const m=refineMesh(source,source,new Uint16Array([0,1,2,0,2,3]),1);
 assert.equal(m.vertices.length/2,9);assert.equal(m.indices.length,24);
 assert.deepEqual(m.vertices,m.uvs);
 let area=0;
 for(let i=0;i<m.indices.length;i+=3){const [a,b,c]=Array.from(m.indices.slice(i,i+3)).map(n=>n*2);area+=Math.abs((m.vertices[b]-m.vertices[a])*(m.vertices[c+1]-m.vertices[a+1])-(m.vertices[c]-m.vertices[a])*(m.vertices[b+1]-m.vertices[a+1]))/2}
 assert.equal(area,1);
 const shifted=source.map(v=>v+2);m.refresh(shifted);
 for(let i=0;i<m.vertices.length;i++)assert.equal(m.vertices[i],m.uvs[i]+2);
 m.refresh(source);assert.deepEqual(m.vertices,m.uvs);
});
