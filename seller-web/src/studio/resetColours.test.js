import test from 'node:test';import assert from 'node:assert/strict';
import {editorForm,productPayload,coloursTotal} from './productEditor.js';
for(const fromDraft of [true,false])test(`editable listing colours: ${fromDraft?'AI draft':'saved product'}`,()=>{
 const p={fromDraft,name:'Adire bubu',price:10000,stock:5,images:[],colourVariants:['Blue and white','Purple'],colourQuantities:[{colour:'Blue and white',quantity:3},{colour:'Purple',quantity:2}]};
 const f=editorForm(p);assert.equal(f.colours.length,2);assert.equal(coloursTotal(f.colours),5);
 f.colours[0].stock=7;f.colours.splice(1,1);f.colours.push({value:'Indigo',stock:4,images:[],ref:null});
 const saved=productPayload(f,p);assert.equal(saved.stock,11);assert.deepEqual(saved.colourVariants,['Blue and white','Indigo']);assert.deepEqual(saved.colourQuantities,[{colour:'Blue and white',quantity:7},{colour:'Indigo',quantity:4}]);
});
