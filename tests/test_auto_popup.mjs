import test from 'node:test';
import assert from 'node:assert/strict';
import {PopupTiming,hasVisibleAvatar} from '../custom_components/luna_local/frontend/auto-popup.mjs';
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


test('visible cards and fullscreen suppress popup, hidden/offscreen/launcher do not',()=>{
 const env={innerWidth:1200,innerHeight:900};
 let visible=true,rect={width:400,height:700,top:0,left:0,bottom:700,right:400};
 const card={isConnected:true,config:{},panel:{checkVisibility:()=>visible,getBoundingClientRect:()=>rect}};
 assert.equal(hasVisibleAvatar(card,env),true);
 visible=false;assert.equal(hasVisibleAvatar(card,env),false);
 visible=true;rect={...rect,top:1000,bottom:1700};assert.equal(hasVisibleAvatar(card,env),false);
 rect={width:1200,height:900,top:0,left:0,bottom:900,right:1200};
 assert.equal(hasVisibleAvatar(card,env),true); // Interactive full-page, no display_only.
 card.popupOnly=true;assert.equal(hasVisibleAvatar(card,env),false);
 card.dialog={open:true};assert.equal(hasVisibleAvatar(card,env),true);
 card.config.auto_popup_instance=true;assert.equal(hasVisibleAvatar(card,env),false);
});
