// Mock Paystack and the API; never make a real charge or create an account.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5175';
const mode=process.env.CAPTURE_MODE || 'after',baseline=mode==='before';const shots=process.env.SCREENSHOT_DIR || `docs/screenshots/live-and-listing/${mode}`;
await mkdir(shots, { recursive: true });
// Share the SDK doubles used by the existing Watch browser tests.
const existing = await readFile(new URL('./watch.browser.mjs', import.meta.url), 'utf8');
const socketMock = existing.match(/const socketMock = `([\s\S]*?)`;/)[1].replace('emit:()=>{}', 'emit:(name,data)=>{(window.__emitted ||= []).push({name,data})}');
const agoraMock = existing.match(/const agoraMock = `([\s\S]*?)`;/)[1];
const flags = { dva: true, savedCards: true };
const card = { id: 'saved', bank: 'Test Bank', brand: 'Visa', last4: '4081', expMonth: 12, expYear: 2035, usable: true };
const account = { status: 'active', bankName: 'Test Bank', bankSlug: 'test-bank', accountNumber: '1234567890', accountName: 'ADA TEST' };
const product = () => ({ product: { productId: 'adire', name: 'Adire Two-Piece – Indigo with embroidered neckline', images:[{url:base+'/mock-photo.svg'},{url:base+'/mock-photo-2.svg'}],price:11000,quantity:300 }, run: 1, minBid: 11000, currentBid: 11000, bidStatus: 'active', isVisible: true, auctionEndsAt: new Date(Date.now()+120000).toISOString() });
const pages = [];
async function fixture({ enabled = true, saved = true, width = 390, missingAddress = false, quotedDeposit = 500, invalidSavedPhone = false } = {}) {
 const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true }); pages.push(page);
 const state = { balance: 2000, dva: { status: 'none' }, saved: saved ? [card] : [], charge: 'success', show: { _id: 'demo', title: 'Fashion live', status: 'live', seller: { _id: 'host', storeName: 'Test Store' }, products: [product()], viewers: ['one'] }, calls: [], latestCredit: null, chargeResult: null };
 state.quotedDeposit = quotedDeposit; state.pauseQuote = false; state.deliveryUnavailable = false;
 state.profile = { _id: 'buyer', firstName: 'Ada', lastName: 'Test', email: 'ada@test.example', phoneNumber: missingAddress ? '' : '08012345678', shippingAddresses: missingAddress ? [] : [{ _id: 'home', isDefault: true, state: 'Lagos', city: 'Lekki', addressLine1: '5 Test Road' }] };
 if(invalidSavedPhone)state.profile.shippingAddresses[0].phoneNumber='081085565429';
 const errors = []; page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message)});page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())}); state.errors = errors;
 await page.addInitScript(() => {
  localStorage.setItem('buyerToken', 'mock-only');
  window.PaystackPop = class {
   newTransaction(options) { window.__popupOptions = options; }
   resumeTransaction(code, options) { window.__resumed = code; window.__resumeOptions = options; }
  };
 });
 await page.route('**/*', async route => {
  const url = new URL(route.request().url()), path = url.pathname;
  if(path.startsWith('/mock-photo'))return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="#10734F"/><text x="90" y="260" font-size="40" fill="white">Adire ${path.includes('-2')?'2':'1'}</text></svg>`});
  if (path.includes('socket__io-client.js')) return route.fulfill({ contentType: 'application/javascript', body: socketMock });
  if (path.includes('agora-rtc-sdk-ng.js')) return route.fulfill({ contentType: 'application/javascript', body: agoraMock });
  if (path.startsWith('/api/')) {
   state.calls.push({ path, search: url.search, method: route.request().method(), body: route.request().postDataJSON() });
   let json = {};
   if (path.endsWith('/watch/config')) json={serviceArea:{states:['Lagos'],areas:{Lagos:{'Eti-Osa':['Lekki']}}}};
    else if (path.endsWith('/profile')) json = state.profile;
   else if(path.endsWith('/profile/courier-phone')){state.repairedPhone=true;state.profile.shippingAddresses[0].phoneNumber=route.request().postDataJSON().phoneNumber;state.profile.phoneNumber=route.request().postDataJSON().phoneNumber;json={success:true};}
   else if (path.endsWith('/addresses')) { const body = route.request().postDataJSON(); state.profile.shippingAddresses = [{ _id: 'home', ...body }]; json = state.profile; }
   else if (path.endsWith('/orders/states')) json = { data: [{ name: 'Lagos', isoCode: 'LA' }] };
   else if (path.endsWith('/orders/cities/LA')) json = { data: [{ name: 'Lekki' }] };
   else if (path.endsWith('/delivery-quote')) {
    if (state.pauseQuote) await new Promise(resolve => { state.releaseQuote = resolve; });
    json = { available: true, amount: state.quotedDeposit, area: 'Lekki, Lagos', courierName: 'Kwik' };
   }
   else if (path.endsWith('/wallet/balance')) json = { balance:state.balance,availableBalance: state.balance, onHoldAmount: 0, ...(enabled ? { topUpMethods: flags } : {}) };
   else if (path === '/api/streams/demo') json = state.show;
   else if (path.endsWith('/join')) json = { stream: state.show, agoraAppId: 'mock', channelName: 'mock', token: 'mock', uid: 2 };
   else if (path.endsWith('/summary')) json = { bids: {}, sold: {}, deliveryDeposit: 500, host: { isNew: true }, ...(enabled ? { topUpMethods: flags } : {}) };
   else if (path.endsWith('/notes')) json = { notes: { howToBuy: 'Tap Bid to join' }, firstLine: 'Tap Bid to join' };
   else if (path.endsWith('/me')) json = !state.profile.shippingAddresses.length || state.deliveryUnavailable ? { depositDue: null, following: true, deliveryProblem: state.deliveryUnavailable ? 'Delivery pricing is temporarily unavailable.' : 'Add your delivery address first.' } : { depositDue: state.quotedDeposit, delivery: { amount: state.quotedDeposit, area: 'Lekki, Lagos', courierName: 'Kwik' }, following: true };
   else if (path.endsWith('/chat')) json = { chatInteractions: [{ id: 'hi', user: 'viewer', content: 'Love this adire!' }] };
   else if (path === '/api/v2/wallet/cards' && route.request().method() === 'GET') json = { cards: state.saved };
   else if (path.startsWith('/api/v2/wallet/cards/') && route.request().method() === 'DELETE') { state.saved = []; json = { removed: true }; }
   else if (path.endsWith('/dva/requery')) json = { message: 'We’re checking your transfer. Keep watching.' };
   else if (path.endsWith('/dva')) {
    if (route.request().method() === 'POST') state.dva = { status: 'pending' };
    json = { ...state.dva, ...(url.searchParams.get('since') && state.latestCredit ? { latestCredit: state.latestCredit } : {}) };
   } else if (path.endsWith('/charge')) {
    if (state.charge === 'declined') return route.fulfill({ status: 422, json: { message: 'Your bank declined this card. Try another card or a bank transfer.' } });
    const paid = missingAddress ? route.request().postDataJSON().amount : 15000;
    state.chargeResult = { status: state.charge, reference: 'MOCK_TOPUP', amount: paid, ...(state.charge === 'needs_bank_check' ? { accessCode: 'mock_resume' } : {}) };
    if (state.charge === 'success') state.balance += paid;
    if (state.charge === 'processing') await new Promise(r => setTimeout(r, 500));
    json = state.chargeResult;
   } else if (path.includes('/topups/')) json = state.chargeResult;
   return route.fulfill({ json });
  }
  if (url.origin !== base && !path.startsWith('/@')) return route.fulfill({ body: '' });
  return route.continue();
 });
 await page.goto(`${base}/live/demo`); await page.locator('.mock-video').waitFor().catch(async e=>{console.error('BODY',await page.locator('body').innerText());throw e;});
 await page.waitForFunction(() => document.querySelector('.reconnect') === null);
 return { page, state };
}
const fonts=await Promise.all(['Nunito','Fredoka'].map(async name=>[name,`data:font/woff2;base64,${(await readFile(new URL(`../../tests/visual/fonts/${name.toLowerCase()}.woff2`,import.meta.url))).toString('base64')}`]));
const capture = async (page, name) => {await page.evaluate(async fonts=>{for(const[name,data]of fonts){const face=await new FontFace(name,`url(${data})`,{weight:'100 900'}).load();document.fonts.add(face);}},fonts);await page.screenshot({ path: `${shots}/${name}.png` }); console.log('Captured', name); };
const open = async page => { await page.getByRole('button', { name: 'Wallet', exact: true }).click(); await page.getByRole('dialog', { name: 'Your wallet' }).waitFor(); };
const alternatives=async page=>{const summary=page.getByText('Other ways to pay',{exact:true});if(await summary.count() && !await page.locator('.wallet-other-ways').getAttribute('open'))await summary.click();};
try {
 for(const width of [360,390]){
  let {page,state}=await fixture({width,quotedDeposit:909});await page.locator('.mock-video').waitFor().catch(async e=>{console.error('BODY',await page.locator('body').innerText());throw e;});await capture(page,`live-item-${width}`);
  await page.getByRole('button',{name:'Bid more',exact:true}).click();await page.getByRole('heading',{name:'Bid more',exact:true}).waitFor();await capture(page,`bid-sheet-${width}`);if(!baseline){const pills=await page.locator('.chip-amt').boundingBox().catch(()=>null);for(const pill of await page.locator('.chip-amt').all()){const b=await pill.boundingBox();assert.equal(b.height,38);assert.equal(await pill.evaluate(el=>el.scrollWidth>el.clientWidth),false);}}
  await page.getByRole('button',{name:'Close',exact:true}).click();
  state.dva=account;await page.getByRole('button',{name:/^Bid ₦12,000/}).click();await alternatives(page);await page.getByRole('button',{name:/^(Bank transfer|Pay by bank transfer)/}).click();await page.getByRole('dialog').getByText('1234567890',{exact:true}).waitFor();await page.getByRole('button',{name:'Back to the show',exact:true}).click();await page.getByRole('button',{name:/^Waiting for your transfer/}).waitFor();await capture(page,`waiting-transfer-${width}`);
  state.show.products[0].currentBidder={_id:'buyer',firstName:'Ada'};await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.getByText("You're winning",{exact:true}).waitFor();await capture(page,`winning-${width}`);if(!baseline){assert.equal(await page.getByText("Top up to bid · we're watching for your transfer",{exact:true}).count(),0);const title=page.locator('.now-nm');assert.equal(await title.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');assert.equal(await page.locator('.live-delivery').evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');}
  if(!baseline&&width===390){await page.locator('.now .photo-open').click();await page.getByRole('dialog',{name:/photos/}).waitFor();await capture(page,'buyer-photos-full');await page.getByRole('button',{name:'Next photo',exact:true}).click();await page.getByText('2 / 2',{exact:true}).waitFor();const b=await page.getByRole('dialog').boundingBox();await page.mouse.move(b.x+100,b.y+200);await page.mouse.down();await page.mouse.move(b.x+100,b.y+400);await page.mouse.up();assert.equal(await page.getByRole('dialog').count(),0);}
  await page.close();
 }
 if(!baseline){
  {const {page,state}=await fixture({quotedDeposit:909});state.balance=50000;await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForTimeout(500);state.show.hostAwayAt=new Date().toISOString();await page.evaluate(()=>window.__socket.trigger('host_presence_changed',{streamId:'demo',away:true}));await page.getByText('Host will be right back',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.reconnect'));const first=await page.locator('.clock').innerText();const [minutes,seconds]=first.split(':').map(Number);await page.evaluate(left=>window.__socket.trigger('bid_timer_update',{productId:'adire',secondsLeft:left}),minutes*60+seconds-1);await page.waitForFunction(previous=>document.querySelector('.clock')?.textContent!==previous,first);await capture(page,'host-away');await page.getByRole('button',{name:/^Bid ₦12,000/}).click();await page.waitForFunction(()=>window.__emitted?.some(e=>e.name==='stream_place_bid'));state.show.hostAwayAt=null;await page.evaluate(()=>window.__socket.trigger('host_presence_changed',{streamId:'demo',away:false}));await page.getByText('Host will be right back',{exact:true}).waitFor({state:'hidden'});await page.close();console.log('PASS host-away bids/timers');}
  for(const signal of ['socket','poll','balance']){
   const {page,state}=await fixture({quotedDeposit:909});state.dva=account;await page.getByRole('button',{name:/^Bid ₦12,000/}).click();await alternatives(page);await page.getByRole('button',{name:/^(Bank transfer|Pay by bank transfer)/}).click();await page.getByRole('dialog').getByText('1234567890',{exact:true}).waitFor();await page.getByRole('button',{name:'Back to the show',exact:true}).click();await page.getByRole('button',{name:/^Waiting for your transfer/}).waitFor();state.balance=22000;
   if(signal==='poll')state.latestCredit={reference:'POLL_NEW',amount:20000,source:'transfer'};
   if(signal==='socket'){state.latestCredit={reference:'SOCKET_NEW',amount:20000,source:'transfer'};await page.evaluate(()=>window.__socket.trigger('wallet_credited',{reference:'SOCKET_NEW',amount:20000,source:'transfer'}));}
   await page.getByRole('button',{name:/^Waiting for your transfer/}).waitFor({state:'hidden'});await page.waitForFunction(()=>window.__emitted?.some(e=>e.name==='stream_place_bid'));await page.waitForTimeout(3400);assert.equal(await page.getByRole('button',{name:/^Waiting for your transfer/}).count(),0,`${signal} wait must not reappear`);assert.equal((await page.evaluate(()=>window.__emitted||[])).filter(e=>e.name==='stream_place_bid').length,1);if(signal==='socket')await capture(page,'transfer-recovered-W6');await page.close();console.log('PASS credit',signal);
  }
 }
 console.log('PASS live screenshots',mode);
} finally {await browser.close();}
