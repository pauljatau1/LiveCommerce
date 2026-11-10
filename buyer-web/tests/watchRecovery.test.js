import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecovery, timersFor } from '../src/watchRecovery.js';

const deferred = () => { let resolve; let reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };

test('foreground refresh applies the latest scene, including an ended show', async () => {
  const applied = []; const status = [];
  const r = createRecovery({ load: async () => ({ status: 'ended', products: [] }), apply: (scene) => applied.push(scene), status: (s) => status.push(s) });
  await r.refresh();
  assert.equal(applied[0].status, 'ended');
  assert.deepEqual(status, ['syncing', 'ready']);
});

test('a live event during refresh cannot be overwritten by an older snapshot', async () => {
  const first = deferred(); const applied = []; let calls = 0;
  const r = createRecovery({ load: () => ++calls === 1 ? first.promise : Promise.resolve('new item'), apply: (s) => applied.push(s), status() {} });
  const done = r.refresh();
  r.invalidate();
  first.resolve('old item');
  await done;
  assert.deepEqual(applied, ['new item']);
});

test('simultaneous resume events share one request and one follow-up', async () => {
  const first = deferred(); let calls = 0;
  const r = createRecovery({ load: () => ++calls === 1 ? first.promise : Promise.resolve('latest'), apply() {}, status() {} });
  const done = r.refresh();
  assert.equal(r.refresh(), done);
  r.refresh(); r.refresh();
  assert.equal(calls, 1);
  first.resolve('first'); await done;
  assert.equal(calls, 2);
});

test('unmounted watches ignore late responses and status changes', async () => {
  const request = deferred(); const applied = []; const status = [];
  const r = createRecovery({ load: () => request.promise, apply: (s) => applied.push(s), status: (s) => status.push(s) });
  const done = r.refresh(); r.dispose(); request.resolve('old show'); await done;
  await r.refresh();
  assert.deepEqual(applied, []);
  assert.deepEqual(status, ['syncing']);
});

test('failed refresh keeps the old state and a retry can recover', async () => {
  let fail = true; const status = []; const applied = [];
  const r = createRecovery({ load: async () => { if (fail) throw new Error('offline'); return 'latest'; }, apply: (s) => applied.push(s), status: (s) => status.push(s) });
  await r.refresh(); assert.deepEqual(applied, []);
  fail = false; await r.refresh();
  assert.deepEqual(status, ['syncing', 'failed', 'syncing', 'ready']);
  assert.deepEqual(applied, ['latest']);
});

test('restores countdowns from server deadlines rather than stale ticks', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  assert.deepEqual(timersFor([
    { product: { productId: 'current' }, bidStatus: 'active', auctionEndsAt: '2026-11-10T12:00:09Z' },
    { product: { productId: 'expired' }, bidStatus: 'active', auctionEndsAt: '2026-11-10T11:59:00Z' },
    { product: { productId: 'old' }, bidStatus: 'ended', auctionEndsAt: '2026-11-10T12:00:30Z' },
    { product: { productId: 'invalid' }, bidStatus: 'active', auctionEndsAt: 'n/a' },
  ], now), { current: 9, expired: 0 });
});

test('a background status check does not mark bidding as reconnecting', async () => {
  const status = [];
  const r = createRecovery({ load: async () => ({ status: 'live' }), apply() {}, status: (s) => status.push(s) });
  await r.refresh({ quiet: true });
  assert.deepEqual(status, ['ready']);
});
