// Show notes in Live studio: the five sections as a list (first line + Edit).
// Editing one section shows only that text, a growing text area, the character
// count, and Save / Cancel kept just above the keyboard, so the field you're
// typing in never scrolls out of view.
import { useEffect, useRef, useState } from 'react';
import { ALWAYS, NOTE_SECTIONS, NOTES_MAX, notesLength, paymentExtra } from './NotesEditor';
import useKeyboardInset from './useKeyboardInset';
import { Sheet } from './ui';

const firstLine = (s) => String(s || '').split(/(?<=[.!?])\s/)[0];

export default function NotesSheet({ notes, busy, onSave, onClose }) {
  const [editing, setEditing] = useState(null); // section key
  const [text, setText] = useState('');
  const area = useRef(null);
  const kb = useKeyboardInset();
  const current = notes || {};

  const valueOf = (k) => (k === 'payment' ? paymentExtra(current.payment) : current[k] || '');
  const next = editing ? { ...current, [editing]: text } : current;
  const used = notesLength(next);

  // Grow with the text (up to about 6 lines, then it scrolls inside)
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text, editing]);

  const save = async () => { if (await onSave(next)) setEditing(null); };

  if (editing) {
    const label = NOTE_SECTIONS.find(([k]) => k === editing)?.[1];
    return (
      <Sheet label={`Edit ${label}`} onClose={() => setEditing(null)} lift={kb.bottom} maxHeight={kb.bottom ? kb.height - 12 : null}>
        <span className="h2">{label}</span>
        {editing === 'payment' && <span className="hint" style={{ fontWeight: 'var(--w-medium)', color: 'var(--text)' }}>{ALWAYS} <span className="mut" style={{ fontWeight: 'var(--w-medium)' }}>(always included)</span></span>}
        <label htmlFor="nt-edit" className="sr">{label}</label>
        <textarea id="nt-edit" ref={area} className="in ta" style={{ minHeight: 72, resize: 'none', overflowY: 'auto' }} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <span className="hint" aria-live="polite" style={used > NOTES_MAX ? { color: 'var(--danger)', fontWeight: 'var(--w-medium)' } : undefined}>
          {used} / {NOTES_MAX} characters for all notes. No links, phone or account numbers.
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn3" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancel</button>
          <button type="button" className="btn" style={{ flex: 1.3 }} disabled={busy || used > NOTES_MAX} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet label="Show notes" onClose={onClose} closeX>
      <span className="h2" style={{ paddingRight: 44 }}>Show notes</span>
      <span className="hint">Pinned under your name for everyone watching. When you save, buyers see "Updated".</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {NOTE_SECTIONS.map(([k, label]) => {
          const v = k === 'payment' ? `${ALWAYS} ${paymentExtra(current.payment)}`.trim() : current[k];
          return (
            <button key={k} type="button" className="nt-row" onClick={() => { setText(valueOf(k)); setEditing(k); }}>
              <span className="nt-tx">
                <b>{label}</b>
                <span className={v ? '' : 'mut'}>{v ? firstLine(v) : 'Nothing yet'}</span>
              </span>
              <span className="nt-edit">Edit</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
