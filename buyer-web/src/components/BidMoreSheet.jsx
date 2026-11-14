// "Bid more": step chips instead of typing an amount. Each chip shows the bid
// it makes. Big jumps ask once more before bidding. No auto-bidding.
import { useState } from 'react';
import { naira } from '../api';
import { Sheet } from './ui';
import { stepFor } from './watch';

// Chips that respect the step rules: nothing smaller than the current step.
export const chipsFor = (current) => {
  const top = Number(current?.currentBid) || 0;
  const step = stepFor(top);
  return (step >= 2500 ? [2500, 5000, 10000] : [500, 1000, 2000, 5000]).filter((c) => c >= step);
};

// A jump of ₦5,000 or more, or half the top bid or more, is worth a second look.
export const isBigJump = (top, amount) => top > 0 && (amount - top >= 5000 || amount - top >= top / 2);

export default function BidMoreSheet({ current, top, onClose, onPlace }) {
  const base = current.currentBid > 0 ? current.currentBid : current.minBid || 0;
  const chips = chipsFor(current);
  const [pick, setPick] = useState(chips[0]);
  const [confirming, setConfirming] = useState(false);
  const amount = base + pick;
  const bidNow = () => {
    if (!confirming && isBigJump(current.currentBid, amount)) { setConfirming(true); return; }
    onPlace(amount);
  };
  return (
    <Sheet title="Bid more" top={top} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }} role="group" aria-label="How much more">
        {chips.map((c) => (
          <button key={c} type="button" className={`chip chip-amt${pick === c ? ' on' : ''}`} aria-pressed={pick === c} onClick={() => { setPick(c); setConfirming(false); }}>
            <span className="f">{naira(base + c)}</span>
            <small>+{naira(c)}</small>
          </button>
        ))}
      </div>
      <p className="mut" style={{ margin: 0 }}>We hold {naira(amount)} from your wallet. It comes back if someone outbids you.</p>
      {confirming ? (
        <>
          <p style={{ margin: 0, fontWeight: 'var(--w-medium)' }}>That's {naira(amount - current.currentBid)} more than the top bid. Bid {naira(amount)}?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn2" style={{ flex: 1 }} onClick={() => setConfirming(false)}>Pick less</button>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={bidNow}>Yes, bid {naira(amount)}</button>
          </div>
        </>
      ) : (
        <button type="button" className="btn" onClick={bidNow}>Bid {naira(amount)}</button>
      )}
    </Sheet>
  );
}
