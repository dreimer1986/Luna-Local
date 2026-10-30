import test from 'node:test';
import assert from 'node:assert/strict';
import {PopupTiming} from '../custom_components/luna_local/frontend/auto-popup.mjs';
test('speech opens, end has three seconds grace, following answer extends it',()=>{
 const p=new PopupTiming();
 assert.equal(p.update([],0),false);
 assert.equal(p.update(['room:a'],100),true);
 assert.equal(p.update([],3099),true);
 assert.equal(p.update([],3100),false);
 assert.equal(p.update(['room:b'],3200),true);
 assert.equal(p.update(['room:b'],5000),true);
 assert.equal(p.update([],7999),true);
 assert.equal(p.update([],8000),false);
});
test('manual dismissal suppresses same answer but allows next and overlapping rooms',()=>{
 const p=new PopupTiming();p.update(['a'],0);p.dismiss(['a']);
 assert.equal(p.update(['a'],100),false);
 assert.equal(p.update(['a','b'],200),true);
 p.dismiss(['a','b']);assert.equal(p.update([],300),false);
 assert.equal(p.update(['c'],400),true);
});
