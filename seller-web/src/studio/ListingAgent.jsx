// Listing Agent: add a product by chatting.
// Seller drops photos → AI drafts the listing → seller answers what the photos
// can't show (quantity, official or replica, price) → publish.
// Design: Claude Design canvas, "S-List-*" screens (Start, Thinking, Draft,
// Published, Fallback, Desktop).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerUtils } from '@/util/auth';
import { draftFromPhotos, fetchCategories, publishListing, refineDraft, shrinkPhoto } from './listingApi';
import './studio.css';

const MAX_PHOTOS = 5;
const CONDITIONS = ['Brand New', 'Fairly Used', 'Refurbished'];
const QUICK_TWEAKS = ['Shorter title', 'Funnier description', 'Add the box details'];
const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
const digits = (v) => Number(String(v).replace(/[^\d]/g, '')) || 0;
const fmt = (v) => (digits(v) ? digits(v).toLocaleString('en-NG') : '');

const Icon = {
  close: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  camera: (c = 'currentColor') => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13" r="4" /></svg>,
  gallery: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>,
  send: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)"><path d="M3 20l18-8L3 4l2 8z" /></svg>,
  check: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-10" /></svg>,
  wifi: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" /></svg>,
  x: <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
};

function Bot({ children }) {
  return (
    <div className="bot">
      <span className="av" aria-hidden="true" />
      <div className="bub">{children}</div>
    </div>
  );
}

function Thinking({ label }) {
  return (
    <Bot>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span>{label}</span>
        <span role="status" aria-label="Thinking" style={{ display: 'flex', gap: 6, padding: '2px 0' }}>
          <span className="dt" /><span className="dt" style={{ animationDelay: '.15s' }} /><span className="dt" style={{ animationDelay: '.3s' }} />
        </span>
      </span>
    </Bot>
  );
}

// One editable row of the buyer preview
function Field({ label, editing, onEdit, highlight, children, editor }) {
  if (editing) {
    return (
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F1EBE3', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--primary-soft)' }}>
        <span className="cap" style={{ color: 'var(--primary-strong)' }}>{label} · EDITING</span>
        {editor}
      </div>
    );
  }
  return (
    <button type="button" className={`row${highlight ? ' hl' : ''}`} onClick={onEdit}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span className="cap">{label}{highlight ? <> · <span style={{ color: 'var(--warm)' }}>JUST UPDATED</span></> : null}</span>
        {children}
      </span>
      <span className="ed">Edit</span>
    </button>
  );
}

export default function ListingAgent() {
  const navigate = useNavigate();
  const sellerName = sellerUtils.getSeller()?.firstName;
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState('start'); // start | thinking | draft | published | fallback
  const [draft, setDraft] = useState(null);
  const [previousDraft, setPreviousDraft] = useState(null);
  const [changed, setChanged] = useState(null); // field the AI just changed
  const [thread, setThread] = useState([]); // seller messages and AI replies after the draft
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [authenticity, setAuthenticity] = useState(null);
  const [price, setPrice] = useState('');
  const [allowAuction, setAllowAuction] = useState(false);
  const [startingBid, setStartingBid] = useState('');
  const [instant, setInstant] = useState('');
  const [published, setPublished] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const chatEnd = useRef(null);

  useEffect(() => { fetchCategories().then(setCategories); }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [thread, phase, busy]);

  const addFiles = useCallback(async (fileList) => {
    setError('');
    const files = Array.from(fileList || []).slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) {
      if (photos.length >= MAX_PHOTOS) setError(`Up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const results = await Promise.allSettled(files.map((f) => shrinkPhoto(f)));
    const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const bad = results.find((r) => r.status === 'rejected');
    if (bad) setError(bad.reason.message);
    setPhotos((p) => [...p, ...ok].slice(0, MAX_PHOTOS));
  }, [photos.length]);

  const totalKb = useMemo(() => Math.round(photos.reduce((s, p) => s + p.bytes, 0) / 1024), [photos]);

  const applyDraft = (d) => {
    setDraft(d);
    if (d.suggestedPrice && !price) {
      const mid = Math.round((d.suggestedPrice.low + d.suggestedPrice.high) / 2 / 500) * 500;
      setPrice(fmt(mid));
    }
  };

  const startDraft = async () => {
    if (!photos.length) { setError('Add at least one photo first.'); return; }
    setError('');
    setPhase('thinking');
    try {
      const d = await draftFromPhotos(photos, note.trim());
      applyDraft(d);
      setPhase('draft');
    } catch (e) {
      setError(e.message);
      setDraft((cur) => cur || { title: '', category: null, subCategory: null, condition: /new/i.test(note) ? 'Brand New' : null, description: note.trim(), tags: [], questions: [] });
      setPhase('fallback');
    }
  };

  const askForChange = async (instruction) => {
    const ask = instruction.trim();
    if (!ask || busy || !draft) return;
    setThread((t) => [...t, { from: 'me', text: ask }]);
    setBusy(true);
    try {
      const before = draft;
      const next = await refineDraft({ ...draft, suggestedPrice: draft.suggestedPrice }, ask);
      const diff = ['title', 'description', 'tags', 'category', 'condition'].find((k) => JSON.stringify(next[k]) !== JSON.stringify(before[k]));
      setPreviousDraft(before);
      setDraft({ ...next, questions: before.questions });
      setChanged(diff || null);
      setThread((t) => [...t, { from: 'bot', text: diff ? 'Done. It’s updated in the preview.' : 'I kept it as it was. Try saying it another way?', undo: Boolean(diff) }]);
    } catch (e) {
      setThread((t) => [...t, { from: 'bot', text: e.message }]);
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (!previousDraft) return;
    setDraft(previousDraft);
    setPreviousDraft(null);
    setChanged(null);
    setThread((t) => [...t.map((m) => ({ ...m, undo: false })), { from: 'bot', text: 'Undone.' }]);
  };

  const update = (patch) => { setDraft((d) => ({ ...d, ...patch })); setChanged(null); };

  const extraQuestions = (draft?.questions || []).filter((q) => !/how many|quantity|official|authentic|replica|bootleg/i.test(q));
  const missing = [];
  if (!photos.length) missing.push('a photo');
  if (!draft?.title?.trim()) missing.push('a title');
  if (!draft?.category) missing.push('a category');
  if (!draft?.condition) missing.push('the condition');
  if (!draft?.description?.trim()) missing.push('a description');
  if (!quantity) missing.push('how many you have');
  if (!digits(price)) missing.push('a price');
  if (allowAuction && !digits(startingBid)) missing.push('a starting bid');
  if (allowAuction && digits(instant) && digits(instant) <= digits(startingBid)) missing.push('a “sell instantly” price above the starting bid');

  const publish = async () => {
    if (missing.length || busy) return;
    setBusy(true);
    setError('');
    try {
      const product = await publishListing({
        ...draft,
        photos,
        quantity,
        price: digits(price),
        authenticity: authenticity || 'unknown',
        auction: allowAuction ? { startingBid: digits(startingBid), instant: digits(instant) || null } : null,
      });
      setPublished(product);
      setPhase('published');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPhotos([]); setNote(''); setDraft(null); setPreviousDraft(null); setThread([]); setChanged(null);
    setQuantity(null); setAuthenticity(null); setPrice(''); setAllowAuction(false); setStartingBid(''); setInstant('');
    setPublished(null); setError(''); setEditing(null); setPhase('start');
  };

  const editAll = () => {
    navigate('/dashboard/products/add-products', {
      state: {
        listingDraft: {
          fromDraft: true,
          name: draft?.title || '',
          description: draft?.description || note,
          category: draft?.category || '',
          subCategory: draft?.subCategory || '',
          brand: draft?.brand || '',
          price: digits(price) || undefined,
          stock: quantity || undefined,
          condition: draft?.condition || '',
          tags: draft?.tags || [],
          weight: draft?.weightKg || 1,
          images: photos.map((p, i) => ({ url: p.dataUrl, contentType: p.contentType, isDefault: i === 0 })),
        },
      },
    });
  };

  const subCategoriesFor = (name) => categories.find((c) => c.name === name)?.subCategories || [];
  const hiddenInputs = (
    <>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
    </>
  );

  const header = (status) => (
    <header className="top" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
      <button type="button" className="ib" aria-label="Close" onClick={() => navigate(-1)}>{Icon.close}</button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="f" style={{ fontSize: 17 }}>Listing helper</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: phase === 'thinking' ? 'var(--primary)' : 'var(--text-muted)' }}>{status}</span>
      </div>
      {phase !== 'published' && <button type="button" className="link" style={{ fontSize: 13 }} onClick={editAll}>Edit all details</button>}
    </header>
  );

  const offlineBanner = !online && (
    <div className="banner b-warn" role="status">{Icon.wifi}<span style={{ flex: 1 }}>You're offline. Your draft stays here until the signal is back.</span></div>
  );

  const photoBubble = photos.length > 0 && (
    <div className="thumbs">
      {photos.map((p, i) => (
        <span key={p.id} className="thumb-x">
          <img src={p.dataUrl} alt={`Photo ${i + 1}`} />
          {phase === 'start' && (
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}>{Icon.x}</button>
          )}
        </span>
      ))}
    </div>
  );

  // ---- Start: drop photos ----
  if (phase === 'start') {
    return (
      <div className="studio-app">
        {hiddenInputs}
        {header('New item')}
        {offlineBanner}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px', width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <Bot>Hi{sellerName ? ` ${sellerName}` : ''}! What are we selling today?</Bot>
          {photos.length === 0 ? (
            <button
              type="button"
              aria-label="Add photos"
              className={`drop${dragOver ? ' over' : ''}`}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            >
              <span className="blob" style={{ width: 88, height: 88, borderRadius: 30 }}>
                <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13" r="4" /></svg>
              </span>
              <span className="f" style={{ fontSize: 21, lineHeight: 1.25, maxWidth: 280 }}>Snap or drop up to 5 photos. I'll write the listing.</span>
              <span className="mut" style={{ fontSize: 14 }}>Front, back, and any damage. Plain background helps.</span>
            </button>
          ) : (
            <>
              {photoBubble}
              <span className="hint" style={{ alignSelf: 'flex-end' }}>{photos.length} photo{photos.length > 1 ? 's' : ''} · {totalKb > 1024 ? `${(totalKb / 1024).toFixed(1)} MB` : `${totalKb} KB`}</span>
            </>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={() => cameraInput.current?.click()} disabled={photos.length >= MAX_PHOTOS}>{Icon.camera('#fff')}Camera</button>
            <button type="button" className="btn2" style={{ flex: 1 }} onClick={() => fileInput.current?.click()} disabled={photos.length >= MAX_PHOTOS}>{Icon.gallery}Gallery</button>
          </div>
          {error && <span className="err-text" role="alert">{error}</span>}
          <span className="hint" style={{ textAlign: 'center' }}>Photos are shrunk before upload to save your data.</span>
        </div>
        <form className="composer" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onSubmit={(e) => { e.preventDefault(); startDraft(); }}>
          <label htmlFor="ls-note" className="sr">Add a note</label>
          <input id="ls-note" className="in" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Add a note (optional), e.g. used once, box dented" style={{ border: 0, background: 'var(--surface-sunken)', borderRadius: 999, height: 48 }} />
          {photos.length > 0
            ? <button type="submit" className="btn" style={{ minHeight: 48, padding: '0 18px', flex: 'none' }} disabled={!online}>Write it</button>
            : <button type="submit" className="ib" aria-label="Send" style={{ background: 'var(--primary-soft)' }}>{Icon.send}</button>}
        </form>
      </div>
    );
  }

  // ---- Thinking ----
  if (phase === 'thinking') {
    return (
      <div className="studio-app">
        {header('looking at your photos…')}
        <div className="chat" style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          {photoBubble}
          {note.trim() && <div className="me">{note.trim()}</div>}
          <Thinking label="Looking at your photos…" />
          <div className="ind card" aria-hidden="true" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="sk" style={{ height: 150, borderRadius: 16 }} />
            <span className="sk" style={{ height: 18, width: '85%' }} />
            <span className="sk" style={{ height: 14, width: '50%' }} />
          </div>
        </div>
      </div>
    );
  }

  // ---- Published ----
  if (phase === 'published') {
    return (
      <div className="studio-app">
        {header('Published')}
        <div className="chat" style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <div className="me">Publish</div>
          <Bot>It's live in your shop.</Bot>
          <section className="ind card" aria-label="Published" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--success-soft)' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.check}</span>
              <span className="f" style={{ fontSize: 19, color: 'var(--success)' }}>Listed</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={photos[0]?.dataUrl} alt="" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{draft?.title}</span>
                <span className="f" style={{ fontSize: 18 }}>{naira(digits(price))}</span>
                <span className="mut" style={{ fontSize: 13 }}>{allowAuction ? `or bid from ${naira(digits(startingBid))} · ` : ''}{quantity} in stock</span>
              </div>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" className="btn" onClick={() => navigate(published?._id ? `/studio/plan?add=${published._id}` : '/studio/plan')}>Add to a show</button>
              <button type="button" className="btn2" onClick={reset}>List another</button>
            </div>
          </section>
          <button type="button" className="ind btn3" onClick={() => navigate('/studio/products')}>See all my products</button>
        </div>
      </div>
    );
  }

  // ---- Draft (and fallback form) ----
  const titleEditor = (
    <div style={{ display: 'flex', gap: 8 }}>
      <label htmlFor="la-title" className="sr">Title</label>
      <input id="la-title" className="in" autoFocus maxLength={80} value={draft?.title || ''} onChange={(e) => update({ title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setEditing(null)} style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }} />
      <button type="button" className="ib" aria-label="Save title" style={{ background: 'var(--primary)' }} onClick={() => setEditing(null)}>{Icon.check}</button>
    </div>
  );
  const categoryEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label className="sr" htmlFor="la-cat">Category</label>
      <select id="la-cat" className="sel" value={draft?.category || ''} onChange={(e) => update({ category: e.target.value || null, subCategory: null })}>
        <option value="">Choose a category</option>
        {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      {subCategoriesFor(draft?.category).length > 0 && (
        <>
          <label className="sr" htmlFor="la-sub">Sub-category</label>
          <select id="la-sub" className="sel" value={draft?.subCategory || ''} onChange={(e) => update({ subCategory: e.target.value || null })}>
            <option value="">Choose a sub-category (optional)</option>
            {subCategoriesFor(draft?.category).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}
      <button type="button" className="btn2" onClick={() => setEditing(null)}>Done</button>
    </div>
  );
  const conditionEditor = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Condition">
      {CONDITIONS.map((c) => (
        <button key={c} type="button" className={`qr${draft?.condition === c ? ' on' : ''}`} aria-pressed={draft?.condition === c} onClick={() => { update({ condition: c }); setEditing(null); }}>{c}</button>
      ))}
    </div>
  );
  const descriptionEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor="la-desc" className="sr">Description</label>
      <textarea id="la-desc" className="in ta" autoFocus rows={5} maxLength={1500} value={draft?.description || ''} onChange={(e) => update({ description: e.target.value })} />
      <button type="button" className="btn2" onClick={() => setEditing(null)}>Done</button>
    </div>
  );
  const tagsEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(draft?.tags || []).map((t) => (
          <button key={t} type="button" className="tg" aria-label={`Remove tag ${t}`} onClick={() => update({ tags: draft.tags.filter((x) => x !== t) })}>{t} {Icon.x}</button>
        ))}
      </span>
      <label htmlFor="la-tag" className="sr">Add a tag</label>
      <input id="la-tag" className="in" placeholder="Add a tag and press Enter" onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const t = e.currentTarget.value.trim().toLowerCase();
        if (t && !(draft?.tags || []).includes(t)) update({ tags: [...(draft?.tags || []), t].slice(0, 8) });
        e.currentTarget.value = '';
      }} />
      <button type="button" className="btn2" onClick={() => setEditing(null)}>Done</button>
    </div>
  );

  const preview = (
    <section className="preview" aria-label="Listing preview, as buyers see it">
      <div style={{ position: 'relative' }}>
        {photos[0] ? <img src={photos[0].dataUrl} alt="Cover photo" style={{ display: 'block', width: '100%', height: 230, objectFit: 'cover' }} /> : <div className="sk" style={{ height: 230, borderRadius: 0 }} />}
        <span className="pill" style={{ position: 'absolute', left: 12, top: 12, background: '#fff', color: 'var(--text)' }}>Buyer preview · draft</span>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={photos.length >= MAX_PHOTOS} style={{ position: 'absolute', right: 10, bottom: 10, minHeight: 40, padding: '0 12px', border: 0, borderRadius: 999, background: 'rgba(255,255,255,.95)', font: '800 13px var(--font-body)', color: 'var(--primary)', cursor: 'pointer' }}>
          {photos.length} photo{photos.length === 1 ? '' : 's'} · add
        </button>
      </div>
      <Field label="TITLE" editing={editing === 'title'} onEdit={() => setEditing('title')} highlight={changed === 'title'} editor={titleEditor}>
        <span className="f" style={{ fontSize: 19, lineHeight: 1.25 }}>{draft?.title || <span className="mut">Add a title</span>}</span>
      </Field>
      <Field label="CATEGORY" editing={editing === 'category'} onEdit={() => setEditing('category')} highlight={changed === 'category'} editor={categoryEditor}>
        <span style={{ fontWeight: 700 }}>{draft?.category ? `${draft.category}${draft.subCategory ? ` › ${draft.subCategory}` : ''}` : <span className="mut">Choose a category</span>}</span>
      </Field>
      <Field label="CONDITION" editing={editing === 'condition'} onEdit={() => setEditing('condition')} highlight={changed === 'condition'} editor={conditionEditor}>
        <span>{draft?.condition ? <span className="pill p-active">{draft.condition}</span> : <span className="mut">Choose the condition</span>}</span>
      </Field>
      <Field label="DESCRIPTION" editing={editing === 'description'} onEdit={() => setEditing('description')} highlight={changed === 'description'} editor={descriptionEditor}>
        <span style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{draft?.description || <span className="mut">Add a description</span>}</span>
      </Field>
      <Field label="TAGS" editing={editing === 'tags'} onEdit={() => setEditing('tags')} highlight={changed === 'tags'} editor={tagsEditor}>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(draft?.tags || []).length ? draft.tags.map((t) => <span key={t} className="tg">{t}</span>) : <span className="mut">No tags yet</span>}
        </span>
      </Field>
    </section>
  );

  const priceCard = (
    <div className="ind card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="fl">
        <label className="lab" htmlFor="la-price">Buy Now price</label>
        <div className="money"><span>₦</span><input id="la-price" inputMode="numeric" value={price} onChange={(e) => setPrice(fmt(e.target.value))} placeholder="0" /></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, fontWeight: 800, cursor: 'pointer' }}>
        Also allow auction
        <span className={`tgl${allowAuction ? ' on' : ''}`} aria-hidden="true"><i /></span>
        <input type="checkbox" className="sr" checked={allowAuction} onChange={(e) => { setAllowAuction(e.target.checked); if (e.target.checked && !startingBid && digits(price)) setStartingBid(fmt(Math.round(digits(price) * 0.6 / 500) * 500)); }} />
      </label>
      {allowAuction && (
        <>
          <div className="fl"><label className="lab" htmlFor="la-bid">Starting bid</label><div className="money"><span>₦</span><input id="la-bid" inputMode="numeric" value={startingBid} onChange={(e) => setStartingBid(fmt(e.target.value))} /></div></div>
          <div className="fl">
            <label className="lab" htmlFor="la-inst">Sell instantly at <span className="hint" style={{ fontWeight: 600 }}>optional</span></label>
            <div className="money"><span>₦</span><input id="la-inst" inputMode="numeric" value={instant} onChange={(e) => setInstant(fmt(e.target.value))} /></div>
            <span className="hint">If someone bids this much, the auction ends and they win.</span>
          </div>
        </>
      )}
    </div>
  );

  const isFallback = phase === 'fallback';

  const conversation = (
    <>
      {photoBubble}
      {note.trim() && <div className="me">{note.trim()}</div>}
      {isFallback ? (
        <Bot>
          {(error || "I couldn't read that one.").replace(/\s*(You can )?fill (it|the form) in( here| yourself)?\.?$/i, '')} Fill it in here. I kept what you told me.{' '}
          <button type="button" className="link" style={{ minHeight: 32 }} onClick={startDraft} disabled={!online}>Try the AI again</button>
        </Bot>
      ) : (
        <Bot>
          {draft?.title && draft?.confidence !== 'low'
            ? <>Looks like <strong>{draft.title}</strong>. Here's a draft. Tap anything to change it.</>
            : <>Here's a draft. I wasn't sure about everything, so check it. Tap anything to change it.</>}
        </Bot>
      )}

      <Bot>How many do you have?</Bot>
      <div className="ind" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} role="group" aria-label="Quantity">
        {[1, 2].map((n) => <button key={n} type="button" className={`qr${quantity === n ? ' on' : ''}`} aria-pressed={quantity === n} onClick={() => setQuantity(n)}>{n}</button>)}
        {quantity !== null && quantity >= 3
          ? <span className="money" style={{ width: 120, height: 44 }}><label htmlFor="la-qty" className="sr">Quantity</label><input id="la-qty" inputMode="numeric" autoFocus value={quantity} onChange={(e) => setQuantity(Math.max(3, Math.min(999, digits(e.target.value) || 3)))} style={{ fontSize: 16, paddingLeft: 14 }} /></span>
          : <button type="button" className="qr" onClick={() => setQuantity(3)}>3+</button>}
      </div>

      <Bot>Is it official merch or a replica?</Bot>
      <div className="ind" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Official or replica">
        {[['official', 'Official'], ['replica', 'Replica'], ['unknown', 'Not sure']].map(([v, l]) => (
          <button key={v} type="button" className={`qr${authenticity === v ? ' on' : ''}`} aria-pressed={authenticity === v} onClick={() => setAuthenticity(v)}>{l}</button>
        ))}
      </div>

      {extraQuestions.map((q) => <Bot key={q}>{q} <span className="hint">Reply below.</span></Bot>)}

      <Bot>
        {draft?.suggestedPrice
          ? <>Similar items usually go for <strong>{naira(draft.suggestedPrice.low)}–{naira(draft.suggestedPrice.high)}</strong> (estimate). What's your price?</>
          : <>What's your price?</>}
      </Bot>
      {priceCard}

      {thread.map((m, i) => (m.from === 'me'
        ? <div key={i} className="me">{m.text}</div>
        : <Bot key={i}>{m.text} {m.undo && previousDraft ? <button type="button" className="link" style={{ minHeight: 32 }} onClick={undo}>Undo</button> : null}</Bot>))}
      {busy && phase !== 'published' && <Thinking label="Working on it…" />}
      {!isFallback && (
        <div className="ind" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_TWEAKS.map((t) => <button key={t} type="button" className="chip" disabled={busy || !online} onClick={() => askForChange(t)}>{t}</button>)}
        </div>
      )}
      <div ref={chatEnd} />
    </>
  );

  return (
    <div className="studio-app">
      {hiddenInputs}
      {header(isFallback ? 'Fill in the details' : 'Draft ready')}
      {offlineBanner}
      <div className="layout">
        {preview}
        <div className="chat-col">
          <div className="chat">{conversation}</div>
          <ChatComposer
            disabled={busy || !online || isFallback}
            onSend={askForChange}
            onPhotos={() => fileInput.current?.click()}
            publishLabel={digits(price) ? `Publish for ${naira(digits(price))}` : 'Publish'}
            onPublish={publish}
            missing={missing}
            busy={busy}
            error={error && !isFallback ? error : ''}
            placeholder={isFallback ? 'The AI is off for this one' : extraQuestions.length ? 'Answer, or ask for a change' : 'Ask for a change'}
          />
        </div>
      </div>
    </div>
  );
}

function ChatComposer({ disabled, onSend, onPhotos, publishLabel, onPublish, missing, busy, error, placeholder }) {
  const [text, setText] = useState('');
  return (
    <div className="composer">
      {missing.length > 0 && <span className="hint" role="status">Still needed: {missing.join(', ')}.</span>}
      {error && <span className="err-text" role="alert">{error}</span>}
      <button type="button" className="btn" style={{ minHeight: 56, fontSize: 17 }} disabled={missing.length > 0 || busy} onClick={onPublish}>
        {busy ? 'Working…' : publishLabel}
      </button>
      <form style={{ display: 'flex', gap: 8, alignItems: 'center' }} onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text); setText(''); } }}>
        <button type="button" className="ib" aria-label="Add photos" onClick={onPhotos}>{Icon.camera()}</button>
        <label htmlFor="la-msg" className="sr">Message</label>
        <input id="la-msg" className="in" value={text} maxLength={400} disabled={disabled} onChange={(e) => setText(e.target.value)} placeholder={placeholder} style={{ border: 0, background: 'var(--surface-sunken)', borderRadius: 999, height: 48 }} />
        <button type="submit" className="ib" aria-label="Send" disabled={disabled || !text.trim()} style={{ background: 'var(--primary-soft)' }}>{Icon.send}</button>
      </form>
    </div>
  );
}
