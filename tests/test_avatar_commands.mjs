import test from 'node:test';
import assert from 'node:assert/strict';
import {AvatarCommands} from '../custom_components/luna_local/frontend/avatar-commands.mjs';
import {LunaPerformance} from '../custom_components/luna_local/frontend/performance.mjs';

test('automation subscription expires locally and respects server elapsed time and reset',async()=>{
 let now=1000,unsubscribed=0;const env={performance:{now:()=>now},setTimeout,clearTimeout};
 const hass={connection:{subscribeMessage:async()=>()=>{unsubscribed++;}}};
 const c=new AvatarCommands(hass,env);await new Promise(r=>setImmediate(r));
 c.receive({id:'1',pose:'wave',expression:'joyful',intensity:.7,started_at:10,server_time:15,expires_at:18});
 assert.equal(c.sample().elapsed,5);now=4001;assert.equal(c.sample(),null);
 c.receive({id:'2',pose:'arms_crossed',expression:'angry',intensity:.7,started_at:20,server_time:20,expires_at:30});
 c.receive({reset:true});assert.equal(c.sample(),null);
 c.receive({id:'3',pose:'wave',expression:'joyful',intensity:NaN,started_at:20,server_time:20,expires_at:30});assert.equal(c.sample(),null);
 c.destroy();assert.equal(unsubscribed,1);
});
test('an automation pose coexists with remote speech and expiry does not stop audio',()=>{
 let command={id:'cmd',pose:'wave',expression:{name:'joyful',intensity:.7},elapsed:0};
 const s={phase:'idle',generation:0,config:{},avatarCommands:{sample:()=>command},roomPlayback:{sample:()=>({id:'room',speaking:true,mouth:.7,expression:{name:'sad',intensity:.5},elapsed:0})}};
 const p=new LunaPerformance();let out;
 for(let i=0;i<80;i++)out=p.sample(s,i*.05,.05);
 assert.equal(out.expression,'joyful');assert.ok(out.parameters.ParamLunaWave>.99);assert.ok(out.parameters.ParamMouthOpenY>.6);
 command=null;for(let i=80;i<240;i++)out=p.sample(s,i*.05,.05);
 assert.equal(out.expression,'sad');assert.ok(out.parameters.ParamLunaWave<.001);assert.ok(out.parameters.ParamMouthOpenY>.6);
});
test('explicit relaxed automation overrides idle poses and reduced motion suppresses its wave',()=>{
 const p=new LunaPerformance();const s={phase:'idle',generation:0,config:{},avatarCommands:{sample:()=>({id:'x',pose:'neutral',expression:{name:'neutral',intensity:0},elapsed:0})}};
 let out;for(let i=0;i<700;i++)out=p.sample(s,i*.05,.05);
 assert.equal(out.parameters.ParamLunaCross,0);assert.equal(out.parameters.ParamLunaHipsL,0);
 s.avatarCommands.sample=()=>({id:'y',pose:'wave',expression:{name:'joyful',intensity:.6},elapsed:0});
 out=p.sample(s,36,.05,true);assert.equal(out.parameters.ParamLunaWave,0);assert.equal(out.expression,'joyful');
});
