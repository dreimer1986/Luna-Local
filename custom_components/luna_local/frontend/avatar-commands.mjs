// Automation commands are independent of microphone and TTS playback.
export class AvatarCommands {
 constructor(hass,env=globalThis){
  this.hass=hass;this.env=env;this.revision=0;this.closed=false;this.job=null;
  this.connected=()=>this.subscribe();this.disconnected=()=>{this.job=null;};
  hass.connection.addEventListener?.('connected',this.connected);hass.connection.addEventListener?.('disconnected',this.disconnected);this.subscribe();
 }
 async subscribe(){
  const revision=++this.revision;this.env.clearTimeout(this.retry);
  if(this.unsubscribe)Promise.resolve(this.unsubscribe()).catch(()=>{});this.unsubscribe=null;
  try{
   const unsub=await this.hass.connection.subscribeMessage(event=>{if(!this.closed&&revision===this.revision)this.receive(event);},{type:'luna_local/avatar/commands'});
   if(this.closed||revision!==this.revision){await unsub();return;}this.unsubscribe=unsub;
  }catch{if(!this.closed&&revision===this.revision)this.retry=this.env.setTimeout(()=>this.subscribe(),5000);}
 }
 receive(event){
  if(event?.reset){this.job=null;return;}
  if(!event||typeof event.id!=='string'||!['neutral','wave','hands_on_hips','arms_crossed'].includes(event.pose)||!['neutral','joyful','angry','shy'].includes(event.expression))return;
  if(![event.server_time,event.started_at,event.expires_at,event.intensity].every(Number.isFinite))return;
  const remaining=Math.min(120,event.expires_at-event.server_time);if(remaining<=0){this.job=null;return;}
  const now=this.env.performance.now();
  this.job={id:event.id,pose:event.pose,expression:{name:event.expression,intensity:Math.max(0,Math.min(1,event.intensity))},started:now-Math.max(0,event.server_time-event.started_at)*1000,expires:now+remaining*1000};
 }
 sample(){const now=this.env.performance.now(),j=this.job;if(!j||now>=j.expires)return null;return {...j,elapsed:Math.max(0,(now-j.started)/1000)};}
 destroy(){this.closed=true;++this.revision;this.job=null;this.env.clearTimeout(this.retry);if(this.unsubscribe)Promise.resolve(this.unsubscribe()).catch(()=>{});this.hass.connection.removeEventListener?.('connected',this.connected);this.hass.connection.removeEventListener?.('disconnected',this.disconnected);}
}
