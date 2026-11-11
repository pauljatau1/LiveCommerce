// Real address and service-area components, mocked APIs and invented contacts.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const buyerUrl=process.env.BUYER_TEST_URL||'http://127.0.0.1:5175',sellerUrl=process.env.SELLER_TEST_URL||'http://127.0.0.1:5174';
const areas=JSON.parse(await readFile('server/src/data/lagosAreas.json','utf8'));
const out='docs/screenshots/lagos-launch';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const fonts=await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(`tests/visual/fonts/${name.toLowerCase()}.woff2`)).toString('base64')}`]));
const me={hasFilledAddress:false,hasFilledBusinessAddress:false,accountType:'individual',_id:'seller',firstName:'Sade',storeName:'Sade’s Studio',sellerAddress:{state:'Ogun',city:'Ota',addressLine1:'1 Test Road'},phoneNumber:'08031234567'};
const calls=[],results={};
async function capture(kind,name,{states=['Lagos'],action,existingAddress=false}={}){
 const seller=kind.startsWith('seller'),base=seller?sellerUrl:buyerUrl;
 const source=await(await fetch(base+(seller?'/src/studio/Start.jsx':'/src/components/AddressSheet.jsx'))).text();
 const react=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1],router=source.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)?.[1];
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message)});
 const config={states,areas:{Lagos:areas}};
 const component=kind==='outside'?`h(Outside,{config:${JSON.stringify(config)},state:'Abuja',streamId:'show',onClose(){},onAddress(){window.__address=true}})`:kind==='quote'?`h(OneStep,{action:{kind:'bid',amount:11000},streamId:'show',productId:'product',onClose(){},onReady(){}})`:kind==='seller-policy' ? `h(DashboardRoute,null,h('h1',null,'Planning and listing available'))` : kind==='seller-home'?'h(Home)':kind==='seller-live'?'h(GoLive)':kind==='seller-pickup'?'h(Start)':'h(Address,{onClose(){}})';
 const entry=`import React from '${react}';import ReactDOM from'${react.replace('react.js','react-dom_client.js')}';${seller?`import{BrowserRouter}from'${router}';import DashboardRoute from'/src/Components/protectionRoutes/DashboardRoute.tsx';import Start from'/src/studio/Start.jsx';import Home from'/src/studio/Home.jsx';import GoLive from'/src/studio/GoLive.jsx';import'/src/studio/base.css';`:`import Address from'/src/components/AddressSheet.jsx';import Outside from'/src/components/ServiceAreaSheet.jsx';import OneStep from'/src/components/OneStepSheet.jsx';import'/src/styles.css';`}const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(${seller?`h(BrowserRouter,null,h('div',{className:'studio-app'},${component}))`:`h('div',null,${component})`});`;
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
   else if(path.endsWith('/delivery-quote'))json={success:true,available:true,amount:2450,area:'Lekki, Lagos',courierName:'Test Courier'};
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
 if(action)await action(p);
 await p.evaluate(async fonts=>{for(const [name,url]of fonts){const f=await new FontFace(name,`url(${url})`,{weight:'100 900'}).load();document.fonts.add(f)}},fonts);
 await p.screenshot({path:`${out}/${name}.png`,fullPage:true});assert.deepEqual(errors,[],name);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`${name}: overflow`);results[name]={path:p.url(),states};console.log('PASS',name);await p.close();
}
try{
 await capture('address','buyer-lagos-address',{action:async p=>{await p.locator('select:disabled').first().waitFor();assert(await p.getByLabel('State',{exact:true}).isDisabled());await p.getByLabel('Area',{exact:true}).fill('Lekki');assert(await p.locator('datalist option[value="Lekki"]').count());}});
 await capture('quote','buyer-delivery-price',{action:async p=>{await p.getByLabel('Area',{exact:true}).fill('Lekki');await p.getByLabel('Street address').fill('5 Admiralty Way');await p.getByText(/2,450/).first().waitFor();}});
 await capture('address','buyer-updated-address',{existingAddress:true,action:async p=>{
  await p.getByLabel('Area',{exact:true}).fill('Yaba');await p.getByLabel('Street address').fill('12 Test Street');
  const activation=p.waitForResponse(r=>r.url().endsWith('/addresses/work/set-active'));
  await p.getByRole('button',{name:'Save address',exact:true}).click();await activation;
  assert(calls.some(c=>c.path.endsWith('/addresses/work')&&c.method==='PUT'&&c.body.addressType==='work'&&c.body.city==='Yaba'));
  assert(calls.some(c=>c.path.endsWith('/addresses/work/set-active')&&c.method==='PATCH'));
  assert(!calls.some(c=>c.path.endsWith('/addresses')&&c.method==='POST'));
 }});
 await capture('outside','buyer-outside-lagos');
 await capture('outside','buyer-waitlist-saved',{action:async p=>{await p.getByRole('button',{name:'Notify me'}).click();await p.getByRole('status').waitFor();assert(calls.some(c=>c.path.endsWith('/waitlist')&&c.body.state==='Abuja'));}});
 await capture('address','buyer-two-states',{states:['Lagos','Ogun'],action:async p=>{await p.getByLabel('State',{exact:true}).selectOption('Ogun');await p.getByLabel('Area',{exact:true}).fill('Ota');assert(!await p.getByLabel('State',{exact:true}).isDisabled());}});
 await capture('seller-pickup','seller-lagos-pickup',{action:async p=>{assert(await p.getByLabel('State',{exact:true}).isDisabled());await p.getByLabel('City / area',{exact:true}).fill('Yaba');}});
 await capture('seller-pickup','seller-two-states',{states:['Lagos','Ogun'],action:async p=>{await p.getByLabel('State',{exact:true}).selectOption('Ogun');await p.getByLabel('City / area',{exact:true}).fill('Ota');}});
 await capture('seller-policy','list');
 await capture('seller-policy','plan');
 await capture('seller-home','seller-home-banner');
 await capture('seller-live','seller-go-live-blocked');
 await writeFile(`${out}/checks.json`,JSON.stringify({results,calls},null,2));
}finally{await browser.close()}
