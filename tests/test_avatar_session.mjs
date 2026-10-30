import test from 'node:test';
import assert from 'node:assert/strict';
import {LunaSession, pcmPacket} from '../custom_components/luna_local/frontend/session.mjs';
import {estimateViseme} from '../custom_components/luna_local/frontend/rig.mjs';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function fixture() {
  const sent = [], timers = new Map(); let timer = 0;
  const env = {setTimeout: fn => { timers.set(++timer, fn); return timer; },
    clearTimeout: id => timers.delete(id), document: {hidden: false, addEventListener() {}, removeEventListener() {}}};
  const hass = {states: {}, connection: {socket: {readyState: 1, send: value => sent.push(value)}}};
  return {session: new LunaSession(hass, {}, env), hass, env, sent, timers};
}

test('PCM includes channel zero and signed little-endian samples; EOF has only channel', () => {
  assert.deepEqual([...pcmPacket(0, new Int16Array([-32768, 32767]))], [0, 0, 128, 255, 127]);
  assert.deepEqual([...pcmPacket(7, [])], [7]);
  assert.throws(() => pcmPacket(256, []));
});

test('pipeline uses registered Luna agent even after entity renaming', async () => {
  const {session, hass} = fixture();
  hass.callWS = async ({type}) => type === 'luna_local/avatar/config' ? {agents: ['conversation.renamed']} : {
    preferred_pipeline: 'other', pipelines: [
      {id: 'other', conversation_engine: 'conversation.not_luna', tts_engine: 'tts.test'},
      {id: 'ours', conversation_engine: 'conversation.renamed', tts_engine: 'tts.test'},
    ],
  };
  assert.equal((await session.selectPipeline()).id, 'ours');
  session.config.pipeline = 'other';
  assert.equal((await session.selectPipeline()).id, 'other');
  assert.equal(session.externalAgent, true);
});

test('switching assistants cancels the old turn and clears its conversation id', () => {
  const {session} = fixture();session.conversationId='private-local-history';
  const old=session.generation;session.setPipeline('gemini');
  assert.equal(session.config.pipeline,'gemini');assert.equal(session.conversationId,null);
  assert.equal(session.generation,old+1);
});

test('external agents end at intent and use selected pipeline for cleaned speech', async () => {
  const {session,hass} = fixture();session.externalAgent=true;session.pipeline={id:'gemini'};
  let request,synthesis,played;
  hass.connection.subscribeMessage=async(cb,message)=>{request=message;return ()=>{}};
  hass.callWS=async message=>{synthesis=message;return {url:'/api/tts_proxy/test.wav'}};
  session.playAudio=async url=>{played=url};
  await session.run({start_stage:'intent',input:{text:'Hallo'}},0);
  assert.equal(request.end_stage,'intent');assert.equal(request.pipeline,'gemini');
  await session.speakExternal('Hallo 👋',0);
  assert.deepEqual(synthesis,{type:'luna_local/avatar/tts',pipeline:'gemini',text:'Hallo 👋'});
  assert.equal(played,'/api/tts_proxy/test.wav');
});

test('external emoji-only speech completes and stale speech never plays', async () => {
  const {session,hass} = fixture();session.pipeline={id:'gemini'};
  hass.callWS=async()=>({url:null});session.phase='preparing';
  await session.speakExternal('👋',0);assert.equal(session.phase,'idle');
  let finish,played=false;
  hass.callWS=()=>new Promise(resolve=>finish=resolve);
  session.playAudio=()=>{played=true};
  const pending=session.speakExternal('Hallo',0);session.stop();finish({url:'/api/tts_proxy/a.wav'});
  await pending;assert.equal(played,false);
});

test('Gemini expressions use emoji without contacting Ollama', async () => {
  const {session,hass}=fixture();session.externalAgent=true;
  hass.callWS=()=>{throw Error('Unexpected classifier request')};
  await session.getExpression('Hallo 👋',0);assert.equal(session.expression.gesture,'wave');
  await session.getExpression('Hallo',0);assert.equal(session.expression.name,'neutral');
});

test('stop releases microphone, EOF, audio and subscription; stale events are ignored', async () => {
  const {session, hass, sent} = fixture(); let callback, stopped = 0, unsubscribed = 0;
  hass.connection.subscribeMessage = async cb => { callback = cb; return () => { unsubscribed++; }; };
  session.pipeline = {id: 'ours'};
  await session.run({start_stage: 'stt'}, session.generation);
  session.handler = 0;
  session.stream = {getTracks: () => [{stop: () => stopped++}]};
  session.stop();
  callback({type: 'intent-end', data: {intent_output: {response: {speech: {plain: {speech: 'stale'}}}}}});
  await Promise.resolve();
  assert.equal(stopped, 1); assert.equal(unsubscribed, 1);
  assert.deepEqual([...sent[0]], [0]); assert.equal(session.transcript.length, 0);
  assert.equal(session.phase, 'idle'); assert.equal(session.continuous, false);
});

test('Finish before STT ready sends buffered PCM and EOF once channel is ready', () => {
  const {session, sent} = fixture();
  session.pendingChunks = [new Int16Array([42])];
  session.finishInput();
  assert.equal(sent.length, 0);
  session.handleEvent({type: 'run-start', data: {runner_data: {stt_binary_handler_id: 3}}}, 0);
  session.handleEvent({type: 'stt-start'}, 0);
  assert.deepEqual(sent.map(value => [...value]), [[3, 42, 0], [3]]);
  assert.equal(session.phase, 'thinking');
});

test('tts-end starts actual playback; run-end does not mark playback complete', () => {
  const {session, timers} = fixture(); let plays = 0;
  session.playAudio = () => { plays++; session.phase = 'speaking'; };
  session.handleEvent({type: 'tts-end', data: {tts_output: {url: '/audio'}}}, 0);
  session.handleEvent({type: 'tts-end', data: {tts_output: {url: '/audio'}}}, 0);
  session.handleEvent({type: 'run-end'}, 0);
  for (const callback of [...timers.values()]) callback();
  assert.equal(plays, 1); assert.equal(session.phase, 'speaking');
});

test('hidden tab stops and never silently resumes the microphone', () => {
  const {session, env} = fixture();
  session.continuous = true; session.phase = 'listening'; env.document.hidden = true;
  session.hiddenHandler(); env.document.hidden = false; session.hiddenHandler();
  assert.equal(session.phase, 'idle'); assert.equal(session.continuous, false);
});

test('stop during microphone permission prompt disposes a late stream', async () => {
  const {session, env} = fixture(); let grant, requested, stops = 0;
  const requestedPromise = new Promise(resolve => { requested = resolve; });
  env.isSecureContext = true;
  env.navigator = {mediaDevices: {getUserMedia: () => {
    requested(); return new Promise(resolve => { grant = resolve; });
  }}};
  session.unlockAudio = async () => {};
  session.selectPipeline = async () => ({stt_engine: 'stt.test'});
  const pending = session.listen(); await requestedPromise;
  session.stop(); grant({getTracks: () => [{stop: () => stops++}]});
  await pending;
  assert.equal(stops, 1); assert.equal(session.phase, 'idle'); assert.equal(session.stream, null);
});

test('silence overrides spectrum; different spectral bands produce different mouth shapes', () => {
  const quiet = new Float32Array(2048), loud = new Float32Array(2048).fill(.1);
  const low = new Float32Array(1024).fill(-100), hiss = low.slice();
  for (let i = 7; i < 28; i++) low[i] = -10;
  for (let i = 150; i < 320; i++) hiss[i] = -10;
  assert.equal(estimateViseme(quiet, hiss, 48000, 2048), 'sil');
  assert.equal(estimateViseme(loud, low, 48000, 2048), 'O');
  assert.equal(estimateViseme(loud, hiss, 48000, 2048), 'FF');
});

test('capture worklet preserves the final short audio block before EOF', () => {
  let Processor; const messages = [];
  vm.runInNewContext(readFileSync(new URL('../custom_components/luna_local/frontend/capture-worklet.js', import.meta.url), 'utf8'), {
    sampleRate: 48000,
    AudioWorkletProcessor: class { constructor() { this.port = {postMessage: data => messages.push(data)}; } },
    registerProcessor: (_name, cls) => { Processor = cls; },
  });
  const worklet = new Processor();
  worklet.process([[new Float32Array([.5, -.5, 1, -1])]]);
  worklet.port.onmessage({data: 'finish'});
  assert.deepEqual([...messages[0]], [16383, -16384, 32767, -32768]);
  assert.equal(messages[1], 'finished');
  assert.equal(worklet.process([[new Float32Array(128)]]), false);
  worklet.port.onmessage({data: 'finish'});
  assert.equal(messages.length, 2);
});

test('pending pipeline acknowledgement times out and a late subscription is released', async () => {
  const {session, hass, timers} = fixture(); let acknowledge, unsubscribed = 0;
  session.pipeline = {id: 'ours'};
  hass.connection.subscribeMessage = () => new Promise(resolve => { acknowledge = resolve; });
  const pending = session.run({start_stage: 'intent'}, 0);
  [...timers.values()][0]();
  acknowledge(() => { unsubscribed++; }); await pending;
  assert.equal(session.phase, 'error'); assert.equal(unsubscribed, 1);
});

test('missing TTS output stops continuous mode instead of repeatedly opening the microphone', () => {
  const {session, timers} = fixture(); session.continuous = true;
  session.handleEvent({type: 'run-end'}, 0);
  [...timers.values()][0]();
  assert.equal(session.phase, 'error'); assert.equal(session.continuous, false);
  assert.match(session.error, /Sprachausgabe/);
});


test('microphone disables HA early endpoint while text keeps its normal timeout', async () => {
  const {session,hass}=fixture();session.pipeline={id:'ours'};
  let request;hass.connection.subscribeMessage=async (_,r)=>{request=r;return ()=>{}};
  await session.run({start_stage:'stt',input:{sample_rate:48000}},0);
  assert.equal(request.input.no_vad,true);assert.equal(request.timeout,600);
  await session.run({start_stage:'intent',input:{text:'Hallo'}},0);
  assert.equal(request.input.no_vad,undefined);assert.equal(request.timeout,120);
});

test('capture tolerates long speech and pauses shorter than three seconds', () => {
  for (const rate of [16000,44100,48000]) {
    let Processor;const messages=[];
    vm.runInNewContext(readFileSync(new URL('../custom_components/luna_local/frontend/capture-worklet.js',import.meta.url),'utf8'),{
      sampleRate:rate,
      AudioWorkletProcessor:class {constructor(){this.port={postMessage:data=>messages.push(data)}}},
      registerProcessor:(_,cls)=>{Processor=cls},
    });
    const w=new Processor(),block=Math.round(rate*.02);
    const feed=(seconds,level)=>{for(let n=0;n<Math.round(seconds/.02);n++)w.process([[new Float32Array(block).fill(level)]])};
    feed(4,0);assert.equal(w.finished,false); // No empty auto-submit.
    feed(20,.04);assert.equal(w.finished,false); // No former 15 s limit.
    feed(2.98,0);assert.equal(w.finished,false);
    feed(.4,.02);feed(2.98,0);assert.equal(w.finished,false); // Speech resets pause.
    feed(.02,0);assert.equal(w.finished,true);
    assert.equal(messages.filter(m=>m==='finished').length,1);
    assert.equal(messages.at(-1),'finished'); // PCM tail precedes EOF.
  }
});
