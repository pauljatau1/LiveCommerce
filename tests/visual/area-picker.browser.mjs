import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const directory=require('../../server/src/services/serviceArea').serviceAreaConfig();
// Real address and service-area components, mocked APIs and invented contacts.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const buyerUrl=process.env.BUYER_TEST_URL||'http://127.0.0.1:5175',sellerUrl=process.env.SELLER_TEST_URL||'http://127.0.0.1:5174';
const areas=JSON.parse(await readFile('server/src/data/lagosAreas.json','utf8'));
const baselineFile='buyer-web/src/components/AreaPickerBefore.jsx';
await writeFile(baselineFile,execFileSync('git',['show','364c741d:buyer-web/src/components/AddressSheet.jsx']));
const out='docs/screenshots/area-picker';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const fonts=await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(`tests/visual/fonts/${name.toLowerCase()}.woff2`)).toString('base64')}`]));
const me={hasFilledAddress:false,hasFilledBusinessAddress:false,accountType:'individual',_id:'seller',firstName:'Sade',storeName:'Sade’s Studio',sellerAddress:{state:'Ogun',city:'Ota',addressLine1:'1 Test Road'},phoneNumber:'08031234567'};
const calls=[],results={};
async function capture(kind,name,{states=['Lagos'],action,existingAddress=false,width=390}={}){
 const seller=kind.startsWith('seller'),base=seller?sellerUrl:buyerUrl;
 const source=await(await fetch(base+(seller?'/src/studio/Start.jsx':'/src/components/AddressSheet.jsx'))).text();
 const react=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1],router=source.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)?.[1];
 const p=await browser.newPage({viewport:{width,height:844},isMobile:width<700,hasTouch:width<700});const errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message)});
 const config={...directory,states};
 const component=kind==='outside'?`h(Outside,{config:${JSON.stringify(config)},state:'Abuja',streamId:'show',onClose(){},onAddress(){window.__address=true}})`:kind==='quote'?`h(OneStep,{action:{kind:'bid',amount:11000},streamId:'show',productId:'product',onClose(){},onReady(){}})`:kind==='seller-policy' ? `h(DashboardRoute,null,h('h1',null,'Planning and listing available'))` : kind==='seller-home'?'h(Home)':kind==='seller-live'?'h(GoLive)':kind==='seller-pickup'?'h(Start)':'h(Address,{onClose(){}})';
 const entry=`import React from '${react}';import ReactDOM from'${react.replace('react.js','react-dom_client.js')}';${seller?`import{BrowserRouter}from'${router}';import DashboardRoute from'/src/Components/protectionRoutes/DashboardRoute.tsx';import Start from'/src/studio/Start.jsx';import Home from'/src/studio/Home.jsx';import GoLive from'/src/studio/GoLive.jsx';import'/src/studio/base.css';`:`import Address from'${kind==='before'?'/src/components/AreaPickerBefore.jsx':'/src/components/AddressSheet.jsx'}';import Outside from'/src/components/ServiceAreaSheet.jsx';import OneStep from'/src/components/OneStepSheet.jsx';import'/src/styles.css';`}const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(${seller?`h(BrowserRouter,null,h('div',{className:'studio-app'},${component}))`:`h('div',null,${component})`});`;
 await p.route('**/*',async r=>{const u=new URL(r.request().url()),path=u.pathname;
  if(path==='/src/main.jsx')return r.fulfill({contentType:'application/javascript',body:entry});
  if(path.startsWith('/src/auth.jsx'))return r.fulfill({contentType:'application/javascript',body:`export const useAuth=()=>({buyer:{firstName:'Ada',email:'ada@example.test',phoneNumber:'08031234567',shippingAddresses:${JSON.stringify(existingAddress ? [{_id:'work',addressType:'work',state:'Abuja',isActive:false},{_id:'home',addressType:'home',state:'Abuja',isActive:true}] : [])}},wallet:{availableBalance:50000},signedIn:true,refresh:async()=>{}})`});
  if(path.startsWith('/src/Hooks/useNotification'))return r.fulfill({contentType:'application/javascript',body:'export const useNotification=()=>({showNotification(){}})'});
  if(path.startsWith('/src/Hooks/useAuthContextV2'))return r.fulfill({contentType:'application/javascript',body:`export const useAuthContext=()=>({seller:${JSON.stringify(me)},dispatch(){}})`});
  if(path.startsWith('/src/Hooks/useIntercomVisibility'))return r.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{}'});
  if(path.includes('/api/')){
   calls.push({path,method:r.request().method(),body:r.request().postDataJSON()});let json={};
   if(path.endsWith('/watch/config'))json={serviceArea:config};
   else if(path.endsWith('/waitlist'))json={success:true};
   else if(path.endsWith('/delivery-quote'))json={success:true,available:true,amount:r.request().postDataJSON().address?.city === 'Yaba'?3150:2450,area:r.request().postDataJSON().address?.city+', Lagos',courierName:'Test Courier'};
   else if(path.endsWith('/orders/states'))json={data:[{name:'Ogun',isoCode:'OG'}]};
   else if(path.endsWith('/orders/cities/OG'))json={data:[{name:'Ota'},{name:'Abeokuta'}]};
   else if(path.endsWith('/studio/onboarding'))json={store:{done:true,storeName:me.storeName,categories:['Women']},pickup:{done:true,...me.sellerAddress,phone:me.phoneNumber},bank:{done:true}};
   else if(path.endsWith('/studio/home'))json={productCount:0,readyForShow:0,toShip:0,nextShow:null,lastShow:null,recent:[],money:{ready:0,pending:0}};
   return r.fulfill({json});
  }
  if(u.origin!==base)return r.fulfill({body:''});return r.continue();
 });
 await p.goto(base+(kind==='seller-policy' ? '/studio/'+name : kind==='seller-pickup'?'/studio/start?step=pickup':'/'));
 if(kind==='seller-policy'){await p.getByText('Planning and listing available',{exact:true}).waitFor();await p.waitForTimeout(200);assert.equal(new URL(p.url()).pathname,'/studio/'+name);console.log('PASS outside-area seller can access',name);await p.close();return;}
 if(kind==='outside')await p.getByText('Delivery is Lagos-only for now',{exact:true}).waitFor();
 else if(kind==='seller-live'||kind==='seller-home')await p.getByText(/We deliver within Lagos for now/).waitFor();
 else await p.getByLabel('State',{exact:true}).waitFor();
 await p.waitForTimeout(150);
 if(action)await action(p);
 await p.evaluate(async fonts=>{for(const [name,url]of fonts){const f=await new FontFace(name,`url(${url})`,{weight:'100 900'}).load();document.fonts.add(f)}},fonts);
 await p.screenshot({path:`${out}/${name}.png`,fullPage:false});assert.deepEqual(errors,[],name);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`${name}: overflow`);results[name]={path:p.url(),states};console.log('PASS',name);await p.close();
}
async function choose(p,name,lga){await p.locator('#ad-ct, #os-ct, #pk-ct').click();await p.getByLabel('Search area or LGA',{exact:true}).fill(name);await p.getByRole('button',{name:`${name}, ${lga}`,exact:true}).first().click();}
try {
 await capture('before','buyer-before-datalist');
 await capture('address','buyer-closed-field');
 await capture('address','buyer-open-picker',{action:async p=>{
  await p.locator('#ad-ct').click();await p.getByRole('dialog',{name:'Choose your area',exact:true}).waitFor();
  assert.equal(await p.getByRole('heading',{name:'Popular',exact:true}).count(),1);
  assert.equal(await p.evaluate(()=>document.activeElement.className),'ap-close');
  assert.equal(await p.getByRole('heading',{name:'Island',exact:true}).count(),1);assert.equal(await p.getByRole('heading',{name:'Mainland',exact:true}).count(),1);
  assert.equal(await p.locator('input[list]').count(),0);
 }});
 await capture('address','buyer-search-results',{action:async p=>{
  await p.locator('#ad-ct').click();await p.getByLabel('Search area or LGA',{exact:true}).fill('v.i');
  await p.getByRole('button',{name:'Victoria Island, Eti-Osa',exact:true}).waitFor();
  assert((await p.locator('.ap-option').count()) >= 1);
 }});
 await capture('address','buyer-chosen-area',{action:async p=>{
  await choose(p,'Victoria Island','Eti-Osa');assert.equal(await p.getByRole('dialog',{name:'Choose your area',exact:true}).count(),0);
  assert.equal(await p.locator('#ad-ct').innerText(),'Victoria Island\n⌄');
  await p.getByLabel('Street address').fill('12 Test Street');await p.getByLabel('Landmark',{exact:false}).fill('Near the gate');
  const response=p.waitForResponse(r=>r.url().endsWith('/addresses')&&r.request().method()==='POST');
  await p.getByRole('button',{name:'Save address',exact:true}).click();await response;
  assert(calls.some(c=>c.path.endsWith('/addresses')&&c.body.city==='Victoria Island'&&c.body.lga==='Eti-Osa'));
 }});
 await capture('seller-pickup','seller-pickup-step',{action:async p=>{
  await choose(p,'Yaba','Lagos Mainland');await p.getByLabel('Street address').fill('12 Test Street');
 }});
 await capture('seller-pickup','seller-open-picker',{action:async p=>{await p.locator('#pk-ct').click();await p.getByLabel('Search area or LGA',{exact:true}).fill('eti osa');assert((await p.locator('.ap-option').count())>5);}});
 await capture('quote','area-change-price',{action:async p=>{
  await choose(p,'Lekki','Eti-Osa');await p.getByLabel('Street address').fill('5 Admiralty Way');await p.getByText(/2,450/).first().waitFor();
  await choose(p,'Yaba','Lagos Mainland');await p.getByText(/3,150/).first().waitFor();
  assert(calls.some(c=>c.path.endsWith('/delivery-quote')&&c.body.address.city==='Yaba'&&c.body.address.lga==='Lagos Mainland'));
 }});
 await capture('address','desktop-dialog',{width:1280,action:async p=>{
  await p.locator('#ad-ct').click();const dialog=await p.locator('.ap-dialog').boundingBox();assert(Math.abs(dialog.x+dialog.width/2-640)<2);assert(dialog.y>20);
  await p.keyboard.press('Escape');assert.equal(await p.locator('.ap-dialog').count(),0);assert.equal(await p.getByRole('dialog',{name:'Where should we deliver?',exact:true}).count(),1);
  await p.locator('#ad-ct').click();
 }});
 await writeFile(`${out}/checks.json`,JSON.stringify({results,calls},null,2));
 console.log('PASS picker selection, aliases, server options, save payload, quote refresh, desktop and nested Escape');
} finally {await browser.close();await rm(baselineFile,{force:true});}
