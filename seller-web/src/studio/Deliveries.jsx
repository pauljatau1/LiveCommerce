// Deliveries: one package per buyer per show. Book pickups, follow tracking.
// Design: Claude Design canvas "S-Orders" / "S-Order-Detail".
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL_V2 } from '@/Constants/Server';
import { tokenUtils } from '@/util/auth';
import './studio.css';

const auth = () => ({ headers: { Authorization: `Bearer ${tokenUtils.getBearerToken()}` } });
const naira = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;
const message = (e, fallback) => e?.response?.data?.message || fallback;

const TABS = [
  { key: 'book', label: 'To book', statuses: ['paid'] },
  { key: 'waiting', label: 'Waiting', statuses: ['collecting', 'awaiting_payment', 'quote_failed'] },
  { key: 'moving', label: 'Booked · on the way', statuses: ['booked', 'in_transit'] },
  { key: 'done', label: 'Delivered', statuses: ['delivered', 'cancelled'] },
];
const PILL = {
  collecting: ['p-show', 'Show still on'],
  awaiting_payment: ['p-warn', 'Buyer to pay delivery'],
  quote_failed: ['p-sold', 'Pricing delivery'],
  paid: ['p-warn', 'To book'],
  booked: ['p-show', 'Booked'],
  in_transit: ['p-active', 'On the way'],
  delivered: ['p-active', 'Delivered'],
  cancelled: ['p-draft', 'Cancelled'],
};

const back = <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 5l-7 7 7 7" /></svg>;

function Detail({ d, onBack, onChange, sandbox }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const act = async (path, label, body = {}) => {
    setBusy(label); setError('');
    try {
      const res = await axios.post(`${BASE_URL_V2}/deliveries/${d._id}/${path}`, body, { ...auth(), timeout: 60000 });
      onChange(res.data.delivery);
    } catch (e) {
      setError(message(e, 'Something went wrong. Try again.'));
    } finally {
      setBusy('');
    }
  };
  const [tone, label] = PILL[d.status] || ['p-draft', d.status];
  const who = d.buyer?.firstName || d.buyer?.username || 'Buyer';
  const steps = [
    ['Paid', ['paid', 'booked', 'in_transit', 'delivered'].includes(d.status)],
    ['Pickup booked', ['booked', 'in_transit', 'delivered'].includes(d.status)],
    ['On the way', ['in_transit', 'delivered'].includes(d.status)],
    ['Delivered', d.status === 'delivered'],
  ];
  return (
    <div className="studio-app">
      <header className="top" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <button type="button" className="ib" aria-label="Back" onClick={onBack}>{back}</button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="f" style={{ fontSize: 17 }}>{who} · {d.itemCount} item{d.itemCount === 1 ? '' : 's'}</span>
          <span className="mut" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>From {d.show?.title || 'a live show'}</span>
        </div>
        <span className={`pill ${tone}`}>{label}</span>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, width: '100%', maxWidth: 640, margin: '0 auto' }}>
        <section className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Buyer">
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', font: '800 16px var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{who.slice(0, 2).toUpperCase()}</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 800, fontSize: 17 }}>{who}</span><span className="mut" style={{ fontSize: 14 }}>{d.buyer?.area || 'Delivery address on file'}</span></div>
        </section>
        {d.itemCount > 1 && <div className="soft s-primary" style={{ fontSize: 14, lineHeight: 1.45 }}>{who} got {d.itemCount} items in this show, so they ship together in one package.</div>}
        <section className="card" style={{ padding: '4px 16px' }} aria-label="Items">
          {d.items.map((i, n) => (
            <div key={i.order} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: n < d.items.length - 1 ? '1px solid #F1EBE3' : 0 }}>
              {i.image ? <img src={i.image} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 800 }}>{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}</span><span className="mut" style={{ fontSize: 13 }}>{i.category}</span></div>
              <span className="f" style={{ fontSize: 16 }}>{naira(i.unitPrice * (i.quantity || 1))}</span>
            </div>
          ))}
        </section>
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Delivery">
          <h2 className="h2">Pickup</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 800 }}>{d.courier || 'Courier chosen at pricing'}</span><span className="mut" style={{ fontSize: 14 }}>{d.deliveryEta || 'Cheapest courier for this route'}</span></div>
            {d.fee ? <span className="f" style={{ fontSize: 17 }}>{naira(d.fee)}</span> : null}
          </div>
          {d.status === 'paid' && <span className="hint">Delivery is paid by {who}. Booking charges your Shipbubble wallet; make sure it's funded.</span>}
          {d.status === 'booked' && <span className="hint">You can cancel until the courier processes the pickup.</span>}
          {d.status === 'awaiting_payment' && <span className="hint">{who} needs to pay {naira(d.fee)} for delivery before you can book.</span>}
          {d.status === 'collecting' && <span className="hint">Delivery is priced and charged when the show ends.</span>}
          {d.status === 'quote_failed' && <span className="err-text">{d.lastError || "Couldn't price this delivery yet. We retry every 10 minutes."}</span>}
          {error && <span className="err-text" role="alert">{error}</span>}
          {d.status === 'paid' && <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => act('book', 'book')}>{busy === 'book' ? 'Booking…' : 'Book pickup'}</button>}
          {['quote_failed', 'awaiting_payment'].includes(d.status) && <button type="button" className="btn2" disabled={Boolean(busy)} onClick={() => act('requote', 'requote')}>{busy === 'requote' ? 'Getting a price…' : 'Get a new delivery price'}</button>}
          {d.trackingUrl && <a className="btn2" href={d.trackingUrl} target="_blank" rel="noopener noreferrer">Open tracking</a>}
          {['booked', 'in_transit'].includes(d.status) && <button type="button" className="btn3" disabled={Boolean(busy)} onClick={() => act('refresh', 'refresh')}>{busy === 'refresh' ? 'Checking…' : 'Check for updates'}</button>}
          {d.status === 'booked' && <button type="button" className="link" style={{ alignSelf: 'center', color: 'var(--danger)' }} disabled={Boolean(busy)} onClick={() => act('cancel', 'cancel')}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel pickup'}</button>}
        </section>
        {sandbox && ['booked', 'in_transit'].includes(d.status) && (
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, border: '2px dashed var(--border-strong)' }} aria-label="Test controls">
            <h2 className="h2">Test courier (staging only)</h2>
            <span className="hint">Pretend to be the courier. Each tap makes Shipbubble send a real update, so the buyer's Orders page changes too. Hidden when you switch to a live key.</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['picked_up', 'Picked up'], ['in_transit', 'On the way'], ['completed', 'Delivered']].map(([s, label]) => (
                <button key={s} type="button" className="btn3" disabled={Boolean(busy)} onClick={() => act('simulate', s, { status: s })}>{busy === s ? 'Sending…' : label}</button>
              ))}
            </div>
          </section>
        )}
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Tracking">
          <h2 className="h2">Progress</h2>
          {steps.map(([t, done]) => (
            <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', background: done ? 'var(--success)' : '#fff', border: done ? 0 : '2px solid var(--border-strong)' }} />
              <span style={{ fontWeight: done ? 800 : 700, color: done ? 'var(--text)' : 'var(--text-muted)' }}>{t}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

// After a show ends: summary of what sold and what happens next
function ShowEnded({ mine, onPastShows }) {
  const pricing = mine.filter((d) => ['collecting', 'quote_failed'].includes(d.status)).length;
  const toPay = mine.filter((d) => d.status === 'awaiting_payment').length;
  const ready = mine.filter((d) => d.status === 'paid').length;
  const items = mine.reduce((n, d) => n + (d.itemCount || 0), 0);
  if (!mine.length) {
    return (
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="f" style={{ fontSize: 18 }}>Show ended</span>
        <span className="mut" style={{ fontSize: 14 }}>Nothing sold this time, so there's nothing to send.</span>
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={onPastShows}>See past shows</button>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }} role="status">
      <span className="f" style={{ fontSize: 18 }}>Show ended · {items} item{items === 1 ? '' : 's'} to {mine.length} buyer{mine.length === 1 ? '' : 's'}</span>
      <span style={{ fontSize: 15, lineHeight: 1.45 }}>Each buyer's items ship as one package. Delivery is priced and paid from their wallet automatically; you just book the pickup.</span>
      <ul className="mut" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
        {ready > 0 && <li><b style={{ color: 'var(--text)' }}>{ready} ready to book</b>: tap one below, then Book pickup.</li>}
        {pricing > 0 && <li>{pricing} getting a delivery price. This page updates by itself.</li>}
        {toPay > 0 && <li>{toPay} waiting for the buyer to top up and pay delivery.</li>}
      </ul>
    </div>
  );
}

export default function Deliveries() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const endedShow = params.get('ended');
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('book');
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');
  const [sandbox, setSandbox] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL_V2}/deliveries/seller`, auth());
      setList(res.data.deliveries || []);
      setSandbox(Boolean(res.data.sandbox));
    } catch (e) {
      setError(message(e, "Couldn't load deliveries."));
      setList([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const mine = useMemo(() => (endedShow && list ? list.filter((d) => String(d.show?._id || d.stream) === endedShow) : []), [list, endedShow]);
  // Just after a show: keep checking until every package from it has a price (up to 3 minutes)
  const stillPricing = mine.some((d) => ['collecting', 'quote_failed'].includes(d.status));
  useEffect(() => {
    if (!endedShow) return undefined;
    const started = Date.now();
    const t = setInterval(() => { if (Date.now() - started < 180000) load(); }, 8000);
    return () => clearInterval(t);
  }, [endedShow, load]);
  // Open on the tab where this show's packages are
  const [tabChosen, setTabChosen] = useState(false);
  useEffect(() => {
    if (!endedShow || tabChosen || !mine.length) return;
    setTab(mine.some((d) => d.status === 'paid') ? 'book' : 'waiting');
    if (!stillPricing) setTabChosen(true);
  }, [endedShow, mine, stillPricing, tabChosen]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (list || []).filter((d) => t.statuses.includes(d.status)).length])), [list]);
  const shown = (list || []).filter((d) => TABS.find((t) => t.key === tab).statuses.includes(d.status));

  if (open) {
    return <Detail d={open} sandbox={sandbox} onBack={() => { setOpen(null); load(); }} onChange={(d) => { setOpen(d); setList((l) => l.map((x) => (x._id === d._id ? d : x))); }} />;
  }

  return (
    <div className="studio-app">
      <header className="top" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <button type="button" className="ib" aria-label="Back to dashboard" onClick={() => navigate('/dashboard/home')}>{back}</button>
        <h1 className="f" style={{ margin: 0, fontSize: 22, flex: 1 }}>Deliveries</h1>
      </header>
      <div role="group" aria-label="Delivery status" style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`chip${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => { setTab(t.key); setTabChosen(true); }}>{t.label}{list ? ` · ${counts[t.key]}` : ''}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 32px', width: '100%', maxWidth: 720, margin: '0 auto' }}>
        {error && <span className="err-text" role="alert">{error}</span>}
        {endedShow && list && <ShowEnded mine={mine} onPastShows={() => navigate('/dashboard/live-streams/past-shows')} />}
        {tab === 'book' && counts.book > 0 && (
          <div className="soft s-primary" style={{ fontSize: 15, lineHeight: 1.45 }}>
            {counts.book} package{counts.book === 1 ? ' is' : 's are'} paid and ready. Book each pickup and the courier comes to your pickup address.
          </div>
        )}
        {list === null ? <span className="mut">Loading…</span> : shown.length === 0 ? (
          <div className="card empty">
            <span className="f" style={{ fontSize: 18 }}>{tab === 'book' ? 'Nothing to book right now' : 'Nothing here'}</span>
            <span className="mut" style={{ fontSize: 14 }}>Everything a buyer gets in one show ships as one package. It appears here when the show ends.</span>
          </div>
        ) : shown.map((d) => {
          const [tone, label] = PILL[d.status] || ['p-draft', d.status];
          return (
            <button key={d._id} type="button" onClick={() => setOpen(d)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'var(--text)' }}>
              <span style={{ display: 'flex' }}>
                {d.items.slice(0, 2).map((i, n) => i.image
                  ? <img key={i.order} src={i.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid #fff', objectFit: 'cover', marginLeft: n ? -14 : 0 }} />
                  : <span key={i.order} className="sk" style={{ width: 44, height: 44, marginLeft: n ? -14 : 0 }} />)}
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 800 }}>{d.buyer?.firstName || d.buyer?.username || 'Buyer'} · {d.itemCount} item{d.itemCount === 1 ? '' : 's'}</span>
                <span className="mut" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[d.buyer?.area, d.show?.title].filter(Boolean).join(' · ')}</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className="f" style={{ fontSize: 17 }}>{naira(d.itemsTotal)}</span>
                <span className={`pill ${tone}`}>{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
