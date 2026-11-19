import test from 'node:test';import assert from 'node:assert/strict';
import {generatedShowTitle,wordPrefix} from './showTitle.js';
test('long generated titles keep complete words and the count within 80 characters',()=>{
 const items=[{name:'Nike SB Dunk Low Sneakers with an exceptionally long embroidered finish'},{name:'Nike Dunk Low Style Black and White Sneakers'}, {name:'Adire Gown'}, {name:'Senator Set'}];
 const title=generatedShowTitle(items);assert(title.length<=80);assert(title.endsWith(' + 3 more'));
 const shortened=title.replace('Live auction: ','').replace(' + 3 more','');assert(items[0].name.startsWith(shortened));assert([' ',undefined].includes(items[0].name[shortened.length]));
 assert.equal(generatedShowTitle([{name:'Adire Bubu'},{name:'Ankara Set'}]),'Live auction: Adire Bubu & Ankara Set');
 assert.equal(wordPrefix('Black and white sneakers',12),'Black and');
 assert(generatedShowTitle([{name:'x'.repeat(200)}]).length<=80);
});
