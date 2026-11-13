import test from 'node:test';import assert from 'node:assert/strict';
import {colourRow,missingFields as rawmissingFields,editorForm as raweditorForm,productPayload as rawproductPayload} from './productEditor.js';
const editorForm=(p,t)=>raweditorForm(p,t,true);
const productPayload=(f,p)=>rawproductPayload(f,p,true);
const missingFields=f=>rawmissingFields(f,true);

test('new colour starts at one; empty or zero colour stock is explained beside colours',()=>{assert.equal(colourRow().stock,1);const form=editorForm({name:'Dress',price:5000,stock:3,condition:'New with tags',category:'Women',images:[{url:'dress.jpg'}],weight:1});form.colours=[{...colourRow(),value:'Blue',stock:0}];assert(missingFields(form).some(p=>p.key==='colours'&&p.text==='Add stock for each colour'));form.colours[0].stock=2;assert.equal(productPayload(form).stock,2);});

import {clearOpenAnnouncements,buyerCountLabel} from './liveFeed.js';
test('sold announcements clear only the ended item/run and use a singular buyer label',()=>{const feed=[{key:'open:p1:1'},{key:'open:p1:2'},{kind:'win',text:'won'}];assert.deepEqual(clearOpenAnnouncements(feed,{product:{productId:'p1'},run:1}),feed.slice(1));assert.equal(buyerCountLabel(1),'BUYER');assert.equal(buyerCountLabel(2),'BUYERS');});

import {saveFieldProblems} from './productEditor.js';
test('legacy technical required-fields errors are replaced beside each field',()=>{assert.deepEqual(saveFieldProblems('Missing required fields: description, stock'),[{key:'description',text:'Add a short description.'},{key:'stock',text:'Add how many you have.'}]);assert.equal(saveFieldProblems('Provide a whole stock count for each colour')[0].text,'Add stock for each colour');});
