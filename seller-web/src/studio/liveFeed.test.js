// node --test src/studio/liveFeed.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { feedEntryFor, winnerName } from './liveFeed.js';

test('a win line names the winner, not the host', () => {
  // As the server sends it: `user` is the store name, the winner is in data.bidWinner
  const n = { type: 'auction_winner', user: 'Test Store', content: 'test_user won the auction', data: { bidWinner: { buyer: { _id: 'b9', username: 'test_user', firstName: 'Test' }, bidAmount: 2000 } } };
  const line = feedEntryFor(n);
  assert.equal(line.kind, 'win');
  assert.equal(line.user, 'test_user');
  assert.notEqual(line.user, 'Test Store');
  assert.match(line.text, /^won it for ₦2,000$/);
});

test('falls back to the first name, then "A buyer"', () => {
  assert.equal(winnerName({ bidWinner: { buyer: { firstName: 'Ada' } } }), 'Ada');
  assert.equal(winnerName({ bidWinner: { buyer: 'b9' } }), 'A buyer');
  assert.equal(winnerName({}), 'A buyer');
});

test('chat, bids and buys keep the sender; system lines are short', () => {
  assert.deepEqual(feedEntryFor({ type: 'comment', user: 'yayo', content: 'Yest jhf' }), { kind: 'comment', user: 'yayo', avatar: undefined, text: 'Yest jhf' });
  assert.equal(feedEntryFor({ type: 'new_bid', user: 'test_user', data: { bidAmount: 2000 } }).text, 'bid ₦2,000');
  assert.deepEqual(feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p1', name: 'Top Gear Item (Unclear Screenshot)' } } } }), { kind: 'sys', text: 'Bidding is open', key: 'open:p1:1' });
  assert.equal(feedEntryFor({ type: 'join' }), null);
});

test('"Bidding is open" has the same key each time the same item is announced', () => {
  const a = feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p2' } } } });
  const b = feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p2' } } } });
  const c = feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p3' } } } });
  assert.equal(a.key, b.key);
  assert.notEqual(a.key, c.key);
});

test('host messages are marked, so chat can show a "Host" label', () => {
  assert.equal(feedEntryFor({ type: 'comment', user: 'Test Store', content: 'Yes we deliver', data: { isHost: true } }).host, true);
  assert.equal(feedEntryFor({ type: 'comment', user: 'ada', content: 'hi', data: {} }).host, undefined);
});

test('a second run of the same item gets its own "Bidding is open"', () => {
  const first = feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p2' }, run: 1 } } });
  const again = feedEntryFor({ type: 'auction_start', data: { product: { product: { productId: 'p2' }, run: 2 } } });
  assert.notEqual(first.key, again.key);
});
