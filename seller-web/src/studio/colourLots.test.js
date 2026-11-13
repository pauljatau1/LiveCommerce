import test from 'node:test';import assert from 'node:assert/strict';
import {colourLots,soldCountLabel} from './colourLots.js';
test('planner expands in-stock colours, using their photo and stock, and retains plain products',()=>{
 const p={_id:'p',name:'Adire',image:'main',stock:3,colourQuantities:[{colour:'Indigo',quantity:2,image:'blue'},{colour:'Rust',quantity:1},{colour:'Cream',quantity:0}]},plain={_id:'jeans',name:'Jeans',stock:1};const lots=colourLots([p,plain]);assert.equal(lots.length,3);assert.equal(lots[0].image,'blue');assert.equal(lots[0].catalogueProductId,'p');assert.equal(lots[1].name,'Adire · Rust');assert.equal(lots[1].stock,1);assert.equal(lots[2],plain);assert.equal(p.name,'Adire');
});
test('sold count uses singular and plural',()=>{assert.equal(soldCountLabel(1),'ITEM SOLD');assert.equal(soldCountLabel(0),'ITEMS SOLD');assert.equal(soldCountLabel(2),'ITEMS SOLD');});
