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
