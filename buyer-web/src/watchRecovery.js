// One authoritative refresh at a time. If a newer live event arrives while an
// HTTP snapshot is in flight, discard that snapshot and fetch again.
export function createRecovery({ load, apply, status }) {
  let disposed = false;
  let running = null;
  let revision = 0;
  let pending = false;
  return {
    invalidate() { revision += 1; },
    refresh({ quiet = false } = {}) {
      if (disposed) return Promise.resolve();
      if (running) { pending = true; if (!quiet) status('syncing'); return running; }
      if (!quiet) status('syncing');
      running = (async () => {
        try {
          do {
            pending = false;
            const before = revision;
            const snapshot = await load();
            if (disposed) return;
            if (before === revision) apply(snapshot);
            else pending = true;
          } while (pending && !disposed);
          if (!disposed) status('ready');
        } catch {
          if (!disposed) status('failed');
        } finally { running = null; }
      })();
      return running;
    },
    dispose() { disposed = true; },
  };
}

export function timersFor(items, now = Date.now()) {
  return Object.fromEntries(items.filter((p) => p.bidStatus === 'active' && Number.isFinite(Date.parse(p.auctionEndsAt)))
    .map((p) => [String(p.product?.productId || p.product?._id || ''), Math.max(0, Math.ceil((Date.parse(p.auctionEndsAt) - now) / 1000))]));
}
