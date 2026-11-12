import test from 'node:test';
import assert from 'node:assert/strict';
import {studioBackPlan} from './useStudioBack.js';
test('studio returns through history instead of pushing the destination again',()=>{assert.deepEqual(studioBackPlan({index:1,pathname:'/studio/bank',state:{back:'/studio/money'}}),{delta:-1});});
test('direct and redirected entries replace with a safe default',()=>{assert.deepEqual(studioBackPlan({index:0,pathname:'/studio/bank',fallback:'/studio/me'}),{to:'/studio/me',replace:true});assert.deepEqual(studioBackPlan({index:2,pathname:'/studio/bank',state:{studioRedirect:true,back:'/studio/money'}}),{to:'/studio/money',replace:true});for(const back of ['https://example.test','//example.test','/studio/bank?again'])assert.deepEqual(studioBackPlan({pathname:'/studio/bank',state:{back}}),{to:'/studio',replace:true});});
