// Real app components at phone width; API, sockets and Agora are deterministic
// fixtures. No staging account, camera broadcast or payment is created.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SELLER_TEST_URL || 'http://127.0.0.1:5201';
const shop=process.env.BUYER_TEST_URL || 'http://127.0.0.1:5202';
const output='docs/screenshots/live-controls';await mkdir(output,{recursive:true});
const source=await(await fetch(base+'/src/studio/Live.jsx')).text();
const react=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1],router=source.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
const prior=await readFile('seller-web/tests/host-resume.browser.mjs','utf8');
const agora=prior.match(/const agora=`([\s\S]*?)`;\nconst browser=/)[1];
const socket=prior.match(/const socket=`([\s\S]*?)`;/)[1];
const fonts=await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(`tests/visual/fonts/${name.toLowerCase()}.woff2`)).toString('base64')}`]));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const pages=[],errors=[],calls=[],owners=new Map();let serial=0;
const scene={show:{_id:'demo',status:'live',title:'Friday fashion',type:'auction',viewers:214,actualStartTime:new Date(Date.now()-120000).toISOString(),notes:{howToBuy:'Tap Bid to join'}},items:[{productId:'dress',name:'Adire Bubu – Indigo',image:base+'/photo-1.svg',stock:5,minBid:11000,bidStatus:'active',auctionEndsAt:new Date(Date.now()+60000).toISOString(),isVisible:true}],sales:{count:0,amount:0}};
const product={_id:'product',name:'Adire Bubu – Indigo',price:11000,stock:5,category:'Women',condition:'New',description:'An easy everyday gown.',images:[{url:base+'/photo-1.svg',isDefault:true},{url:base+'/photo-2.svg'}],shippingInfo:{weight:{value:0.5,unit:'kg'}}};
async function fixture(path){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Africa/Lagos'});pages.push(page);
 page.on('dialog',dialog=>{errors.push('unexpected native '+dialog.type());dialog.dismiss();});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message)});page.setDefaultTimeout(15000);
 await page.addInitScript(()=>{localStorage.setItem('sellerToken',JSON.stringify({data:'test-only'}));window.__nativeOpens=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{async getUserMedia(){window.__nativeOpens++;const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;const ctx=canvas.getContext('2d');ctx.fillStyle='#25463d';ctx.fillRect(0,0,720,1280);return canvas.captureStream(24)},async enumerateDevices(){return []}}});});
 const entry=`import React from '${react}';import ReactDOM from '${react.replace('react.js','react-dom_client.js')}';import{BrowserRouter,Routes,Route}from '${router}';import Live from '/src/studio/Live.jsx';import{GoLiveCheck}from '/src/studio/GoLive.jsx';import Editor from '/src/studio/ProductEditor.jsx';import Listing from '/src/studio/ListingAgent.jsx';import '/src/studio/base.css';const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h('div',{className:'studio-app'},h(Routes,null,h(Route,{path:'/studio/live/:id',element:h(Live)}),h(Route,{path:'/studio/golive/:showId',element:h(GoLiveCheck)}),h(Route,{path:'/studio/products/:id/edit',element:h(Editor)}),h(Route,{path:'/studio/list',element:h(Listing)}),h(Route,{path:'*',element:h('h1',null,'Studio Home')})))));`;
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,body=request.postDataJSON(),method=request.method();
  if(path==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:entry});
  if(path.includes('socket__io-client.js'))return route.fulfill({contentType:'application/javascript',body:socket});
  if(path.includes('agora-rtc-sdk-ng.js'))return route.fulfill({contentType:'application/javascript',body:agora});
  if(path.startsWith('/src/Constants/Server'))return route.fulfill({contentType:'application/javascript',body:"export const BASE_URL='http://localhost:8000/api',BASE_URL_V2='http://localhost:8000/api/v2';"});
  if(path.startsWith('/src/Hooks/useIntercomVisibility'))return route.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{}'});
  if(path.startsWith('/src/Hooks/useAuthContextV2'))return route.fulfill({contentType:'application/javascript',body:"export const useAuthContext=()=>({seller:{_id:'seller',firstName:'Sade',phoneNumber:'08031234567',warehouseDetails:{address:{addressLine1:'1 Allen Avenue',city:'Ikeja',state:'Lagos'}}},dispatch(){}});"});
  if(path.startsWith('/photo-'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640"><rect width="480" height="640" fill="#10734F"/><path d="M150 100L70 180L130 230L100 550H380L350 230L410 180L330 100Z" fill="#F4EFE8"/></svg>'});
  if(path.startsWith('/api/')){
   calls.push({path,method,body,actor:pages.indexOf(page),headers:request.headers()});let json={success:true};
   const id=path.match(/\/(?:shows|streams)\/([^/]+)/)?.[1],owner=owners.get(id),sid=request.headers()['x-host-session-id'];
   if(path.endsWith('/host-session')){
    if(method==='GET')json={currentSessionId:owner?.revision || null,canHost:Boolean(owner&&sid===owner.sid),live:id==='demo',host:{deviceName:'iPhone',startedAt:owner?.startedAt || '2026-11-18T18:02:00Z'}};
    else{
     if((body.expectedSessionId || null)!==(owner?.revision || null))return route.fulfill({status:409,json:{code:'host_conflict',message:'This show is live on another device.'}});
     const next={sid:`secret-${++serial}`,revision:`revision-${serial}`,page,startedAt:serial===1?'2026-11-18T18:02:00Z':'2026-11-18T18:41:00Z'};owners.set(id,next);
     if(owner&&owner.page!==page&&!owner.page.isClosed())await owner.page.evaluate(()=>window.__socket?.trigger('host_moved',{streamId:'demo'}));
     json={sessionId:next.sid,revision:next.revision,uid:1234};
    }
   }else if(/\/(presence|renew-token|start|activate-product-bidding|end)$/.test(path)){
    if(!owner||owner.sid!==sid)return route.fulfill({status:409,json:{code:'host_conflict',message:'This show is live on another device.'}});
    if(path.endsWith('/start')&&id==='planned')return route.fulfill({status:409,json:{code:'already_live',message:"You're already live with Friday fashion. End it first."}});
    if(path.endsWith('/renew-token'))json={agoraAppId:'test',channelName:'test',token:'test',uid:1234};
   }else if(path.endsWith('/shows/demo'))json=scene;
   else if(path.endsWith('/shows/planned'))json={...scene,show:{...scene.show,_id:'planned',status:'scheduled',title:'Saturday dresses'}};
   else if(path.endsWith('/chat'))json=[];
   else if(path.endsWith('/watch/config'))json={serviceArea:{states:['Lagos'],areas:[]}};
   else if(path.endsWith('/public/categories'))json=[{_id:'women',name:'Women'}];
   else if(path.endsWith('/category-weights'))json={fallback:0.5,categories:{Women:0.5}};
   else if(path.endsWith('/products/product'))json={product};
   return route.fulfill({json});
  }
  if(url.origin!==base)return route.fulfill({body:''});return route.continue();
 });
 await page.goto(base+path);await page.addStyleTag({content:fonts.map(([name,url])=>`@font-face{font-family:'${name}';src:url('${url}') format('woff2');font-weight:100 900;}`).join('')});await page.evaluate(()=>document.fonts.ready);return page;
}
async function buyerConfirm(){
 const src=await(await fetch(shop+'/src/main.jsx')).text(),r=src.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1],router=src.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Africa/Lagos'});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{errors.push('native buyer confirm');d.dismiss();});
 await page.addInitScript(()=>{window.__buyer={_id:'buyer',firstName:'Ada',lastName:'Test',username:'ada',email:'ada@example.test',phoneNumber:'08031234567',shippingAddresses:[{_id:'home',isActive:true,addressLine1:'5 Admiralty Way',city:'Lekki',state:'Lagos'}]};});
 await page.route('**/*',async route=>{const url=new URL(route.request().url()),path=url.pathname;
  if(path==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:`import React from '${r}';import ReactDOM from '${r.replace('react.js','react-dom_client.js')}';import{BrowserRouter}from '${router}';import Me from '/src/pages/Me.jsx';import '/src/styles.css';const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h(Me)));`});
  if(path.startsWith('/src/auth.jsx'))return route.fulfill({contentType:'application/javascript',body:'export const useAuth=()=>({buyer:window.__buyer,wallet:{availableBalance:20000},signedIn:true,loading:false,refresh:async()=>{},signIn:async()=>{},signOut(){}})'});
  if(path.startsWith('/api/'))return route.fulfill({json:{success:true}});
  if(url.origin!==shop)return route.fulfill({body:''});return route.continue();
 });
 await page.goto(shop+'/me');await page.getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('dialog',{name:'Remove this delivery address?',exact:true}).waitFor();await page.getByRole('button',{name:'Keep',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);await page.close();
}
async function shot(page,name){await page.screenshot({path:`${output}/${name}-390.png`});}
try{
 const first=await fixture('/studio/live/demo');await first.getByRole('button',{name:'Camera and microphone',exact:true}).waitFor();await first.waitForFunction(()=>window.__tracks?.video);
 assert.equal(await first.getByRole('button',{name:'Camera and microphone',exact:true}).locator('svg').count(),1);await shot(first,'rail-settings');
 const second=await fixture('/studio/live/demo');await second.getByRole('heading',{name:'Your show is live on another device',exact:true}).waitFor();assert.equal(await second.evaluate(()=>window.__clients || 0),0);assert.equal(await second.evaluate(()=>window.__nativeOpens),0);await second.getByText(/It's streaming from your iPhone/).waitFor();await shot(second,'other-device');
 const shownRevision=owners.get('demo').revision;const readsBefore=calls.filter(c=>c.actor===1&&c.method==='GET'&&c.path.endsWith('/host-session')).length;
 await second.getByRole('button',{name:'Move the show here',exact:true}).click();await second.getByRole('button',{name:'Camera and microphone',exact:true}).waitFor();await second.waitForFunction(()=>window.__tracks?.video);
 assert.equal(calls.filter(c=>c.actor===1&&c.method==='GET'&&c.path.endsWith('/host-session')).length,readsBefore);assert.equal(calls.findLast(c=>c.actor===1&&c.method==='POST'&&c.path.endsWith('/host-session')).body.expectedSessionId,shownRevision);
 await first.getByRole('heading',{name:'You moved your show to another device',exact:true}).waitFor();await first.waitForFunction(()=>window.__tracks.video.getMediaStreamTrack().readyState==='ended'&&window.__client.connectionState==='DISCONNECTED');await first.getByText(/Running on your iPhone/).waitFor();await shot(first,'moved-device');
 await first.getByRole('button',{name:'Move it back here',exact:true}).click();await first.getByRole('button',{name:'Camera and microphone',exact:true}).waitFor();await second.getByRole('heading',{name:'You moved your show to another device',exact:true}).waitFor();
 // Version update shows a note and never interferes with the live controls.
 await first.evaluate(()=>window.dispatchEvent(new CustomEvent('app:update-ready')));await first.getByText('Update ready · Refresh after the show',{exact:true}).first().waitFor();
 const refused=await fixture('/studio/live/planned');await refused.getByText("You're already live with Friday fashion. End it first.",{exact:true}).waitFor();assert.equal(await refused.getByRole('heading',{name:'You moved your show to another device',exact:true}).count(),0);assert.equal(await refused.evaluate(()=>window.__created?.video || 0),0);await refused.close();
 const check=await fixture('/studio/golive/planned');const tip=check.getByText('Sharper video: face a window or light, keep the phone steady, and use strong Wi-Fi or 4G.',{exact:true});await tip.waitFor();await shot(check,'go-live-tip');
 const editor=await fixture('/studio/products/product/edit');await editor.getByRole('button',{name:'Remove photo 2',exact:true}).click();await editor.getByRole('dialog',{name:'Remove this photo?',exact:true}).waitFor();await shot(editor,'remove-photo');
 await editor.getByRole('button',{name:'Keep',exact:true}).click();assert.equal(await editor.getByRole('button',{name:/Remove photo/}).count(),2);await editor.getByRole('button',{name:'Remove photo 2',exact:true}).click();await editor.getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await editor.getByRole('button',{name:/Remove photo/}).count(),1);assert.equal(await editor.getByRole('button',{name:'Remove photo 1',exact:true}).isDisabled(),true);
 const listing=await fixture('/studio/list');
 const png=await listing.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=240;c.getContext('2d').fillRect(0,0,200,240);return c.toDataURL('image/png').split(',')[1];});
 await listing.locator('input[type=file]').first().setInputFiles([{name:'first.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'second.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);
 await listing.getByRole('button',{name:'Remove photo 2',exact:true}).click();await listing.getByRole('dialog',{name:'Remove this photo?',exact:true}).waitFor();await listing.getByRole('button',{name:'Keep',exact:true}).click();assert.equal(await listing.getByRole('button',{name:/Remove photo/}).count(),2);
 await listing.getByRole('button',{name:'Remove photo 2',exact:true}).click();await listing.getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await listing.getByRole('button',{name:'Remove photo 1',exact:true}).isDisabled(),true);
 // A zero timer is absent, including an unsold item; no short-circuit zero text.
 scene.items[0]={...scene.items[0],bidStatus:'ended',currentBid:0,winner:null,canRunAgain:true};await first.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await first.getByRole('button',{name:/Run again/}).first().waitFor();assert.equal(await first.getByRole('timer').count(),0);
 await buyerConfirm();
 assert.deepEqual(errors,[]);console.log('PASS: two phone sessions, takeover and move-back, camera cleanup, settings SVG, Go live tip, editor Keep/Remove and last photo, unsold timer, live update note');
 await writeFile(`${output}/checks.json`,JSON.stringify({width:390,checks:'passed',backend:'mocked; real Mongo CAS tests run separately',screenshots:['rail-settings','go-live-tip','other-device','moved-device','remove-photo'],designs:'T8, PR #63',errors},null,2));
}finally{await browser.close();}
