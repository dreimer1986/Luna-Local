import test from 'node:test';
import assert from 'node:assert/strict';
import {LunaPerformance} from '../custom_components/luna_local/frontend/performance.mjs';
import {localAssetURL} from '../custom_components/luna_local/frontend/live2d-rig.mjs';

const speaking = () => ({generation: 1, phase: 'speaking', source: {}, playbackStarted: 10,
  audioContext: {state: 'running', currentTime: 10.5, sampleRate: 48000},
  expression: {name: 'neutral', intensity: 0},
  mouthCues: {generation: 1, cues: [{start: 0, end: 1, shape: 'A'}]}});

test('mouth follows the playback clock, not response arrival or render time', () => {
  const session = speaking(), driver = new LunaPerformance();
  for (let i = 0; i < 12; ++i) driver.sample(session, 100 + i / 60, 1 / 60);
  assert.ok(driver.mouth > .8);
  assert.equal(session.playbackTime, .5);
  session.audioContext.currentTime = 11.5;
  for (let i = 0; i < 30; ++i) driver.sample(session, 200, 1 / 60);
  assert.ok(driver.mouth < .001);
  assert.equal(session.viseme, 'sil');
});

test('stop, suspended output and stale turn cues cannot leave the mouth open', () => {
  for (const interrupt of [s => {s.phase = 'idle';}, s => {s.source = null;},
    s => {s.audioContext.state = 'suspended';}, s => {s.generation++;}]) {
    const session = speaking(), driver = new LunaPerformance();
    driver.sample(session, 0, .05); assert.ok(driver.mouth > 0);
    interrupt(session);
    const frame = driver.sample(session, 1, .05);
    assert.equal(frame.parameters.ParamMouthOpenY, 0);
    assert.equal(frame.parameters.ParamLunaVisemeA, 0);
  }
});

test('blink closes both eyes while reduced motion disables voluntary sway', () => {
  const driver = new LunaPerformance(), session = {generation: 0, phase: 'idle'};
  const frame = driver.sample(session, 4.95, .016, true);
  assert.ok(frame.parameters.ParamEyeLOpen < .001);
  assert.equal(frame.parameters.ParamEyeLOpen, frame.parameters.ParamEyeROpen);
  assert.equal(frame.parameters.ParamAngleX, 0);
  assert.equal(frame.parameters.ParamBreath, 0);
});

test('model and executable runtime URLs stay on the HA origin', () => {
  const base = 'https://ha.example/lovelace/luna';
  assert.equal(localAssetURL('/local/luna/model/luna.model3.json', base), 'https://ha.example/local/luna/model/luna.model3.json');
  for (const url of ['https://evil.example/player.mjs', '//evil.example/player.mjs', 'javascript:alert(1)', 'data:text/javascript,']) {
    assert.throws(() => localAssetURL(url, base));
  }
});
