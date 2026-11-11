// Money (design: S-Money / S-Withdraw): balance, withdraw sheet, activity.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';
import { CLASSIC_DASHBOARD } from '@/config/featureFlags';
import { BankAccountSheet } from './BankAccount';
import { Problem, Skeleton, TopBar, Sheet } from './ui';

export default function Money() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [bankSheet, setBankSheet] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [toast, setToast] = useState('');
  const load = useCallback(() => {
    setError('');
    studio.money().then(setData).catch((e) => setError(errorText(e, "Couldn't load your money.")));
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);

  const withdraw = async (e) => {
    e.preventDefault();
    setBusy(true); setSheetError('');
    try {
      await studio.withdraw(Number(amount));
      setSheet(false);
      setToast(`Withdrawal of ${naira(amount)} requested. We'll tell you when it's sent.`);
      load();
    } catch (err) {
      setSheetError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const bank = data?.bank;
  return (
    <div className="studio-app">
      <TopBar title="Money" onBack={() => navigate(-1)} />
      <div className="st-inner">
        {error && <Problem text={error} onRetry={load} />}
        {!data && !error && <><Skeleton h={200} r={24} /><Skeleton h={240} /></>}
        {data && (
          <>
            <section className="card" aria-label="Balance" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface)' }}>
              <span className="cap" style={{ color: 'var(--primary-strong)' }}>READY TO WITHDRAW</span>
              <span className="f" style={{ fontSize: 'var(--t-hero)', lineHeight: 1 }}>{naira(data.ready)}</span>
              {bank
                ? <button type="button" className="btn" disabled={data.ready < 1000} onClick={() => { setAmount(String(Math.floor(data.ready))); setSheetError(''); setSheet(true); }}>Withdraw to {bank.bankName} ••{bank.last4}</button>
                : CLASSIC_DASHBOARD ? <Link to="/dashboard/earnings-payouts" className="btn">Add your bank account</Link> : <button className="btn" onClick={() => setBankSheet(true)}>Add your bank account</button>}
              {data.ready < 1000 && bank && <span className="hint">The smallest withdrawal is ₦1,000.</span>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #CFE8DA', fontSize: 'var(--t-body)' }}>
                <span><strong>{naira(data.pending)}</strong> on the way</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>released a day after delivery</span>
              </div>
              {data.requested > 0 && <span className="hint">{naira(data.requested)} withdrawal being processed.</span>}
            </section>

            <p className="mut" style={{ margin: 0, fontSize: 'var(--t-small)', lineHeight: 1.5 }}>Money from a sale is ready a day after the buyer gets their package, less the platform and payment fees. Withdrawals usually reach your bank within a few hours.</p>

            <section className="card" style={{ padding: '4px 16px 8px' }} aria-label="Activity">
              <h2 className="h2" style={{ padding: '12px 0 8px' }}>Activity</h2>
              {!data.activity.length && <p className="mut" style={{ margin: '0 0 12px' }}>Sales and withdrawals will show here.</p>}
              {data.activity.map((a) => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 0', borderTop: '1px solid #F1EBE3' }}>
                  <span aria-hidden="true" style={{ flex: 'none', width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--w-medium) var(--t-body) var(--font-body)', ...(a.kind === 'in' ? { background: 'var(--success-soft)', color: 'var(--success)' } : a.kind === 'out' ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)' } : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }) }}>{a.kind === 'in' ? '+' : a.kind === 'out' ? '↓' : '−'}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={{ fontWeight: 'var(--w-medium)' }}>{a.label}</span><span className="mut" style={{ fontSize: 'var(--t-small)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[a.detail, when(a.date)].filter(Boolean).join(' · ')}</span></div>
                  <span className="f" style={{ color: a.kind === 'in' ? 'var(--success)' : 'var(--text)' }}>{a.kind === 'in' ? '+' : '−'}{naira(a.amount)}</span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      {sheet && bank && (
        <Sheet label="Confirm withdrawal" onClose={() => setSheet(false)}>
          <h2 className="f" style={{ margin: 0, fontSize: 'var(--t-h1)' }}>Withdraw {naira(amount || 0)}?</h2>
          <form onSubmit={withdraw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="fl"><label className="lab" htmlFor="wamount">Amount (₦)</label>
              <div style={{ display: 'flex', gap: 8 }}><input id="wamount" className="in" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} /><button type="button" className="btn3" onClick={() => setAmount(String(Math.floor(data.ready)))}>All</button></div>
            </div>
            <div className="soft" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-page)', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'var(--w-medium)' }}>{bank.bankName} ••{bank.last4}</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>{bank.accountName}</span></div>
              {CLASSIC_DASHBOARD ? <Link to="/dashboard/earnings-payouts" className="link">Change</Link> : <button type="button" className="link" onClick={() => { setSheet(false); setBankSheet(true); }}>Change</button>}
            </div>
            {sheetError && <span className="err-text" role="alert">{sheetError}</span>}
            <div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn3" style={{ flex: 1 }} onClick={() => setSheet(false)}>Cancel</button><button type="submit" className="btn" style={{ flex: 1.5 }} disabled={busy || Number(amount) < 1000}>{busy ? 'Requesting…' : `Withdraw ${naira(amount || 0)}`}</button></div>
          </form>
        </Sheet>
      )}
      {bankSheet && <BankAccountSheet onClose={() => setBankSheet(false)} onSaved={load} />}
      {toast && <div className="toast" role="status" style={{ position: 'fixed', left: 16, right: 16, bottom: 24, maxWidth: 480, margin: '0 auto', zIndex: 60 }}><span style={{ flex: 1 }}>{toast}</span></div>}
    </div>
  );
}
