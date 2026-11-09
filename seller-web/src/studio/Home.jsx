// Studio Home (design: S-Home / S-Home-Desktop / S-Home-Focal).
// One focal card that changes with what the seller should do next.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studio, errorText, naira, when, greeting } from './api';
import { Icon, Pill, PRODUCT_PILL, Problem, Skeleton } from './ui';
import { Brand } from './StudioLayout';
import ShareSheet from './ShareSheet';

const countdown = (date) => {
  const ms = Math.max(0, new Date(date) - Date.now());
  const days = Math.floor(ms / 86400000);
  const hrs = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return days > 0 ? [[days, 'DAYS'], [String(hrs).padStart(2, '0'), 'HRS']] : [[hrs, 'HRS'], [String(mins).padStart(2, '0'), 'MINS']];
};

function Focal({ data, onShare }) {
  const { nextShow: show, toShip, productCount } = data;
  if (show?.status === 'live') {
    return (
      <section className="card" aria-label="You're live" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
        <span className="pill p-live" style={{ alignSelf: 'flex-start' }}>● LIVE NOW</span>
        <h2 className="f" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{show.title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/studio/live/${show._id}`} className="btn" style={{ flex: 1.3, background: 'var(--live)' }}>Back to your show</Link>
          {show.link && <button type="button" className="btn2" style={{ flex: 1 }} onClick={() => onShare(show)}>{Icon.share}Share</button>}
        </div>
      </section>
    );
  }
  if (show) {
    const soon = new Date(show.scheduledStartTime) - Date.now() < 30 * 60000;
    return (
      <section className="card" aria-label="Your next show" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface)' }}>
        <span className="cap">NEXT SHOW · {when(show.scheduledStartTime).toUpperCase()} · {show.type === 'drop' ? 'DROP' : 'AUCTION'}</span>
        <h2 className="f" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{show.title}</h2>
        <div style={{ display: 'flex', gap: 8 }} aria-label="Time until the show">
          {[...countdown(show.scheduledStartTime), [show.itemCount, 'ITEMS']].map(([n, l]) => (
            <div key={l} style={{ flex: 1, padding: '10px 0', borderRadius: 16, background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span className="f" style={{ fontSize: 26 }}>{n}</span><span className="cap">{l}</span></div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/studio/golive/${show._id}`} className="btn" style={{ flex: 1.3, ...(soon ? { background: 'var(--live)' } : {}) }}>{soon ? 'Go live' : 'Get ready'}</Link>
          {show.link && <button type="button" className="btn2" style={{ flex: 1 }} onClick={() => onShare(show)}>{Icon.share}Share</button>}
        </div>
      </section>
    );
  }
  if (toShip > 0) {
    return (
      <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
        <span className="cap" style={{ color: 'var(--primary-strong)' }}>TO DO</span>
        <h2 className="f" style={{ margin: 0, fontSize: 24 }}>{toShip} package{toShip === 1 ? '' : 's'} to send</h2>
        <span style={{ fontSize: 15 }}>Delivery is paid. Book the pickup and a courier comes to you.</span>
        <Link to="/studio/orders" className="btn">Book pickups</Link>
      </section>
    );
  }
  if (!productCount) {
    return (
      <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
        <span className="cap" style={{ color: 'var(--primary-strong)' }}>START HERE</span>
        <h2 className="f" style={{ margin: 0, fontSize: 24 }}>List your first item</h2>
        <span style={{ fontSize: 15 }}>Take a few photos. I'll write the title, description and price for you to check.</span>
        <Link to="/studio/list" className="btn">{Icon.camera}List an item</Link>
      </section>
    );
  }
  return (
    <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
      <span className="cap">NO SHOW PLANNED</span>
      <h2 className="f" style={{ margin: 0, fontSize: 24 }}>Plan your next show</h2>
      <span style={{ fontSize: 15 }}>Pick items, choose auction or drop, set a time. Buyers get a link to join.</span>
      <Link to="/studio/plan" className="btn">Plan a show</Link>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(null);
  const load = useCallback(() => {
    setError('');
    studio.home().then(setData).catch((e) => setError(errorText(e, "Couldn't load your studio.")));
  }, []);
  useEffect(() => { load(); }, [load]);

  const name = data?.seller?.firstName || data?.seller?.storeName || '';
  return (
    <main className="st-main">
      <div className="st-head st-hide-desk">
        <span style={{ flex: 1 }}><Brand size={24} /></span>
        <Link to="/studio/notifications" className="ib" aria-label="Notifications" style={{ background: 'none' }}>{Icon.bell}</Link>
        <Link to="/studio/me" aria-label="Your store" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-sunken)', color: 'var(--text)', font: '800 15px var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          {(data?.seller?.storeName || name || 'S').slice(0, 2).toUpperCase()}
        </Link>
      </div>
      <h1 className="f" style={{ margin: 0, fontSize: 26 }}>{greeting()}{name ? `, ${name}.` : '.'}</h1>
      {error && <Problem text={error} onRetry={load} />}
      {!data && !error && <><Skeleton h={220} r={24} /><Skeleton h={60} /><Skeleton h={180} /></>}
      {data && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1.6 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Focal data={data} onShare={setSharing} />
            {data.readyForShow > 0 && !data.nextShow && data.productCount > 0 && (
              <>
                <div className="bot"><span className="av" aria-hidden="true" /><div className="bub">{data.readyForShow} item{data.readyForShow === 1 ? " hasn't" : "s haven't"} been in a show yet. Want to plan one?</div></div>
                <div className="ind" style={{ display: 'flex', gap: 8 }}><Link to="/studio/plan" className="qr" style={{ textDecoration: 'none' }}>Yes, plan it</Link></div>
              </>
            )}
          </div>
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.productCount > 0 && <Link to="/studio/list" className="st-row" style={{ padding: 16 }}>
              <span className="blob" style={{ width: 52, height: 52, borderRadius: 18, color: 'var(--primary)' }}>{Icon.camera}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span className="f" style={{ fontSize: 18 }}>List an item</span><span className="mut" style={{ fontSize: 14 }}>Drop photos. I'll write it</span></span>
              {Icon.chevron('var(--text-muted)')}
            </Link>}
            {data.lastShow && (
              <Link to={`/studio/recap/${data.lastShow._id}`} className="st-row" style={{ padding: 16 }}>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span className="cap">LAST SHOW · {when(data.lastShow.endTime || data.lastShow.scheduledStartTime).toUpperCase()}</span><span style={{ fontWeight: 800 }}>{data.lastShow.title}</span><span className="mut" style={{ fontSize: 14 }}>{data.lastShow.sold} sold · see recap</span></span>
                {Icon.chevron('var(--text-muted)')}
              </Link>
            )}
            {data.toShip > 0 && data.nextShow && (
              <Link to="/studio/orders" className="st-row" style={{ padding: 16 }}>
                <span style={{ flex: 1, fontWeight: 800 }}>{data.toShip} package{data.toShip === 1 ? '' : 's'} to send</span><span className="pill p-warn">To ship</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {data && data.recent.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 className="h2">Recent listings</h2><Link to="/studio/products" className="link">See all</Link></div>
          <div className="st-scroll">
            {data.recent.map((p) => (
              <Link key={p._id} to={`/studio/products/${p._id}`} className="pc" style={{ flex: 'none', width: 150 }}>
                {p.image ? <img src={p.image} alt="" /> : <span className="sk" style={{ display: 'block', aspectRatio: '1' }} />}
                <span className="b"><span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span><span className="f" style={{ fontSize: 16 }}>{naira(p.price)}</span><span style={{ alignSelf: 'flex-start' }}><Pill map={PRODUCT_PILL} status={p.status} /></span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data && (
        <Link to="/studio/money" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 56, padding: '0 16px', borderRadius: 18, background: 'var(--surface)', color: 'var(--text)', textDecoration: 'none', fontSize: 15 }}>
          <span><strong>{naira(data.money.ready)}</strong> ready to withdraw{data.money.pending ? <> · <strong>{naira(data.money.pending)}</strong> on the way</> : null}</span>
          {Icon.chevron('var(--primary)')}
        </Link>
      )}
      {sharing && <ShareSheet show={sharing} onClose={() => setSharing(null)} />}
    </main>
  );
}
