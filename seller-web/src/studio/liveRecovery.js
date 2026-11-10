// One authoritative refresh at a time. If a newer live event arrives while an
// HTTP snapshot is in flight, discard that snapshot and fetch again.
export function createLiveRecovery({ load, apply, status }) {
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
        let latest;
        try {
          do {
            pending = false;
            const before = revision;
            const snapshot = await load();
            if (disposed) return;
            if (before === revision) { apply(snapshot); latest = snapshot; }
            else pending = true;
          } while (pending && !disposed);
          if (!disposed) status('ready');
          return latest;
        } catch (error) {
          if (!disposed) status('failed');
          throw error;
        } finally { running = null; }
      })();
      return running;
    },
    dispose() { disposed = true; },
  };
}

export const studioTimers = (items, now = Date.now()) => Object.fromEntries(items
  .filter((i) => i.bidStatus === 'active' && Number.isFinite(Date.parse(i.auctionEndsAt)))
  .map((i) => [i.productId, Math.max(0, Math.ceil((Date.parse(i.auctionEndsAt) - now) / 1000))]));
export const selectedItem = (items, previous) => (items.find((i) => i.bidStatus === 'active') || items.find((i) => i.isVisible) || items.find((i) => i.productId === previous) || items[0])?.productId || null;
export const runState = (item, seconds) => ({
  running: item?.bidStatus === 'active',
  settling: Boolean(item?.settlementPending || (item?.bidStatus === 'ongoing' && !item?.canRunAgain) || (item?.bidStatus === 'active' && seconds === 0)),
  canRunAgain: Boolean(item?.canRunAgain && item.stock > 0),
});
