import {COLOURS} from './features.js';
const idOf = (p) => String(p?.product?.productId || p?.product?._id || '');
const priceOf = (p) => p?.product?.discountedPrice || p?.product?.price || 0;
const nextBid = (p) => p.currentBid > 0 ? p.currentBid + (p.currentBid < 10000 ? 500 : p.currentBid < 50000 ? 1000 : 2500) : Math.max(p.minBid || 0, 500);
export const oneTapAmount = (shortfall) => Math.max(5000, Math.ceil(Math.max(0, shortfall) / 5000) * 5000);

// Pure policy: the chosen bid/price is a ceiling, never permission to spend more.
export function resolveWalletIntent(intent, scene, balance, depositDue, buyerId, colours=COLOURS) {
  if (!intent || scene?.status !== 'live' || !Number.isFinite(balance) || !Number.isFinite(depositDue) || depositDue < 0 || String(intent.buyerId) !== String(buyerId)) return { type: 'none' };
  const items = scene.products || [];let item = items.find((p) => idOf(p) === intent.productId);
  if (intent.kind === 'bid') {
    const open = item?.bidStatus === 'active' && (!item.auctionEndsAt || Date.parse(item.auctionEndsAt) > Date.now());
    const sameRun = Number(item?.run || 1) === Number(intent.run || 1);
    const held = String(item?.currentBidder?._id || item?.currentBidder) === String(buyerId) ? Number(item.currentBid) || 0 : 0;
    if (open && sameRun && intent.amount >= nextBid(item) && balance >= intent.amount - held + depositDue) return { type: 'auto', action: { ...intent } };
    const current = items.find((p) => p.bidStatus === 'active' && (!p.auctionEndsAt || Date.parse(p.auctionEndsAt) > Date.now()));
    return current ? { type: 'ask', action: { ...intent, productId: idOf(current), run: current.run || 1, amount: nextBid(current) } } : { type: 'none' };
  }
  if (intent.kind === 'buy') {
    const colour=intent.item?.product?.chosenColour;
    if(colours&&colour&&item){const row=item.product?.colourQuantities?.find(c=>c.colour===colour);if(!row||row.quantity<1)return {type:'none'};const p=item.product;const name=p.colour?p.name.slice(0,-(p.colour.length+3)):p.name;item={...item,product:{...p,chosenColour:colour,name:`${name} · ${colour}`,quantity:row.quantity}};}

    const amount = item ? priceOf(item) * intent.quantity : 0;
    if (item && Number(item.run || 1) === Number(intent.run || 1) && item.isVisible && !item.minBid && item.bidStatus !== 'ended' && item.product?.quantity >= intent.quantity &&
        amount === intent.amount && balance >= amount + depositDue) return { type: 'auto', action: { ...intent, item } };
    return item && !item.minBid && item.product?.quantity > 0 ? { type: 'ask', action: { ...intent, quantity: Math.min(intent.quantity, item.product.quantity),
      amount: priceOf(item) * Math.min(intent.quantity, item.product.quantity), item } } : { type: 'none' };
  }
  return { type: 'none' };
}
