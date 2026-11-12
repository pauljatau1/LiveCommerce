// Invented contacts and mocked Maps/API responses; no billable Places requests.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),config=require('../../server/src/services/serviceArea').serviceAreaConfig();
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const out='docs/screenshots/maps-address-profile';await mkdir(out,{recursive:true});
const calls=[],checks=[];
async function fixture(kind,{fallback=false,failMaps=false}={}){
 const seller=kind==='pickup',base=`http://127.0.0.1:${seller?5174:5175}`;
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const component=(type,longText,shortText)=>({types:[type],longText,shortText});
  const place=(outside=false)=>({formattedAddress:outside?'12 Test Road, Abuja, Nigeria':'12 Admiralty Way, Lekki, Lagos, Nigeria',addressComponents:[component('street_number','12'),component('route',outside?'Test Road':'Admiralty Way'),component('sublocality_level_1',outside?'Wuse':'Lekki'),component('administrative_area_level_2',outside?'Abuja Municipal':'Eti-Osa'),component('administrative_area_level_1',outside?'Federal Capital Territory':'Lagos State'),component('country','Nigeria','NG')],location:{lat:()=>6.45,lng:()=>3.47},async fetchFields(body){window.__fields=body.fields;}});
  let tokenId=0;class AutocompleteSessionToken{constructor(){this.id=++tokenId;}}
  window.google={maps:{async importLibrary(name){if(name==='places')return {AutocompleteSessionToken,AutocompleteSuggestion:{async fetchAutocompleteSuggestions(body){(window.__searches||=[]).push(body);return {suggestions:[{placePrediction:{placeId:'demo',text:{toString:()=>body.input.toLowerCase().includes('abuja')?'12 Test Road, Wuse, Abuja':'12 Admiralty Way, Lekki, Lagos'},toPlace:()=>place(body.input.toLowerCase().includes('abuja'))}}]};}}};return {Geocoder:class{async geocode(){return {results:[place()]};}}};}}};
  Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success,failure){if(window.__denyLocation)return failure({code:1});success({coords:{latitude:6.45,longitude:3.47}});}}});
 });
 const source=await(await fetch(base+(seller?'/src/studio/PickupAddress.jsx':'/src/pages/Me.jsx'))).text();const react=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1];
 const routerSource=await(await fetch(base+(seller?'/src/studio/Start.jsx':'/src/main.jsx'))).text();const router=routerSource.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
 const profile=kind==='guest'?null:{_id:'buyer',firstName:'Ada',lastName:'Test',username:'ada_lagos',email:'ada@example.test',phoneNumber:kind==='dva'?'':'08031234567',shippingAddresses:kind==='quote'?[]:[{_id:'home',isActive:true,state:'Lagos',city:'Yaba',addressLine1:'5 Test Road',phoneNumber:'08031234567'}]};
 const h='React.createElement';const component=kind==='pickup'?`${h}(Pickup)`:kind==='profile'?`${h}(Me)`:kind==='dva'?`${h}(Topups,{methods:{dva:true},amount:15000,need:15000,onMethod(){}})`:kind==='quote'?`${h}(OneStep,{action:{kind:'bid',amount:11000},streamId:'show',productId:'product',onClose(){},onReady(){}})`:`${h}(Address,{onClose(){}})`;
 const entry=`import React from '${react}';import ReactDOM from '${react.replace('react.js','react-dom_client.js')}';import{BrowserRouter}from'${router}';${seller?"import Pickup from '/src/studio/PickupAddress.jsx';import '/src/studio/base.css';":"import Address from '/src/components/AddressSheet.jsx';import Me from '/src/pages/Me.jsx';import Topups from '/src/components/StayOnStreamTopUps.jsx';import OneStep from '/src/components/OneStepSheet.jsx';import '/src/styles.css';"}ReactDOM.createRoot(document.getElementById('root')).render(${h}(BrowserRouter,null,${h}('div',{className:'${seller?'studio-app':'app'}'},${component})));`;
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),path=url.pathname,method=route.request().method();
  if(path==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:entry});
  if(path.endsWith('/GoogleAddress.jsx')&&!fallback){const response=await route.fetch();const body=(await response.text()).replace('import.meta.env.VITE_GOOGLE_MAPS_KEY','"mock-key"');return route.fulfill({response,body});}
  if(path.endsWith('/googlePlaces.js')&&failMaps){const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('export function loadGoogleMaps(key) {','export function loadGoogleMaps(key) { return Promise.reject(new Error("Mock network failure"));')});}
  if(path.startsWith('/src/auth.jsx'))return route.fulfill({contentType:'application/javascript',body:`export const useAuth=()=>({buyer:${JSON.stringify(profile)},wallet:{availableBalance:50000},signedIn:${Boolean(profile)},loading:false,refresh:async()=>{},signIn:async()=>{},signOut(){}});`});
  if(path.startsWith('/src/Hooks/useAuthContextV2'))return route.fulfill({contentType:'application/javascript',body:"export const useAuthContext=()=>({seller:{firstName:'Sade'},dispatch(){}});"});
  if(path.includes('/api/')){calls.push({path,method,body:route.request().postDataJSON()});let json={success:true};
   if(path.endsWith('/watch/config'))json={serviceArea:config};
   else if(path.endsWith('/studio/onboarding'))json={pickup:{done:true,state:'Lagos',city:'Lekki',addressLine1:'12 Admiralty Way',phone:'08031234567'}};
   else if(path.endsWith('/onboarding/pickup'))json={pickup:{...route.request().postDataJSON(),done:true}};
   else if(path.endsWith('/delivery-quote'))json={available:true,amount:2450,area:'Lekki, Lagos'};
   else if(path.endsWith('/dva'))json=method==='POST'?{status:'pending'}:{status:'none'};
   return route.fulfill({json});
  }
  if(url.origin!==base)return route.fulfill({body:''});return route.continue();
 });
 await page.goto(base+(seller?'/studio/pickup':kind==='profile'?'/me':'/'));
 const shot=async name=>{await page.evaluate(async fonts=>{for(const [name,data]of fonts){const font=await new FontFace(name,`url(${data})`,{weight:'100 900'}).load();document.fonts.add(font)}},await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(`tests/visual/fonts/${name.toLowerCase()}.woff2`)).toString('base64')}`])));await page.screenshot({path:`${out}/${name}.png`,fullPage:kind==='profile'});assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),name+' horizontal overflow');assert.deepEqual(errors,[]);checks.push(name);};
 return {page,shot,errors};
}
try{
 let f=await fixture('address');await f.page.getByRole('combobox',{name:'Start typing your street or building'}).fill('12 Admiralty');await f.page.getByRole('option').waitFor();await f.shot('typing-address');await f.page.getByRole('option').click();await f.page.getByRole('button',{name:'Change',exact:true}).waitFor();await f.shot('picked-address');assert.deepEqual(await f.page.evaluate(()=>window.__fields),['formattedAddress','addressComponents','location']);assert.equal(await f.page.evaluate(()=>window.__searches[0].includedRegionCodes[0]),'ng');assert(await f.page.evaluate(()=>window.__searches[0].sessionToken.id));assert(await f.page.evaluate(()=>window.__searches[0].locationBias.north>6));
 await f.page.getByRole('button',{name:'Save address',exact:true}).click();await f.page.waitForTimeout(200);assert(calls.some(c=>c.path.includes('/addresses')&&c.body.latitude===6.45&&c.body.longitude===3.47));
 await f.page.getByRole('button',{name:'Change',exact:true}).click();await f.page.getByRole('combobox').fill('Abuja');await f.page.getByRole('option').click();await f.page.getByText(/Delivery is Lagos-only/).waitFor();assert(await f.page.evaluate(()=>window.__searches.at(-1).sessionToken.id!==window.__searches[0].sessionToken.id));await f.shot('out-of-area');await f.page.getByRole('button',{name:'Notify me',exact:true}).click();await f.page.getByText(/We’ll tell you/).waitFor();await f.page.close();
 f=await fixture('address');await f.page.getByRole('button',{name:'Use my current location'}).click();await f.page.getByText('Address found from your current location.').waitFor();await f.shot('current-location');await f.page.evaluate(()=>window.__denyLocation=true);await f.page.getByRole('button',{name:'Use my current location'}).click();await f.page.getByText(/Location permission was denied/).waitFor();await f.page.close();
 f=await fixture('address',{fallback:true});await f.page.locator('#ad-ct').click();await f.page.getByRole('dialog',{name:'Choose your area',exact:true}).waitFor();await f.shot('fallback-picker');await f.page.close();
 f=await fixture('address',{failMaps:true});await f.page.getByText(/Address search couldn’t load/).waitFor();await f.page.locator('#ad-ct').waitFor();await f.page.close();
 f=await fixture('pickup');await f.page.getByRole('button',{name:'Change',exact:true}).waitFor();await f.shot('seller-pickup-edit');await f.page.getByRole('button',{name:'Use my current location'}).click();await f.page.getByRole('button',{name:'Save pickup address'}).click();await f.page.waitForURL('**/studio/me');assert(calls.some(c=>c.path.endsWith('/onboarding/pickup')&&c.body.latitude===6.45));await f.page.close();
 f=await fixture('profile');await f.page.getByRole('heading',{name:'Your details'}).waitFor();await f.shot('buyer-profile');await f.page.getByRole('button',{name:'Add address',exact:true}).click();await f.page.getByRole('button',{name:'Use my current location'}).click();await f.page.getByRole('button',{name:'Save address',exact:true}).click();await f.page.getByText('Address saved.').waitFor();await f.page.close();
 f=await fixture('dva');await f.page.getByRole('button',{name:/Bank transfer/}).click();await f.page.getByLabel('Phone',{exact:true}).fill('08031234567');await f.page.getByRole('checkbox').check();await f.shot('inline-dva-phone');const assigned=f.page.waitForResponse(r=>r.url().endsWith('/dva')&&r.request().method()==='POST');await f.page.getByRole('button',{name:'Get my account number'}).click();await assigned;await f.page.getByText(/Setting up your account number/).waitFor();const phone=calls.findIndex(c=>c.path.endsWith('/profile/phone'));const dva=calls.findIndex((c,i)=>i>phone&&c.path.endsWith('/dva')&&c.method==='POST');assert(phone>=0&&dva>phone);await f.page.close();
 f=await fixture('guest');await f.page.getByRole('combobox').fill('Abuja');await f.page.getByRole('option').click();await f.page.getByLabel('Email for updates').fill('guest@example.test');await f.page.getByRole('button',{name:'Notify me',exact:true}).click();await f.page.getByText(/We’ll tell you/).waitFor();assert(calls.some(c=>c.path.endsWith('/waitlist')&&c.body.email==='guest@example.test'));await f.page.close();
 f=await fixture('quote');await f.page.getByRole('button',{name:'Use my current location'}).click();await f.page.getByText(/2,450/).first().waitFor();assert(calls.some(c=>c.path.endsWith('/delivery-quote')&&c.body.address.latitude===6.45));await f.page.close();
 await writeFile(`${out}/checks.json`,JSON.stringify({checks,calls},null,2));console.log('PASS',checks.join(', '),'and saves, quote refresh, lazy fallback, permission refusal and inline phone-before-DVA ordering');
}finally{await browser.close();}
