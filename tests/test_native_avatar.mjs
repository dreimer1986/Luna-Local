import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeAvatarFrame} from '../tools/live2d/native-avatar.mjs';
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
