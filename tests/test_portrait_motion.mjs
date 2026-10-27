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
