import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { account, errorText } from './api';
import { Sheet, TopBar } from './ui';

export function BankAccountSheet({ onClose, onSaved }) {
  const { seller } = useAuthContext();
  const [banks, setBanks] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const [code, setCode] = useState(seller?.bankDetails?.bankIdentifierCode || '');
  const [number, setNumber] = useState(seller?.bankDetails?.accountNumber || '');
  const [type, setType] = useState(seller?.bankDetails?.bankAccountType || 'Savings');
  const [verified, setVerified] = useState(null);
  const revision = useRef(0);
  const load = () => { setError(''); account.banks().then(r => setBanks(r.data || [])).catch(e => setError(errorText(e, 'Couldn’t load banks. Please try again.'))); };
  useEffect(() => { load(); return () => { revision.current++; }; }, []);
  const change = (update) => { revision.current++; setVerified(null); setError(''); update(); };
  const check = async () => {
    const current = ++revision.current; setBusy('check'); setError('');
    try { const r = await account.checkBank({ accountNumber: number, bankCode: code }); if (current === revision.current) { if (!r.data?.accountName) throw new Error('Name unavailable'); setVerified({ code, number, name: r.data.accountName }); } }
    catch(e) { if (current === revision.current) setError(errorText(e, 'Couldn’t check this account. Check the details and try again.')); }
    finally { setBusy(''); }
  };
  const save = async e => {
    e.preventDefault(); if (!verified || verified.code !== code || verified.number !== number || busy) return;
    setBusy('save'); setError('');
    try { await account.saveBank({ bankDetails: { ...seller?.bankDetails, bankCountry: 'Nigeria', bankName: banks.find(b => b.code === code)?.name, bankAccountType: type, accountCurrency: 'NGN', accountNumber: number, accountName: verified.name, bankIdentifierCode: code }, isVerified: true }); onSaved?.(); onClose(); }
    catch(e) { setError(errorText(e, 'Couldn’t save your account. Please try again.')); }
    finally { setBusy(''); }
  };
  return <Sheet label="Bank account" onClose={onClose} closeX><h2 className="h2">Your payout account</h2><p className="hint">Check the account name before saving.</p>
    <form className="entry-form" onSubmit={save}>
      <label className="fl"><span className="lab">Bank</span><select className="sel" value={code} disabled={!!busy} required onChange={e => change(() => setCode(e.target.value))}><option value="">Choose a bank</option>{banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></label>
      {!banks.length && <button type="button" className="link" onClick={load}>Reload banks</button>}
      <label className="fl"><span className="lab">Account number</span><input className="in" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required value={number} disabled={!!busy} onChange={e => change(() => setNumber(e.target.value.replace(/\D/g, '')))} /></label>
      <label className="fl"><span className="lab">Account type</span><select className="sel" value={type} onChange={e => setType(e.target.value)}>{['Savings','Current','Business'].map(t => <option key={t}>{t}</option>)}</select></label>
      {verified ? <div className="banner b-ok" role="status">{verified.name}</div> : <button type="button" className="btn2" onClick={check} disabled={!!busy || number.length !== 10 || !code}>{busy === 'check' ? 'Checking…' : 'Check account name'}</button>}
      {error && <span className="err-text" role="alert">{error}</span>}
      <button className="btn" disabled={!verified || !!busy}>{busy === 'save' ? 'Saving…' : 'Save bank account'}</button>
    </form></Sheet>;
}
export default function BankAccount() {
  const navigate = useNavigate();
  return <div className="studio-app"><TopBar title="Bank account" onBack={() => navigate('/studio/me')} /><BankAccountSheet onClose={() => navigate('/studio/me')} /></div>;
}
