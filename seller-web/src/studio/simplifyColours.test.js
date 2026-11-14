import test from 'node:test';
import assert from 'node:assert/strict';
import {COLOURS,coloursEnabled} from './features.js';
import {editorForm,productPayload,missingFields} from './productEditor.js';
import {soldCountLabel} from './colourLots.js';
test('colours default off; explicit opt-in retains rollback',()=>{assert.equal(COLOURS,false);for(const v of [undefined,'','false','0'])assert.equal(coloursEnabled({VITE_COLOURS:v}),false);assert.equal(coloursEnabled({VITE_COLOURS:'true'}),true);});
for(const fromDraft of [false,true])test(`plain stock and no colour payload from ${fromDraft?'AI draft':'saved product'}`,()=>{
 const p={fromDraft,name:'Adire Two-Piece – Indigo',stock:7,price:10000,images:[{url:'photo'}],category:'Women',condition:'New with tags',colourVariants:['Blue'],colourQuantities:[{colour:'Blue',quantity:2}]};const f=editorForm(p);assert.deepEqual(f.colours,[]);assert.equal(f.stock,7);f.stock=9;f.colours=[{value:'Invalid',stock:0}];const payload=productPayload(f,p);assert.equal(payload.stock,9);for(const k of ['colourVariants','colourQuantities','variants'])assert.equal(Object.hasOwn(payload,k),false);assert.equal(missingFields(f).some(p=>p.key==='colours'),false);assert.equal(payload.name,p.name);
});
test('recap counts items with singular and plural',()=>{assert.equal(`${1} ${soldCountLabel(1)}`,'1 ITEM SOLD');assert.equal(`${2} ${soldCountLabel(2)}`,'2 ITEMS SOLD');});
