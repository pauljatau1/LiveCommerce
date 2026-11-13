import test from 'node:test';import assert from 'node:assert/strict';
import {hasCourierName,nameForQuote} from '../src/courierName.js';
import {settlementText} from '../src/deliverySettlement.js';
test('courier input needs first and last name, letters only',()=>{assert.equal(hasCourierName({firstName:'Ada',lastName:'Okafor'}),true);for(const data of [{firstName:'Ada'},{firstName:'Ada123',lastName:'Okafor'},{firstName:'Ada',lastName:'@host'}])assert.equal(hasCourierName(data),false);assert.equal(nameForQuote({firstName:'Ada',lastName:'Okafor'}),'Ada Okafor');});
test('wallet settlement wording explains debit, release and pending final price',()=>{assert.match(settlementText({paidAt:'now',adjustment:300}),/₦300 more.*wallet/);assert.match(settlementText({paidAt:'now',adjustment:-500}),/₦500 returned/);assert.equal(settlementText({fee:1200}),'');});

import {deliveryEstimateText} from '../src/deliverySettlement.js';
test('live delivery copy identifies a first-item estimate and final parcel pricing',()=>{assert.equal(deliveryEstimateText(591),'Delivery from ₦591 · one parcel per show, priced when the show ends');});

import {hasFinalDelivery} from '../src/deliverySettlement.js';
test('win sheet distinguishes an unpriced first-item estimate from the final parcel fee',()=>{assert.equal(hasFinalDelivery({status:'collecting',fee:null}),false);assert.equal(hasFinalDelivery({status:'quote_failed',fee:591}),false);assert.equal(hasFinalDelivery({status:'paid',fee:1100}),true);assert.equal(hasFinalDelivery({status:'awaiting_payment',fee:1100}),true);});
