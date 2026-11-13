import test from 'node:test';import assert from 'node:assert/strict';
import {COLOURS,coloursEnabled} from '../src/features.js';import {resolveWalletIntent} from '../src/walletIntents.js';
test('default off buys the plain item after top-up, ignoring old chosen-colour stock',()=>{
 assert.equal(COLOURS,false);assert.equal(coloursEnabled({VITE_COLOURS:'true'}),true);
 const item={product:{productId:'p',name:'Adire – Indigo',price:1000,quantity:3,colourQuantities:[{colour:'Blue',quantity:0}]},isVisible:true,run:1};const intent={kind:'buy',buyerId:'b',productId:'p',quantity:2,amount:2000,run:1,item:{product:{chosenColour:'Blue'}}};const result=resolveWalletIntent(intent,{status:'live',products:[item]},5000,500,'b');assert.equal(result.type,'auto');assert.equal(result.action.item,item);assert.equal(result.action.item.product.chosenColour,undefined);
});
