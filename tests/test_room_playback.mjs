import test from 'node:test';
import assert from 'node:assert/strict';
import {mouthEnvelope,RoomPlayback} from '../custom_components/luna_local/frontend/room-playback.mjs';
import {LunaPerformance} from '../custom_components/luna_local/frontend/performance.mjs';
const buffer={duration:1,sampleRate:100,length:100,numberOfChannels:1,getChannelData:()=>Float32Array.from({length:100},(_,i)=>i<50?.1:0)};
test('silent PCM analysis follows actual energy and silence',()=>{const e=mouthEnvelope(buffer);assert.ok(e.values[0]>.8);assert.equal(e.values.at(-1),0)});
test('remote playback seeks to speaker time, stops and cannot resurrect after cancellation',async()=>{
 let now=1000,resolveAudio;const audio=new Promise(r=>resolveAudio=r);let unsub=0;
 const hass={connection:{subscribeMessage:async()=>()=>{unsub++}}};
 const env={location:{href:'https://ha.example/test',origin:'https://ha.example'},performance:{now:()=>now},setTimeout,clearTimeout,
   fetch:async()=>({ok:true,arrayBuffer:()=>audio}),OfflineAudioContext:class{async decodeAudioData(){return buffer}}};
 const remote=new RoomPlayback(hass,()=>{},env);
 const event={id:'1',device_id:'a',room:'Wohnzimmer',url:'/api/tts_proxy/x',phase:'speaking',server_time:10,started_at:9.8};
 remote.receive(event);resolveAudio(new ArrayBuffer(1));await new Promise(r=>setImmediate(r));
 assert.ok(remote.sample().mouth>.8);now=1500;assert.equal(remote.sample().mouth,0);
 remote.receive({...event,phase:'idle'});assert.equal(remote.sample(),null);
 remote.receive({...event,id:'2'});remote.receive({...event,id:'2',phase:'idle'});await new Promise(r=>setImmediate(r));assert.equal(remote.sample(),null);
 remote.destroy();assert.equal(unsub,1);
});
test('local dialogue takes priority and remote stop closes the mouth',()=>{
 let active=true;const remote={sample:()=>active?{id:'room',speaking:true,mouth:.8}:null};
 const session={generation:1,phase:'idle',roomPlayback:remote};const p=new LunaPerformance();
 assert.ok(p.sample(session,1,.05).parameters.ParamMouthOpenY>0);
 session.phase='thinking';assert.equal(p.sample(session,2,.05).parameters.ParamMouthOpenY,0);
 session.phase='idle';p.sample(session,3,.05);active=false;assert.equal(p.sample(session,4,.05).parameters.ParamMouthOpenY,0);
});
