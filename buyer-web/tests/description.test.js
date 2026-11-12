import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {descriptionNodes} from '../src/description.js';
const text=value=>({nodeType:3,textContent:value});
const element=(tag,children,attributes={})=>({nodeType:1,tagName:tag.toUpperCase(),childNodes:children,attributes});
test('description policy keeps basic formatting and drops executable content and attributes',()=>{
 const parsed=[element('p',[text('Soft '),element('strong',[text('cotton')])],{onclick:'evil()'}),element('script',[text('evil()')]),element('svg',[element('script',[text('evil()')])]),element('img',[],{onerror:'evil()'}),element('a',[text('Ask the host')],{href:'javascript:evil()'}),element('ul',[element('li',[text('Made in Lagos')])])];
 const doc={createElement:()=>({content:{childNodes:parsed}})};
 assert.deepEqual(descriptionNodes('HTML parsed by the browser',doc),[{tag:'p',children:[{text:'Soft '},{tag:'strong',children:[{text:'cotton'}]}]},{text:'Ask the host'},{tag:'ul',children:[{tag:'li',children:[{text:'Made in Lagos'}]}]}]);
});
test('without a browser DOM, unparsed HTML can only be a React text node',()=>{
 assert.deepEqual(descriptionNodes('<script>evil()</script>',null),[{text:'<script>evil()</script>'}]);
});
test('both independently deployed apps use the same sanitizer policy',async()=>{
 assert.equal(await readFile(new URL('../src/description.js',import.meta.url),'utf8'),await readFile(new URL('../../seller-web/src/description.js',import.meta.url),'utf8'));
});
