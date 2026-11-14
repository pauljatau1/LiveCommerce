import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SELLER_TEST_URL||'http://127.0.0.1:5174';
const source=await(await fetch(`${base}/src/studio/Live.jsx`)).text();
const reactUrl=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1];
const routerUrl=source.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
const domUrl=reactUrl.replace('react.js','react-dom_client.js');
const baseline=Boolean(process.env.BASELINE_CAPTURE),shots=process.env.SCREENSHOT_DIR;
if(shots)await mkdir(shots,{recursive:true});
const main=`import React from '${reactUrl}';import ReactDOM from '${domUrl}';import {BrowserRouter,Routes,Route} from '${routerUrl}';import Live from '/src/studio/Live.jsx';const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h(Routes,null,h(Route,{path:'/studio/live/:id',element:h(Live)}),h(Route,{path:'*',element:h('h1',null,'Show recap')}))));`;
const socket=`export const io=()=>{const events={};const s={connected:true,on(n,f){events[n]=f},emit(){},trigger(n,d){events[n]?.(d)},disconnect(){s.connected=false;events.disconnect?.()},connect(){s.connected=true;events.connect?.()}};window.__socket=s;setTimeout(()=>s.connect(),0);return s;};`;
const agora=`const track=kind=>{window.__created ||= {audio:0,video:0};window.__created[kind]++;const raw={readyState:'live',stop(){raw.readyState='ended'},getCapabilities(){return {width:{max:1280},height:{max:720},frameRate:{max:30}}},getSettings(){return {deviceId:kind==='audio'?'mic1':'cam1'}}};const t={kind,enabled:true,muted:false,getMediaStreamTrack:()=>raw,stop(){},close(){raw.stop()},async setEnabled(v){t.enabled=v;window.__micEnabled=v},async setMuted(v){t.muted=v;if(kind==='audio')window.__micEnabled=!v},async setDevice(id){window.__chosenDevice=id},async setEncoderConfiguration(c){window.__encoder=c},play(el){if(el)el.innerHTML='<div style="height:100%;background:linear-gradient(145deg,#52646b,#18262b)"></div>'}};window.__tracks ||= {};window.__tracks[kind]=t;return t;};export default{setLogLevel(){},getCameras:async()=>[{deviceId:'cam1',label:'Front camera'},{deviceId:'cam2',label:'Back camera'}],getMicrophones:async()=>[{deviceId:'mic1',label:'Phone microphone'},{deviceId:'mic2',label:'External microphone'}],createMicrophoneAudioTrack:async()=>track('audio'),createCameraVideoTrack:async()=>{if(window.__failCameraOnce){window.__failCameraOnce=false;throw Error('AgoraRTCError camera temporarily unavailable');}return track('video')},createClient(){window.__clients=(window.__clients||0)+1;const events={},c={localTracks:[],connectionState:'DISCONNECTED',async setClientRole(){},on(n,f){events[n]=f},trigger(n,d){events[n]?.(d)},async join(){window.__joins=(window.__joins||0)+1;c.connectionState='CONNECTED';events['connection-state-change']?.('CONNECTED');},async leave(){c.connectionState='DISCONNECTED'},async publish(tracks){for(const t of Array.isArray(tracks)?tracks:[tracks]){if(t.enabled===false)throw Error('AgoraRTCError TRACK_IS_DISABLED');if(!c.localTracks.includes(t))c.localTracks.push(t)}},async unpublish(t){c.localTracks=c.localTracks.filter(x=>x!==t)},removeAllListeners(){},async renewToken(){}};window.__client=c;return c}};`;
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const viewport of [{width:375,height:667},{width:390,height:844}]){
  if(baseline&&viewport.width!==375)continue;
  const page=await browser.newPage({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  let scene={show:{_id:'demo',status:'live',title:'Fashion live',type:'auction',link:'https://example.com',viewers:2,actualStartTime:new Date(Date.now()-120000).toISOString(),notes:{howToBuy:'Tap Bid to join'}},items:[{productId:'gown',name:'Adire Bubu Maxi Dress',stock:31,minBid:11000,bidStatus:'pending',run:1,colourVariants:['Purple and Beige','Blue and White','Red and Beige'],isVisible:true},{productId:'next',name:'Next Ankara Set',stock:5,minBid:500,price:500,bidStatus:'pending'}],sales:{count:1,amount:15000}};
  let prepareCalls=0,lastPayload;
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.pathname==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:main});
   if(u.pathname.includes('socket__io-client.js'))return route.fulfill({contentType:'application/javascript',body:socket});
   if(u.pathname.includes('agora-rtc-sdk-ng.js'))return route.fulfill({contentType:'application/javascript',body:agora});
   if(u.pathname.startsWith('/src/Constants/Server'))return route.fulfill({contentType:'application/javascript',body:"export const BASE_URL='http://localhost:8000/api',BASE_URL_V2='http://localhost:8000/api/v2';"});
   if(u.pathname.startsWith('/src/Hooks/useIntercomVisibility'))return route.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{}'});
   if(u.origin==='http://localhost:8000'){
    let json={};const path=u.pathname;
    if(path.endsWith('/shows/demo'))json=scene;
    else if(path.endsWith('/presence')){await page.evaluate(data=>{(window.__presence ||= []).push(data)},route.request().postDataJSON());json=scene.ending?{ending:true}:{away:route.request().postDataJSON().away};}
    else if(path.endsWith('/renew-token'))json={agoraAppId:'test',channelName:'test',token:'test',uid:1};
    else if(path.endsWith('/chat'))json=Array.from({length:40},(_,i)=>({id:String(i),type:'comment',user:'viewer',content:i%2?'bid ₦3,000':'Love this dress!'}));
    else if(path.endsWith('/run')){
     prepareCalls++;lastPayload=route.request().postDataJSON();
     if(prepareCalls===1)return route.fulfill({status:409,json:{message:'Finishing the last sale. Please wait a moment.'}});
     scene.items[0]={...scene.items[0],bidStatus:'pending',run:2,runNote:lastPayload.note,canRunAgain:false};
    }else if(path.endsWith('/activate-product-bidding'))scene.items[0]={...scene.items[0],bidStatus:'active',auctionEndsAt:new Date(Date.now()+60000).toISOString()};
    return route.fulfill({json});
   }
   if(u.origin!==base)return route.fulfill({body:''});return route.continue();
  });
  await page.goto(`${base}/studio/live/demo`);await page.getByRole('button',{name:/Start bidding/}).first().waitFor();
  if(!baseline)await page.waitForFunction(()=>!document.querySelector('.lv-live')?.textContent.includes('Syncing'));
  if(shots)await page.screenshot({path:`${shots}/studio-${viewport.width}.png`});
  if(!baseline&&viewport.width<900){const bottom=await page.locator('.lv-bottom').boundingBox();assert(bottom.y>=115,`studio obscures camera: ${bottom.y}`);assert((await page.locator('.lv-phone-only .lv-feed').boundingBox()).height<=viewport.height*.24);}
  scene.items[0]={...scene.items[0],bidStatus:'ended',winner:{name:'Buyer',amount:15000},canRunAgain:true};
  // Reload for a consistent before/after Run again capture.
  await page.reload();await page.getByRole('button',{name:/Run again/}).first().click();
  const dialog=page.getByRole('dialog',{name:'Run again',exact:true});await dialog.waitFor();
  if(shots)await page.screenshot({path:`${shots}/run-${viewport.width}.png`});
  if(baseline){await page.close();continue;}
  await page.getByRole('textbox',{name:/Note for this run/}).fill('Purple and Beige');
  await page.getByRole('button',{name:'60s',exact:true}).click();
  await dialog.getByRole('button',{name:/^Start/}).click();
  await dialog.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('textbox',{name:/Note for this run/}).inputValue(),'Purple and Beige');
  assert.equal(await page.getByRole('button',{name:'60s',exact:true}).getAttribute('aria-pressed'),'true');
  if(shots)await page.screenshot({path:`${shots}/run-error-${viewport.width}.png`});
  await dialog.getByRole('button',{name:/^Start/}).click();
  await dialog.waitFor({state:'hidden'});assert.equal(lastPayload.note,'Purple and Beige');assert.equal(lastPayload.seconds,60);
  // A stale zero/winner event cannot enable Run again while the order is settling.
  scene.items[0]={...scene.items[0],bidStatus:'ongoing',canRunAgain:false,settlementPending:true,winner:{name:'Buyer',amount:16000}};
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.getByText('Finishing sale…',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Run again/}).count(),0);
  // Foreground must catch up to a new item and restore its deadline and mute choice.
  await page.getByRole('button',{name:'Mute microphone',exact:true}).click();
  await page.evaluate(()=>{window.__hidden=true;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__hidden?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>window.__tracks.video.muted && window.__presence?.some(p=>p.away));
  await page.evaluate(()=>{window.__tracks.video.getMediaStreamTrack().readyState='ended';window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>window.__created.video===2 && !window.__tracks.video.muted && window.__presence?.some(p=>p.away===false));
  assert.deepEqual(await page.evaluate(()=>window.__created),{audio:1,video:2});assert.equal(await page.evaluate(()=>window.__clients),1);assert.equal(await page.evaluate(()=>window.__tracks.audio.muted),true);assert.equal(await page.evaluate(()=>window.__joins),1);
  await page.evaluate(()=>{window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.__tracks.video.muted);await page.evaluate(()=>{window.__tracks.video.getMediaStreamTrack().readyState='ended';window.__failCameraOnce=true;window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.__created.video===3&&!window.__tracks.video.muted);assert.equal(await page.evaluate(()=>window.__clients),1);assert(!await page.getByText(/AgoraRTCError/).count());
  await page.getByRole('button',{name:'Camera and microphone',exact:true}).click();await page.getByLabel('Camera',{exact:true}).selectOption('cam2');await page.waitForFunction(()=>window.__chosenDevice==='cam2');await page.getByLabel('Microphone',{exact:true}).selectOption('mic2');await page.waitForFunction(()=>window.__chosenDevice==='mic2');assert.equal(await page.evaluate(()=>window.__tracks.audio.muted),true);await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('studio-camera')),'cam2');assert.equal(await page.evaluate(()=>window.__clients),1);
  await page.evaluate(()=>window.__client.trigger('network-quality',{uplinkNetworkQuality:5}));await page.waitForFunction(()=>window.__encoder.width===640);await page.evaluate(()=>window.__client.trigger('network-quality',{uplinkNetworkQuality:1}));await page.waitForFunction(()=>window.__encoder.width===1280);
  scene.items=[{...scene.items[1],bidStatus:'active',isVisible:true,name:'Latest Senator Set',auctionEndsAt:new Date(Date.now()+45000).toISOString()}];
  await page.evaluate(()=>{window.__client.connectionState='DISCONNECTED';window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
  await page.getByText('Latest Senator Set',{exact:true}).first().waitFor();await page.waitForFunction(()=>window.__micEnabled===false);
  assert.equal(await page.evaluate(()=>window.__clients),1);assert.equal(await page.evaluate(()=>window.__joins),2);
  const remaining=Number((await page.getByRole('timer').innerText()).split(':')[1]);
  await page.waitForTimeout(1600);
  assert(Number((await page.getByRole('timer').innerText()).split(':')[1])<remaining,'restored countdown must keep ticking without socket events');
  scene.items[0]={...scene.items[0],name:'Newest after socket reconnect'};await page.evaluate(()=>{window.__socket.disconnect();window.__socket.connect()});
  await page.getByText('Newest after socket reconnect',{exact:true}).first().waitFor();
  scene.ending=true;await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.getByText('Finishing your show. Your last sale is being saved.',{exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Show recap',exact:true}).count(),0);
  scene.show.status='ended';await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.getByRole('heading',{name:'Show recap',exact:true}).waitFor();assert.deepEqual(errors,[]);
  console.log(`PASS ${viewport.width}×${viewport.height}: layout, Run again retry, settlement gate, iOS resume, RTC/mute, reconnect, ended`);await page.close();
 }
}finally{await browser.close()}
