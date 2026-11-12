import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as buyer from '../src/phone.js';
import * as seller from '../../seller-web/src/studio/phone.js';
const server=createRequire(import.meta.url)('../../server/src/utils/phone.js');
test('buyer, studio and server use the same local phone rule and wording',()=>{
 for(const phone of ['08031234567','0803 123 4567','01012345678','','8031234567','+2348031234567','080312345678','abc08031234567','0803-123-4567']){
  for(const other of [seller,server]){assert.equal(buyer.phoneProblem(phone),other.phoneProblem(phone));assert.equal(buyer.phoneDigits(phone),other.phoneDigits(phone));assert.equal(buyer.PHONE_HINT,other.PHONE_HINT);assert.equal(buyer.PHONE_ERROR,other.PHONE_ERROR);}
 }
 assert.equal(buyer.phoneProblem('0803 123 4567'),'');
 for(const phone of ['8031234567','+2348031234567','0803123456','abcdefghijk'])assert.equal(buyer.phoneProblem(phone),buyer.PHONE_ERROR);
});
