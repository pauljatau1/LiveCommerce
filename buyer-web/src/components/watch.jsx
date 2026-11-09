// Presentational pieces of the Watch screen. Watch.jsx owns the state.
import { useEffect, useRef, useState } from 'react';
import { imageOf, naira } from '../api';
import { Icon } from './ui';

export const idOf = (p) => String(p?.product?.productId || p?.product?._id || '');
export const stepFor = (bid) => (bid < 10000 ? 500 : bid < 50000 ? 1000 : 2500);
export const nextBidFor = (p) => (p.currentBid > 0 ? p.currentBid + stepFor(p.currentBid) : Math.max(p.minBid || 0, 500));
export const who = (u) => u?.username || u?.firstName || 'someone';
export const priceOf = (p) => p?.product?.discountedPrice || p?.product?.price || 0;
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Toggles a class for one beat whenever `value` changes (movement only on state changes)
export function usePulse(value) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setOn(true);
    const t = window.setTimeout(() => setOn(false), 700);
    return () => window.clearTimeout(t);
  }, [value]);
  return on;
}

// Chat on the video: no bubbles. Small avatar, dimmed name, white text; bids in primary-on-dark.
export function ChatFeed({ feed, feedRef, className = '' }) {
  return (
    <div ref={feedRef} className={`feed ${className}`} aria-live="polite">
      {feed.map((m) => (
        <div key={m.id} className={`line ${m.kind}`}>
          {m.kind !== 'sys' && (
            <span className="ava" aria-hidden="true">{m.avatar ? <img src={m.avatar} alt="" /> : (m.user || '?').slice(0, 1).toUpperCase()}</span>
          )}
          <span>{m.user && <span className="nm">{m.user} </span>}<span className="tx">{m.text}</span></span>
        </div>
      ))}
    </div>
  );
}

export function Timer({ secs, plus }) {
  if (typeof secs !== 'number') return null;
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return (
    <span className={`clock${secs <= 10 ? ' hot' : ''}`} aria-label={`${secs} seconds left`} role="timer">
      {m}:{s}{plus ? <span className="plus">+{plus}s</span> : null}
    </span>
  );
}

// Every sheet over the video starts with this: price, state, timer, one action.
export function MiniBidBar({ current, secs, state, action }) {
  if (!current) return null;
  return (
    <div className="minibar">
      <span className="f price-sm">{naira(current.currentBid > 0 ? current.currentBid : current.minBid || priceOf(current))}</span>
      <span className="mut grow">{state || current.product?.name}</span>
      {typeof secs === 'number' && current.bidStatus === 'active' && <Timer secs={secs} />}
      {action}
    </div>
  );
}

export function ItemThumb({ item, size = 56 }) {
  return imageOf(item)
    ? <img src={imageOf(item)} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: 14, objectFit: 'cover', flex: 'none' }} />
    : <span className="sk" style={{ width: size, height: size, flex: 'none', borderRadius: 14 }} />;
}

export function ItemsList({ items, current, buyerId, busy, onBuy }) {
  return (
    <div className="list">
      {items.map((p) => {
        const id = idOf(p);
        const isNow = current && idOf(current) === id;
        const ended = p.bidStatus === 'ended';
        const mine = ended && String(p.bidWinner?.buyer?._id || p.bidWinner?.buyer || '') === String(buyerId || '');
        const stock = p.product?.quantity;
        let line;
        if (ended) line = p.bidWinner?.bidAmount ? `Sold · ${mine ? 'you' : who(p.bidWinner?.buyer)} · ${naira(p.bidWinner.bidAmount)}` : 'Not sold';
        else if (p.minBid) line = `Auction · from ${naira(p.minBid)}`;
        else line = `Drop · ${naira(priceOf(p))}${typeof stock === 'number' ? ` · ${stock} left` : ''}`;
        return (
          <div key={id} className="li">
            <ItemThumb item={p} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {isNow && <div className="cap">ON NOW</div>}
              <div style={{ fontWeight: 700 }}>{p.product?.name}</div>
              <div className="mut" style={{ fontSize: 14 }}>{line}</div>
            </div>
            {onBuy && !p.minBid && !ended && stock !== 0 && (
              <button type="button" className="btn" style={{ minHeight: 44, padding: '0 14px' }} disabled={busy} onClick={() => onBuy(p)}>{naira(priceOf(p))}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const RailButton = ({ label, onClick, children }) => (
  <button type="button" className="rail-btn" onClick={onClick} aria-label={label}>
    <span className="rail-ic">{children}</span>
    <span className="rail-lb" aria-hidden="true">{label}</span>
  </button>
);

// "Delivery to Lekki about ₦2,500 · one fee this show"
export const deliveryLine = (est) => (est?.available ? `Delivery to ${est.area} about ${naira(est.amount)} · one fee this show` : null);

export { Icon };
