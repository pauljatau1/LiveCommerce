// The new seller studio shell: tab bar on phones, slim top bar on desktop.
// Same five places everywhere: Home, Products, Go Live, Orders, Me.
import { useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { BRAND_NAME } from '@/config/constants';
import { Icon } from './ui';
import { useIntercomVisibility } from '@/Hooks/useIntercomVisibility';
import './studio.css';

const TABS = [
  { to: '/studio', label: 'Home', icon: Icon.home, end: true },
  { to: '/studio/products', label: 'Products', icon: Icon.products },
  { to: '/studio/golive', label: 'Go Live', live: true },
  { to: '/studio/orders', label: 'Orders', icon: Icon.orders },
  { to: '/studio/me', label: 'Me', icon: Icon.me },
];

// Money is reached from Home and Me. The top-bar link is kept, switched off, to match the design.
const SHOW_MONEY_IN_TOP_BAR = false;

export const Brand = ({ size = 22 }) => (
  <Link to="/studio" className="f" style={{ fontSize: size, display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text)', textDecoration: 'none' }}>
    {BRAND_NAME}<span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50% 50% 50% 2px', background: 'var(--primary)', marginTop: -10 }} />
  </Link>
);

export default function StudioLayout() {
  useIntercomVisibility(true); // the chat launcher would cover the Me tab
  useEffect(() => { document.title = `${BRAND_NAME} studio`; }, []);
  return (
    <div className="studio-app">
      <header className="dbar st-dbar">
        <span style={{ marginRight: 16 }}><Brand /></span>
        <nav aria-label="Main" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TABS.filter((t) => !t.live).map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `dnav${isActive ? ' on' : ''}`}>{t.label}</NavLink>
          ))}
          {SHOW_MONEY_IN_TOP_BAR && <NavLink to="/studio/money" className={({ isActive }) => `dnav${isActive ? ' on' : ''}`}>Money</NavLink>}
        </nav>
        <span style={{ flex: 1 }} />
        <Link to="/studio/golive" className="btn" style={{ background: 'var(--live)', minHeight: 44 }}>{Icon.live('#fff', 18)}Go Live</Link>
      </header>

      <Outlet />

      <nav className="tabbar st-tabbar" aria-label="Main">
        {TABS.map((t) => (t.live ? (
          <NavLink key={t.to} to={t.to} className="tab-live"><span className="c">{Icon.live()}</span>{t.label}</NavLink>
        ) : (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab${isActive ? ' on' : ''}`}>{t.icon}{t.label}</NavLink>
        )))}
      </nav>
    </div>
  );
}
