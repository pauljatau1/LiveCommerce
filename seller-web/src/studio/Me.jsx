// Me (design: S-Me): store, settings shortcuts, sign out.
// Settings not yet redesigned open the classic pages.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studio, errorText } from './api';
import { Sheet } from './ui';

const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
import { useAuthContext } from '@/Hooks/useAuthContextV2';

const Row = ({ to, title, sub, danger, onClick }) => {
  const body = (
    <>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontWeight: 'var(--w-medium)', color: danger ? 'var(--danger)' : 'var(--text)' }}>{title}</span>{sub && <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{sub}</span>}</span>
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
  // Weekly show slot: buyers who follow get "Live every Saturday at 7pm" and a repeating calendar invite
  const [slot, setSlot] = useState(null);
  const [editSlot, setEditSlot] = useState(null);
  const [slotError, setSlotError] = useState('');
  useEffect(() => { studio.slot().then((r) => setSlot(r?.slot || null)).catch(() => {}); }, []);
  const saveSlot = async () => {
    setSlotError('');
    try { const r = await studio.saveSlot(editSlot.day, editSlot.time); setSlot(r.slot); setEditSlot(null); } catch (e) { setSlotError(errorText(e, "Couldn't save. Try again.")); }
  };
  return (
    <main className="st-main" style={{ maxWidth: 720 }}>
      <section style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0' }}>
        {seller?.storeAvatar?.url
          ? <img src={seller.storeAvatar.url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', color: 'var(--text)', font: 'var(--w-display) var(--t-display) var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{name.slice(0, 2).toUpperCase()}</span>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-h1)' }}>{name}</h1>
          {seller?.aboutStore && <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{seller.aboutStore}</span>}
          {seller?.email && <span className="mut" style={{ fontSize: 'var(--t-small)' }}>{seller.email}</span>}
        </div>
      </section>
      <Link to="/dashboard/settings" className="btn2">Edit store profile</Link>

      <nav className="card" aria-label="Settings" style={{ overflow: 'hidden' }}>
        <div style={{ marginTop: -1 }}>
          <Row to="/dashboard/settings" title="Pickup address" sub={[address.addressLine1, address.city, address.state].filter(Boolean).join(', ') || 'Add where couriers collect from'} />
          <Row to="/dashboard/earnings-payouts" title="Bank account" sub={bank.accountNumber ? `${bank.bankName} ••${String(bank.accountNumber).slice(-4)} · ${bank.accountName || ''}` : 'Add a bank account to withdraw'} />
          <Row to="/studio/money" title="Money" sub="Balance, withdrawals and activity" />
          <Row to="/studio/shows" title="Shows" sub="Upcoming and past shows" />
          <Row title="Weekly show" sub={slot?.saved ? slot.label : 'Pick a regular day and time'} onClick={() => setEditSlot({ day: slot?.day ?? 6, time: slot?.time || '19:00' })} />
        </div>
      </nav>

      <nav className="card" aria-label="More" style={{ overflow: 'hidden' }}>
        <div style={{ marginTop: -1 }}>
          <Row to="/dashboard/help" title="Help" />
          <Row to="/dashboard/home" title="Classic dashboard" sub="Coupons, messages, analytics and other older tools" />
          <Row title="Sign out" danger onClick={() => logout?.()} />
        </div>
      </nav>
      {editSlot && (
        <div className="studio-app" style={{ display: 'contents' }}>
          <Sheet label="Weekly show" onClose={() => setEditSlot(null)}>
            <span className="h2">Weekly show</span>
            <span className="hint">Buyers who follow you see when you're live next, and can add it to their calendar every week.</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Day">
              {DAYS.map(([d, l]) => <button key={d} type="button" className={`chip${editSlot.day === d ? ' on' : ''}`} aria-pressed={editSlot.day === d} onClick={() => setEditSlot((s) => ({ ...s, day: d }))}>{l}</button>)}
            </div>
            <div className="fl">
              <label className="lab" htmlFor="slot-time">Time (Lagos)</label>
              <input id="slot-time" type="time" className="in" style={{ width: 140 }} value={editSlot.time} onChange={(e) => setEditSlot((s) => ({ ...s, time: e.target.value }))} />
            </div>
            {slotError && <span className="err-text" role="alert">{slotError}</span>}
            <button type="button" className="btn" onClick={saveSlot}>Save</button>
          </Sheet>
        </div>
      )}
    </main>
  );
}
