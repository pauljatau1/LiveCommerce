import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Header, Icon } from '../components/ui';

const when = (d) => new Date(d).toLocaleString('en-NG', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

function ShowCard({ s, live }) {
  return (
    <Link to={`/live/${s._id}`} className="show">
      <span className="cv">
        {s.coverImage?.url ? <img src={s.coverImage.url} alt="" loading="lazy" /> : null}
        {live ? <span className="pill p-live">LIVE</span> : <span className="pill s-warm" style={{ color: 'var(--warm)' }}>{when(s.scheduledStartTime)}</span>}
        {live && <span className="pill glass" style={{ position: 'absolute', right: 8, top: 8 }}>{Icon.eye}{s.viewers?.length || 0}</span>}
      </span>
      <span className="b">
        <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{s.title}</span>
        <span className="mut" style={{ fontSize: 13 }}>{s.seller?.storeName || s.seller?.businessName || 'A creator'}</span>
      </span>
    </Link>
  );
}

export default function Home() {
  const [live, setLive] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.liveShows().then((l) => setLive(Array.isArray(l) ? l : [])).catch(() => { setLive([]); setError('The server is waking up. Pull to refresh in a moment.'); });
    api.upcomingShows().then((u) => setUpcoming(u.filter((s) => s.status === 'scheduled').slice(0, 12))).catch(() => {});
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '20px 16px 40px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 className="h1">Shop clothes live</h1>
          <p className="mut" style={{ margin: 0 }}>Watch sellers go live, bid on clothes, shoes and bags, and grab limited drops.</p>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="h2">Live now</h2>
          {live === null ? (
            <div className="shows">{[0, 1].map((i) => <span key={i} className="sk" style={{ aspectRatio: '3/4', borderRadius: 20 }} />)}</div>
          ) : live.length ? (
            <div className="shows">{live.map((s) => <ShowCard key={s._id} s={s} live />)}</div>
          ) : (
            <div className="card empty"><span className="blob" aria-hidden="true">{Icon.eye}</span><span className="f" style={{ fontSize: 18 }}>No one is live right now</span><span className="mut" style={{ fontSize: 14 }}>{error || 'Check the upcoming shows below.'}</span></div>
          )}
        </section>

        {upcoming.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="h2">Coming up</h2>
            <div className="shows">{upcoming.map((s) => <ShowCard key={s._id} s={s} />)}</div>
          </section>
        )}
      </main>
    </div>
  );
}
