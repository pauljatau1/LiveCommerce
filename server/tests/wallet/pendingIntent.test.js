// Evaluate the dependency-free browser module in CommonJS Jest. Only the ES
// export keywords are removed; the production policy itself runs unchanged.
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../../buyer-web/src/walletIntents.js'), 'utf8');
const { resolveWalletIntent, oneTapAmount } = new Function(`${source.replace(/^import .*features.js';\n/m, 'const COLOURS=false;\n').replace(/^export /gm, '')}; return { resolveWalletIntent, oneTapAmount };`)();
const item = (extra = {}) => ({ product: { productId: 'adire', price: 11000, quantity: 3 }, minBid: 11000,
  bidStatus: 'active', currentBid: 11000, isVisible: true, run: 2, auctionEndsAt: new Date(Date.now() + 60000).toISOString(), ...extra });
const intent = { kind: 'bid', productId: 'adire', amount: 12000, run: 2, buyerId: 'ada' };
const decide = (p = item(), i = intent, balance = 12500, deposit = 500) => resolveWalletIntent(i, { status: 'live', products: [p] }, balance, deposit, 'ada');
it('rounds shortfalls UP to the next ₦5,000', () => {
  expect([1, 5000, 5001, 11000].map(oneTapAmount)).toEqual([5000, 5000, 10000, 15000]);
});
it('automatically places only the original valid bid with delivery covered', () => {
  expect(decide()).toMatchObject({ type: 'auto', action: { amount: 12000, run: 2, productId: 'adire' } });
  expect(decide(item(), intent, 12499).type).toBe('ask');
  expect(decide(item({ currentBidder: 'ada' }), intent, 1500).type).toBe('auto');
});
it('asks for the current next bid after the price or run moves; never raises automatically', () => {
  expect(decide(item({ currentBid: 15000 }))).toMatchObject({ type: 'ask', action: { amount: 16000 } });
  expect(decide(item({ run: 3 }))).toMatchObject({ type: 'ask', action: { run: 3 } });
  expect(decide(item({ auctionEndsAt: new Date(0).toISOString() })).type).toBe('none');
  expect(decide(item({ bidStatus: 'ended' })).type).toBe('none');
});
it('asks when the host has moved to another item', () => {
  expect(decide(item({ product: { productId: 'ankara' }, currentBid: 15000 }))).toMatchObject({ type: 'ask', action: { productId: 'ankara', amount: 16000 } });
});
it('does nothing after show end, sign-out/account change, or a failed balance refresh', () => {
  expect(resolveWalletIntent(intent, { status: 'ended', products: [item()] }, 50000, 0, 'ada').type).toBe('none');
  expect(decide(item(), { ...intent, buyerId: 'other' }).type).toBe('none');
  expect(decide(item(), intent, NaN).type).toBe('none');
});
it('automatically buys only at the chosen price and quantity; changes need confirmation', () => {
  const p = item({ minBid: 0, bidStatus: 'none' });
  const i = { ...intent, kind: 'buy', quantity: 2, amount: 22000 };
  expect(decide(p, i, 22500).type).toBe('auto');
  expect(decide(p, i, 22499).type).toBe('ask');
  expect(decide({ ...p, product: { ...p.product, price: 12000 } }, i, 50000)).toMatchObject({ type: 'ask', action: { amount: 24000 } });
  expect(decide({ ...p, product: { ...p.product, quantity: 1 } }, i, 50000)).toMatchObject({ type: 'ask', action: { quantity: 1 } });
  expect(decide({ ...p, run: 3 }, i, 50000).type).toBe('ask');
  expect(decide({ ...p, isVisible: false }, i, 50000).type).toBe('ask');
  expect(decide({ ...p, product: { ...p.product, quantity: 0 } }, i, 50000).type).toBe('none');
});

it('never resumes spending while the real delivery quote is unavailable', () => {
  for (const deposit of [null, undefined, NaN, -1]) {
    expect(resolveWalletIntent(intent, { status: 'live', products: [item()] }, 50000, deposit, 'ada').type).toBe('none');
  }
});
