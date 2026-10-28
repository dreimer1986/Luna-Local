import test from 'node:test';
import assert from 'node:assert/strict';
import {markerExpression} from '../custom_components/luna_local/frontend/emotion-markers.mjs';
import {LunaSession} from '../custom_components/luna_local/frontend/session.mjs';
import {LunaPerformance} from '../custom_components/luna_local/frontend/performance.mjs';
test('reply markers select expressions without inferring mood from words',()=>{
 assert.equal(markerExpression('Das ist traurig.'),null);
 assert.equal(markerExpression('Gerne 😊').name,'shy');
 assert.equal(markerExpression(['🙂']).name,'joyful');
 assert.equal(markerExpression('Oh nein 😢').name,'sad');
 assert.equal(markerExpression('Prima :D').name,'laughing');
 assert.equal(markerExpression(null),null);
});
test('explicit reply markers bypass classification and respect disable and stale turns',async()=>{
 let calls=0; const s={config:{},generation:3,emit(){},hass:{callWS(){calls++;}}};
 await LunaSession.prototype.getExpression.call(s,'Prima 🙂',3);
 assert.equal(s.expression.name,'joyful');assert.equal(calls,0);
 await LunaSession.prototype.getExpression.call(s,'😡',2);assert.equal(s.expression.name,'joyful');
 s.config.expressions=false;await LunaSession.prototype.getExpression.call(s,'🙂',3);
 assert.equal(s.expression.name,'neutral');assert.equal(calls,0);
});
test('remote mood drives eyes and mouth, local conversation has priority, disable returns neutral',()=>{
 const remote={id:'room',speaking:true,mouth:.6,expression:markerExpression('😢')};
 const s={phase:'idle',generation:1,config:{},expression:markerExpression('🙂'),roomPlayback:{sample:()=>remote}};
 const p=new LunaPerformance();let value;
 for(let i=0;i<30;i++)value=p.sample(s,1,.05);
 assert.equal(value.expression,'sad');assert.ok(value.parameters.ParamMouthOpenY>.5);
 assert.ok(value.parameters.ParamEyeLOpen<.95);
 s.phase='thinking';value=p.sample(s,1,.05);assert.equal(value.expression,'joyful');assert.equal(value.parameters.ParamMouthOpenY,0);
 s.config.expressions=false;for(let i=0;i<60;i++)value=p.sample(s,1,.05);
 assert.equal(value.expression,'neutral');assert.ok(value.parameters.ParamEyeLOpen>.999);
});
