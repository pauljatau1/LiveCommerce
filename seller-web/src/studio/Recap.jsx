// Show recap (design: S-Recap): opens right after a show ends.
// What sold, to whom, what didn't, and the one next step: ship.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studio, errorText, naira } from './api';
import { Problem, Skeleton, TopBar } from './ui';

export default function Recap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    studio.recap(id).then((r) => { setData(r); setError(''); }).catch((e) => setError(errorText(e, "Couldn't load the recap.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  // Delivery pricing runs for a few seconds after the show; refresh until it settles
  const pricing = data?.deliveries?.pricing > 0;
  useEffect(() => {
    if (!pricing) return undefined;
    const t = setInterval(load, 6000);
    const stop = setTimeout(() => clearInterval(t), 120000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [pricing, load]);

  const dv = data?.deliveries || {};
  return (
    <div className="studio-app">
      <TopBar title="Show recap" onBack={() => navigate('/studio')} close />
      <div className="st-inner">
        {error && <Problem text={error} onRetry={load} />}
        {!data && !error && <><Skeleton h={200} r={28} /><Skeleton h={160} /></>}
        {data && (
          <>
            <section style={{ padding: 20, borderRadius: 28, background: 'var(--warm-soft)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span className="cap" style={{ color: 'var(--warm)' }}>{data.show.title.toUpperCase()}{data.minutes ? ` · ${data.minutes} MIN` : ''}</span>
              <h1 className="f" style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>{data.itemsSold ? `Nice one. You made ${naira(data.earned)}.` : 'Show ended. Nothing sold this time.'}</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
                {[[data.itemsSold, 'ITEMS SOLD'], [data.buyers, 'BUYERS'], [data.viewers, 'WATCHED']].map(([n, l]) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 12, borderRadius: 18, background: 'var(--surface)' }}><span className="f" style={{ fontSize: 22 }}>{n}</span><span className="cap">{l}</span></div>
                ))}
              </div>
            </section>

            {data.itemsSold > 0 && (
              <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Next">
                <h2 className="h2">Next: send the packages</h2>
                <span style={{ fontSize: 15, lineHeight: 1.45 }}>Each buyer's items ship together. Delivery is priced and paid from their wallet automatically; you book the pickup.</span>
                <ul className="mut" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
                  {dv.toBook > 0 && <li><b style={{ color: 'var(--text)' }}>{dv.toBook} ready to book</b></li>}
                  {dv.pricing > 0 && <li>{dv.pricing} getting a delivery price… this page updates by itself</li>}
                  {dv.awaitingPayment > 0 && <li>{dv.awaitingPayment} waiting for the buyer to pay delivery</li>}
                  {dv.booked > 0 && <li>{dv.booked} already booked</li>}
                </ul>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to="/studio/orders" className="btn" style={{ flex: '1 1 160px' }}>Ship orders</Link>
                  <Link to="/studio/plan" className="btn2" style={{ flex: '1 1 160px' }}>Plan next show</Link>
                </div>
              </section>
            )}
            {!data.itemsSold && <Link to="/studio/plan" className="btn">Plan next show</Link>}

            {data.sold.length > 0 && (
              <section className="card" style={{ padding: '4px 16px 8px' }} aria-label="What sold">
                <h2 className="h2" style={{ padding: '12px 0 8px' }}>What sold</h2>
                {data.sold.map((i, n) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 0', borderTop: '1px solid #F1EBE3' }}>
                    {i.image ? <img src={i.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 44, height: 44 }} />}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={{ fontWeight: 800 }}>{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}</span><span className="mut" style={{ fontSize: 13 }}>{[i.buyer, i.area].filter(Boolean).join(' · ')}</span></div>
                    <span className="f" style={{ fontSize: 17 }}>{naira(i.amount)}</span>
                  </div>
                ))}
              </section>
            )}

            {data.unsold.length > 0 && (
              <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Didn't sell">
                <h2 className="h2">Didn't sell</h2>
                {data.unsold.map((p) => (
                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.image ? <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 44, height: 44 }} />}
                    <span style={{ flex: 1, fontWeight: 800 }}>{p.name}</span>
                    <Link to={`/studio/plan?add=${p._id}`} className="btn2" style={{ minHeight: 44, padding: '0 14px' }}>Next show</Link>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
