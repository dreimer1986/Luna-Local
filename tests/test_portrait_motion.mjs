import test from 'node:test';
import assert from 'node:assert/strict';
import {movePortrait} from '../tools/live2d/portrait-motion.mjs';
test('portrait idle movement keeps overlapping face meshes aligned and feet anchored',()=>{
 const face=new Float32Array([.03,.4,-.08,.39]),foreground=face.slice();
 movePortrait(face,3);movePortrait(foreground,3);
 assert.deepEqual(face,foreground);assert.notEqual(face[0],.03);
 const feet=new Float32Array([.1,-.75]);const original=feet.slice();movePortrait(feet,3);assert.deepEqual(feet,original);
 for(let t=0;t<60;t+=.1){const v=new Float32Array([.1,.4]);movePortrait(v,t);assert.ok(Math.abs(v[0]-.1)<.02);assert.ok(Math.abs(v[1]-.4)<.01)}
});
test('reduced motion preserves geometry',()=>{const v=new Float32Array([.1,.4]);const original=v.slice();movePortrait(v,3,true);assert.deepEqual(v,original)});
test('hands and fingertips relax with bounded motion and different timing',()=>{
 const tips=new Float32Array([(99-512)/1024,(768-1529)/1024,(925-512)/1024,(768-1529)/1024]);
 const a=tips.slice(),b=tips.slice();movePortrait(a,1);movePortrait(b,4);
 assert.notDeepEqual(a,b);
 for(let i=0;i<a.length;i++)assert.ok(Math.abs(a[i]-tips[i])<.015);
 assert.notEqual(a[1]-tips[1],a[3]-tips[3]);
});
