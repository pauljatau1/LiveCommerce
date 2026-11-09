// After delivery: stars and chips (uses the server's reviewSeller).
import { useState } from 'react';
import { api, errorMessage } from '../api';
import { Sheet } from './ui';

export const REVIEW_TAGS = ['As shown live', 'Good quality', 'Well packed', 'Fast delivery'];
const STAR_WORDS = ['', 'Not good', 'Could be better', 'Okay', 'Good', 'Great'];

export default function RateSheet({ seller, onClose, onDone }) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (t) => setTags((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));

  const send = async () => {
    setError('');
    if (!stars) { setError('Tap the stars first.'); return; }
    const words = comment.trim();
    if (!tags.length && words.length < 10) { setError('Pick what was good, or write a few words (10 letters or more).'); return; }
    if (words && words.length < 10) { setError('Write a little more (10 letters or more), or leave it empty.'); return; }
    setBusy(true);
    try {
      await api.review(seller._id, { rating: stars, tags, comment: words || undefined });
      onDone?.('rated');
    } catch (e) {
      const msg = errorMessage(e, "Couldn't send your rating. Try again.");
      if (/already reviewed/i.test(msg)) { onDone?.('already'); return; }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={`Rate ${seller?.storeName || 'the host'}`} onClose={onClose}>
      <div role="radiogroup" aria-label="Stars" style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n === 1 ? '' : 's'}`} className="star" onClick={() => setStars(n)}>
            <span aria-hidden="true" style={{ color: n <= stars ? 'var(--text)' : 'var(--border-strong)' }}>★</span>
          </button>
        ))}
      </div>
      {stars > 0 && <span className="mut">{STAR_WORDS[stars]}</span>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="What was good">
        {REVIEW_TAGS.map((t) => <button key={t} type="button" className={`chip${tags.includes(t) ? ' on' : ''}`} aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>{t}</button>)}
      </div>
      <div className="fl">
        <label className="lab" htmlFor="rate-c">Anything else? <span className="hint" style={{ fontWeight: 600 }}>optional</span></label>
        <textarea id="rate-c" className="in ta" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
      </div>
      {error && <span className="err" role="alert">{error}</span>}
      <button type="button" className="btn" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send rating'}</button>
    </Sheet>
  );
}
