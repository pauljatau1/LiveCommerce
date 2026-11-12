import test from 'node:test';
import assert from 'node:assert/strict';
import {mapPlace,allowedPlace,locationBias,loadGoogleMaps,PLACE_FIELDS} from './googlePlaces.js';
const part=(type,longText,shortText)=>({types:[type],longText,shortText});
for(const [city,lga] of [['Lekki','Eti-Osa'],['Yaba','Lagos Mainland'],['Surulere','Surulere']])test(`Maps ${city} street, area, LGA and coordinates`,()=>{
 const address=mapPlace({formattedAddress:`12 Test Road, ${city}, Lagos`,addressComponents:[part('street_number','12'),part('route','Test Road'),part('sublocality_level_1',city),part('administrative_area_level_2',lga+' Local Government Area'),part('administrative_area_level_1','Lagos State'),part('country','Nigeria','NG')],location:{lat:()=>6.5,lng:()=>3.4}});
 assert.deepEqual(address,{addressLine1:'12 Test Road',city,lga,state:'Lagos',country:'NG',latitude:6.5,longitude:3.4,formattedAddress:`12 Test Road, ${city}, Lagos`,addressSource:'google'});
});
test('Geocoder response maps the same fields and preserves zero coordinates',()=>{
 const a=mapPlace({formatted_address:'1 Road, Yaba',address_components:[{types:['neighborhood'],long_name:'Yaba'},{types:['country'],short_name:'NG'}],geometry:{location:{lat:0,lng:0}}});assert.equal(a.latitude,0);assert.equal(a.city,'Yaba');assert.equal(a.country,'NG');
});
test('outside service area and future configured state',()=>{assert.equal(allowedPlace({states:['Lagos']},'Abuja'),false);assert.equal(allowedPlace({states:['Lagos','Ogun']},' ogun State '),true);});
test('bounds come from server and requested fields are minimal',()=>{assert.deepEqual(locationBias({states:['Lagos'],bounds:{Lagos:{north:7,south:6,east:4,west:2}}}),{north:7,south:6,east:4,west:2});assert.deepEqual(PLACE_FIELDS,['formattedAddress','addressComponents','location']);});
test('missing key falls back without inserting a script',async()=>{await assert.rejects(loadGoogleMaps(''),/not set up/);});
