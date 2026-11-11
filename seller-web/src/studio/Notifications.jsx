// Notifications inbox: new orders, auction wins, show reminders, payouts and
// the assistant's tips. Toasts for new ones show anywhere in the studio
// (StudioLayout); this is where they all stay.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studio, errorText } from './api';
import { Empty, Icon, Problem, Skeleton, TopBar } from './ui';

const timeOf = (at) => {
  const d = new Date(at);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => studio.notifications().then((r) => { setData(r); setError(''); }).catch((e) => setError(errorText(e, "Couldn't load notifications."))), []);
  useEffect(() => { load(); }, [load]);
  const markAll = async () => {
    try { await studio.markRead(); setData((d) => ({ ...d, unread: 0, items: d.items.map((n) => ({ ...n, unread: false })) })); } catch (e) { setError(errorText(e, "Couldn't mark them read.")); }
  };
  const today = new Date().toDateString();
  const groups = data ? [
    ['TODAY', data.items.filter((n) => new Date(n.at).toDateString() === today)],
    ['EARLIER', data.items.filter((n) => new Date(n.at).toDateString() !== today)],
  ].filter(([, l]) => l.length) : [];

  return (
    <div className="studio-app">
      <TopBar title="Notifications" onBack={() => navigate(-1)} right={data?.unread ? <button type="button" className="link" onClick={markAll}>Mark all read</button> : null} />
      <div className="st-inner">
        {error && <Problem text={error} onRetry={load} />}
        {!data && !error && <><Skeleton h={64} /><Skeleton h={64} /><Skeleton h={64} /></>}
        {data && !data.items.length && <Empty icon={Icon.bell} title="Nothing yet" text="New orders, wins and payouts show up here." action={<Link to="/studio/plan" className="btn2">Plan a show</Link>} />}
        {groups.map(([label, list]) => (
          <section key={label} style={{ display: 'flex', flexDirection: 'column' }} aria-label={label}>
            <span className="cap" style={{ padding: '4px 0' }}>{label}</span>
            {list.map((n) => (
              <Link key={n.id} to={n.link || '/studio'} className="st-row" style={{ minHeight: 64 }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: n.unread ? 'var(--primary)' : 'transparent' }} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: n.unread ? 'var(--w-medium)' : 'var(--w-medium)' }}>{n.title}</span>
                  <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{n.body}</span>
                </span>
                <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{timeOf(n.at)}</span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
