import ImageGallery from './ImageGallery';
const LEGACY_STATIC_PHOTOS=false;
import {deliveryEstimateText} from '../deliverySettlement';
import SafeDescription from './SafeDescription';
// Presentational pieces of the Watch screen. Watch.jsx owns the state.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// Chat on the video: no bubbles. Small avatar; the name on its own line in small dimmed
// text, the message underneath in white; bids in primary-on-dark. The list scrolls by
// touch; it stays on the newest message unless the viewer has scrolled up, and then a
// "New messages ↓" chip jumps back down.
export function ChatFeed({ feed, className = '', max = 80 }) {
  const ref = useRef(null);
  const stuck = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const shown = feed.slice(-max);
  const lastId = shown[shown.length - 1]?.id;

  const toBottom = (smooth) => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (stuck.current) setUnseen(false);
  };
  useLayoutEffect(() => {
    if (stuck.current) toBottom(false);
    else if (lastId) setUnseen(true);
  }, [lastId]);

  return (
    <div className={`feed-wrap ${className}`}>
      <div ref={ref} className="feed" aria-live="polite" onScroll={onScroll}>
        {shown.map((m) => (
          <div key={m.id} className={`line ${m.kind}`}>
            {m.kind !== 'sys' && m.kind !== 'hidden' && (
              <span className="ava" aria-hidden="true">{m.avatar ? <img src={m.avatar} alt="" /> : (m.user || '?').slice(0, 1).toUpperCase()}</span>
            )}
            <span className="line-tx">
              {m.user && m.kind !== 'sys' && m.kind !== 'hidden' && <span className="nm">{m.user}{m.host && <span className="host-tag">Host</span>}</span>}
              <span className="tx">{m.kind === 'sys' && m.user ? `${m.user} ${m.text}` : m.text}</span>
            </span>
          </div>
        ))}
      </div>
      {unseen && (
        <button type="button" className="new-msgs" onClick={() => { stuck.current = true; setUnseen(false); toBottom(true); }}>New messages ↓</button>
      )}
    </div>
  );
}

// Up next, as one compact row: 32px photo, "Up next · <name>" on one line, price on the right
export function UpNextRow({ item, onClick }) {
  if (!item) return null;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className="upnext-row" onClick={onClick}>
      <ItemThumb item={item} size={32} />
      <span className="un-tx"><b>Up next</b> · {item.product?.name}</span>
      <span className="un-price">{item.minBid ? `from ${naira(item.minBid)}` : naira(priceOf(item))}</span>
    </Tag>
  );
}

// The on-screen keyboard. iOS doesn't shrink the page (vh) when it opens, only the
// visual viewport, and may scroll the page up. Returns how much of the bottom the
// keyboard covers and how far the page was scrolled, so the input can sit just above it.
export function useKeyboardInset() {
  const [inset, setInset] = useState({ bottom: 0, top: 0 });
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return undefined;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      // Small differences are browser bars, not a keyboard
      setInset({ bottom: covered > 80 ? Math.round(covered) : 0, top: Math.max(0, Math.round(vv.offsetTop || 0)) });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return inset;
}

// "ships in 1–2 days" from the host's real median (null until known)
export const shipsLine = (days) => (!days ? '' : days <= 1 ? 'ships in 1 day' : `ships in ${days - 1}–${days} days`);

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
  if(!LEGACY_STATIC_PHOTOS && imageOf(item))return <ImageGallery images={item.product?.images?.length?item.product.images:[imageOf(item)]} alt={item.product?.name || 'Product'} size={size}/>;
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
              {p.product?.description && <details><summary className="link">About this item</summary><SafeDescription value={p.product.description}/></details>}
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
// Shipbubble's price to the buyer's address (never a guess): "Delivery to Maryland, Lagos ₦2,450 · one fee this show"
export const deliveryLine = (est) => (est?.available ? deliveryEstimateText(est.amount) : null);

export { Icon };
