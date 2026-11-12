import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshSellerSnapshot,setupNext,setupPrefill} from './sellerSnapshot.js';
test('a save replaces auth and storage with the same complete server snapshot',async()=>{
 const fresh={_id:'s',storeName:'Saved store',phoneNumber:'08031234567',hasFilledAddress:true,bankDetails:{accountName:'Sade'}};
 let stored,action;
 const result=await refreshSellerSnapshot(async()=>fresh,v=>{stored=v;},v=>{action=v;});
 assert.equal(result,fresh);assert.equal(stored,fresh);assert.deepEqual(action,{type:'STORE_SELLER',payload:fresh});
});
test('failed reload cannot overwrite auth or storage with a partial local patch',async()=>{
 let changed=false;await assert.rejects(refreshSellerSnapshot(async()=>{throw new Error('offline');},()=>{changed=true;},()=>{changed=true;}));assert.equal(changed,false);
});
test('getting started always continues pickup to bank to finished',()=>{
 assert.equal(setupNext('store'),'pickup');assert.equal(setupNext('pickup'),'bank');assert.equal(setupNext('bank'),'done');
});
test('signup name and courier phone prefill empty setup answers',()=>{
 const server={store:{storeName:'Sade’s Studio'},pickup:{phone:'08031234567'}};
 assert.deepEqual(setupPrefill({storeName:'',phone:''},server),{storeName:'Sade’s Studio',phone:'08031234567'});
 assert.equal(setupPrefill({storeName:'Edited'},server).storeName,'Edited');
});
