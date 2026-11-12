// Mock Paystack and the API; never make a real charge or create an account.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const before=process.env.MODE==='before',mode=before?'before':'after';const base=before?'http://127.0.0.1:5188':'http://127.0.0.1:5185';
const shots=`docs/screenshots/staging-feedback-12nov/${mode}`;
await mkdir(shots, { recursive: true });
// Share the SDK doubles used by the existing Watch browser tests.
const existing = await readFile(new URL('../../buyer-web/tests/watch.browser.mjs', import.meta.url), 'utf8');
const socketMock = existing.match(/const socketMock = `([\s\S]*?)`;/)[1].replace('emit:()=>{}', 'emit:(name,data)=>{(window.__emitted ||= []).push({name,data})}');
const agoraMock = existing.match(/const agoraMock = `([\s\S]*?)`;/)[1];
const flags = { dva: true, savedCards: true };
const card = { id: 'saved', bank: 'Test Bank', brand: 'Visa', last4: '4081', expMonth: 12, expYear: 2035, usable: true };
const account = { status: 'active', bankName: 'Test Bank', bankSlug: 'test-bank', accountNumber: '1234567890', accountName: 'ADA TEST' };
const product = () => ({ product: { productId: 'adire', name: 'Adire Bubu Gown', price: 11000, quantity: 3 }, run: 1, minBid: 11000, currentBid: 11000, bidStatus: 'active', isVisible: true, auctionEndsAt: new Date(Date.now()+120000).toISOString() });
const pages = [];
async function fixture({ enabled = true, saved = true, width = 390, missingAddress = false, quotedDeposit = 500 } = {}) {
 const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true }); pages.push(page);
 const state = { balance: 2000, dva: { status: 'none' }, saved: saved ? [card] : [], charge: 'success', show: { _id: 'demo', title: 'Fashion live', status: 'live', seller: { _id: 'host', storeName: 'Test Store' }, products: [product()], viewers: ['one'] }, calls: [], latestCredit: null, chargeResult: null };
 state.quotedDeposit = quotedDeposit; state.pauseQuote = false; state.deliveryUnavailable = false;
 state.profile = { _id: 'buyer', firstName: 'Ada', lastName: 'Test', email: 'ada@test.example', phoneNumber: missingAddress ? '' : '08012345678', shippingAddresses: missingAddress ? [] : [{ _id: 'home', isDefault: true, state: 'Lagos', city: 'Lekki', addressLine1: '5 Test Road' }] };
 const errors = []; page.on('pageerror', e => errors.push(e.message)); state.errors = errors;
 await page.addInitScript(() => {

  window.PaystackPop = class {
   newTransaction(options) { window.__popupOptions = options; }
   resumeTransaction(code, options) { window.__resumed = code; window.__resumeOptions = options; }
  };
 });
 await page.route('**/*', async route => {
  const url = new URL(route.request().url()), path = url.pathname;
  if (path.includes('socket__io-client.js')) return route.fulfill({ contentType: 'application/javascript', body: socketMock });
  if (path.includes('agora-rtc-sdk-ng.js')) return route.fulfill({ contentType: 'application/javascript', body: agoraMock });
  if (url.origin === 'http://localhost:8000') {
   state.calls.push({ path, search: url.search, method: route.request().method(), body: route.request().postDataJSON() });
   let json = {};
   if(path.endsWith('/auth/login')||path.endsWith('/auth/register'))json={token:'mock-only'};
   else if(path.endsWith('/guest-join'))json={stream:state.show,agoraAppId:'mock',channelName:'mock',token:'mock',uid:2000001};
   else if (path.endsWith('/watch/config')) json={serviceArea:{states:['Lagos'],areas:{Lagos:{'Eti-Osa':['Lekki']}}}};
    else if (path.endsWith('/profile')) json = state.profile;
   else if (path.endsWith('/addresses')) { const body = route.request().postDataJSON(); state.profile.shippingAddresses = [{ _id: 'home', ...body }]; json = state.profile; }
   else if (path.endsWith('/orders/states')) json = { data: [{ name: 'Lagos', isoCode: 'LA' }] };
   else if (path.endsWith('/orders/cities/LA')) json = { data: [{ name: 'Lekki' }] };
   else if (path.endsWith('/delivery-quote')) {
    if (state.pauseQuote) await new Promise(resolve => { state.releaseQuote = resolve; });
    json = { available: true, amount: state.quotedDeposit, area: 'Lekki, Lagos', courierName: 'Kwik' };
   }
   else if (path.endsWith('/wallet/balance')) json = { availableBalance: state.balance, onHoldAmount: 0, ...(enabled ? { topUpMethods: flags } : {}) };
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
 await page.goto(`${base}/live/demo`); await page.locator('.mock-video').waitFor();
 await page.waitForFunction(() => document.querySelector('.reconnect') === null);
 return { page, state };
}

try{
 for(const method of ['signup','signin']){
  const {page,state}=await fixture();
  const input=page.locator('#w-chat');await input.fill('Is the adire cotton?');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.getByRole('dialog',{name:'Join the chat',exact:true}).waitFor();
  if(!before)assert.notEqual(await page.evaluate(()=>document.activeElement.id),'w-chat');
  if(method==='signup')await page.screenshot({path:`${shots}/guest-join.png`});
  await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await input.inputValue(),'Is the adire cotton?');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  if(method==='signin')await page.getByRole('button',{name:'I have an account',exact:true}).click();
  else await page.getByLabel('Username',{exact:true}).fill('ada_test');
  await page.getByLabel('Email',{exact:true}).fill('ada@test.example');await page.getByLabel('Password',{exact:true}).fill('mock-password');
  if(!before){await page.getByRole('button',{name:'Show password'}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Hide password'}).click();}
  await page.getByRole('button',{name:method==='signup'?'Create account':'Sign in',exact:true}).click();
  await page.getByRole('dialog',{name:'Join the chat',exact:true}).waitFor({state:'hidden'});
  if(!before){await page.waitForFunction(()=>window.__emitted?.some(e=>e.name==='stream_comment'));const comments=await page.evaluate(()=>window.__emitted.filter(e=>e.name==='stream_comment'));assert.equal(comments.length,1);assert.equal(comments[0].data.content,'Is the adire cotton?');assert.equal(await input.inputValue(),'');}
  else assert.equal(await input.inputValue(),'Is the adire cotton?');
  assert.deepEqual(state.errors,[]);await page.close();
 }
 console.log('PASS',mode,'guest blur, cancel preserves draft, signup/signin posts once after authentication');
}finally{for(const p of pages)await p.close().catch(()=>{});await browser.close();}
