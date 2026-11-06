import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { naira } from '../api';
import { useAuth } from '../auth';

export const Icon = {
  close: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  back: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>,
  send: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4l2 8z" /></svg>,
  eye: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  wallet: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M16 13h2M3 10h18" /></svg>,
  share: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" /></svg>,
  sound: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M17 9a4 4 0 0 1 0 6" /></svg>,
};

export function Header({ back, title }) {
  const { signedIn, wallet } = useAuth();
  return (
    <header className="top" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      {back ? <Link to={back} className="ib" aria-label="Back">{Icon.back}</Link> : <Link to="/" className="brand">[brand]<i /></Link>}
      <span className="f" style={{ flex: 1, fontSize: 18 }}>{title || ''}</span>
      {signedIn ? (
        <>
          <Link to="/orders" className="link" style={{ fontSize: 14, marginRight: 4 }}>Orders</Link>
          <Link to="/wallet" className="wallet-chip">{Icon.wallet}{naira(wallet?.availableBalance)}</Link>
        </>
      ) : (
        <Link to="/signin" className="btn2" style={{ minHeight: 40 }}>Sign in</Link>
      )}
    </header>
  );
}

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="scrim" onClick={onClose} />
      <div className="sheet2">
        <span className="grab" aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 className="h2" style={{ flex: 1 }}>{title}</h2>
          <button type="button" className="ib" aria-label="Close" onClick={onClose}>{Icon.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
