// Screens shown while the studio loads, for a link that goes nowhere, and when
// something breaks. Each gives one way forward and a way home; no error codes.
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/constants';
import { Icon } from './ui';
import './studio.css';

const ic = { 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Lost = <svg {...ic} width="30" height="30" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M9 9l4 4M13 9l-4 4" /></svg>;
const Warn = <svg {...ic} width="30" height="30" viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17.5v.5" /></svg>;

const Wordmark = () => <span className="entry-wordmark">{APP_NAME}<i>studio</i></span>;
const Block = ({ w = '100%', h = 14, r, style }) => <span className="sk pulse" style={{ display: 'block', width: w, height: h, borderRadius: r, ...style }} />;

// Loading: the real top and bottom bars, grey blocks where content will be
export function StudioLoader() {
  const tabs = [['Home', Icon.home], ['Products', Icon.products], ['Go Live', null], ['Orders', Icon.orders], ['Me', Icon.me]];
  return (
    <div className="studio-app" role="status" aria-busy="true" aria-label="Loading your studio">
      <div className="dbar st-dbar" aria-hidden="true"><Wordmark /><span style={{ flex: 1 }} /><Block w={32} h={32} r="50%" /></div>
      <div className="entry-head st-hide-desk" aria-hidden="true" style={{ paddingTop: 20 }}><Wordmark /><Block w={32} h={32} r="50%" /></div>
      <div className="st-inner" aria-hidden="true" style={{ paddingTop: 32, gap: 0 }}>
        <Block w={120} />
        <Block w={260} h={28} style={{ marginTop: 12, maxWidth: '80%' }} />
        <Block h={180} r={24} style={{ marginTop: 24 }} />
        <Block h={48} r={999} style={{ marginTop: 16 }} />
        <Block w={90} h={12} style={{ marginTop: 36 }} />
        {[[70, 40], [60, 35], [75, 45]].map(([a, b]) => (
          <div key={a} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            <Block w={48} h={48} r={12} />
            <div style={{ flex: 1 }}><Block w={`${a}%`} /><Block w={`${b}%`} h={12} style={{ marginTop: 8 }} /></div>
          </div>
        ))}
      </div>
      <span className="sr">Loading your studio…</span>
      <nav className="tabbar st-tabbar" aria-hidden="true" style={{ position: 'sticky', bottom: 0, marginTop: 'auto' }}>
        {tabs.map(([label, icon]) => (icon
          ? <span key={label} className={`tab${label === 'Home' ? ' on' : ''}`}>{icon}{label}</span>
          : <span key={label} className="tab-live"><span className="c">{Icon.live()}</span>{label}</span>))}
      </nav>
    </div>
  );
}

const COPY = {
  notFound: { title: 'We can’t find that page', text: 'The link may be old or have a typo. Everything in your studio is where you left it.', icon: Lost, tone: '' },
  error: { title: 'Something went wrong', text: 'It’s on our side, not yours. Reloading usually fixes it. If it keeps happening, message us on WhatsApp from Help.', icon: Warn, tone: ' warn' },
};

// kind: notFound | error. title/text override the words (e.g. a paused account).
export function StudioProblem({ kind, title, text, reload = false, children }) {
  const copy = COPY[kind || (reload ? 'error' : 'notFound')];
  return (
    <div className="studio-app entry">
      <div className="entry-head"><Link to="/studio" className="entry-wordmark">{APP_NAME}<i>studio</i></Link></div>
      <main className="entry-center">
        <span className={`state-ic${copy.tone}`}>{copy.icon}</span>
        <h1 className="hero" style={{ marginTop: 24 }}>{title || copy.title}</h1>
        <p className="mut" style={{ margin: '8px 0 0' }}>{text || copy.text}</p>
      </main>
      <div className="entry-actions">
        {reload && <button type="button" className="btn" onClick={() => window.location.reload()}>Reload</button>}
        <Link className={reload ? 'btn2' : 'btn'} to="/studio">Go to studio</Link>
        {children}
      </div>
    </div>
  );
}
