import test from 'node:test';
import assert from 'node:assert/strict';
import {AvatarPoses} from '../custom_components/luna_local/frontend/avatar-poses.mjs';
import {markerExpression} from '../custom_components/luna_local/frontend/emotion-markers.mjs';
import {moveFullBody} from '../tools/live2d/fullbody-motion.mjs';
import {armPose} from '../tools/live2d/fullbody-pose.mjs';
function run(p,input,start,end,reduced=false){let out;for(let t=start;t<end;t+=.05)out=p.sample(input,t,.05,reduced);return out;}
test('gesture is triggered once per reply, fades out, and a new reply can wave again',()=>{
 const p=new AvatarPoses(()=>0),input={turn:1,phase:'speaking',mood:markerExpression('Hallo 👋')};
 assert.ok(run(p,input,0,3).ParamLunaWave>.99);
 assert.ok(run(p,input,3,9).ParamLunaWave<.001);
 input.turn=2;assert.ok(run(p,input,9,12).ParamLunaWave>.99);
});
test('idle poses vary and transitions are bounded; reduced motion cancels voluntary poses',()=>{
 const p=new AvatarPoses(()=>0),input={turn:1,phase:'idle',mood:null};
 const neutral=run(p,input,0,19);assert.equal(neutral.ParamLunaHipsL,0);
 const pose=run(p,input,19,25);assert.ok(pose.ParamLunaHipsL>.99);
 const stop=p.sample(input,25,.05,true);assert.equal(stop.ParamLunaHipsL,0);assert.equal(stop.ParamLunaCross,0);
});
test('mood changes blend and do not survive a neutral reply',()=>{
 const p=new AvatarPoses(()=>0),input={turn:'room:1',phase:'speaking',mood:markerExpression('😡')};
 const angry=run(p,input,0,5);assert.ok(angry.ParamLunaAnger>.7);assert.ok(angry.ParamLunaHipsR>.99);
 input.mood=null;input.turn='room:2';const neutral=run(p,input,5,12);assert.ok(neutral.ParamLunaAnger<.001);assert.ok(neutral.ParamLunaHipsR<.001);
});
test('gesture marker mappings are explicit and unrelated words do not trigger arms',()=>{
 assert.equal(markerExpression('Bis bald 👋').gesture,'wave');assert.equal(markerExpression('😤').gesture,'hips');
 assert.equal(markerExpression('😠').gesture,'crossed');assert.equal(markerExpression('🙈').name,'shy');assert.equal(markerExpression('Winken wäre nett'),null);
});
test('overlapping arm layers share the same elbow deformation and neutral is exact',()=>{
 for(const pose of [{ParamLunaWave:1},{ParamLunaCross:1},{ParamLunaHipsL:1}]){
  assert.deepEqual(armPose(.18,.20,'ArtMesh0',pose),armPose(.18,.20,'ArtMesh1',pose));
 }
 const source=new Float32Array([-.05,.58,.02,.50,.25,-.08,0,-.7]),copy=source.slice();moveFullBody(copy,4,true,'ArtMesh2',{});assert.deepEqual(copy,source);
 const upper=new Float32Array([.24,-.09]),hand=upper.slice();moveFullBody(upper,1,false,'ArtMesh0');moveFullBody(hand,1,false,'ArtMesh2');assert.notDeepEqual(hand,upper);
});
test('a room interruption does not replay the previous local gesture',()=>{
 const p=new AvatarPoses(()=>0),local={turn:1,phase:'speaking',mood:markerExpression('👋')};
 run(p,local,0,3);run(p,{turn:'room:1',phase:'speaking',mood:markerExpression('🙂')},3,10);
 assert.ok(run(p,local,10,12).ParamLunaWave<.001);
 const late=new AvatarPoses(()=>0);assert.equal(late.sample({...local,replyAge:8},0,.05).ParamLunaWave,0);
});
