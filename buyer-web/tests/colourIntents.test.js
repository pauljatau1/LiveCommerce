import test from 'node:test';import assert from 'node:assert/strict';import {resolveWalletIntent} from '../src/walletIntents.js';
test('a pending top-up retains the chosen colour and its available stock',()=>{
 const item={product:{productId:'lot',name:'Adire · Indigo',colour:'Indigo',price:13000,quantity:2,colourQuantities:[{colour:'Indigo',quantity:2},{colour:'Rust',quantity:1}]},isVisible:true,run:1,minBid:0,bidStatus:'pending'};
 const intent={kind:'buy',buyerId:'b',productId:'lot',quantity:1,run:1,amount:13000,item:{...item,product:{...item.product,chosenColour:'Rust'}}};
 const scene={status:'live',products:[item]};const result=resolveWalletIntent(intent,scene,20000,500,'b');assert.equal(result.type,'auto');assert.equal(result.action.item.product.chosenColour,'Rust');assert.equal(result.action.item.product.name,'Adire · Rust');
 scene.products[0].product.colourQuantities[1].quantity=0;assert.equal(resolveWalletIntent(intent,scene,20000,500,'b').type,'none');
});
