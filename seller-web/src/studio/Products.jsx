// Products (design: S-Products). Filter chips, grid, "List item" button.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { studio, errorText, naira } from './api';
import { Icon, Pill, PRODUCT_PILL, Empty, Problem, Skeleton } from './ui';

const FILTERS = [
  ['all', 'All'],
  ['active', 'Ready for a show'],
  ['in_show', 'In a show'],
  ['sold_out', 'Sold out'],
  ['hidden', 'Hidden'],
];

export default function Products() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const load = useCallback(() => {
    setError('');
    studio.products().then(setData).catch((e) => setError(errorText(e, "Couldn't load your products.")));
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({ ...(data?.counts || {}), active: data?.counts?.ready || 0 }), [data]);
  const shown = (data?.products || [])
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="st-main">
      <div className="st-head">
        <h1 className="f" style={{ flex: 1, margin: 0, fontSize: 'var(--t-display)' }}>Products</h1>
        <button type="button" className="ib" aria-label="Search products" aria-expanded={searching} style={{ background: 'var(--surface)' }} onClick={() => setSearching((v) => !v)}>{Icon.search}</button>
        <Link to="/studio/list" className="btn st-hide-phone">{Icon.plus}List item</Link>
      </div>
      {searching && (
        <div className="fl"><label className="sr" htmlFor="psearch">Search products</label><input id="psearch" className="in" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus /></div>
      )}
      <div role="group" aria-label="Filter" className="st-scroll" style={{ gap: 8 }}>
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={`chip${filter === key ? ' on' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label}{data ? ` · ${counts[key] ?? 0}` : ''}
          </button>
        ))}
      </div>
      {error && <Problem text={error} onRetry={load} />}
      {!data && !error && <div className="st-grid">{[1, 2, 3, 4].map((n) => <Skeleton key={n} h={230} />)}</div>}
      {data && !data.products.length && (
        <Empty icon={Icon.products} title="No products yet" text="Take a few photos and I'll draft the listing for you." action={<Link to="/studio/list" className="btn">List your first item</Link>} />
      )}
      {data && data.products.length > 0 && !shown.length && <p className="mut" style={{ margin: 0 }}>Nothing here.</p>}
      <div className="st-grid">
        {shown.map((p) => (
          <Link key={p._id} to={`/studio/products/${p._id}`} className="pc">
            {p.image ? <img src={p.image} alt="" /> : <span className="sk" style={{ display: 'block', aspectRatio: '1', borderRadius: 0 }} />}
            <span className="b">
              <span style={{ fontSize: 'var(--t-small)', fontWeight: 'var(--w-medium)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}><span className="f" style={{ fontSize: 'var(--t-h2)' }}>{naira(p.price)}</span><span className="mut" style={{ fontSize: 'var(--t-caption)', fontWeight: 'var(--w-medium)' }}>{p.stock} left</span></span>
              <span style={{ alignSelf: 'flex-start' }}><Pill map={PRODUCT_PILL} status={p.status} /></span>
            </span>
          </Link>
        ))}
      </div>
      <Link to="/studio/list" className="btn st-fab st-hide-desk">{Icon.plus}List item</Link>
    </main>
  );
}
