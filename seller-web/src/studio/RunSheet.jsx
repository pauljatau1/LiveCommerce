// Before a run: an optional note in the seller's own words ("Red, size M", up to
// 40 characters), the starting bid and the auction time. Used for "Run again" and
// for adding a note before the first run. Kept above the keyboard.
import { useState } from 'react';
import { naira } from './api';
import useKeyboardInset from './useKeyboardInset';
import { Sheet } from './ui';

const LENGTHS = [[30, '30s'], [60, '60s'], [120, '2 min']];

export default function RunSheet({ item, again, busy, blocked = false, error = '', onStart, onClose }) {
  const [note, setNote] = useState(again ? '' : item.runNote || '');
  const [minBid, setMinBid] = useState(String(item.minBid || ''));
  const [seconds, setSeconds] = useState(item.auctionSeconds || 30);
  const kb = useKeyboardInset();
  const bid = Number(String(minBid).replace(/[^\d]/g, '')) || 0;

  return (
    <Sheet className="run-sheet" label={again ? 'Run again' : 'Before bidding starts'} onClose={onClose} lift={kb.bottom} maxHeight={kb.bottom ? kb.height - 12 : null}>
      <span className="h2">{again ? `Run again · ${item.colour?`${item.colour} · `:''}${item.stock} left` : item.name}</span>
      <span className="hint run-item-name">{again ? item.name : "One item per run"}</span>
      {error && <div className="run-error" role="alert">{error}</div>}
      <div className="fl">
        <label className="lab" htmlFor="run-note">Note for this run <span className="hint" style={{ fontWeight: 600 }}>optional</span></label>
        {!item.colour && (item.colourVariants || []).length > 1 && <div role="group" aria-label="Suggested colour notes" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {item.colourVariants.map((colour) => <button key={colour} type="button" className={`chip${note === colour.slice(0, 40) ? ' on' : ''}`} onClick={() => setNote(colour.slice(0, 40))}>{colour}</button>)}
        </div>}
        <input id="run-note" className="in" value={note} maxLength={40} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Red, size M" />
        <span className="hint">{note.length} / 40 · Shown to buyers. No contacts or links.</span>
      </div>
      <div className="fl">
        <label className="lab" htmlFor="run-bid">Starting bid</label>
        <span className="money" style={{ maxWidth: 200 }}><span>₦</span><input id="run-bid" inputMode="numeric" value={bid ? bid.toLocaleString('en-NG') : ''} onChange={(e) => setMinBid(e.target.value)} /></span>
      </div>
      <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Auction time">
        {LENGTHS.map(([v, l]) => <button key={v} type="button" className={`chip${seconds === v ? ' on' : ''}`} aria-pressed={seconds === v} onClick={() => setSeconds(v)}>{l}</button>)}
      </div>
      <button type="button" className="btn" disabled={busy || blocked || bid < 100} onClick={() => onStart({ note: note.trim(), minBid: bid, seconds })}>
        {busy ? 'Starting…' : blocked ? 'Waiting for the show…' : `Start · ${naira(bid)}`}
      </button>
    </Sheet>
  );
}
