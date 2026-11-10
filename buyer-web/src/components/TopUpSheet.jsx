// Add money to the wallet with Paystack. The server credits only what
// Paystack confirms, for this buyer, as a wallet top-up.
import { useEffect, useState } from 'react';
import { errorMessage, naira } from '../api';
import { PaymentCancelled, topUpWithPaystack } from '../payments';
import { useAuth } from '../auth';
import { Sheet } from './ui';

const PRESETS = [5000, 10000, 20000, 50000, 100000, 200000];

export default function TopUpSheet({ onClose, need = 0, onDone, top = null }) {
  const { buyer, wallet, refreshWallet } = useAuth();
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
      await topUpWithPaystack({ email: buyer?.email, buyerId: buyer?._id, amount: value });
      await refreshWallet();
      setDone(value);
      onDone?.();
    } catch (e) {
      if (!(e instanceof PaymentCancelled)) setError(`${errorMessage(e, e.message || 'We could not confirm the payment yet.')} If you were charged, it will show up shortly.`);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Sheet className="wallet-sheet" title="Wallet topped up" onClose={onClose} top={top}>
        <div className="soft s-primary" style={{ fontWeight: 700 }}>{naira(done)} added. You have {naira(wallet?.availableBalance)} to spend.</div>
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
      <button type="button" className="btn" disabled={busy} onClick={pay}>{busy ? 'Waiting for Paystack…' : `Add ${naira(value)}`}</button>
      <span className="hint" style={{ textAlign: 'center' }}>Secure payment with Paystack</span>
    </Sheet>
  );
}
