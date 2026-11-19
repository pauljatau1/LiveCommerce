import test from 'node:test';import assert from 'node:assert/strict';
import {startCheckedShow} from './goLiveStart.js';
const liveShow={_id:'A',title:'Friday dresses'};
const fixture=()=>({liveConflict:async()=>({liveShow:null}),hostStatus:async()=>({canHost:false,currentSessionId:null}),claimHost:async()=>({sessionId:'secret'}),startShow:async()=>({})});
test('preflight conflict never starts or claims the planned show',async()=>{
 const api=fixture();api.liveConflict=async()=>({liveShow});api.claimHost=()=>assert.fail('claimed');api.startShow=()=>assert.fail('started');
 assert.deepEqual(await startCheckedShow({id:'B',api,remember(){}}),{conflict:liveShow});
});
test('a raced 409 becomes the same conflict result; success starts before navigation',async()=>{
 const api=fixture(),order=[];api.startShow=async()=>{throw {response:{status:409,data:{code:'already_live',liveShow}}};};
 assert.deepEqual(await startCheckedShow({id:'B',api,remember:()=>order.push('claim')}),{conflict:liveShow});
 api.startShow=async()=>order.push('start');assert.deepEqual(await startCheckedShow({id:'B',api,remember:()=>order.push('claim')}),{started:true});assert.deepEqual(order,['claim','claim','start']);
});
