import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeAvatarFrame,nativeTailFrame} from '../tools/live2d/native-avatar.mjs';
test('tail visits both sides through the hidden centre with gentle bounded idle',()=>{
 assert.equal(nativeTailFrame(0).ParamLunaTailSide,1);
 assert.equal(nativeTailFrame(22).ParamLunaTailSide,0);
 assert.equal(nativeTailFrame(30).ParamLunaTailSide,-1);
 assert.equal(nativeTailFrame(46).ParamLunaTailSide,0);
 assert.equal(nativeTailFrame(48).ParamLunaTailSide,1);
 let previous=nativeTailFrame(0);
 for(let t=.05;t<100;t+=.05){
  const f=nativeTailFrame(t);
  assert.ok(f.PARAM_TAIL>=0&&f.PARAM_TAIL<=.08);
  assert.ok(Math.abs(f.ParamLunaTailSide-previous.ParamLunaTailSide)<.04);
  assert.deepEqual(nativeTailFrame(t,true),nativeTailFrame(0,true));
  previous=f;
 }
 const explicit={ParamLunaTailSide:-.5,PARAM_TAIL:.06,PARAM_TAIL_ANGRY:.2};
 const f=nativeAvatarFrame(explicit,22);
 for(const [id,value] of Object.entries(explicit))assert.equal(f.parameters[id],value);
});
test('native donor profile retains approved portrait limits without losing mouth opening or wave',()=>{
 for(const form of [-1,0,1]){
  const result=nativeAvatarFrame({ParamMouthForm:form,ParamMouthOpenY:.85,ParamAngleX:2.5,ParamEyeLOpen:.2,ParamLunaWave:1,PARAM_ARM_R_B:8},1);
  assert.equal(result.parameters.ParamMouthForm,Math.max(-.35,Math.min(.35,form)));
  assert.equal(result.parameters.ParamMouthOpenY,.85);
  assert.equal(result.parameters.ParamEyeLOpen,.2);
  assert.equal(result.parameters.ParamAngleX,0);
  assert.equal(result.parameters.PARAM_ARM_R_B,8);
  assert.equal(result.partOpacities.PartLunaWaveR,1);
  assert.equal(result.partOpacities.PartArmRB,0);
 }
});

test('legacy resting arms remain neutral while intact donor motion stays available',()=>{
 for(let t=0;t<=60;t+=.25){
  const rest=nativeAvatarFrame({ParamArmRB03:12,ParamArmLB01:20},t);
  for(const id of ['ParamArmLB01','ParamArmLB02','ParamArmLB03','ParamArmRB01','ParamArmRB02','ParamArmRB03'])assert.equal(Math.abs(rest.parameters[id]),0);
 }
 const raised=nativeAvatarFrame({ParamLunaRaisedL:1},2);
 assert.notEqual(raised.parameters.ParamArmLB01,0);
 assert.notEqual(nativeAvatarFrame({ParamLunaWave:1},0).parameters.PARAM_ARM_R_B,nativeAvatarFrame({ParamLunaWave:1},.2).parameters.PARAM_ARM_R_B);
});

test('native expressions preserve blink closure and speech silence and keep portrait limits',()=>{
 for(const mood of ['Joy','Laugh','Shy','Surprise'])for(const amount of [0,.4,1]){
  const p={['ParamLuna'+mood]:amount,ParamEyeLOpen:0,ParamEyeROpen:0,ParamLunaSpeaking:1};
  for(const mouth of [0,.3,.85]){
   const f=nativeAvatarFrame({...p,ParamMouthOpenY:mouth},0).parameters;
   assert.equal(f.ParamEyeLOpen,0);assert.equal(f.ParamEyeROpen,0);
   assert.equal(f.ParamMouthOpenY,mouth);
   assert.ok(Math.abs(f.ParamMouthForm)<=.35);
   assert.equal(f.ParamAngleZ,0);assert.equal(f.ParamBrowLY,0);
  }
 }
 assert.ok(nativeAvatarFrame({ParamLunaLaugh:.65},0).parameters.ParamEyeLOpen<.1);
 assert.ok(nativeAvatarFrame({ParamLunaSurprise:.5},0).parameters.ParamMouthOpenY>.1);
 assert.equal(nativeAvatarFrame({},0).parameters.ParamMouthOpenY,0);
});
