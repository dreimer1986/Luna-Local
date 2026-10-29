// V9 geometry coordinates, in model units. Every layer uses the same face warp.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const ARM_MESHES = ['ArtMesh0','ArtMesh1','ArtMesh2','ArtMesh5','ArtMesh6','ArtMesh7'];
export const HAND_MESHES = ['ArtMesh2','ArtMesh7'];
export function facePose(x,y,p={}) {
 const joy=clamp(p.ParamLunaJoy),angry=clamp(p.ParamLunaAnger),shy=clamp(p.ParamLunaShy);
 if(y<.47||y>.64||!(joy||angry||shy))return [x,y];
 let dy=0;
 for(const [cx,cy,side] of [[-.045,.579,-1],[.034,.596,1]]) {
  const dx=x-cx,wy=Math.exp(-(((y-cy)/.012)**2)),wx=Math.exp(-((dx/.033)**4));
  dy+=(angry*.60-shy*.12)*side*dx*wx*wy;
 }
 const mx=x-.007,my=y-.514,mw=Math.exp(-((mx/.038)**4)-((my/.023)**4));
 dy+=(joy*.004-angry*.008)*(Math.min(1,(mx/.020)**2)-.30)*mw;
 return [x,y+dy];
}
function rotate(x,y,cx,cy,a){const c=Math.cos(a),s=Math.sin(a),dx=x-cx,dy=y-cy;return [cx+c*dx-s*dy,cy+s*dx+c*dy];}
export function armPose(x,y,id,p={}) {
 const i=ARM_MESHES.indexOf(id);if(i<0)return [x,y];
 const side=i<3?1:-1,segment=i%3;
 const wave=side===1?clamp(p.ParamLunaWave):0,hips=clamp(p.ParamLunaHips ?? (side===1?p.ParamLunaHipsL:p.ParamLunaHipsR)),cross=clamp(p.ParamLunaCross);
 if(!(wave||hips||cross))return [x,y];
 const shoulder=side*(wave*.62+hips*.40-cross*.25),elbow=side*(wave*2.08-hips*1.40-cross*1.90);
 const wrist=side*(wave*.18*Math.sin((p.ParamLunaGestureTime||0)*7)+hips*.65+cross*.30);
 if(segment===2)[x,y]=rotate(x,y,side*.251,.015,wrist);
 const elbowWeight=1-smooth(.13,.27,y),shoulderWeight=1-smooth(.32,.43,y);
 [x,y]=rotate(x,y,side*.19,.185,elbow*elbowWeight);
 return rotate(x,y,side*.125,.380,shoulder*shoulderWeight);

}
export function poseHead(x,y,p={}) {
 const shy=clamp(p.ParamLunaShy),anger=clamp(p.ParamLunaAnger),joy=clamp(p.ParamLunaJoy);
 if(y<.38||!(shy||anger||joy))return [x,y];
 const weight=smooth(.38,.46,y),angle=(-shy*.075+joy*.025+anger*.015)*weight;
 return rotate(x,y,0,.44,angle);
}
