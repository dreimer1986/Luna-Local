// Drive existing Cubism forms only. No vertex/pivot changes or synthetic arm shapes.
import {fullBodyParameters} from './fullbody-motion.mjs';
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function nativeAvatarFrame(parameters,time,reduced=false){
 const wave=reduced?0:clamp(parameters.ParamLunaWave),raised=reduced?0:clamp(parameters.ParamLunaRaisedL);
 return {
  parameters:{...fullBodyParameters(time,reduced),...parameters,
   // Use the original handwave's 0..8 range; the native -10..10 range remains intact.
   PARAM_ARM_R_B:Number.isFinite(parameters.PARAM_ARM_R_B)?parameters.PARAM_ARM_R_B:4+4*Math.sin(time*6)},
  partOpacities:{PartArmRB:1-wave,PartLunaWaveR:wave,PartArmLB:1-raised,PartLunaRaisedL:raised},
 };
}
