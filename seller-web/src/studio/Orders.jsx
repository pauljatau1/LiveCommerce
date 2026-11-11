// Orders (design: S-Orders / S-Order-Detail). One package per buyer per show:
// pricing and payment happen automatically; the seller books the pickup.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';
import { Icon, Pill, DELIVERY_PILL, Empty, Problem, Skeleton, Thumbs, TopBar } from './ui';

const TABS = [
  { key: 'ship', label: 'To ship', statuses: ['paid'] },
  { key: 'waiting', label: 'Waiting', statuses: ['collecting', 'quote_failed', 'awaiting_payment'] },
  { key: 'moving', label: 'On the way', statuses: ['booked', 'in_transit'] },
  { key: 'done', label: 'Delivered', statuses: ['delivered'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];
const buyerName = (d) => d.buyer?.firstName || (d.buyer?.username ? `@${d.buyer.username}` : 'Buyer');

const useDeliveries = () => {
  const [state, setState] = useState({ list: null, sandbox: false, error: '' });
  const load = useCallback(async () => {
    try {
      const res = await studio.deliveries();
      setState({ list: res.deliveries || [], sandbox: Boolean(res.sandbox), error: '' });
    } catch (e) {
      setState((s) => ({ ...s, list: s.list || [], error: errorText(e, "Couldn't load orders.") }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return [state, load, setState];
};

function Row({ d }) {
  return (
    <Link to={`/studio/orders/${d._id}`} className="st-row">
      <Thumbs images={d.items.map((i) => i.image)} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontWeight: 'var(--w-medium)' }}>{buyerName(d)} · {d.itemCount} item{d.itemCount === 1 ? '' : 's'}</span>
        <span className="mut" style={{ fontSize: 'var(--t-small)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[d.buyer?.area, d.show?.title].filter(Boolean).join(' · ')}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className="f" style={{ fontSize: 'var(--t-h2)' }}>{naira(d.itemsTotal)}</span>
        <Pill map={DELIVERY_PILL} status={d.status} />
      </span>
    </Link>
  );
}

export function Orders() {
  const [{ list, error }, load] = useDeliveries();
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (list || []).filter((d) => t.statuses.includes(d.status)).length])), [list]);
  const [tab, setTab] = useState(null);
  const active = tab || (counts.ship ? 'ship' : counts.waiting ? 'waiting' : counts.moving ? 'moving' : 'ship');
  const shown = (list || []).filter((d) => TABS.find((t) => t.key === active).statuses.includes(d.status));
  // Group by show so a show's packages sit together
  const groups = shown.reduce((acc, d) => {
    const key = d.show?._id || 'other';
    (acc[key] = acc[key] || { title: d.show?.title, items: [] }).items.push(d);
    return acc;
  }, {});

  return (
    <main className="st-main">
      <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-display)' }}>Orders</h1>
      <div role="group" aria-label="Order status" className="st-scroll" style={{ gap: 8 }}>
        {TABS.filter((t) => t.key !== 'cancelled' || counts.cancelled).map((t) => (
          <button key={t.key} type="button" className={`chip${active === t.key ? ' on' : ''}`} aria-pressed={active === t.key} onClick={() => setTab(t.key)}>{t.label}{list ? ` · ${counts[t.key]}` : ''}</button>
        ))}
      </div>
      {error && <Problem text={error} onRetry={load} />}
      {active === 'ship' && counts.ship > 0 && (
        <div className="soft s-primary" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="bot"><span className="av" aria-hidden="true" style={{ background: '#fff' }} /><span style={{ fontSize: 'var(--t-body)', lineHeight: 1.45 }}>{counts.ship} package{counts.ship === 1 ? ' is' : 's are'} paid. Pack each one, then tap it and book the pickup. The courier comes to your pickup address.</span></div>
        </div>
      )}
      {active === 'waiting' && counts.waiting > 0 && (
        <p className="mut" style={{ margin: 0, fontSize: 'var(--t-small)', lineHeight: 1.5 }}>Delivery is priced and paid from the buyer's wallet automatically after the show. If pricing fails we retry every 10 minutes.</p>
      )}
      {list === null && <><Skeleton h={72} /><Skeleton h={72} /></>}
      {list && !shown.length && (
        <Empty icon={Icon.orders} title={list.length ? 'Nothing here' : 'No orders yet'} text={list.length ? 'Check the other tabs.' : 'They appear here after your first sale. Everything a buyer gets in one show ships as one package.'} action={!list.length && <Link to="/studio/plan" className="btn2">Plan a show</Link>} />
      )}
      {Object.entries(groups).map(([key, g]) => (
        <section key={key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={g.title || 'Orders'}>
          {g.title && <span className="cap" style={{ paddingTop: 4 }}>FROM {g.title.toUpperCase()}</span>}
          {g.items.map((d) => <Row key={d._id} d={d} />)}
        </section>
      ))}
    </main>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [{ list, sandbox, error: loadError }, load, setState] = useDeliveries();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const d = (list || []).find((x) => x._id === id);

  const act = async (action, label, body) => {
    setBusy(label); setError('');
    try {
      const res = await studio.deliveryAction(id, action, body);
      if (res.delivery) setState((s) => ({ ...s, list: s.list.map((x) => (x._id === id ? res.delivery : x)) }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy('');
    }
  };

  // While waiting on Shipbubble, refresh quietly
  useEffect(() => {
    if (!d || !['collecting', 'quote_failed'].includes(d.status)) return undefined;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [d, load]);

  if (!d) {
    return (
      <div className="studio-app">
        <TopBar title="Order" onBack={() => navigate('/studio/orders')} />
        <div className="st-inner">{loadError ? <Problem text={loadError} onRetry={load} /> : list ? <Problem text="Order not found." /> : <><Skeleton h={80} /><Skeleton h={200} /></>}</div>
      </div>
    );
  }

  const who = buyerName(d);
  const steps = [
    ['Paid', ['paid', 'booked', 'in_transit', 'delivered'].includes(d.status), d.paidAt],
    ['Pickup booked', ['booked', 'in_transit', 'delivered'].includes(d.status), d.bookedAt],
    ['Picked up · on the way', ['in_transit', 'delivered'].includes(d.status)],
    ['Delivered · money released next day', d.status === 'delivered'],
  ];
  const current = steps.findIndex(([, done]) => !done);
  return (
    <div className="studio-app">
      <TopBar title={`${who} · ${d.itemCount} item${d.itemCount === 1 ? '' : 's'}`} sub={`From ${d.show?.title || 'a live show'}`} onBack={() => navigate('/studio/orders')} right={<Pill map={DELIVERY_PILL} status={d.status} />} />
      <div className="st-inner">
        <section className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Buyer">
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', color: 'var(--text)', font: 'var(--w-medium) var(--t-body) var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{who.replace('@', '').slice(0, 2).toUpperCase()}</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'var(--w-medium)', fontSize: 'var(--t-h2)' }}>{who}</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>{d.buyer?.area || 'Delivery address on file'}</span></div>
        </section>
        {d.itemCount > 1 && <div className="soft s-primary" style={{ fontSize: 'var(--t-small)', lineHeight: 1.45 }}>{who} got {d.itemCount} items in this show, so they ship together in one package.</div>}

        <section className="card" style={{ padding: '4px 16px' }} aria-label="Items">
          {d.items.map((i, n) => (
            <div key={i.order + n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: n < d.items.length - 1 ? '1px solid #F1EBE3' : 0 }}>
              {i.image ? <img src={i.image} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'var(--w-medium)' }}>{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}</span>{i.note && <span style={{ fontSize: 'var(--t-small)' }}>{i.note}</span>}<span className="mut" style={{ fontSize: 'var(--t-small)' }}>{i.category}</span></div>
              <span className="f" style={{ fontSize: 'var(--t-body)' }}>{naira(i.unitPrice * (i.quantity || 1))}</span>
            </div>
          ))}
        </section>

        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--t-body)' }} aria-label="Payment">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items</span><span>{naira(d.itemsTotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery (paid by {who})</span><span>{d.fee ? naira(d.fee) : '—'}</span></div>
          <div className="mut" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 'var(--t-small)' }}><span>You receive after delivery</span><span>{naira(d.itemsTotal)} less fees</span></div>
        </section>

        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Pickup">
          <h2 className="h2">Pickup</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'var(--w-medium)' }}>{d.courier || 'Courier chosen when priced'}</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>{d.deliveryEta || 'Cheapest courier for this route'}</span></div>
            {d.fee ? <span className="f" style={{ fontSize: 'var(--t-h2)' }}>{naira(d.fee)}</span> : null}
          </div>
          {d.status === 'paid' && <span className="hint">Pack it first. Booking charges your Shipbubble wallet; {who} has already paid you for delivery. Booked after 6pm, pickup is the next day.</span>}
          {d.status === 'booked' && <span className="hint">You can cancel until the courier collects it.</span>}
          {d.status === 'awaiting_payment' && <span className="hint">{who} needs to top up and pay {naira(d.fee)} for delivery. We've told them.</span>}
          {d.status === 'collecting' && <span className="hint">The show is still on. Delivery is priced when it ends.</span>}
          {d.status === 'quote_failed' && <span className="err-text">{d.lastError || "Couldn't price this delivery yet. We retry every 10 minutes."}</span>}
          {error && <span className="err-text" role="alert">{error}</span>}
          {d.status === 'paid' && <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => act('book', 'book')}>{busy === 'book' ? 'Booking…' : 'Book pickup'}</button>}
          {['quote_failed', 'awaiting_payment'].includes(d.status) && <button type="button" className="btn2" disabled={Boolean(busy)} onClick={() => act('requote', 'requote')}>{busy === 'requote' ? 'Getting a price…' : 'Try pricing again'}</button>}
          {d.trackingUrl && <a className="btn2" href={d.trackingUrl} target="_blank" rel="noopener noreferrer">Open tracking</a>}
          {['booked', 'in_transit'].includes(d.status) && <button type="button" className="btn3" disabled={Boolean(busy)} onClick={() => act('refresh', 'refresh')}>{busy === 'refresh' ? 'Checking…' : 'Check for updates'}</button>}
          {d.status === 'booked' && <button type="button" className="link" style={{ alignSelf: 'center', color: 'var(--danger)' }} disabled={Boolean(busy)} onClick={() => act('cancel', 'cancel')}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel pickup'}</button>}
        </section>

        {sandbox && ['booked', 'in_transit'].includes(d.status) && (
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, border: '2px dashed var(--border-strong)' }} aria-label="Test courier">
            <h2 className="h2">Test courier (staging only)</h2>
            <span className="hint">Pretend to be the courier. Each tap makes Shipbubble send a real update, so the buyer's Orders page changes too.</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['picked_up', 'Picked up'], ['in_transit', 'On the way'], ['completed', 'Delivered']].map(([s, label]) => (
                <button key={s} type="button" className="btn3" disabled={Boolean(busy)} onClick={() => act('simulate', s, { status: s })}>{busy === s ? 'Sending…' : label}</button>
              ))}
            </div>
          </section>
        )}

        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="Tracking">
          <h2 className="h2" style={{ paddingBottom: 10 }}>Tracking</h2>
          {steps.map(([t, done, at], n) => (
            <div key={t} className="tl">
              <span className="d" style={done ? { background: 'var(--success)' } : n === current ? { border: '2.5px solid var(--primary)', background: '#fff' } : { border: '2px solid var(--border-strong)' }}>{done ? Icon.check : null}</span>
              <span className={`t${done || n === current ? '' : ' mut'}`}><span style={{ fontWeight: done || n === current ? 'var(--w-medium)' : 'var(--w-medium)' }}>{t}</span>{done && at ? <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{when(at)}</span> : n === current ? <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{d.status === 'paid' ? "You're here" : 'Next'}</span> : null}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
