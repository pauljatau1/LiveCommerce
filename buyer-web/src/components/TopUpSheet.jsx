// Add money to the wallet with Paystack. The server credits only what
// Paystack confirms, for this buyer, as a wallet top-up.
import { useState } from 'react';
import { PAYSTACK_KEY, api, errorMessage, naira } from '../api';
import { useAuth } from '../auth';
import { Sheet } from './ui';

const PRESETS = [5000, 10000, 20000, 50000, 100000, 200000];

const loadPaystack = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v2/inline.js';
    s.onload = () => resolve(window.PaystackPop);
    s.onerror = () => reject(new Error("Couldn't load Paystack. Check your connection."));
    document.head.appendChild(s);
  });

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
    if (!PAYSTACK_KEY) { setError("Payments aren't switched on yet."); return; }
    setBusy(true);
    try {
      const PaystackPop = await loadPaystack();
      const popup = new PaystackPop();
      popup.newTransaction({
        key: PAYSTACK_KEY,
        email: buyer?.email,
        amount: value * 100,
        currency: 'NGN',
        metadata: { purpose: 'wallet_topup', buyerId: buyer?._id },
        onSuccess: async (tx) => {
          try {
            await api.confirmTopUp(value, tx.reference);
            await refreshWallet();
            setDone(value);
            onDone?.();
          } catch (e) {
            setError(`${errorMessage(e, 'We could not confirm the payment yet.')} If you were charged, it will show up shortly.`);
          } finally {
            setBusy(false);
          }
        },
        onCancel: () => setBusy(false),
        onError: (e) => { setError(e?.message || 'Payment failed.'); setBusy(false); },
      });
    } catch (e) {
      setError(e.message);
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
