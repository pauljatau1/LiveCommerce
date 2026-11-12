import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesArea,areaGroups,pickerAreas} from './areaPicker.js';
const areas=[{name:'Victoria Island',lga:'Eti-Osa',aliases:['VI','V.I.'],group:'Island',popularRank:2},{name:'Lekki',lga:'Eti-Osa',group:'Island',popularRank:0},{name:'Yaba',lga:'Lagos Mainland',group:'Mainland',popularRank:4}];
test('area search matches area and LGA, ignoring case, spaces and punctuation',()=>{
 for(const q of ['vi','v.i','V I','victoria island','Vic toria'])assert(matchesArea(areas[0],q));
 assert.equal(areas.filter(area=>matchesArea(area,'eti osa')).length,2);assert.equal(areas.filter(area=>matchesArea(area,'LAGOSMAINLAND'))[0].name,'Yaba');assert(!matchesArea(areas[0],'Ikeja'));
});
test('popular areas retain server ranking; all areas stay grouped and search has no duplicates',()=>{
 const groups=areaGroups(areas);assert.deepEqual(groups.map(g=>g.label),['Popular','Island','Mainland']);assert.deepEqual(groups[0].areas.map(a=>a.name),['Lekki','Victoria Island','Yaba']);assert.deepEqual(areaGroups(areas,'v.i')[0].areas.map(a=>a.name),['Victoria Island']);
});
test('picker uses the server directory, with old API compatibility',()=>{
 assert.deepEqual(pickerAreas({areaOptions:{Lagos:areas}},'Lagos'),areas);assert.equal(pickerAreas({areas:{Lagos:{'Lagos Mainland':['Yaba']}}},'Lagos')[1].name,'Yaba');assert.deepEqual(pickerAreas({},'Unknown'),[]);
});
