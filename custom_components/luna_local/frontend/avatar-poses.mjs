// A small pose vocabulary; speech and blink continue independently.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export class AvatarPoses {
 constructor(random=Math.random){this.random=random;this.key=null;this.started=0;this.nextIdle=0;this.idle='relaxed';this.weights={};this.gestures=new Map();}
 sample({turn,phase,mood,replyAge=0,automation=null},time,dt,reduced=false){
  const key=`${turn}:${mood?.name||'neutral'}:${mood?.gesture||''}`;
  if(key!==this.key){
   this.key=key;this.started=time-Math.max(0,Number.isFinite(replyAge)?replyAge:0);
   if(mood?.gesture){
    if(this.gestures.has(key))this.started=this.gestures.get(key);
    else {this.gestures.set(key,this.started);if(this.gestures.size>32)this.gestures.delete(this.gestures.keys().next().value);}
   }
  }
  const age=Math.max(0,time-this.started),intensity=clamp((mood?.intensity||0)*1.8);
  const target={ParamLunaJoy:['joyful','amused','laughing'].includes(mood?.name)?intensity:0,
   ParamLunaAnger:mood?.name==='angry'?intensity:0,ParamLunaShy:mood?.name==='shy'?intensity:0,
   ParamLunaWave:0,ParamLunaHipsL:0,ParamLunaHipsR:0,ParamLunaCross:0,ParamLunaIdleLean:0};
  if(!this.nextIdle)this.nextIdle=time+20;
  if(time>=this.nextIdle){const choices=['relaxed','left_hip','right_hip','crossed'].filter(x=>x!==this.idle);this.idle=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];this.nextIdle=time+18+this.random()*14;}
  if(!reduced){
   if(automation){
    target.ParamLunaWave=automation.pose==='wave'?1:0;
    target.ParamLunaHipsL=target.ParamLunaHipsR=automation.pose==='hands_on_hips'?1:0;
    target.ParamLunaCross=automation.pose==='arms_crossed'?1:0;
   }
   else if(mood?.gesture==='wave' && age<5.5)target.ParamLunaWave=1;
   else if(mood?.gesture==='hips' && age<12)target.ParamLunaHipsL=target.ParamLunaHipsR=1;
   else if(mood?.gesture==='crossed' && age<12)target.ParamLunaCross=1;
   else if(phase==='idle'){
    target.ParamLunaHipsL=this.idle==='left_hip'?1:0;
    target.ParamLunaHipsR=this.idle==='right_hip'?1:0;
    target.ParamLunaCross=this.idle==='crossed'?1:0;
    target.ParamLunaIdleLean=this.idle==='left_hip'?.008:this.idle==='right_hip'?-.008:0;
   }
  }
  for(const [name,value] of Object.entries(target)){
   const rate=1-Math.exp(-Math.max(0,Math.min(.05,dt))/(name==='ParamLunaWave'?.35:.65));
   this.weights[name]=(this.weights[name]||0)+(value-(this.weights[name]||0))*rate;
   // Respect reduced motion immediately for body gestures, retaining static facial expression.
   if(reduced&&!['ParamLunaJoy','ParamLunaAnger','ParamLunaShy'].includes(name))this.weights[name]=0;
  }
  return {...this.weights,ParamLunaGestureTime:age};
 }
}
