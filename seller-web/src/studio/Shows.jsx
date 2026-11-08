// Shows: upcoming and past, each opening Go Live or its recap.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studio, errorText, when } from './api';
import { Icon, Problem, Skeleton, TopBar, Empty } from './ui';
import ShareSheet from './ShareSheet';

const Row = ({ s, to, right }) => (
  <Link to={to} className="st-row">
    {s.images[0] ? <img src={s.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span className="cap">{(s.status === 'live' ? 'LIVE NOW' : when(s.status === 'ended' ? s.endTime || s.scheduledStartTime : s.scheduledStartTime)).toUpperCase()} · {s.type === 'drop' ? 'DROP' : 'AUCTION'}</span>
      <span style={{ fontWeight: 800 }}>{s.title}</span>
    </span>
    {right}
  </Link>
);

export default function Shows() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState(null);
  const [past, setPast] = useState(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(null);
  useEffect(() => {
    Promise.all([studio.shows(), studio.shows('ended')])
      .then(([u, p]) => { setUpcoming(u.shows); setPast(p.shows); })
      .catch((e) => setError(errorText(e, "Couldn't load your shows.")));
  }, []);
  return (
    <div className="studio-app">
      <TopBar title="Shows" onBack={() => navigate(-1)} right={<Link to="/studio/plan" className="btn2" style={{ minHeight: 44 }}>Plan a show</Link>} />
      <div className="st-inner">
        {error && <Problem text={error} />}
        {!upcoming && !error && <><Skeleton h={76} /><Skeleton h={76} /></>}
        {upcoming && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Upcoming">
            <h2 className="h2">Upcoming</h2>
            {!upcoming.length && <span className="mut">No show planned.</span>}
            {upcoming.map((s) => (
              <div key={s._id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}><Row s={s} to={s.status === 'live' ? `/studio/live/${s._id}` : `/studio/golive/${s._id}`} right={s.status === 'live' ? <span className="pill p-live">● Live</span> : <span className="pill p-show">{s.itemCount} items</span>} /></div>
                {s.link && <button type="button" className="ib" aria-label={`Share ${s.title}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => setSharing(s)}>{Icon.share}</button>}
              </div>
            ))}
          </section>
        )}
        {past && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Past shows">
            <h2 className="h2">Past shows</h2>
            {!past.length && <Empty icon={Icon.live('var(--primary)', 32)} title="No shows yet" text="Your recaps will be here." />}
            {past.map((s) => <Row key={s._id} s={s} to={`/studio/recap/${s._id}`} right={<span className="mut" style={{ fontSize: 13, fontWeight: 800 }}>{s.sold} sold</span>} />)}
          </section>
        )}
      </div>
      {sharing && <ShareSheet show={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}
