// Add money to the wallet with Paystack. The server credits only what
// Paystack confirms, for this buyer, as a wallet top-up.
import { useEffect, useRef, useState } from 'react';
import { errorMessage, naira } from '../api';
import { PaymentCancelled, topUpWithPaystack } from '../payments';
import { useAuth } from '../auth';
import StayOnStreamTopUps from './StayOnStreamTopUps';
import { Sheet } from './ui';

const PRESETS = [5000, 10000, 20000, 50000, 100000, 200000];

export default function TopUpSheet({ onClose, need = 0, onDone, top = null, methods: configuredMethods, onWaiting, onPending, onCancelled, initialBank }) {
  const { buyer, wallet, refreshWallet } = useAuth();
  const methods = wallet?.topUpMethods || configuredMethods || {};
  const enhanced = methods.dva || methods.savedCards;
  const [method, setMethod] = useState(initialBank ? 'bank' : 'card');
  const [saveCard, setSaveCard] = useState(true);
  const [doneSource, setDoneSource] = useState('card');
  const handled = useRef(new Set());
  const finishRef = useRef(null);
  const finish = async (reference, credited, source = 'card') => {
    if (reference && handled.current.has(reference)) return;
    if (reference) handled.current.add(reference);
    await refreshWallet(); setDone(credited); setDoneSource(source);
    onDone?.(reference, credited, source);
  };
  finishRef.current = finish;
  useEffect(() => {
    const receive = (event) => finishRef.current(event.detail.reference, event.detail.amount, event.detail.source);
    window.addEventListener('gbam:wallet_credited', receive);
    return () => window.removeEventListener('gbam:wallet_credited', receive);
  }, []);
  const suggested = need > 0 ? Math.ceil(need / 1000) * 1000 : 10000;
  const [amount, setAmount] = useState(String(suggested));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [balanceError, setBalanceError] = useState(false);
  useEffect(() => {
    let active = true;
    refreshWallet().then((balance) => { if (active) setBalanceError(!balance); });
    return () => { active = false; };
  }, [refreshWallet]);
  const value = Number(String(amount).replace(/[^\d]/g, '')) || 0;

  const pay = async () => {
    setError('');
    if (value < 100) { setError('Enter at least ₦100.'); return; }
    setBusy(true);
    try {
      onPending?.();
      const reference = await topUpWithPaystack({ email: buyer?.email, buyerId: buyer?._id, amount: value, saveCard: methods.savedCards && saveCard });
      await finish(reference, value);
    } catch (e) {
      if (e instanceof PaymentCancelled) onCancelled?.();
      if (!(e instanceof PaymentCancelled)) setError(`${errorMessage(e, e.message || 'We could not confirm the payment yet.')} If you were charged, it will show up shortly.`);
    } finally {
      setBusy(false);
    }
  };

  const cardForm=<div className="wallet-card-form">
      <div className="amounts" role="group" aria-label="Amount">
        {PRESETS.map((p) => (
          <button key={p} type="button" className={`qr${value === p ? ' on' : ''}`} aria-pressed={value === p} onClick={() => setAmount(String(p))}>{naira(p)}</button>
        ))}
      </div>
      <div className="fl">
        <label className="lab" htmlFor="tu-amt">Top-up amount</label>
        <input id="tu-amt" className="in" inputMode="numeric" value={value ? value.toLocaleString('en-NG') : ''} onChange={(e) => setAmount(e.target.value)} placeholder="₦" />
      </div>
      {error && <span className="err" role="alert">{error}</span>}
      {methods.savedCards && <label className="hint"><input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} /> Save this card for one-tap top-ups</label>}
      <button type="button" className="btn" disabled={busy} onClick={pay}>{busy ? 'Waiting for Paystack…' : enhanced ? `Pay with card · ${naira(value)}` : `Add ${naira(value)}`}</button>
      <span className="hint" style={{ textAlign: 'center' }}>{enhanced ? "Paystack opens on top of the show. You won't leave it." : 'Secure payment with Paystack'}</span>

  </div>;

  if (done) {
    return (
      <Sheet className="wallet-sheet" title="Wallet topped up" onClose={onClose} top={top}>
        <div className="soft s-primary" style={{ fontWeight: 'var(--w-medium)' }}>{naira(done)} {doneSource === 'transfer' ? 'received' : 'added'}. You have {naira(wallet?.availableBalance)} to spend.</div>
        <button type="button" className="btn" onClick={onClose}>Back to the show</button>
      </Sheet>
    );
  }

  return (
    <Sheet className="wallet-sheet" title="Your wallet" onClose={onClose} top={top}>
      <div className="wallet-available" role="status">
        <span>Available to spend</span>
        <strong>{typeof wallet?.availableBalance === 'number' ? naira(wallet.availableBalance) : '—'}</strong>
        {balanceError && <small>Couldn’t refresh. {wallet ? 'Showing your last balance.' : 'Try opening your wallet again.'}</small>}
        {wallet?.onHoldAmount > 0 && <small>{naira(wallet.onHoldAmount)} held in bids</small>}
      </div>
      <p className="mut wallet-copy">{need > 0 ? `Add ${naira(need)} more to continue.` : 'Add money for your next bid.'}</p>
      {enhanced && <StayOnStreamTopUps methods={methods} amount={value} need={need} onDone={finish} onWaiting={onWaiting} onPending={onPending} onMethod={setMethod} onUseAnotherCard={pay} onBusyChange={setBusy} initialBank={initialBank} cardForm={cardForm} externalBusy={busy} />}
      {!enhanced&&cardForm}
      {method === 'bank' && <button type="button" className="btn2" onClick={onClose}>Back to the show</button>}
    </Sheet>
  );
}
