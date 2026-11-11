/* eslint-disable react-refresh/only-export-components */
// Show notes editor: fixed sections in a fixed order, 600 characters in all.
// "Never pay outside the app." is always included (the server adds it too).
export const NOTE_SECTIONS = [
  ['howToBuy', 'How to buy'],
  ['delivery', 'Delivery'],
  ['payment', 'Payment and safety'],
  ['sizes', 'Sizes and returns'],
  ['fromSeller', 'From the seller'],
];
export const NOTES_MAX = 600;
export const ALWAYS = 'Never pay outside the app.';

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
// What the seller types in Payment, without the fixed line (shown separately)
export const paymentExtra = (p) => clean(p).replace(/never pay outside the app\.?/gi, '').trim();
export const notesLength = (notes) => NOTE_SECTIONS.reduce((n, [k]) => n + (k === 'payment' ? clean(`${ALWAYS} ${paymentExtra(notes?.[k])}`).length : clean(notes?.[k]).length), 0);
export const hasNotes = (notes) => Boolean(notes) && NOTE_SECTIONS.some(([k]) => (k === 'payment' ? paymentExtra(notes[k]) : clean(notes[k])));
export const firstLineOf = (notes) => {
  const first = NOTE_SECTIONS.map(([k]) => clean(notes?.[k])).find(Boolean) || '';
  return first.split(/(?<=[.!?])\s/)[0];
};

export default function NotesEditor({ notes, onChange, idPrefix = 'sn' }) {
  const set = (k) => (e) => onChange({ ...notes, [k]: e.target.value });
  const used = notesLength(notes);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {NOTE_SECTIONS.map(([k, label]) => (
        <div key={k} className="fl">
          <label className="lab" htmlFor={`${idPrefix}-${k}`}>{label}</label>
          {k === 'payment' && <span className="hint" style={{ fontWeight: 'var(--w-medium)', color: 'var(--text)' }}>{ALWAYS} <span className="mut" style={{ fontWeight: 'var(--w-medium)' }}>(always included)</span></span>}
          <textarea
            id={`${idPrefix}-${k}`}
            className="in ta"
            style={{ minHeight: 64 }}
            value={k === 'payment' ? paymentExtra(notes?.[k]) : notes?.[k] || ''}
            onChange={k === 'payment' ? (e) => onChange({ ...notes, payment: e.target.value }) : set(k)}
          />
        </div>
      ))}
      <span className="hint" aria-live="polite" style={used > NOTES_MAX ? { color: 'var(--danger)', fontWeight: 'var(--w-medium)' } : undefined}>
        {used} / {NOTES_MAX} characters{used > NOTES_MAX ? ': shorten them a little' : ''}. No links, phone or account numbers.
      </span>
    </div>
  );
}
