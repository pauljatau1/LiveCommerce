import useStudioBack from './useStudioBack';
// Add and edit a product. Phone: one column with Save fixed at the bottom.
// Desktop: the studio top bar, Save at the top right, and a live preview.
// Opened from the listing agent it arrives filled in ("Filled in from your photos").
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { studio, account, errorText, naira } from './api';
import { Problem, Skeleton, TopBar } from './ui';
import { DesktopBar } from './StudioLayout';
import {
  editorForm, productPayload, missingFields, categoryWeight, colourRow, coloursTotal,
  MAX_PHOTOS, WEIGHT_PICKS, WEIGHT_HINTS,
} from './productEditor';
import { CONDITIONS, AUTHENTICITY, authenticityLabel } from './catalogue';

const LOCAL_STYLES = ['Ankara', 'Aso-oke', 'Adire', 'Lace'];

const ic = { 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Sparkle = <svg {...ic} width="18" height="18" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>;
const Alert = <svg {...ic} width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>;
const SmallX = <svg {...ic} strokeWidth="2.5" width="14" height="14" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const AddPhoto = <svg {...ic} strokeWidth="2.2" width="22" height="22" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
const Plus = <svg {...ic} strokeWidth="2.2" width="18" height="18" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
const Down = (c = 'currentColor') => <svg {...ic} stroke={c} strokeWidth="2.2" width="20" height="20" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>;

const srcOf = (img) => img?.url || img?.data || '';
const plainText = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const digitsOnly = (v) => String(v).replace(/[^\d.]/g, '');
const groupDigits = (v) => {
  const raw = String(v ?? '');
  if (!raw || raw.includes('.')) return raw;
  return Number(raw).toLocaleString('en-NG');
};

const readFiles = (files) => Promise.all([...files].map((file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ url: reader.result, contentType: file.type });
  reader.onerror = reject;
  reader.readAsDataURL(file);
})));

const FieldError = ({ id, text }) => (text ? <p className="field-err" id={id}>{Alert}<span>{text}</span></p> : null);

// Photos: cover first, remove, add (up to 5), hold and drag to reorder.
// Mouse: drag and drop. Touch: hold for a moment, then drag. Screen readers: "Make cover".
function Photos({ images, onChange, error }) {
  const inputId = useId();
  const strip = useRef(null);
  const [drag, setDrag] = useState(null); // index being moved
  const [readError, setReadError] = useState('');
  const hold = useRef(null);
  const live = useRef({ images, drag: null, over: null });
  live.current.images = images;

  const move = (from, to) => {
    if (from === to || from == null || to == null) return;
    const next = [...live.current.images];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  const add = async (e) => {
    setReadError('');
    try {
      const room = Math.max(0, MAX_PHOTOS - images.length);
      const added = await readFiles([...e.target.files].slice(0, room));
      onChange([...images, ...added]);
    } catch {
      setReadError('Couldn’t read that photo. Try another one.');
    }
    e.target.value = '';
  };

  // Touch: hold 350ms to pick a photo up; scrolling is blocked only while dragging
  useEffect(() => {
    const el = strip.current;
    if (!el) return undefined;
    const indexAt = (t) => {
      const tile = document.elementFromPoint(t.clientX, t.clientY)?.closest?.('[data-ph]');
      return tile ? Number(tile.dataset.ph) : null;
    };
    const start = (e) => {
      const tile = e.target.closest?.('[data-ph]');
      if (!tile || e.target.closest('button')) return;
      const index = Number(tile.dataset.ph);
      clearTimeout(hold.current);
      hold.current = setTimeout(() => { live.current.drag = index; live.current.over = index; setDrag(index); }, 350);
    };
    const moveTouch = (e) => {
      if (live.current.drag == null) { clearTimeout(hold.current); return; }
      e.preventDefault();
      const over = indexAt(e.touches[0]);
      if (over != null) live.current.over = over;
    };
    const end = () => {
      clearTimeout(hold.current);
      if (live.current.drag != null) move(live.current.drag, live.current.over);
      live.current.drag = null;
      setDrag(null);
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', moveTouch, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', moveTouch);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="pe-photos">
      <div className="lab ed-pad">
        <span>Photos</span>
        <span className="opt">{images.length} of {MAX_PHOTOS}<span className="st-hide-phone"> · the first is the cover · drag to reorder</span></span>
      </div>
      <div className="ph-strip" ref={strip}>
        {images.map((img, i) => (
          <div
            key={`${srcOf(img).slice(-24)}-${i}`}
            data-ph={i}
            className={`ph${drag === i ? ' dragging' : ''}`}
            draggable
            onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); move(drag, i); setDrag(null); }}
            onDragEnd={() => setDrag(null)}
          >
            <img src={srcOf(img)} alt={`Photo ${i + 1}${i === 0 ? ', cover' : ''}`} />
            <button type="button" className="x" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(images.filter((_, n) => n !== i))}>{SmallX}</button>
            {i === 0 ? <span className="pill">Cover</span> : <button type="button" className="sr" onClick={() => move(i, 0)}>Make photo {i + 1} the cover</button>}
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <label className="add-tile" htmlFor={inputId}>{AddPhoto}<span>Add<span className="st-hide-phone"> photo</span></span></label>
        )}
      </div>
      <input id={inputId} className="sr" type="file" accept="image/*" multiple onChange={add} />
      <p className="hint ed-pad pe-phone" style={{ margin: '6px 0 0' }}>Hold and drag to reorder. The first photo is the cover.</p>
      <div className="ed-pad"><FieldError text={readError || error} /></div>
    </div>
  );
}

function Stepper({ value, onChange, label, small = false }) {
  const n = Number(value) || 0;
  return (
    <div className={`stepper${small ? ' sm' : ''}`}>
      <button type="button" aria-label={`One less${label ? `, ${label}` : ''}`} onClick={() => onChange(Math.max(0, n - 1))}>−</button>
      <input aria-label={label || 'Quantity'} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))} onBlur={() => onChange(n)} />
      <button type="button" aria-label={`One more${label ? `, ${label}` : ''}`} onClick={() => onChange(n + 1)}>+</button>
    </div>
  );
}

function Seg({ label, value, options, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

function Colours({ colours, onChange, error }) {
  const update = (key, patch) => onChange(colours.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const addPhoto = async (key, e) => {
    const [img] = await readFiles([...e.target.files].slice(0, 1)).catch(() => []);
    if (img) update(key, { images: [img] });
    e.target.value = '';
  };
  return (
    <div className="ed-sub" id="pe-colours">
      <p className="b" style={{ fontWeight: 'var(--w-medium)' }}>Colours {!colours.length && <span className="opt mut" style={{ fontWeight: 'var(--w-regular)' }}>optional</span>}</p>
      <p className="hint" style={{ margin: '2px 0 0' }}>
        {colours.length ? 'Each colour has its own stock and, if you like, its own photo.' : 'Add colours if you sell the same item in more than one. Each gets its own stock and, if you like, its own photo.'}
      </p>
      {colours.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)' }}>
          {colours.map((c) => (
            <div className="ed-colour" key={c.key}>
              {srcOf(c.images?.[0])
                ? <div className="ph"><img src={srcOf(c.images[0])} alt={`${c.value || 'Colour'} photo`} /><button type="button" className="x" style={{ width: 20, height: 20, top: 2, right: 2 }} aria-label={`Remove the photo for ${c.value || 'this colour'}`} onClick={() => update(c.key, { images: [] })}>{SmallX}</button></div>
                : <label className="add-tile" aria-label={`Add a photo for ${c.value || 'this colour'}`}>{AddPhoto}<input className="sr" type="file" accept="image/*" onChange={(e) => addPhoto(c.key, e)} /></label>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`inbox${error && !c.value.trim() ? ' bad' : ''}`}>
                  <input aria-label="Colour name" placeholder="e.g. Green and gold" value={c.value} maxLength={60} onChange={(e) => update(c.key, { value: e.target.value })} />
                  <button type="button" className="eye" aria-label={`Remove ${c.value || 'this colour'}`} onClick={() => onChange(colours.filter((x) => x.key !== c.key))}>{SmallX}</button>
                </div>
              </div>
              <Stepper small label={`${c.value || 'colour'} in stock`} value={c.stock} onChange={(stock) => update(c.key, { stock })} />
            </div>
          ))}
        </div>
      )}
      <FieldError text={error} />
      <button type="button" className="btn2" style={{ width: 'auto', alignSelf: 'flex-start', display: 'inline-flex', marginTop: 12 }} onClick={() => onChange([...colours, colourRow()])}>{Plus}Add colour</button>
      {colours.length > 0 && <p className="hint" style={{ margin: '12px 0 0' }}>Stock: <b style={{ color: 'var(--text)' }}>{coloursTotal(colours)} in total</b>, added up from your colours.</p>}
    </div>
  );
}

function Weight({ form, set, error }) {
  const hint = form.weightSource === 'agent' ? WEIGHT_HINTS.agent : form.weightSource === 'category' ? WEIGHT_HINTS.category : '';
  return (
    <div className="fl" id="pe-weight" style={{ padding: '20px 0 4px' }}>
      <label className="lab" htmlFor="pe-wt">Weight</label>
      <div className={`inbox${error ? ' bad' : ''}`} style={{ width: 160 }}>
        <input id="pe-wt" inputMode="decimal" value={form.weight} aria-invalid={!!error} aria-describedby="pe-wt-err" onChange={(e) => { set('weight', e.target.value.replace(/[^\d.,]/g, '')); set('weightSource', 'typed'); }} />
        <span className="unit">kg</span>
      </div>
      <FieldError id="pe-wt-err" text={error} />
      {hint && <p className="hint" style={{ margin: 0 }}>{hint}</p>}
      <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {WEIGHT_PICKS.map(([label, kg]) => (
          <button key={label} type="button" className={`chip${Number(form.weight) === kg ? ' on' : ''}`} aria-pressed={Number(form.weight) === kg} onClick={() => { set('weight', kg); set('weightSource', 'typed'); }}>{label} · {kg} kg</button>
        ))}
      </div>
      <p className="mut" style={{ margin: '4px 0 0', fontSize: 'var(--t-caption)' }}>Shipbubble uses this to price delivery.</p>
    </div>
  );
}

function More({ form, set }) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const otherStyle = form.localStyle && !LOCAL_STYLES.includes(form.localStyle);
  const [styleOther, setStyleOther] = useState(otherStyle);
  const summary = [form.fabric, authenticityLabel(form.authenticity) !== 'Not sure' && authenticityLabel(form.authenticity), form.tags.length ? `${form.tags.length} tag${form.tags.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ') || 'Fabric, local style, original or replica, tags';
  const addTag = () => { const t = tag.trim().replace(/,$/, ''); if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]); setTag(''); };
  return (
    <div>
      <button type="button" className="sect-row" aria-expanded={open} aria-controls="pe-more" onClick={() => setOpen(!open)}>
        <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontWeight: 'var(--w-medium)' }}>Fabric, style and more</p>{!open && <p className="mut" style={{ fontSize: 'var(--t-small)' }}>{summary}</p>}</div>
        {Down('var(--text-muted)')}
      </button>
      {open && (
        <div id="pe-more" className="ed-fields" style={{ paddingBottom: 24 }}>
          <div className="fl"><label className="lab" htmlFor="pe-fabric">Fabric</label><div className="inbox"><input id="pe-fabric" value={form.fabric} maxLength={60} onChange={(e) => set('fabric', e.target.value)} placeholder="e.g. Cotton wax print" /></div></div>
          <div className="fl">
            <span className="lab" id="pe-style-l">Local style</span>
            <div className="chips" role="group" aria-labelledby="pe-style-l" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LOCAL_STYLES.map((s) => <button key={s} type="button" className={`chip${form.localStyle === s && !styleOther ? ' on' : ''}`} aria-pressed={form.localStyle === s && !styleOther} onClick={() => { setStyleOther(false); set('localStyle', form.localStyle === s ? '' : s); }}>{s}</button>)}
              <button type="button" className={`chip${styleOther ? ' on' : ''}`} aria-pressed={styleOther} onClick={() => { setStyleOther(!styleOther); if (!styleOther && LOCAL_STYLES.includes(form.localStyle)) set('localStyle', ''); }}>Other</button>
            </div>
            {styleOther && <div className="inbox"><input aria-label="Local style" value={form.localStyle} maxLength={60} onChange={(e) => set('localStyle', e.target.value)} placeholder="e.g. Bubu" /></div>}
          </div>
          <div className="fl"><span className="lab">Original or replica</span><Seg label="Original or replica" value={form.authenticity} options={AUTHENTICITY} onChange={(v) => set('authenticity', v)} /></div>
          <div className="fl">
            <label className="lab" htmlFor="pe-tag">Tags</label>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {form.tags.map((t) => <span key={t} className="tg" style={{ paddingRight: 4 }}>{t}<button type="button" className="eye" style={{ width: 32, height: 32 }} aria-label={`Remove tag ${t}`} onClick={() => set('tags', form.tags.filter((x) => x !== t))}>{SmallX}</button></span>)}
              </div>
            )}
            <div className="inbox"><input id="pe-tag" value={tag} onChange={(e) => (e.target.value.endsWith(',') ? (setTag(e.target.value), addTag()) : setTag(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} onBlur={addTag} placeholder="Add a tag and press enter" enterKeyHint="done" /></div>
          </div>
          <div className="ed-two">
            <div className="fl"><label className="lab" htmlFor="pe-sku">SKU <span className="opt">optional</span></label><div className="inbox"><input id="pe-sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} /></div></div>
            <div className="fl"><label className="lab" htmlFor="pe-upc">Barcode <span className="opt">optional</span></label><div className="inbox"><input id="pe-upc" value={form.upc} inputMode="numeric" onChange={(e) => set('upc', e.target.value)} /></div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ form, seller }) {
  const city = seller?.sellerAddress?.city || seller?.businessAddress?.city || '';
  const desc = plainText(form.description);
  return (
    <aside className="ed-preview" aria-label="Preview">
      <p className="sec">How buyers see it</p>
      <div style={{ marginTop: 12, overflow: 'hidden', borderRadius: 18, background: 'var(--surface)' }}>
        {srcOf(form.images[0]) ? <img src={srcOf(form.images[0])} alt="" style={{ display: 'block', width: '100%', aspectRatio: '4 / 5', objectFit: 'cover' }} /> : <span className="sk" style={{ display: 'block', aspectRatio: '4 / 5', borderRadius: 0 }} />}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {form.condition && <span className="pill p-draft">{form.condition}</span>}
            {form.authenticity !== 'unknown' && <span className="pill p-draft">{authenticityLabel(form.authenticity)}</span>}
          </div>
          <p className="h1" style={{ marginTop: 10 }}>{form.name || 'Product name'}</p>
          <p className="f" style={{ margin: '4px 0 0', fontSize: 'var(--t-display)' }}>{Number(form.salePrice) > 0 ? naira(form.salePrice) : form.price ? naira(form.price) : '₦ —'}</p>
          {desc && <p className="mut" style={{ margin: '10px 0 0', fontSize: 'var(--t-small)' }}>{desc.length > 140 ? `${desc.slice(0, 140)}…` : desc}</p>}
          <p style={{ margin: '14px 0 0', paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 'var(--t-small)' }}>
            <b>{seller?.storeName || 'Your store'}</b>{city && <span className="mut"> · {city}</span>}
          </p>
        </div>
      </div>
      <p className="hint" style={{ margin: '12px 0 0' }}>Updates as you type.</p>
    </aside>
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { seller } = useAuthContext();
  const draft = location.state?.listingDraft;
  const [original, setOriginal] = useState(draft || {});
  const [form, setForm] = useState(id ? null : editorForm(draft));
  const [categories, setCategories] = useState([]);
  const [weights, setWeights] = useState(null);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState([]);
  const [phase, setPhase] = useState(''); // '' | saving | saved
  const priceTouched = useRef(false);

  useEffect(() => {
    account.categories()
      .then((r) => setCategories((Array.isArray(r) ? r : r.categories || r.data || [])))
      .catch((e) => setError(errorText(e, 'Couldn’t load categories. Check your connection and try again.')));
    account.categoryWeights().then(setWeights).catch(() => {});
    if (id) {
      account.product(id)
        .then((r) => { const p = r.product || r.data || r; setOriginal(p); setForm(editorForm(p)); })
        .catch((e) => setError(errorText(e, 'Couldn’t load this product. Go back and try again.')));
    }
  }, [id]);

  // A product added by hand starts at the typical weight for its category
  useEffect(() => {
    setForm((f) => (f && f.weightSource === 'category' ? { ...f, weight: categoryWeight(weights, f.category) } : f));
  }, [weights, form?.category]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (missing.length) setMissing((m) => m.filter((x) => x.key !== key));
  };
  const errFor = (key) => missing.find((m) => m.key === key)?.text || '';
  const clearMissing = (key) => setMissing((m) => m.filter((x) => x.key !== key));
  const setImages = (images) => { setForm((f) => ({ ...f, images })); clearMissing('photos'); };
  const pickCategory = (category) => { setForm((f) => ({ ...f, category, subCategory: '' })); clearMissing('category'); };

  const save = async (e) => {
    e?.preventDefault();
    if (phase) return;
    setError('');
    const problems = missingFields(form);
    setMissing(problems);
    if (problems.length) {
      const el = document.getElementById(`pe-${problems[0].key}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector?.('input,select,textarea')?.focus({ preventScroll: true });
      return;
    }
    setPhase('saving');
    try {
      const r = await account.saveProduct(id, productPayload(form, original));
      setPhase('saved');
      const target = id || r._id || r.product?._id || r.data?.product?._id || r.data?._id;
      if(!target) throw new Error('Missing saved product ID');
      // A temporary read failure must not make a retry create a second product.
      const detail = await studio.product(target).catch(()=>null);
      navigate(`/studio/products/${target}`, { replace: true, state: { savedProduct: detail, studioNotice: 'Saved. It’s in your products.' } });
    } catch (err) {
      setPhase('');
      setError(errorText(err, 'Couldn’t save this product. Check your connection and try again. Nothing you typed is lost.'));
    }
  };

  const sub = categories.find((c) => c.name === form?.category)?.subCategories || [];
  const title = id ? 'Edit product' : 'Add product';
  const back = useStudioBack(id ? `/studio/products/${id}` : '/studio/products');
  const busy = phase !== '';
  const saveLabel = phase === 'saving' ? 'Saving…' : phase === 'saved' ? 'Saved' : id ? 'Save changes' : 'Save product';
  const saveButton = (style) => (
    <button type="submit" form="pe-form" className="btn" style={style} disabled={phase === 'saved'} aria-live="polite">
      {phase === 'saving' && <span className="spin" aria-hidden="true" />}{saveLabel}
    </button>
  );
  const statusPill = id && form ? <span className={`pill ${form.status === 'draft' ? 'p-draft' : 'p-active'}`}>{form.status === 'draft' ? 'Draft' : 'Active'}</span> : null;
  const fromAgent = Boolean(original.fromDraft);
  const select = (key, label, options, onPick) => (
    <div className="fl" id={`pe-${key}`}>
      <label className="lab" htmlFor={`pe-${key}-in`}>{label}</label>
      <div className={`inbox${errFor(key) ? ' bad' : ''}`}>
        <select id={`pe-${key}-in`} value={form[key]} onChange={(e) => (onPick ? onPick(e.target.value) : set(key, e.target.value))}>
          <option value="">Choose</option>
          {form[key] && !options.includes(form[key]) && <option value={form[key]} disabled>{form[key]} (saved category)</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {Down('var(--text-muted)')}
      </div>
      <FieldError text={errFor(key)} />
    </div>
  );

  return (
    <div className="studio-app pe">
      <DesktopBar className="ed-dbar" />
      <TopBar title={title} close={!id} onBack={busy ? undefined : back} right={statusPill} />
      <div className="ed-page">
        <div className="ed-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <button type="button" className="link" onClick={() => navigate('/studio/products')}>← Products</button>
            <h1 className="disp">{title}</h1>
            {fromAgent && <p className="ai-line" style={{ marginTop: 4 }}>{Sparkle}Filled in from your photos. Check and save.</p>}
          </div>
          {form && saveButton({ width: 200 })}
        </div>
        {fromAgent && <p className="ai-line ed-pad pe-phone" style={{ marginTop: 12 }}>{Sparkle}Filled in from your photos. Check and save.</p>}
        {missing.length > 0 && <p className="field-err ed-missing" role="alert">{Alert}<span>{missing.length === 1 ? '1 thing' : `${missing.length} things`} to add before you can save.</span></p>}
        {error && <div className="ed-pad" style={{ marginTop: 12 }}><Problem text={error} /></div>}

        {!form ? <div className="ed-pad" style={{ paddingTop: 16 }}><Skeleton h={240} /></div> : (
          <div className="ed-cols">
            <form id="pe-form" className="ed-form" onSubmit={save} noValidate aria-busy={phase === 'saving'} style={phase === 'saving' ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
              <Photos images={form.images} onChange={setImages} error={errFor('photos')} />

              <div className="ed-pad ed-fields">
                <div className="fl" id="pe-name">
                  <label className="lab" htmlFor="pe-name-in">Name</label>
                  <div className={`inbox${errFor('name') ? ' bad' : ''}`}><input id="pe-name-in" value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Vintage denim jacket" /></div>
                  <FieldError text={errFor('name')} />
                </div>

                <div className="ed-three">
                  <div className="ed-two">
                    <div className="fl" id="pe-price">
                      <label className="lab" htmlFor="pe-price-in">Price</label>
                      <div className={`inbox${errFor('price') ? ' bad' : ''}`}>
                        <span className="pre">₦</span>
                        <input id="pe-price-in" inputMode="numeric" value={groupDigits(form.price)} aria-invalid={!!errFor('price')} aria-describedby="pe-price-err" onChange={(e) => { priceTouched.current = true; set('price', digitsOnly(e.target.value)); }} />
                      </div>
                      <FieldError id="pe-price-err" text={errFor('price')} />
                      {fromAgent && !priceTouched.current && Number(form.price) > 0 && <p className="hint st-hide-phone" style={{ margin: 0 }}>Estimate from your photos</p>}
                    </div>
                    <div className="fl">
                      <label className="lab" htmlFor="pe-sale">Sale price <span className="opt inline">optional</span></label>
                      <div className="inbox"><span className="pre">₦</span><input id="pe-sale" inputMode="numeric" placeholder="0" value={groupDigits(form.salePrice || '')} onChange={(e) => set('salePrice', digitsOnly(e.target.value))} /></div>
                    </div>
                  </div>
                  {fromAgent && !priceTouched.current && Number(form.price) > 0 && <p className="hint pe-phone" style={{ margin: '-14px 0 0' }}>{naira(form.price)} is an estimate from your photos. Change it if you like.</p>}
                  <div className="fl" id="pe-stock">
                    <span className="lab">Quantity in stock</span>
                    {form.colours.length
                      ? <p className="hint" style={{ margin: 0, minHeight: 48, display: 'flex', alignItems: 'center' }}><b style={{ color: 'var(--text)' }}>{coloursTotal(form.colours)}</b>&nbsp;in total, from your colours</p>
                      : <Stepper label="Quantity in stock" value={form.stock} onChange={(v) => set('stock', v)} />}
                  </div>
                </div>

                <div className="fl" id="pe-condition">
                  <span className="lab" id="pe-cond-l">Condition</span>
                  <div className="chips" role="group" aria-labelledby="pe-cond-l" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...new Set([...CONDITIONS, form.condition].filter(Boolean))].map((c) => (
                      <button key={c} type="button" className={`chip${form.condition === c ? ' on' : ''}`} aria-pressed={form.condition === c} style={errFor('condition') ? { borderColor: 'var(--danger)' } : undefined} onClick={() => set('condition', c)}>{c}</button>
                    ))}
                  </div>
                  <FieldError text={errFor('condition')} />
                </div>

                <div className="ed-three">
                  <div className="ed-two">
                    {select('category', 'Category', categories.map((c) => c.name), pickCategory)}
                    {select('subCategory', 'Sub-category', sub.map((c) => (typeof c === 'string' ? c : c.name)))}
                  </div>
                  <div className="fl">
                    <label className="lab" htmlFor="pe-brand">Brand <span className="opt inline">optional</span></label>
                    <div className="inbox"><input id="pe-brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Leave blank if there's no brand" /></div>
                  </div>
                </div>

                <div className="fl">
                  <span className="lab" id="pe-desc">Description</span>
                  <SunEditor
                    setContents={original.description || ''}
                    onChange={(value) => set('description', value)}
                    setOptions={{ height: '112px', resizingBar: false, buttonList: [['bold', 'italic', 'list', 'removeFormat']], defaultStyle: 'font-family: Nunito,sans-serif;font-size:16px' }}
                  />
                </div>
              </div>

              <div className="ed-pad">
                <More form={form} set={set} />
                <Colours colours={form.colours} onChange={(colours) => set('colours', colours)} error={errFor('colours')} />
                <Weight form={form} set={set} error={errFor('weight')} />
              </div>

              <div className="ed-pad fl ed-status">
                <span className="lab">Status</span>
                <Seg
                  label="Status"
                  value={form.status}
                  onChange={(v) => set('status', v)}
                  options={[['active', 'Active'], ['draft', 'Draft'], ...(form.status === 'offline_auction' ? [['offline_auction', 'Auction']] : [])]}
                />
                <p className="hint" style={{ margin: 0 }}>Active products can go in your shows. Drafts stay hidden.</p>
              </div>
            </form>
            <Preview form={form} seller={seller} />
          </div>
        )}
      </div>
      {form && (
        <div className="foot">
          {phase === 'saved' && <div className="toast" role="status" style={{ marginBottom: 12 }}><span style={{ flex: 1 }}>Saved. It’s in your products.</span></div>}
          {saveButton({ width: '100%' })}
        </div>
      )}
    </div>
  );
}
