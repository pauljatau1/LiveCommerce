// Actual app components; deterministic API/RTC fixtures, no staging accounts.
import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const seller=process.env.SELLER_TEST_URL || 'http://127.0.0.1:5201',buyer=process.env.BUYER_TEST_URL || 'http://127.0.0.1:5202';
const out='docs/screenshots/second-show-and-overflow';await mkdir(out,{recursive:true});
const prior=await readFile('seller-web/tests/host-resume.browser.mjs','utf8');
const agora=prior.match(/const agora=`([\s\S]*?)`;\nconst browser=/)[1],socket=prior.match(/const socket=`([\s\S]*?)`;/)[1];
const productTitle=('Adire Bubu with an exceptionally long embroidered neckline and matching accessories ').repeat(4)+'Supercalifragilisticexpialidocious'.repeat(5);
const showTitle=('Friday fashion finds and a wonderfully long show title ').repeat(6)+'LongShowNameWithoutSpaces'.repeat(5);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const checks=[];
const fonts=await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(`tests/visual/fonts/${name.toLowerCase()}.woff2`)).toString('base64')}`]));
async function fixture(kind,width=390,mode='blocked'){
 const studio=!kind.startsWith('shop-'),base=studio?seller:buyer,page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(15000);
 const errors=[],calls=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',kind,e.message)});
 const state={mode,conflict:mode==='blocked'?{_id:'A',title:'Friday fashion finds'}:null,status:'scheduled',owners:{A:'foreign-A'},calls,errors};
 await page.addInitScript(()=>{localStorage.setItem('buyerToken','mock-only');localStorage.setItem('sellerToken',JSON.stringify({data:'mock-only'}));window.__mountedLiveControls=false;new MutationObserver(()=>{if(document.querySelector('.lv-rail,.lv-go,.lv-end'))window.__mountedLiveControls=true;}).observe(document,{subtree:true,childList:true});Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{const c=document.createElement('canvas');c.width=720;c.height=1280;c.getContext('2d').fillRect(0,0,720,1280);const stream=c.captureStream(24);(window.__nativeStreams ||= []).push(stream);return stream;},enumerateDevices:async()=>[]}});});
 const src=await(await fetch(base+(studio?'/src/studio/Live.jsx':'/src/main.jsx'))).text(),react=src.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1],router=src.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
 const imports=studio?"import Detail from '/src/studio/ProductDetail.jsx';import Products from '/src/studio/Products.jsx';import Planner from '/src/studio/Planner.jsx';import{Orders}from '/src/studio/Orders.jsx';import Recap from '/src/studio/Recap.jsx';import{GoLiveCheck}from '/src/studio/GoLive.jsx';import Live from '/src/studio/Live.jsx';import '/src/studio/base.css';":"import Watch from '/src/pages/Watch.jsx';import Orders from '/src/pages/Orders.jsx';import Me from '/src/pages/Me.jsx';import{AuthProvider}from '/src/auth.jsx';import '/src/styles.css';";
 const route=studio?"h(Routes,null,h(Route,{path:'/studio/products/:id',element:h(Detail)}),h(Route,{path:'/studio/products',element:h(Products)}),h(Route,{path:'/studio/plan',element:h(Planner)}),h(Route,{path:'/studio/orders',element:h(Orders)}),h(Route,{path:'/studio/recap/:id',element:h(Recap)}),h(Route,{path:'/studio/golive/:showId',element:h(GoLiveCheck)}),h(Route,{path:'/studio/live/:id',element:h(Live)}))":"h(AuthProvider,null,h(Routes,null,h(Route,{path:'/live/:streamId',element:h(Watch)}),h(Route,{path:'/orders',element:h(Orders)}),h(Route,{path:'/me',element:h(Me)})))";
 const entry=`import React from '${react}';import ReactDOM from '${react.replace('react.js','react-dom_client.js')}';import{BrowserRouter,Routes,Route}from '${router}';${imports}const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h('div',{className:'${studio?'studio-app':'app'}'},${route})));`;
 const image=base+'/fixture-photo.svg',product={_id:'p',name:productTitle,price:11000,stock:5,status:'active',category:'Women',condition:'New with tags',description:'A hand-dyed gown.',weightKg:0.5,images:[image],image,views:5,sold:2};
 const products=Array.from({length:8},(_,i)=>({...product,_id:i?'p'+i:'p'}));
 const delivery={_id:'delivery',status:'paid',createdAt:new Date().toISOString(),show:{_id:'show',title:showTitle,type:'auction'},seller:{_id:'host',storeName:'Test store'},buyer:{firstName:'Ada',lastName:'Test',area:'Lekki'},itemCount:1,itemsTotal:11000,fee:500,items:[{order:'order',name:productTitle,note:productTitle,image,quantity:1,unitPrice:11000}]};
 const watchProduct={product:{productId:'p',name:productTitle,quantity:5,price:11000,images:[{url:image}]},minBid:11000,currentBid:11000,bidStatus:'active',isVisible:true,auctionEndsAt:new Date(Date.now()+600000).toISOString()};
 const watchShow={_id:'show',title:showTitle,status:'live',seller:{_id:'host',storeName:'Test store'},products:[watchProduct],viewers:[]};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method(),body=req.postDataJSON();
  if(path==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:entry});
  if(path.includes('socket__io-client.js'))return route.fulfill({contentType:'application/javascript',body:socket});
  if(path.includes('agora-rtc-sdk-ng.js'))return route.fulfill({contentType:'application/javascript',body:agora});
  if(path.startsWith('/src/Constants/Server'))return route.fulfill({contentType:'application/javascript',body:"export const BASE_URL='http://localhost:8000/api',BASE_URL_V2='http://localhost:8000/api/v2';"});
  if(path.startsWith('/src/Hooks/useIntercomVisibility'))return route.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{}'});
  if(path.startsWith('/src/Hooks/useAuthContextV2'))return route.fulfill({contentType:'application/javascript',body:"export const useAuthContext=()=>({seller:{_id:'seller',firstName:'Sade',phoneNumber:'08031234567',warehouseDetails:{address:{addressLine1:'1 Allen Avenue',city:'Ikeja',state:'Lagos'}}}});"});
  if(path==='/fixture-photo.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="#10734F"/><path d="M140 80L70 160L130 210L110 410H370L350 210L410 160L340 80Z" fill="#F4EFE8"/></svg>'});
  if(path.startsWith('/api/')){
   calls.push({path,method,body});let json={success:true};const id=path.match(/\/(?:shows|streams)\/([^/]+)/)?.[1];
   if(path.endsWith('/watch/config'))json={serviceArea:{states:['Lagos'],areas:{Lagos:{'Eti-Osa':['Lekki']}}}};
   else if(path.endsWith('/live-conflict')){const value=state.conflict;state.conflictReads=(state.conflictReads || 0)+1;if(state.mode==='race-late'&&state.conflictReads===1)await new Promise(resolve=>setTimeout(resolve,1000));json={liveShow:value};}
   else if(path.endsWith('/host-session')){if(method==='GET')json={currentSessionId:state.owners[id]?'revision-'+id:null,canHost:req.headers()['x-host-session-id']===state.owners[id],live:id==='A'||state.status==='live'};else{state.owners[id]='local-'+id;json={sessionId:state.owners[id],revision:'revision-'+id};}}
   else if(path.endsWith('/start')){if(state.mode.startsWith('race')||state.mode==='direct'){state.conflict={_id:'A',title:'Friday fashion finds'};return route.fulfill({status:409,json:{code:'already_live',liveShow:state.conflict,message:"You're already live with Friday fashion finds. End it first."}});}if(state.mode==='missing')return route.fulfill({status:404,json:{message:'This show is no longer available.'}});if(state.mode==='error')return route.fulfill({status:422,json:{code:'out_of_area',message:'Update your pickup address to go live.'}});state.status='live';}
   else if(/\/studio\/shows\/[AB]$/.test(path))json={show:{_id:id,title:id==='A'?'Friday fashion finds':'Saturday shoes',status:id==='A'?'live':state.status,type:'auction',viewers:2},items:[{productId:'p',name:'Adire Bubu',image,stock:5,minBid:11000,bidStatus:'pending',isVisible:true}],sales:{count:0,amount:0}};
   else if(path.endsWith('/renew-token'))json={agoraAppId:'test',channelName:'test',token:'test',uid:1234};
   else if(path.endsWith('/chat'))json=[];
   else if(path.endsWith('/studio/products'))json={products};
   else if(path.endsWith('/studio/products/p'))json={product,shows:[{_id:'show',title:showTitle,status:'scheduled',scheduledStartTime:new Date(Date.now()+86400000).toISOString()}]};
   else if(path.endsWith('/studio/show-notes/default'))json={notes:null};
   else if(path.endsWith('/recap'))json={show:{title:showTitle},itemsSold:1,buyers:1,viewers:5,earned:11000,sold:[{name:productTitle,image,buyer:'Ada',area:'Lekki',quantity:1,amount:11000}],unsold:[product],deliveries:{},slot:null};
   else if(path.endsWith('/next-plan'))json={show:null};
   else if(path.endsWith('/deliveries/seller'))json={deliveries:[delivery]};
   else if(path.endsWith('/deliveries'))json={deliveries:[delivery]};
   else if(path.endsWith('/profile'))json={_id:'buyer',firstName:'Ada',lastName:'Test',username:'ada',email:'ada@example.test',phoneNumber:'08031234567',shippingAddresses:[{_id:'home',isActive:true,addressLine1:'1 Admiralty Way',city:'Lekki',state:'Lagos',phoneNumber:'08031234567'}]};
   else if(path.endsWith('/wallet/balance'))json={availableBalance:50000,onHoldAmount:0};
   else if(path==='/api/streams/show')json=watchShow;
   else if(path.endsWith('/join'))json={stream:watchShow,agoraAppId:'test',channelName:'test',token:'test',uid:2};
   else if(path.endsWith('/summary'))json={bids:{p:0},sold:{},deliveryDeposit:0,host:{isNew:true,shipsInDays:1}};
   else if(path.endsWith('/notes'))json={notes:{howToBuy:showTitle},firstLine:showTitle};
   else if(path.endsWith('/me'))json={depositDue:0,following:true};
   return route.fulfill({json});
  }
  if(url.origin!==base)return route.fulfill({body:''});return route.continue();
 });
 const paths={detail:'/studio/products/p',products:'/studio/products',planner:'/studio/plan','studio-orders':'/studio/orders',recap:'/studio/recap/show',check:'/studio/golive/B',direct:'/studio/live/B','shop-live':'/live/show','shop-orders':'/orders','shop-profile':'/me'};
 await page.goto(base+paths[kind]);assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/i.test(await page.locator('meta[name=viewport]').getAttribute('content')));await page.addStyleTag({content:fonts.map(([name,url])=>`@font-face{font-family:'${name}';src:url('${url}') format('woff2');font-weight:100 900;}`).join('')});await page.evaluate(()=>document.fonts.ready);
 return {page,state,errors,product};
}
async function noOverflow(page,label,width){
 await page.waitForTimeout(120);const measure=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
 if(measure.document!==width || measure.body>width){const bad=await page.locator('body *').evaluateAll((nodes,limit)=>nodes.map(el=>({tag:el.tagName,class:el.className,text:el.textContent?.slice(0,70),right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,scroll:el.scrollWidth})).filter(r=>r.right>limit+1||r.width>limit+1).slice(0,24),width);throw Error(`${label} ${width}: ${JSON.stringify(measure)} ${JSON.stringify(bad)}`);}
 checks.push({page:label,width,...measure});
}
try{
 for(const width of [360,390])for(const kind of ['detail','products','planner','studio-orders','recap','shop-live','shop-orders','shop-profile']){
  const {page,errors,product}=await fixture(kind,width);
  if(kind==='detail')await page.getByTitle(`In "${showTitle}"`,{exact:true}).waitFor();
  else if(kind==='products')await page.locator('.pc').first().waitFor();
  else if(kind==='planner'){await page.getByRole('button',{name:/^Next/}).waitFor();await noOverflow(page,kind+'-pick',width);await page.getByRole('button',{name:/^Next/}).click();await page.locator('.colour-lot-row').first().waitFor();await noOverflow(page,kind+'-running-order',width);await page.getByRole('button',{name:/^Next/}).click();await page.getByLabel('Show title',{exact:true}).fill(showTitle);}
  else if(kind==='studio-orders')await page.locator('a[href="/studio/orders/delivery"]').waitFor();
  else if(kind==='recap')await page.getByText('What sold',{exact:true}).waitFor();
  else if(kind==='shop-live')await page.locator('.now-nm').waitFor();
  else if(kind==='shop-orders')await page.getByText('Paid · preparing',{exact:true}).waitFor();
  else await page.getByRole('heading',{name:'Your details',exact:true}).waitFor();
  await noOverflow(page,kind,width);assert.deepEqual(errors,[]);
  if(width===390&&kind==='detail'){product.name='Adire Bubu – Indigo';await page.reload();await page.getByTitle(`In "${showTitle}"`,{exact:true}).waitFor();await page.addStyleTag({content:fonts.map(([name,url])=>`@font-face{font-family:'${name}';src:url('${url}') format('woff2');font-weight:100 900;}`).join('')});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/long-show-product-390.png'});}await page.close();
 }
 for(const mode of ['blocked','race','race-late','success']){
  const {page,state,errors}=await fixture('check',390,mode);const go=page.getByRole('button',{name:'Go live',exact:true});await go.waitFor();await go.click();
  if(mode==='success'){await page.getByRole('button',{name:'Camera and microphone',exact:true}).waitFor();assert.equal(state.calls.filter(c=>c.path.endsWith('/start')).length,1);await page.waitForFunction(()=>document.querySelector('.lv-video')?.children.length>0);}
  else{const sheet=page.getByRole('dialog',{name:"You're already live",exact:true});await sheet.waitFor();if(mode==='race-late'){await page.waitForTimeout(1100);assert(await sheet.isVisible());}assert(new URL(page.url()).pathname.endsWith('/golive/B'));assert.equal(state.status,'scheduled');assert.equal(state.calls.filter(c=>c.path.endsWith('/start')).length,mode.startsWith('race')?1:0);assert.equal(await page.evaluate(()=>window.__mountedLiveControls),false);if(mode==='blocked')await page.screenshot({path:out+'/already-live-390.png'});await page.getByRole('button',{name:'Not now',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);await go.click();await sheet.waitFor();await page.getByRole('button',{name:'Go to my live show',exact:true}).click();await page.getByRole('heading',{name:'Your show is live on another device',exact:true}).waitFor();}
  assert.deepEqual(errors,[]);await page.close();
 }
 for(const mode of ['direct','error','missing']){
  const {page,errors}=await fixture('direct',390,mode);
  if(mode==='direct'){await page.getByRole('dialog',{name:"You're already live",exact:true}).waitFor();assert(new URL(page.url()).pathname.endsWith('/golive/B'));}
  else{await page.getByText(mode==='missing'?'This show is no longer available.':'Update your pickup address to go live.',{exact:true}).waitFor();if(mode==='missing')assert.equal(await page.getByRole('button',{name:'Back to Go live check',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Try again',exact:true}).count(),0);}
  assert.equal(await page.evaluate(()=>window.__mountedLiveControls),false);assert.equal(await page.locator('.lv-rail,.lv-go,.lv-end').count(),0);assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(out+'/checks.json',JSON.stringify({checks,flows:['preflight sheet','409 sheet','successful checked start','legacy direct refusal','plain error without controls','non-retryable missing show'],mocks:true},null,2));console.log('PASS: 360/390px overflow audit, preflight/409 sheets, T8 hand-off, direct refusal, plain errors, successful start');
}finally{await browser.close();}
