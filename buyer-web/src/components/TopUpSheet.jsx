// Add money to the wallet with Paystack. The server credits only what
// Paystack confirms, for this buyer, as a wallet top-up.
import { useState } from 'react';
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
      <Sheet title="Wallet topped up" onClose={onClose} top={top}>
        <div className="soft s-primary" style={{ fontWeight: 700 }}>{naira(done)} added. You have {naira(wallet?.availableBalance)} to spend.</div>
        <button type="button" className="btn" onClick={onClose}>Back to the show</button>
      </Sheet>
    );
  }

  return (
    <Sheet title="Top up your wallet" onClose={onClose} top={top}>
      <p className="mut" style={{ margin: 0, fontSize: 15 }}>
        Bids and Buy Now are paid from your wallet, so checkout is instant.{need > 0 ? <> You need <strong>{naira(need)}</strong> more for this.</> : null}
      </p>
      <div className="amounts" role="group" aria-label="Amount">
        {PRESETS.map((p) => (
          <button key={p} type="button" className={`qr${value === p ? ' on' : ''}`} aria-pressed={value === p} onClick={() => setAmount(String(p))}>{naira(p)}</button>
        ))}
      </div>
      <div className="fl">
        <label className="lab" htmlFor="tu-amt">Or enter an amount</label>
        <input id="tu-amt" className="in" inputMode="numeric" value={value ? value.toLocaleString('en-NG') : ''} onChange={(e) => setAmount(e.target.value)} placeholder="₦" />
      </div>
      {error && <span className="err" role="alert">{error}</span>}
      <button type="button" className="btn" disabled={busy} onClick={pay}>{busy ? 'Waiting for Paystack…' : `Pay ${naira(value)} with Paystack`}</button>
      <span className="hint" style={{ textAlign: 'center' }}>Card, bank transfer or USSD. Your wallet is credited once Paystack confirms.</span>
    </Sheet>
  );
}
