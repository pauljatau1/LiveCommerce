// Product detail (design: S-Product-Detail): photos, price, stock counter, details, actions.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';
import { Pill, PRODUCT_PILL, Problem, Skeleton, TopBar, Sheet } from './ui';
import { authenticityLabel } from './catalogue';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const [photo, setPhoto] = useState(0);
  const [editPrice, setEditPrice] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    setError('');
    studio.product(id).then(setData).catch((e) => setError(errorText(e, "Couldn't load this product.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); }, [toast]);

  const save = async (body, label, done) => {
    setSaving(label);
    try {
      const res = await studio.updateProduct(id, body);
      setData((d) => ({ ...d, product: { ...d.product, ...res.product } }));
      setToast(done);
      return true;
    } catch (e) {
      setToast(errorText(e));
      return false;
    } finally {
      setSaving('');
    }
  };

  const p = data?.product;
  const upcoming = (data?.shows || []).find((s) => ['scheduled', 'live'].includes(s.status));
  return (
    <div className="studio-app">
      <TopBar title="Product" onBack={() => navigate('/studio/products')} right={p && <Link to={`/dashboard/products/edit-product/${p._id}`} className="btn2">Edit all</Link>} />
      {error && <div className="st-inner"><Problem text={error} onRetry={load} /></div>}
      {!p && !error && <div className="st-inner"><Skeleton h={300} /><Skeleton h={120} /></div>}
      {p && (
        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
          <div style={{ position: 'relative' }}>
            {p.images[photo] ? <img src={p.images[photo]} alt={p.name} style={{ display: 'block', width: '100%', height: 320, objectFit: 'cover' }} /> : <span className="sk" style={{ display: 'block', height: 320, borderRadius: 0 }} />}
            {p.images.length > 1 && (
              <button type="button" className="pill" style={{ position: 'absolute', left: 12, bottom: 12, background: '#fff', color: 'var(--text)', border: 0, cursor: 'pointer' }} onClick={() => setPhoto((n) => (n + 1) % p.images.length)} aria-label="Next photo">
                {photo + 1} / {p.images.length} ›
              </button>
            )}
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Pill map={PRODUCT_PILL} status={p.status} />
              {upcoming && <span className="pill p-show">In "{upcoming.title}"</span>}
            </div>
            <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-h1)', lineHeight: 1.2 }}>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="f" style={{ fontSize: 'var(--t-display)' }}>{naira(p.price)}</span>
              <button type="button" className="link" onClick={() => setEditPrice(String(p.price))}>Change price</button>
            </div>
            <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{p.views} views · {p.sold} sold</span>
          </div>

          <section className="card" aria-label="Stock" style={{ margin: '0 16px', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'var(--w-medium)' }}>In stock</span><span className="hint">Buyers see "{p.stock} left"</span></div>
            <button type="button" className="ib" aria-label="One fewer" disabled={Boolean(saving) || p.stock <= 0} style={{ font: 'var(--w-medium) var(--t-h1) var(--font-body)' }} onClick={() => save({ stock: p.stock - 1 }, 'stock', 'Stock updated')}>−</button>
            <span className="f" style={{ width: 40, textAlign: 'center', fontSize: 'var(--t-h1)' }} aria-live="polite">{p.stock}</span>
            <button type="button" className="ib" aria-label="One more" disabled={Boolean(saving)} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', font: 'var(--w-medium) var(--t-h1) var(--font-body)' }} onClick={() => save({ stock: p.stock + 1 }, 'stock', 'Stock updated')}>+</button>
          </section>

          <section className="card" aria-label="Details" style={{ margin: '0 16px', overflow: 'hidden' }}>
            {[
              ['CATEGORY', [p.category, p.subCategory].filter(Boolean).join(' › ')],
              ['CONDITION', p.condition],
              ['ORIGINAL OR REPLICA', authenticityLabel(p.authenticity)],
              ['BRAND', p.brand],
              ['WEIGHT', p.weightKg ? `${p.weightKg} kg` : null],
              ['ABOUT', p.description],
            ].filter(([, v]) => v).map(([k, v], n) => (
              <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minHeight: 52, padding: '14px 16px', borderTop: n ? '1px solid #F1EBE3' : 0 }}>
                <span className="cap" style={{ width: 96, paddingTop: 2, flex: 'none' }}>{k}</span>
                <span style={{ flex: 1, fontWeight: k === 'ABOUT' ? 'var(--w-regular)' : 'var(--w-medium)', fontSize: k === 'ABOUT' ? 'var(--t-body)' : 'var(--t-body)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{v}</span>
              </div>
            ))}
          </section>

          {data.shows.length > 0 && (
            <section className="card" aria-label="Shows" style={{ margin: '0 16px', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 className="h2">Shows</h2>
              {data.shows.map((s) => (
                <Link key={s._id} to={s.status === 'ended' ? `/studio/recap/${s._id}` : `/studio/golive/${s._id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text)', textDecoration: 'none', minHeight: 44, alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--w-medium)' }}>{s.title}</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>{s.status === 'ended' ? 'Ended' : when(s.scheduledStartTime)}</span>
                </Link>
              ))}
            </section>
          )}

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to={`/studio/plan?add=${p._id}`} className="btn2">Add to a show</Link>
            <button type="button" className="btn3" disabled={Boolean(saving)} style={{ color: p.status === 'hidden' ? 'var(--primary)' : 'var(--danger)' }} onClick={() => save({ hidden: p.status !== 'hidden' }, 'hide', p.status === 'hidden' ? 'Visible to buyers again' : 'Hidden from buyers')}>
              {p.status === 'hidden' ? 'Show to buyers again' : 'Hide from buyers'}
            </button>
          </div>
        </div>
      )}

      {editPrice !== null && (
        <Sheet label="Change price" onClose={() => setEditPrice(null)}>
          <h2 className="f" style={{ margin: 0, fontSize: 'var(--t-h1)' }}>Change price</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={async (e) => { e.preventDefault(); if (await save({ price: Number(editPrice) }, 'price', 'Price updated')) setEditPrice(null); }}>
            <div className="fl"><label className="lab" htmlFor="newprice">Price (₦)</label><input id="newprice" className="in" inputMode="numeric" value={editPrice} onChange={(e) => setEditPrice(e.target.value.replace(/[^\d]/g, ''))} autoFocus /></div>
            <div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn3" style={{ flex: 1 }} onClick={() => setEditPrice(null)}>Cancel</button><button type="submit" className="btn" style={{ flex: 1.4 }} disabled={saving === 'price' || !editPrice}>{saving === 'price' ? 'Saving…' : `Set ${naira(editPrice)}`}</button></div>
          </form>
        </Sheet>
      )}
      {toast && <div className="toast" role="status" style={{ position: 'fixed', left: 16, right: 16, bottom: 24, maxWidth: 480, margin: '0 auto', zIndex: 60 }}><span style={{ flex: 1 }}>{toast}</span></div>}
    </div>
  );
}
