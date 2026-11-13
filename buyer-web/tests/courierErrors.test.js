import test from 'node:test';
import assert from 'node:assert/strict';
import {courierPhoneError,courierAddressError} from '../src/courierErrors.js';
test('courier phone state explains the entered length and accepts the local format',()=>{
 assert.equal(courierPhoneError('0803 123 4567'),'');
 assert.equal(courierPhoneError('0803123456'),"That's 10 digits. Enter all 11, starting with 0, e.g. 0803 123 4567.");
 assert.match(courierPhoneError('18031234567'),/starting with 0/);
});
test('address-not-found copy names the area without mislabelling phone/name/provider failures',()=>{
 assert.equal(courierAddressError("Shipbubble couldn't find that address",'Ajah'),"The courier couldn't find this address in Ajah. Check the street name, or add your estate or a landmark.");
 for(const message of ['Check the phone number','Add your full name for the courier',"Couldn't price delivery right now."])assert.equal(courierAddressError(message,'Ajah'),'');
});
