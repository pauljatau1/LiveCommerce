// Me (design: S-Me): store, settings shortcuts, sign out.
// Settings not yet redesigned open the classic pages.
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';

const Row = ({ to, title, sub, danger, onClick }) => {
  const body = (
    <>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontWeight: 800, color: danger ? 'var(--danger)' : 'var(--text)' }}>{title}</span>{sub && <span className="mut" style={{ fontSize: 13 }}>{sub}</span>}</span>
      {!danger && <span aria-hidden="true" className="mut">›</span>}
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', borderTop: '1px solid #F1EBE3', textDecoration: 'none', color: 'var(--text)', width: '100%', background: 'none', border: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' };
  return onClick ? <button type="button" style={style} onClick={onClick}>{body}</button> : <Link to={to} style={style}>{body}</Link>;
};

export default function Me() {
  const { seller, logout } = useAuthContext();
  const name = seller?.storeName || [seller?.firstName, seller?.lastName].filter(Boolean).join(' ') || 'Your store';
  const address = seller?.sellerAddress || seller?.businessAddress || {};
  const bank = seller?.bankDetails || {};
  return (
    <main className="st-main" style={{ maxWidth: 720 }}>
      <section style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0' }}>
        {seller?.storeAvatar?.url
          ? <img src={seller.storeAvatar.url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', font: '600 26px var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{name.slice(0, 2).toUpperCase()}</span>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 className="f" style={{ margin: 0, fontSize: 22 }}>{name}</h1>
          {seller?.aboutStore && <span className="mut" style={{ fontSize: 14 }}>{seller.aboutStore}</span>}
          {seller?.email && <span className="mut" style={{ fontSize: 14 }}>{seller.email}</span>}
        </div>
      </section>
      <Link to="/dashboard/settings" className="btn2">Edit store profile</Link>

      <nav className="card" aria-label="Settings" style={{ overflow: 'hidden' }}>
        <div style={{ marginTop: -1 }}>
          <Row to="/dashboard/settings" title="Pickup address" sub={[address.addressLine1, address.city, address.state].filter(Boolean).join(', ') || 'Add where couriers collect from'} />
          <Row to="/dashboard/earnings-payouts" title="Bank account" sub={bank.accountNumber ? `${bank.bankName} ••${String(bank.accountNumber).slice(-4)} · ${bank.accountName || ''}` : 'Add a bank account to withdraw'} />
          <Row to="/studio/money" title="Money" sub="Balance, withdrawals and activity" />
          <Row to="/studio/shows" title="Shows" sub="Upcoming and past shows" />
        </div>
      </nav>

      <nav className="card" aria-label="More" style={{ overflow: 'hidden' }}>
        <div style={{ marginTop: -1 }}>
          <Row to="/dashboard/help" title="Help" />
          <Row to="/dashboard/home" title="Classic dashboard" sub="Coupons, messages, analytics and other older tools" />
          <Row title="Sign out" danger onClick={() => logout?.()} />
        </div>
      </nav>
    </main>
  );
}
