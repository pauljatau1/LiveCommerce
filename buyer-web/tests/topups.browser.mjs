// Mock Paystack and the API; never make a real charge or create an account.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5175';
const shots = process.env.SCREENSHOT_DIR || '../docs/screenshots/stay-on-stream-topups';
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
async function fixture({ enabled = true, saved = true, width = 390 } = {}) {
 const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true }); pages.push(page);
 const state = { balance: 2000, dva: { status: 'none' }, saved: saved ? [card] : [], charge: 'success', show: { _id: 'demo', title: 'Fashion live', status: 'live', seller: { _id: 'host', storeName: 'Test Store' }, products: [product()], viewers: ['one'] }, calls: [], latestCredit: null, chargeResult: null };
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
   state.calls.push({ path, method: route.request().method(), body: route.request().postDataJSON() });
   let json = {};
   if (path.endsWith('/profile')) json = { _id: 'buyer', firstName: 'Ada', lastName: 'Test', email: 'ada@test.example', phoneNumber: '08012345678', shippingAddresses: [{ _id: 'home', isDefault: true }] };
   else if (path.endsWith('/wallet/balance')) json = { availableBalance: state.balance, onHoldAmount: 0, ...(enabled ? { topUpMethods: flags } : {}) };
   else if (path === '/api/streams/demo') json = state.show;
   else if (path.endsWith('/join')) json = { stream: state.show, agoraAppId: 'mock', channelName: 'mock', token: 'mock', uid: 2 };
   else if (path.endsWith('/summary')) json = { bids: {}, sold: {}, deliveryDeposit: 500, host: { isNew: true }, ...(enabled ? { topUpMethods: flags } : {}) };
   else if (path.endsWith('/notes')) json = { notes: { howToBuy: 'Tap Bid to join' }, firstLine: 'Tap Bid to join' };
   else if (path.endsWith('/me')) json = { depositDue: 500, following: true };
   else if (path.endsWith('/chat')) json = { chatInteractions: [{ id: 'hi', user: 'viewer', content: 'Love this adire!' }] };
   else if (path === '/api/v2/wallet/cards' && route.request().method() === 'GET') json = { cards: state.saved };
   else if (path.startsWith('/api/v2/wallet/cards/') && route.request().method() === 'DELETE') { state.saved = []; json = { removed: true }; }
   else if (path.endsWith('/dva/requery')) json = { message: 'We’re checking your transfer. Keep watching.' };
   else if (path.endsWith('/dva')) {
    if (route.request().method() === 'POST') state.dva = { status: 'pending' };
    json = { ...state.dva, ...(url.searchParams.get('since') && state.latestCredit ? { latestCredit: state.latestCredit } : {}) };
   } else if (path.endsWith('/charge')) {
    if (state.charge === 'declined') return route.fulfill({ status: 422, json: { message: 'Your bank declined this card. Try another card or a bank transfer.' } });
    state.chargeResult = { status: state.charge, reference: 'MOCK_TOPUP', amount: 15000, ...(state.charge === 'needs_bank_check' ? { accessCode: 'mock_resume' } : {}) };
    if (state.charge === 'success') state.balance += 15000;
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
try {
 const { page: before } = await fixture({ enabled: false }); await open(before);
 assert.equal(await before.getByRole('button', { name: /Bank transfer/ }).count(), 0);
 await capture(before, '01-before-popup-only'); await before.close();
 const { page, state } = await fixture();
 await page.getByRole('button', { name: 'Bid ₦12,000', exact: false }).click();
 await page.getByRole('button', { name: /Top up ₦15,000/ }).waitFor(); await capture(page, '02-methods');
 await page.getByRole('button', { name: /^Bank transfer/ }).click();
 await page.getByRole('heading', { name: 'Get your own account number' }).waitFor();
 assert(await page.getByRole('button', { name: 'Get my account number' }).isDisabled());
 await capture(page, '03-bank-consent');
 await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Get my account number' }).click();
 await page.getByRole('status').filter({ hasText: 'Setting up your account number…' }).waitFor(); await capture(page, '04-bank-pending');
 state.dva = account;
 await page.evaluate(account => window.__socket.trigger('wallet_dva_ready', account), account);
 await page.getByText('1234567890', { exact: true }).waitFor(); await capture(page, '05-bank-account');
 await page.getByRole('button', { name: 'Sent it but nothing yet?' }).click();
 await page.getByText('We’re checking your transfer. Keep watching.', { exact: true }).waitFor();
 await page.getByRole('button', { name: 'Back to the show', exact: true }).click();
 await page.getByRole('button', { name: /^Waiting for your transfer/ }).waitFor(); await capture(page, '06-waiting-on-show');
 await page.getByRole('button', { name: /^Waiting for your transfer/ }).click();
 await page.getByText('1234567890', { exact: true }).waitFor(); // pill reopens the account step
 // If another bid arrived, never automatically increase the buyer's chosen amount.
 state.show.products[0].currentBid = 15000; state.balance = 22000;
 await page.evaluate(() => window.__socket.trigger('wallet_credited', { reference: 'BANK_NEW', amount: 20000, source: 'transfer' }));
 await page.getByRole('button', { name: 'Money’s in. Bid ₦16,000?' }).waitFor();
 assert.equal((await page.evaluate(() => window.__emitted || [])).filter(e => e.name === 'stream_place_bid').length, 0);
 await capture(page, '07-money-in-confirm-new-bid');
 await page.getByRole('button', { name: 'Money’s in. Bid ₦16,000?' }).click();
 await page.waitForFunction(() => window.__emitted?.some(e => e.name === 'stream_place_bid' && e.data.bidAmount === 16000));
 assert.deepEqual(state.errors, []); await page.close();
 const { page: bank, state: bs } = await fixture({ saved: false }); bs.dva = account; await open(bank);
 await bank.getByRole('button', { name: /^Bank transfer/ }).click(); await bank.getByText('1234567890', { exact: true }).waitFor();
 bs.balance += 5000;
 await bank.evaluate(() => window.__socket.trigger('wallet_credited', { reference: 'BANK_RECEIPT', amount: 5000, source: 'transfer' }));
 await bank.getByRole('dialog', { name: 'Wallet topped up' }).getByText(/₦5,000 received/).waitFor(); await capture(bank, '08-transfer-received'); await bank.close();
 const { page: auto, state: as } = await fixture();
 await auto.getByRole('button', { name: 'Bid ₦12,000', exact: false }).click();
 await auto.getByRole('button', { name: /Top up ₦15,000/ }).click();
 await auto.waitForFunction(() => window.__emitted?.some(e => e.name === 'stream_place_bid' && e.data.bidAmount === 12000));
 assert.equal((await auto.evaluate(() => window.__emitted)).filter(e => e.name === 'stream_place_bid').length, 1);
 assert.equal((await auto.evaluate(() => window.__emitted)).find(e => e.name === 'stream_place_bid').data.expectedRun, 1);
 await auto.evaluate(() => window.__socket.trigger('wallet_credited', { reference: 'MOCK_TOPUP', amount: 15000, source: 'card' }));
 assert.equal((await auto.evaluate(() => window.__emitted)).filter(e => e.name === 'stream_place_bid').length, 1); await auto.close();
 const { page: charging, state: cs } = await fixture(); cs.charge = 'processing'; await open(charging);
 await charging.getByRole('button', { name: /Top up ₦10,000/ }).click();
 await charging.getByText('Charging Test Bank •••• 4081…', { exact: true }).waitFor(); await capture(charging, '09-card-charging');
 await charging.getByText('Confirming your top-up…', { exact: true }).waitFor(); await capture(charging, '14-card-confirming');
 assert(await charging.getByRole('button', { name: /^Bank transfer/ }).isDisabled()); await charging.close();
 const { page: paused, state: ps } = await fixture(); ps.charge = 'needs_bank_check'; await open(paused);
 await paused.getByRole('button', { name: /Top up ₦10,000/ }).click();
 await paused.getByText('Test Bank wants a code. This happens now and then, even with a saved card.').waitFor();
 await paused.waitForFunction(() => window.__resumed === 'mock_resume'); await capture(paused, '10-card-bank-check');
 await paused.evaluate(() => window.__resumeOptions.onCancel()); await paused.close();
 const { page: decline, state: ds } = await fixture({ width: 320 }); ds.charge = 'declined'; await open(decline);
 await decline.getByRole('button', { name: /Top up ₦10,000/ }).click();
 await decline.getByText('Your bank declined this card. Try another card or a bank transfer.').waitFor(); await capture(decline, '11-card-declined-small-phone');
 await decline.getByRole('button', { name: 'Use another card' }).click(); await decline.waitForFunction(() => window.__popupOptions);
 assert.equal(await decline.evaluate(() => window.__popupOptions.metadata.saveCard), true);
 await decline.close();
 const { page: added } = await fixture(); await open(added); await added.getByRole('button', { name: /Top up ₦10,000/ }).click();
 await added.getByRole('dialog', { name: 'Wallet topped up' }).getByText(/₦15,000 added/).waitFor(); await capture(added, '12-card-added');
 await added.goto(`${base}/wallet`); await added.getByRole('region', { name: 'Saved cards' }).getByText(/4081/).waitFor();
 await capture(added, '13-wallet-saved-cards'); await added.getByRole('button', { name: 'Remove', exact: true }).click();
 await added.getByText('No saved cards yet.').waitFor(); await added.close();
 const { page: purchase, state: bsale } = await fixture();
 bsale.show.products[0] = { ...product(), minBid: 0, currentBid: 0, bidStatus: 'not_started' };
 await purchase.reload(); await purchase.locator('.mock-video').waitFor();
 await purchase.getByRole('button', { name: 'Buy now · ₦11,000', exact: true }).click();
 await purchase.getByRole('button', { name: /Top up ₦10,000/ }).click();
 await purchase.getByRole('dialog', { name: /It’s yours/ }).waitFor();
 const bought = bsale.calls.find(c => c.path.endsWith('/buy-now'));
 assert.equal(bought.body.expectedAmount, 11000); assert.equal(bought.body.expectedRun, 1); assert.equal(bought.body.quantity, 1); await purchase.close();
 const { page: failed, state: fs } = await fixture({ saved: false }); await open(failed);
 await failed.getByRole('button', { name: /^Bank transfer/ }).click(); fs.dva = { status: 'failed' };
 await failed.evaluate(() => window.__socket.trigger('wallet_dva_ready', { status: 'failed' }));
 await failed.getByText('We can’t set up an account number right now. Use a card instead.').waitFor(); await capture(failed, '15-bank-unavailable'); await failed.close();
 console.log('PASS: flags, DVA consent/polling/requery/waiting/receipt, saved-card success/paused/decline/popup, duplicate receipts, original-bid auto-place, price-moved confirmation, removal.');
} finally { await browser.close(); }
