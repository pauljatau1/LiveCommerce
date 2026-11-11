// Shared studio pieces: icons, status pills, empty and error states.
/* eslint-disable react-refresh/only-export-components */
import { useRef, useState } from 'react';
import './studio.css';

const s = { 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  bell: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></svg>,
  home: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z" /></svg>,
  products: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>,
  live: (c = '#fff', size = 24) => <svg {...s} stroke={c} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="6" width="14" height="12" rx="3" /><path d="M16 10l6-3v10l-6-3z" /></svg>,
  orders: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></svg>,
  me: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>,
  back: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 5l-7 7 7 7" /></svg>,
  close: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  chevron: (c = 'currentColor') => <svg {...s} stroke={c} width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>,
  plus: <svg {...s} stroke="#fff" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>,
  camera: <svg {...s} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13" r="4" /></svg>,
  check: <svg {...s} stroke="#fff" width="12" height="12" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 12l5 5 9-10" /></svg>,
  money: <svg {...s} width="22" height="22" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="3" /><circle cx="12" cy="12.5" r="2.5" /></svg>,
  share: <svg {...s} width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.2"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>,
  eye: <svg {...s} width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  mic: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.2"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  micOff: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.2"><path d="M15 9.5V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M3 3l18 18" /></svg>,
  flip: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 11a8 8 0 0 0-14-4L4 9M4 13a8 8 0 0 0 14 4l2-2" /><path d="M4 4v5h5M20 20v-5h-5" /></svg>,
  send: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4l2 8z" /></svg>,
  search: <svg {...s} width="20" height="20" viewBox="0 0 24 24" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>,
};

// Product status → pill
export const PRODUCT_PILL = {
  active: ['p-active', 'Ready'],
  in_show: ['p-show', 'In a show'],
  sold_out: ['p-sold', 'Sold out'],
  hidden: ['p-draft', 'Hidden'],
};

// Delivery status → pill (seller's words)
export const DELIVERY_PILL = {
  collecting: ['p-show', 'Show still on'],
  quote_failed: ['p-warn', 'Pricing delivery'],
  awaiting_payment: ['p-warn', 'Buyer to pay delivery'],
  paid: ['p-warn', 'To ship'],
  booked: ['p-show', 'Pickup booked'],
  in_transit: ['p-active', 'On the way'],
  delivered: ['p-active', 'Delivered'],
  cancelled: ['p-draft', 'Cancelled'],
};

export const Pill = ({ map, status }) => {
  const [tone, label] = map[status] || ['p-draft', status];
  return <span className={`pill ${tone}`}>{label}</span>;
};

export const Empty = ({ icon, title, text, action }) => (
  <div className="card empty">
    <div className="blob" style={{ color: 'var(--primary)' }}>{icon}</div>
    <span className="f" style={{ fontSize: 'var(--t-h2)' }}>{title}</span>
    {text && <span className="mut" style={{ fontSize: 'var(--t-body)' }}>{text}</span>}
    {action}
  </div>
);

export const Problem = ({ text, onRetry }) => (
  <div className="banner b-warn" role="alert" style={{ borderRadius: 16 }}>
    <span style={{ flex: 1 }}>{text}</span>
    {onRetry && <button type="button" className="link" style={{ color: 'var(--warning)' }} onClick={onRetry}>Try again</button>}
  </div>
);

export const Skeleton = ({ h = 80, r = 20 }) => <span className="sk" style={{ display: 'block', height: h, borderRadius: r }} />;

export const Thumbs = ({ images = [], size = 44 }) => (
  <span style={{ display: 'flex', flex: 'none' }}>
    {(images.length ? images : [null]).slice(0, 2).map((src, n) => (src
      ? <img key={n} src={src} alt="" style={{ width: size, height: size, borderRadius: 12, border: '2px solid #fff', objectFit: 'cover', marginLeft: n ? -14 : 0 }} />
      : <span key={n} className="sk" style={{ width: size, height: size, borderRadius: 12, marginLeft: n ? -14 : 0 }} />))}
  </span>
);

// Page header for inner screens: back button, title, optional right side
export const TopBar = ({ title, sub, onBack, right, close }) => (
  <header className="top" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
    {onBack && <button type="button" className="ib" aria-label={close ? 'Close' : 'Back'} onClick={onBack}>{close ? Icon.close : Icon.back}</button>}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span className="f" style={{ fontSize: 'var(--t-h2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      {sub && <span className="mut" style={{ fontSize: 'var(--t-small)', fontWeight: 'var(--w-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>}
    </div>
    {right}
  </header>
);

// Bottom sheet with scrim, sized to its content. Closes on a scrim tap, Escape,
// swiping down, or the optional ✕ at the top right.
export const Sheet = ({ label, onClose, children, closeX = false, lift = 0, maxHeight = null, className = '' }) => {
  const ref = useRef(null);
  const startY = useRef(null);
  const [drag, setDrag] = useState(0);
  const onTouchStart = (e) => { if ((ref.current?.scrollTop || 0) <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => { if (startY.current !== null) setDrag(Math.max(0, e.touches[0].clientY - startY.current)); };
  const onTouchEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (drag > 80) onClose();
    setDrag(0);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <button type="button" aria-label="Close" className="scrim" style={{ border: 0, cursor: 'pointer' }} onClick={onClose} />
      <section
        ref={ref}
        className={`sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        // lift: sits just above the on-screen keyboard; maxHeight: the visible height
        style={{ maxWidth: 560, margin: '0 auto', bottom: lift || undefined, maxHeight: maxHeight || undefined, paddingBottom: lift ? 12 : 'max(18px, env(safe-area-inset-bottom))', transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? 'none' : 'transform .2s' }}
      >
        <span className="grab" aria-hidden="true" />
        {closeX && <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>{Icon.close}</button>}
        {children}
      </section>
    </div>
  );
};
