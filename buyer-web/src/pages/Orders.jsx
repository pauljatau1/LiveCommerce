// Your orders, grouped as deliveries: everything from one show ships together.
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, errorMessage, naira } from '../api';
import { useAuth } from '../auth';
import TopUpSheet from '../components/TopUpSheet';
import RateSheet from '../components/RateSheet';
import { Header } from '../components/ui';

const STATE = {
  needs_fix:{label:'Update delivery details',tone:'p-warn',note:d=>d.lastError || 'Update your delivery details so we can get a price.'},
  collecting: { label: 'Show still on', tone: 'p-show', note: (d) => `Everything you get in this show ships together.${d.depositHeld ? ` ${naira(d.depositHeld)} is held for delivery.` : ''}` },
  quote_failed: { label: 'Pricing delivery', tone: 'p-warn', note: () => "We're getting a delivery price. The host has been told." },
  awaiting_payment: { label: 'Pay delivery', tone: 'p-warn', note: (d) => `Delivery to you is ${naira(d.fee)}${d.courier ? ` with ${d.courier}` : ''}.` },
  paid: { label: 'Paid · preparing', tone: 'p-active', note: (d) => `Delivery paid (${naira(d.fee)}). The host will book a courier.` },
  booked: { label: 'Courier booked', tone: 'p-active', note: (d) => `${d.courier || 'The courier'} will pick it up soon.` },
  in_transit: { label: 'On the way', tone: 'p-active', note: (d) => `${d.courier || 'The courier'} has your package.${d.deliveryEta ? ` ${d.deliveryEta}.` : ''}` },
  delivered: { label: 'Delivered', tone: 'p-active', note: () => 'Enjoy it!' },
  cancelled: { label: 'Cancelled', tone: 'p-sold', note: () => 'This delivery was cancelled.' },
};

export default function Orders() {
  const { signedIn, loading, wallet, refreshWallet } = useAuth();
  const [deliveries, setDeliveries] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [topUp, setTopUp] = useState(null);
  const [rating, setRating] = useState(null); // the delivery being rated
  // Hosts already rated from this phone (the server also refuses a second rating)
  const [rated, setRated] = useState(() => { try { return JSON.parse(localStorage.getItem('ratedHosts') || '[]'); } catch { return []; } });
  const markRated = (sellerId) => setRated((l) => { const next = [...new Set([...l, String(sellerId)])]; try { localStorage.setItem('ratedHosts', JSON.stringify(next)); } catch { /* private mode */ } return next; });

  const load = useCallback(() => api.deliveries().then(setDeliveries).catch(() => setDeliveries([])), []);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  const pay = async (d) => {
    setError('');
    if ((wallet?.availableBalance || 0) + (d.depositHeld || 0) < d.fee) { setTopUp(d.fee - (d.depositHeld || 0) - (wallet?.availableBalance || 0)); return; }
    setBusy(d._id);
    try { await api.payDelivery(d._id); await Promise.all([load(), refreshWallet()]); } catch (e) { setError(errorMessage(e, "Couldn't pay for delivery.")); } finally { setBusy(null); }
  };

  if (!loading && !signedIn) return <Navigate to="/signin?next=/orders" replace />;
  return (
    <div className="app">
      <Header back="/" title="Your orders" />
      <main className="wrap" style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <span className="err" role="alert">{error}</span>}
        {deliveries === null ? <span className="mut">Loading…</span> : deliveries.length === 0 ? (
          <div className="card empty"><span className="f" style={{ fontSize: 'var(--t-h2)' }}>No orders yet</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>Things you win or buy in a show appear here, grouped into one delivery per show.</span><Link to="/" className="btn2">Find a show</Link></div>
        ) : deliveries.map((d) => {
          const st = STATE[d.status] || { label: d.status, tone: 'p-show', note: () => '' };
          return (
            <section key={d._id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'var(--w-medium)', fontSize: 'var(--t-body)' }}>{d.show?.title || 'Live show'}</div>
                  <div className="mut" style={{ fontSize: 'var(--t-small)' }}>{d.seller?.storeName} · {d.itemCount} item{d.itemCount === 1 ? '' : 's'} · {new Date(d.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                </div>
                <span className={`pill ${st.tone}`}>{st.label}</span>
              </div>
              <div className="list">
                {d.items.map((i) => (
                  <div key={i.order} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {i.image ? <img src={i.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 44, height: 44 }} />}
                    <span style={{ flex: 1, fontWeight: 'var(--w-medium)', fontSize: 'var(--t-small)' }}>{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}{i.note && <span className="mut" style={{ display: 'block', fontWeight: 'var(--w-medium)' }}>{i.note}</span>}</span>
                    <span className="f" style={{ fontSize: 'var(--t-body)' }}>{naira(i.unitPrice * (i.quantity || 1))}</span>
                  </div>
                ))}
              </div>
              <p className="mut" style={{ margin: 0, fontSize: 'var(--t-small)' }}>{st.note(d)}</p>
              {d.status==='needs_fix'&&(d.fix?.party==='buyer'?<Link className="btn2" to="/me">Fix delivery details</Link>:<span className="hint">The host has been asked to update their pickup details.</span>)}
              {d.status === 'awaiting_payment' && (
                <button type="button" className="btn" disabled={busy === d._id} onClick={() => pay(d)}>{busy === d._id ? 'Paying…' : `Pay ${naira(Math.max(0, d.fee - (d.depositHeld || 0)))} for delivery`}</button>
              )}
              {d.trackingUrl && <a className="btn2" href={d.trackingUrl} target="_blank" rel="noopener noreferrer">Track your package</a>}
              {d.status === 'delivered' && d.seller?._id && !rated.includes(String(d.seller._id)) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 'var(--t-body)' }}>Got it? Tell {d.seller.storeName || 'the host'} how it went.</span>
                  <button type="button" className="btn2" onClick={() => setRating(d)}>Rate</button>
                </div>
              )}
            </section>
          );
        })}
      </main>
      {topUp !== null && <TopUpSheet need={topUp} onClose={() => { setTopUp(null); load(); }} />}
      {rating && <RateSheet seller={rating.seller} onClose={() => setRating(null)} onDone={() => { markRated(rating.seller._id); setRating(null); }} />}
    </div>
  );
}
