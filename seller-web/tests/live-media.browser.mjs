// Against the local seller Vite server. Agora/network are stubbed, while camera
// and microphone tracks come from Chromium's real fake-device capture pipeline.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SELLER_TEST_URL || 'http://127.0.0.1:5174';
const source = await (await fetch(`${base}/src/studio/Live.jsx`)).text();
const version = source.match(/react-router-dom\.js\?v=([a-z0-9]+)/)[1];
const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,
 args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'] });
const h = `import React from '/node_modules/.vite/deps/react.js?v=${version}';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js?v=${version}';
import {BrowserRouter,Routes,Route} from '/node_modules/.vite/deps/react-router-dom.js?v=${version}';
import {GoLiveCheck} from '/src/studio/GoLive.jsx'; import Live from '/src/studio/Live.jsx';
const h=React.createElement; ReactDOM.createRoot(document.getElementById('root')).render(h(React.StrictMode,null,h(BrowserRouter,null,h(Routes,null,
 h(Route,{path:'/studio/golive/:showId',element:h(GoLiveCheck)}),h(Route,{path:'/studio/live/:id',element:h(Live)}),
 h(Route,{path:'/studio/recap/:id',element:h('h1',null,'Show recap')}),h(Route,{path:'*',element:h('h1',null,'Studio home')})
))));`;
const agora=`const create=async(kind)=>{
 if(kind==='audio' && location.search.includes('failmic')) throw Object.assign(Error('Microphone denied'),{code:'PERMISSION_DENIED'});
 const stream=await navigator.mediaDevices.getUserMedia({[kind==='audio'?'audio':'video']:true});
 const raw=stream.getTracks()[0];
 return {getMediaStreamTrack:()=>raw,stop(){},close(){raw.stop()},setEnabled:async()=>{},play(el){const v=document.createElement('video');v.srcObject=stream;v.muted=true;v.autoplay=true;el.replaceChildren(v)}};
}; export default {setLogLevel(){},createMicrophoneAudioTrack:()=>create('audio'),createCameraVideoTrack:()=>create('video'),createClient(){
 return {setClientRole:async()=>{},on(){},join:async()=>{},publish:async()=>{},unpublish:async()=>{},renewToken:async()=>{},removeAllListeners(){},leave:()=>new Promise(()=>{})};
}};`;
const socket=`export const io=()=>({on(){},emit(){},disconnect(){}});`;
const context=await browser.newContext({permissions:['camera','microphone'],viewport:{width:390,height:700}});
try {
 const page=await context.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__captures=[]; const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async constraints=>{
   const stream=await original(constraints); window.__captures.push(...stream.getTracks());
   await new Promise(resolve=>setTimeout(resolve,200));return stream;
  };
 });
 let status='scheduled',endRequested=false,allowEnd;
 const endGate=new Promise(resolve=>allowEnd=resolve);
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/src/main.jsx') return route.fulfill({contentType:'application/javascript',body:h});
  if(url.pathname.includes('agora-rtc-sdk-ng.js'))return route.fulfill({contentType:'application/javascript',body:agora});
  if(url.pathname.includes('socket__io-client.js'))return route.fulfill({contentType:'application/javascript',body:socket});
  if(url.pathname.startsWith('/src/Hooks/useIntercomVisibility'))return route.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{};'});
  if(url.origin==='http://localhost:8000'){
   let json={};
   if(url.pathname.endsWith('/shows/demo'))json={show:{_id:'demo',title:'Test show',status,type:'auction',viewers:0},items:[],sales:{count:0,amount:0}};
   else if(url.pathname.endsWith('/start'))status='live';
   else if(url.pathname.endsWith('/renew-token'))json={agoraAppId:'test',channelName:'test',token:'test',uid:1};
   else if(url.pathname.endsWith('/end')){endRequested=true;await endGate;status='ended';}
   else if(url.pathname.endsWith('/chat'))json=[];
   return route.fulfill({json});
  }
  if(url.origin!==base)return route.fulfill({body:''});
  return route.continue();
 });
 await page.goto(`${base}/studio/golive/demo`);
 await page.waitForFunction(()=>window.__captures.length>=4 && window.__captures.filter(t=>t.readyState==='live').length===2);
 await page.getByRole('button',{name:'Go live',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.lv-live')?.textContent.includes('● LIVE'));
 assert.equal(await page.evaluate(()=>window.__captures.filter(t=>t.readyState==='live').length),2);
 await page.getByRole('button',{name:'End show',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'End show',exact:true}).click();
 await page.waitForFunction(()=>window.__captures.every(t=>t.readyState==='ended'));
 assert(endRequested,'backend must receive end even with a stalled RTC leave');
 assert.equal(await page.locator('h1').filter({hasText:'Show recap'}).count(),0,'capture must stop before backend response/navigation');
 allowEnd(); await page.getByRole('heading',{name:'Show recap'}).waitFor();
 console.log('PASS preflight StrictMode → live → end: every native capture track ended before network teardown');
 // A denied microphone must also close a camera permission that resolves later.
 status='live'; await page.goto(`${base}/studio/live/demo?failmic=1`);
 await page.getByText(/Camera or microphone is blocked/).waitFor();
 await page.waitForFunction(()=>window.__captures.length>0 && window.__captures.every(t=>t.readyState==='ended'));
 assert.deepEqual(errors,[]);
 console.log('PASS microphone failure: late camera tracks are released');
} finally {await context.close();await browser.close();}
