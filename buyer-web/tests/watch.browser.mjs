// Run against `VITE_API_BASE_URL=http://localhost:8000 npm run dev`.
// PLAYWRIGHT_MODULE may point to the cloud runtime's Playwright installation.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5175';
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const socketMock = `export const io = () => {
 const events = {}; const s = {connected:true,on:(n,f)=>{events[n]=f;return s},emit:()=>{},
 trigger:(n,d)=>events[n]?.(d), disconnect:()=>{s.connected=false;events.disconnect?.()},
 connect:()=>{s.connected=true;events.connect?.()}};
 window.__socket=s; setTimeout(()=>s.connect(),0); return s;
};`;
const agoraMock = `const Agora={setLogLevel(){},createClient(){
 const events={}; const track={play(el){window.__plays=(window.__plays||0)+1;el.innerHTML='<div class="mock-video" style="height:100%;background:linear-gradient(135deg,#384f4d,#101f26)"></div>'},stop(){document.querySelector('.stage')?.replaceChildren()}};
 const host={uid:1,hasVideo:true,hasAudio:true,videoTrack:track,audioTrack:{play(){}}};
 const c={connectionState:'CONNECTED',remoteUsers:[host],on:(n,f)=>events[n]=f,
 setClientRole:async()=>{},subscribe:async(user,type)=>{if(type==='video')user.videoTrack=track},
 unsubscribe:async(user,type)=>{if(type==='video'){track.stop();user.videoTrack=null}},
 join:async()=>{await events['user-published']?.(host,'video');await events['user-published']?.(host,'audio')},
 renewToken:async()=>{},leave:async()=>{window.__leaves=(window.__leaves||0)+1},removeAllListeners:()=>{},
 trigger:(n,...args)=>events[n]?.(...args)};window.__client=c;return c;
}}; export default Agora;`;
const product = (name, id, price) => ({ product: { productId:id,name,quantity:3,price },minBid:price,currentBid:price,bidStatus:'active',isVisible:true,auctionEndsAt:new Date(Date.now()+55000).toISOString() });
try {
 const sizes=process.env.BASELINE_CAPTURE ? [{width:375,height:600}] : [{width:320,height:568},{width:375,height:600},{width:390,height:700},{width:1280,height:800}];
 for (const viewport of sizes) {
  const page = await browser.newPage({ viewport, isMobile:viewport.width<1024, hasTouch:viewport.width<1024 });
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('buyerToken','local-test-only'));
  let scene={_id:'demo',title:'Fashion live',status:'live',seller:{_id:'host',storeName:'Test Store'},products:[product('Adire Bubu Gown','first',11000)],viewers:['a','b']};
  let balance=42500;
  let showRequests=0;
  await page.route('**/*', async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.includes('socket__io-client.js')) return route.fulfill({contentType:'application/javascript',body:socketMock});
   if(url.pathname.includes('agora-rtc-sdk-ng.js')) return route.fulfill({contentType:'application/javascript',body:agoraMock});
   if(url.origin==='http://localhost:8000') {
    const path=url.pathname;
    let json={};
    if (path.endsWith('/watch/config')) json={serviceArea:{states:['Lagos'],areas:{Lagos:{'Eti-Osa':['Lekki']}}}};
    else if(path.endsWith('/profile')) json={_id:'buyer',firstName:'Buyer',shippingAddresses:[]};
    else if(path.endsWith('/wallet/balance')) json={availableBalance:balance,onHoldAmount:1000};
    else if(path==='/api/streams/demo') {showRequests++;json=scene;}
    else if(path.endsWith('/join')) json={stream:scene,agoraAppId:'test',channelName:'test',token:'test',uid:2};
    else if(path.endsWith('/summary')) json={bids:{first:4,second:2},sold:{},deliveryDeposit:0,host:{isNew:true,shipsInDays:1}};
    else if(path.endsWith('/notes')) json={notes:{howToBuy:'Tap Bid to join'},firstLine:'Tap Bid to join'};
    else if(path.endsWith('/me')) json={depositDue:0,following:true};
    else if(path.endsWith('/chat')) json={chatInteractions:Array.from({length:60},(_,i)=>({id:String(i),user:'viewer',content:'A very long comment '.repeat(20)}))};
    return route.fulfill({json});
   }
   if(url.origin!==base && !url.pathname.startsWith('/@')) return route.fulfill({body:''});
   return route.continue();
  });
  await page.goto(`${base}/live/demo`);
  await page.locator('.mock-video').waitFor();
  if(process.env.BASELINE_CAPTURE) {
   await page.screenshot({path:`${screenshots}/watch-${viewport.width}.png`});
   await page.getByRole('button',{name:'Wallet',exact:true}).click();
   await page.getByRole('dialog').waitFor();
   await page.screenshot({path:`${screenshots}/wallet-${viewport.width}.png`});
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.evaluate(()=>window.__socket.trigger('auction_order_created',{productName:'Adire Bubu Gown',amount:15000,orderId:'win'}));
   await page.getByRole('dialog').waitFor();
   await page.screenshot({path:`${screenshots}/win-${viewport.width}.png`});
   await page.getByRole('button',{name:'Keep watching',exact:true}).click();
   await page.evaluate(()=>window.__socket.disconnect());
   await page.getByText('Reconnecting…',{exact:true}).waitFor();
   await page.screenshot({path:`${screenshots}/reconnect-${viewport.width}.png`});
   await page.close();console.log('Captured baseline');continue;
  }
  await page.waitForFunction(()=>document.querySelector('.reconnect')===null);
  if(screenshots) await page.screenshot({path:`${screenshots}/watch-initial-${viewport.width}.png`});
  const bottom=await page.locator('.bottom').boundingBox();
  assert(bottom.y>=120,`bottom must leave video clear at ${viewport.width}: ${JSON.stringify(bottom)}`);
  assert(bottom.y+bottom.height<=viewport.height+1);
  const feed=page.locator(viewport.width<1024?'.w-phone .feed':'.w-chat .feed');
  const feedBox=await feed.boundingBox();
  if(viewport.width<1024) assert(feedBox.height<=viewport.height*.25,`comments too tall: ${feedBox.height}`);
  const input=page.locator(viewport.width<1024?'#w-chat':'#w-chat-desk');
  await input.fill('hello');
  if(viewport.width<1024) {
   const typingBox=await feed.boundingBox(); assert(typingBox.y>=100);
   assert(typingBox.height<=viewport.height*.31);
  }
  await input.blur();
  await page.getByRole('button',{name:'Wallet',exact:true}).click();
  await page.getByRole('dialog',{name:'Your wallet'}).getByText('₦42,500',{exact:true}).waitFor();
  assert((await page.locator('.wallet-sheet').boundingBox()).height<=viewport.height*.91);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  balance=36000;
  await page.getByRole('button',{name:'Wallet',exact:true}).click();
  await page.getByRole('dialog',{name:'Your wallet'}).getByText('₦36,000',{exact:true}).waitFor();
  if(screenshots) await page.screenshot({path:`${screenshots}/wallet-${viewport.width}.png`});
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:'Pause video',exact:true}).click();
  const resume=page.getByRole('button',{name:'Show the host again',exact:true});
  await resume.waitFor();
  const clickable=await resume.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el});
  assert(clickable,'resume tap intercepted');
  const plays=await page.evaluate(()=>window.__plays);
  await resume.click();
  await page.waitForFunction(n=>window.__plays>n,plays);
  assert.equal(await resume.count(),0);
  await page.getByRole('button',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:/Audio only/}).click();
  await page.evaluate(()=>window.__client.trigger('user-published',window.__client.remoteUsers[0],'video'));
  await page.getByText('Audio only',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Show the host again',exact:true}).click();
  await page.evaluate(()=>window.__socket.disconnect());
  await page.getByText('Reconnecting…',{exact:true}).waitFor();
  if(screenshots) await page.screenshot({path:`${screenshots}/reconnect-${viewport.width}.png`});
  scene={...scene,products:[product('Latest Ankara Set','second',27000)]};
  await page.evaluate(()=>window.__socket.connect());
  await page.locator('.now-nm').getByText('Latest Ankara Set',{exact:true}).waitFor();
  assert((await page.locator('.clock').first().innerText()).startsWith('0:'));
  const requestsBefore=showRequests;
  scene={...scene,products:[product('Resumed Senator Set','third',15000)]};
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.locator('.now-nm').getByText('Resumed Senator Set',{exact:true}).waitFor();
  assert(showRequests>requestsBefore);
  if(screenshots) await page.screenshot({path:`${screenshots}/watch-${viewport.width}.png`});
  await page.evaluate(()=>window.__socket.trigger('auction_order_created',{productName:'Adire Bubu Gown',amount:15000,orderId:'win'}));
  await page.getByRole('dialog',{name:'You won!'}).waitFor();
  assert((await page.locator('.purchase-sheet').innerText()).length<300);
  if(screenshots) { await page.waitForTimeout(700); await page.screenshot({path:`${screenshots}/win-${viewport.width}.png`}); }
  await page.getByRole('button',{name:'Keep watching',exact:true}).click();
  // Returning from the iOS back/forward cache after the host has ended.
  scene={...scene,status:'ended'};
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await page.getByRole('heading',{name:'That’s a wrap!'}).waitFor();
  assert.equal(await page.locator('.watch').count(),0);
  await page.waitForFunction(()=>window.__leaves>0);
  assert.deepEqual(errors,[]);
  for (const event of ['stream_notification', 'streamEnded']) {
   scene={...scene,status:'live'};
   await page.reload();
   await page.locator('.mock-video').waitFor();
   await page.waitForFunction(()=>document.querySelector('.reconnect')===null);
   await page.evaluate(name=>window.__socket.trigger(name,{type:'stream_ended',data:{streamId:'demo'}}),event);
   await page.getByRole('heading',{name:'That’s a wrap!'}).waitFor();
   assert.equal(await page.locator('.watch').count(),0);
  }
  console.log(`PASS ${viewport.width}×${viewport.height}: comments, balance, host tap, audio choice, reconnect, resume, win, missed end`);
  await page.close();
 }
 // A received end notification must also leave the watch screen immediately.
 // Both event names are handled by the component; missed events are covered above.
} finally { await browser.close(); }
