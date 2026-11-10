import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveRecovery, runState, selectedItem, studioTimers } from './liveRecovery.js';

test('a winner or a zero timer never makes an unsettled auction runnable', () => {
 assert.equal(runState({bidStatus:'ongoing',winner:{amount:1000},stock:31},0).canRunAgain,false);
 assert.deepEqual(runState({bidStatus:'active',stock:31},0),{running:true,settling:true,canRunAgain:false});
 assert.equal(runState({bidStatus:'ended',stock:31,canRunAgain:true},0).canRunAgain,true);
});
test('foreground selection follows the latest active/visible item', () => {
 const items=[{productId:'old',bidStatus:'ended'},{productId:'new',bidStatus:'active'}];
 assert.equal(selectedItem(items,'old'),'new');
 assert.equal(selectedItem([{productId:'new',isVisible:true},{productId:'old'}],'old'),'new');
});
test('countdowns restore from server deadlines, not missed socket ticks', () => {
 assert.deepEqual(studioTimers([{productId:'a',bidStatus:'active',auctionEndsAt:'2026-11-10T12:00:20Z'}],Date.parse('2026-11-10T12:00:00Z')),{a:20});
});
test('newer socket changes invalidate an in-flight scene and coalesce refreshes', async () => {
 let resolve;const first=new Promise(r=>resolve=r);let calls=0;const applied=[];
 const r=createLiveRecovery({load:()=>++calls===1?first:Promise.resolve('latest'),apply:s=>applied.push(s),status(){}});
 const pending=r.refresh();r.invalidate();r.refresh();resolve('stale');
 assert.equal(await pending,'latest');assert.deepEqual(applied,['latest']);assert.equal(calls,2);
});
test('a disposed studio cannot apply a late snapshot', async () => {
 let resolve;const pending=new Promise(r=>resolve=r);const applied=[];
 const r=createLiveRecovery({load:()=>pending,apply:s=>applied.push(s),status(){}});
 const done=r.refresh();r.dispose();resolve('old');await done;assert.deepEqual(applied,[]);
});
