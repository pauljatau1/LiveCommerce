// Mock Paystack and the API; never make a real charge or create an account.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5175';
const shots = process.env.SCREENSHOT_DIR || 'docs/screenshots/colour-lots';
await mkdir(shots, { recursive: true });
// Share the SDK doubles used by the existing Watch browser tests.
const existing = await readFile(new URL('./watch.browser.mjs', import.meta.url), 'utf8');
const socketMock = existing.match(/const socketMock = `([\s\S]*?)`;/)[1].replace('emit:()=>{}', 'emit:(name,data)=>{(window.__emitted ||= []).push({name,data})}');
const agoraMock = existing.match(/const agoraMock = `([\s\S]*?)`;/)[1];
const flags = { dva: true, savedCards: true };
const card = { id: 'saved', bank: 'Test Bank', brand: 'Visa', last4: '4081', expMonth: 12, expYear: 2035, usable: true };
const account = { status: 'active', bankName: 'Test Bank', bankSlug: 'test-bank', accountNumber: '1234567890', accountName: 'ADA TEST' };
const product = () => ({ product: { productId: 'adire', name: 'Adire Bubu Gown', price: 11000, quantity: 3 }, run: 1, minBid: 11000, currentBid: 11000, bidStatus: 'active', isVisible: true, auctionEndsAt: new Date(Date.now()+120000).toISOString() });
const pages = [];
async function fixture({ enabled = true, saved = true, width = 390, missingAddress = false, quotedDeposit = 500, invalidSavedPhone = false } = {}) {
 const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true }); pages.push(page);
 const state = { balance: 2000, dva: { status: 'none' }, saved: saved ? [card] : [], charge: 'success', show: { _id: 'demo', title: 'Fashion live', status: 'live', seller: { _id: 'host', storeName: 'Test Store' }, products: [product()], viewers: ['one'] }, calls: [], latestCredit: null, chargeResult: null };
 state.quotedDeposit = quotedDeposit; state.pauseQuote = false; state.deliveryUnavailable = false;
 state.profile = { _id: 'buyer', firstName: 'Ada', lastName: 'Test', email: 'ada@test.example', phoneNumber: missingAddress ? '' : '08012345678', shippingAddresses: missingAddress ? [] : [{ _id: 'home', isDefault: true, state: 'Lagos', city: 'Lekki', addressLine1: '5 Test Road' }] };
 if(invalidSavedPhone)state.profile.shippingAddresses[0].phoneNumber='081085565429';
 const errors = []; page.on('pageerror', e => errors.push(e.message)); state.errors = errors;
 await page.addInitScript(() => {
  localStorage.setItem('buyerToken', 'mock-only');
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
const capture = async (page, name) => { await page.screenshot({ path: `${shots}/${name}.png` }); console.log('Captured', name); };
const open = async page => { await page.getByRole('button', { name: 'Wallet', exact: true }).click(); await page.getByRole('dialog', { name: 'Your wallet' }).waitFor(); };
const alternatives=async page=>{const summary=page.getByText('Other ways to pay',{exact:true});if(await summary.count() && !await page.locator('.wallet-other-ways').getAttribute('open'))await summary.click();};

try{
 const {page,state}=await fixture();state.balance=50000;state.show.products[0].product={...state.show.products[0].product,name:'Adire Two-Piece · Indigo',colour:'Indigo',catalogueProductId:'catalogue',colourVariants:['Indigo','Rust','Cream'],colourQuantities:[{colour:'Indigo',quantity:2},{colour:'Rust',quantity:1},{colour:'Cream',quantity:0}]};
 await page.reload();await page.locator('.mock-video').waitFor();await page.locator('.panel .now-nm').filter({hasText:'Adire Two-Piece · Indigo'}).waitFor();await capture(page,'S10-buyer-item-colour');
 state.show.products[0]={...state.show.products[0],minBid:0,currentBid:0,bidStatus:'pending'};await page.reload();await page.locator('.mock-video').waitFor();await page.getByRole('button',{name:/Buy now ·/}).click();await page.getByRole('button',{name:'Rust 1 left',exact:true}).click();await page.getByRole('button',{name:/Buy · ₦11,000/}).click();await page.getByRole('dialog',{name:'It’s yours!'}).waitFor();const call=state.calls.findLast(c=>c.path.endsWith('/buy-now'));assert.equal(call.body.colour,'Rust');assert.equal(call.body.quantity,1);await capture(page,'S10-bought-colour');
 console.log('PASS colour selection stays on show and reaches buy endpoint; item and purchase carry the colour');
}finally{await Promise.all(pages.map(p=>p.close()));await browser.close();}
