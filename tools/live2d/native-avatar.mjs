// Drive existing Cubism forms only. No vertex/pivot changes or synthetic arm shapes.
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
// Hold each side, then cross behind the body using the authored native forms.
export function nativeTailFrame(time,reduced=false){
 const t=Number.isFinite(time)?Math.max(0,time):0,phase=t%48;
 const ease=x=>x*x*(3-2*x);
 const side=phase<20?1:phase<24?1-2*ease((phase-20)/4):phase<44?-1:-1+2*ease((phase-44)/4);
 return {ParamLunaTailSide:reduced?1:side,PARAM_TAIL:reduced?0:.04*(1+Math.sin(t*1.2)),PARAM_TAIL_ANGRY:0};
}
export function nativeAvatarFrame(parameters,time,reduced=false){
 const wave=reduced?0:clamp(parameters.ParamLunaWave),raised=reduced?0:clamp(parameters.ParamLunaRaisedL);
 const raisedIdle=reduced?0:raised;
 return {
  parameters:{ParamBreath:0,...nativeTailFrame(time,reduced),...parameters,
   // The resting A arms are still legacy artwork, not intact donor chains.
   // Their old idle controls open cuffs/torso seams. Only the transplanted Mao
   // B arm may use these controls while visible; Chitose has its own parameter.
   ParamArmLB01:raisedIdle*Math.sin(time*.41)*2,
   ParamArmLB02:raisedIdle*Math.sin(time*.53+.8)*2,
   ParamArmLB03:raisedIdle*Math.sin(time*.61)*1.5,
   ParamArmRB01:0,ParamArmRB02:0,ParamArmRB03:0,ParamArmRB02Y:0,ParamHandLB:0,
   // The portrait patches still use the approved V9 face. Keep its original
   // control limits: unconstrained template forms separate lips/teeth/eyes.
   ParamMouthForm:Math.max(-.35,Math.min(.35,Number.isFinite(parameters.ParamMouthForm)?parameters.ParamMouthForm:0)),
   ParamAngleX:0,ParamAngleY:0,ParamAngleZ:0,
   ParamBodyAngleX:0,ParamBodyAngleY:0,ParamBodyAngleZ:0,
   ParamBrowLY:0,ParamBrowRY:0,ParamEyeBallX:0,ParamEyeBallY:0,
   // Use the original handwave's 0..8 range; the native -10..10 range remains intact.
   PARAM_ARM_R_B:Number.isFinite(parameters.PARAM_ARM_R_B)?parameters.PARAM_ARM_R_B:4+4*Math.sin(time*6)},
  partOpacities:{PartArmRB:1-wave,PartLunaWaveR:wave,PartArmLB:1-raised,PartLunaRaisedL:raised},
 };
}
