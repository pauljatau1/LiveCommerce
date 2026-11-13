const LEGACY_COMBINED_RUNNING_ORDER=false;
import {colourLots} from './colourLots';
import {serviceAreaConfig} from './api';
import useStudioBack from './useStudioBack';
// Show Planner (design: S-Planner-Pick / S-Planner-Setup / S-Planner-Scheduled).
// Step 1: pick items + auction or drop. Step 2: title, order, prices, time, cover.
// Then the show is scheduled and the seller gets the link to share.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { shrinkPhoto } from './listingApi';
import { studio, errorText, naira, when } from './api';
import { Icon, Problem, Skeleton, TopBar, Empty } from './ui';
import NotesEditor, { ALWAYS, NOTE_SECTIONS, NOTES_MAX, hasNotes, notesLength, paymentExtra } from './NotesEditor';
import ShareSheet from './ShareSheet';

const TYPES = [
  ['auction', 'Auction show', 'Fans bid, highest wins. Best for rare items.'],
  ['drop', 'Drop show', 'Fixed price, limited stock. First to buy wins.'],
];

const nextDays = () => Array.from({ length: 4 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d; });
const dayLabel = (d, i) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }));
const TIMES = [['18:00', '6:00 PM'], ['19:00', '7:00 PM'], ['20:00', '8:00 PM'], ['21:00', '9:00 PM']];

export default function Planner() {
  const back=useStudioBack('/studio/shows');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);
  const [lots,setLots]=useState(null);
  const [review,setReview]=useState(false);
  const [dragged,setDragged]=useState(null);
  const [type, setType] = useState('auction');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryStates,setDeliveryStates]=useState([]);
  useEffect(()=>{serviceAreaConfig().then(config=>setDeliveryStates(config.states)).catch(()=>{});},[]);
  const [bids, setBids] = useState({});
  const [now, setNow] = useState(false);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('20:00');
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [created, setCreated] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    studio.products().then((r) => {
      const usable = r.products.filter((p) => p.status !== 'hidden' && p.stock > 0);
      setProducts(usable);
      const add = params.get('add');
      // Start with the requested item, else items not yet in a show (up to 4)
      const first = add && usable.some((p) => p._id === add) ? [add] : usable.filter((p) => p.status === 'active').slice(0, 4).map((p) => p._id);
      setPicked(first);
    }).catch((e) => setError(errorText(e, "Couldn't load your products.")));
  }, [params]);

  const byId = useMemo(() => new Map((products || []).map((p) => [p._id, p])), [products]);
  const items = step===2 && lots?lots:picked.map((id) => byId.get(id)).filter(Boolean);
  const toggle = (id) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 20 ? l : [...l, id]));
  const move = (i,dir) => {if(lots){setLots(l=>{const n=[...l],j=i+dir;if(j<0||j>=n.length)return l;[n[i],n[j]]=[n[j],n[i]];return n;});return;}moveLegacy(i,dir);};
  const moveLegacy = (i, dir) => setPicked((l) => { const n = [...l]; const j = i + dir; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const [lengths, setLengths] = useState({}); // productId -> 30 | 60 | 120 seconds
  // Show notes: pinned for buyers; drafted by the assistant, or the seller's saved ones
  const [notes, setNotes] = useState(null);
  const [notesState, setNotesState] = useState(''); // '' | 'drafting' | 'error'
  const [editingNotes, setEditingNotes] = useState(false);
  const [reuseNotes, setReuseNotes] = useState(true);
  const draftNotes = async () => {
    setNotesState('drafting');
    try {
      const r = await studio.notesDraft({ title, type: type === 'auction' ? 'auction' : 'drop', items: items.map((p) => ({ name: p.name, price: p.price })), auctionSeconds: items[0] ? lengthOf(items[0]) : 30 });
      setNotes(r.notes);
      setNotesState('');
    } catch {
      setNotesState('error');
    }
  };
  useEffect(() => {
    if (step !== 2 || notes) return;
    studio.notesDefault().then((r) => { if (r?.notes) setNotes(r.notes); }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const lengthOf = (p) => lengths[p._id] || 30;
  const startBid = (p) => bids[p._id] ?? String(Math.max(500, Math.round((p.price * 0.6) / 500) * 500));

  const goSetup = () => {
    setLots(colourLots(picked.map(id=>byId.get(id)).filter(Boolean)));
    if (!title) {
      const names = items.slice(0, 2).map((p) => p.name.split(/[,(]|\s[–-]\s/)[0].trim().slice(0, 28));
      setTitle(`${type === 'auction' ? 'Live auction' : 'Live drop'}: ${names.join(' & ')}${items.length > 2 ? ` + ${items.length - 2} more` : ''}`.slice(0, 80));
    }
    if (!description) setDescription(`${items.map((p) => p.name).join(', ')}. ${type === 'auction' ? 'Bid live, highest bid wins.' : 'Fixed prices, limited stock: first to buy gets it.'} ${deliveryStates.length ? `Delivery within ${deliveryStates.join(' and ')}.` : 'Delivery within our service area.'}`.slice(0, 500));
    setReview(false);setStep(2);
    window.scrollTo(0, 0);
  };

  const startAt = () => {
    if (now) return new Date(Date.now() + 60000);
    const d = new Date(nextDays()[day]);
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const create = async () => {
    setSaveError('');
    const at = startAt();
    if (!now && at < new Date()) { setSaveError('That time has passed. Pick a later time or "Go live now".'); return; }
    if (!title.trim() || !description.trim()) { setSaveError('Add a title and a short description.'); return; }
    const bad = type === 'auction' && items.find((p) => !(Number(startBid(p)) >= 100));
    if (bad) { setSaveError(`Set a starting bid for ${bad.name}.`); return; }
    setBusy(true);
    const body = {
      title: title.trim(),
      description: description.trim(),
      category: items[0]?.category || 'Clothing',
      scheduledStartTime: at.toISOString(),
      ...(cover ? { coverImage: { data: cover.base64, contentType: cover.contentType } } : {}),
      products: items.map((p) => (type === 'auction'
        ? { product: { productId: p.catalogueProductId || p._id },...(p.colour?{colour:p.colour}:{}), minBid: Number(startBid(p)), maxBid: Math.max(Number(startBid(p)) * 100, 1000000), auctionSeconds: lengthOf(p) }
        : { product: { productId: p.catalogueProductId || p._id },...(p.colour?{colour:p.colour}:{}) })),
    };
    try {
      const res = type === 'auction' ? await studio.createAuction(body) : await studio.createDrop(body);
      const show = res.stream || res.data?.stream || res;
      if (!show?._id) throw new Error('No show returned');
      // Pin the notes on the new show; a problem here never blocks the show
      if (hasNotes(notes)) {
        try { await studio.saveNotes(show._id, notes, reuseNotes); } catch (e) { setSaveError(`Your show is set, but the notes didn't save: ${errorText(e)} You can pin them from the live studio.`); }
      }
      if (now) { navigate(`/studio/golive/${show._id}`, { replace: true }); return; }
      setCreated({ ...show, at, count: items.length, images: items.map((p) => p.image) });
    } catch (e) {
      setSaveError(errorText(e, "Couldn't create the show. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const link = created.streamLink;
    return (
      <div className="studio-app">
        <TopBar title="Your show" backTo="/studio" right={<span className="pill p-active">Scheduled</span>} />
        <div className="st-inner">
          <section className="card" style={{ overflow: 'hidden' }} aria-label="Scheduled show">
            <div style={{ padding: 18, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="cap">{when(created.at).toUpperCase()} · {type === 'auction' ? 'AUCTION' : 'DROP'} · {created.count} ITEMS</span>
              <span className="f" style={{ fontSize: 'var(--t-h1)', lineHeight: 1.15 }}>{created.title}</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex' }}>{created.images.slice(0, 6).map((src, n) => (src ? <img key={n} src={src} alt="" style={{ width: 48, height: 48, borderRadius: 14, border: '2px solid #fff', objectFit: 'cover', marginLeft: n ? -10 : 0 }} /> : null))}</div>
              {link && (
                <div className="fl"><span className="lab">Show link</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="in" readOnly value={link} aria-label="Show link" onFocus={(e) => e.target.select()} />
                    <button type="button" className="btn2" onClick={() => setSharing(true)}>{Icon.share}Share</button>
                  </div>
                  <span className="hint">Post it on WhatsApp, Instagram and TikTok. Buyers who open it get a reminder.</span>
                </div>
              )}
            </div>
          </section>
          <div className="bot"><span className="av" aria-hidden="true" /><div className="bub">You can go live early if you're ready. Buyers with the link will see you're live.</div></div>
          <Link to={`/studio/golive/${created._id}`} className="btn" style={{  background: 'var(--live)', fontSize: 'var(--t-h2)' }}>{Icon.live('#fff', 20)}Go live</Link>
          <Link to="/studio" className="btn3">Done</Link>
        </div>
        {sharing && <ShareSheet show={{ ...created, link, scheduledStartTime: created.at, status: 'scheduled', type }} onClose={() => setSharing(false)} />}
      </div>
    );
  }

  return (
    <div className="studio-app">
      <TopBar title="Plan a show" sub={step === 1 ? 'Step 1 of 2 · pick items' : `Step 2 of 2 · ${type === 'auction' ? 'auction' : 'drop'} · ${items.length} item${items.length === 1 ? '' : 's'}`} onBack={() => (step === 2 ? review?setReview(false):setStep(1) : back())} close={step === 1} />
      {step === 1 && (
        <div className="st-inner" style={{ paddingBottom: 120 }}>
          {error && <Problem text={error} />}
          {!products && !error && <Skeleton h={300} />}
          {products && !products.length && <Empty icon={Icon.products} title="Nothing to sell yet" text="List an item with stock first, then plan a show around it." action={<Link to="/studio/list" className="btn">List an item</Link>} />}
          {products && products.length > 0 && (
            <>
              <div className="bot"><span className="av" aria-hidden="true" /><div className="bub">Tap what you want to sell. I picked items that haven't been in a show yet.</div></div>
              <div role="group" aria-label="Your products" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))', gap: 8 }}>
                {products.map((p) => {
                  const n = picked.indexOf(p._id);
                  return (
                    <button key={p._id} type="button" aria-pressed={n >= 0} onClick={() => toggle(p._id)} style={{ position: 'relative', padding: 0, border: 0, borderRadius: 18, overflow: 'hidden', background: 'var(--surface-sunken)', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', font: 'inherit', color: 'var(--text)', outline: n >= 0 ? '3px solid var(--primary)' : 'none', outlineOffset: -3 }}>
                      {p.image ? <img src={p.image} alt="" style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover' }} /> : <span className="sk" style={{ display: 'block', aspectRatio: '1', borderRadius: 0 }} />}
                      {n >= 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', font: 'var(--w-medium) var(--t-small) var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{n + 1}</span>}
                      <span style={{ padding: '6px 8px 8px', fontSize: 'var(--t-caption)', fontWeight: 'var(--w-medium)', lineHeight: 1.2, background: 'var(--surface)' }}>{p.name.length > 34 ? `${p.name.slice(0, 32)}…` : p.name} · {naira(p.price)}</span>
                    </button>
                  );
                })}
              </div>
              <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <legend className="lab" style={{ paddingBottom: 8 }}>What kind of show?</legend>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TYPES.map(([key, name, text]) => (
                    <button key={key} type="button" aria-pressed={type === key} onClick={() => setType(key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 18, border: type === key ? '2px solid var(--primary)' : '1.5px solid var(--border-strong)', background: type === key ? 'var(--primary-soft)' : 'var(--surface)', textAlign: 'left', font: 'inherit', color: 'var(--text)', cursor: 'pointer' }}>
                      <span className="f" style={{ fontSize: 'var(--t-h2)' }}>{name}</span><span className="mut" style={{ fontSize: 'var(--t-small)' }}>{text}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <section data-keyboard-bar aria-label="Selected items" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px max(16px, env(safe-area-inset-bottom))', background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-up)' }}>
            <span style={{ flex: 1, fontWeight: 'var(--w-medium)', maxWidth: 560, marginLeft: 'auto' }}>{items.length} item{items.length === 1 ? '' : 's'}</span>
            <button type="button" className="btn" disabled={!items.length} onClick={goSetup} style={{ marginRight: 'auto' }}>Next</button>
          </section>
        </div>
      )}

      {step === 2 && !review && <><div className="st-inner colour-running-order"><p className="hint">Drag to change the order. Each colour runs as its own item.</p>{items.map((p,i)=><div className="colour-lot-row" key={p._id} draggable onDragStart={()=>setDragged(i)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged===null)return;setLots(rows=>{const next=[...rows];const [row]=next.splice(dragged,1);next.splice(i,0,row);return next;});setDragged(null);}}><button className="link" type="button" aria-label={`Move ${p.name}; use arrow keys`} onKeyDown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();move(i,e.key==='ArrowUp'?-1:1);}}}>⠿</button><span>{i+1}</span>{p.image?<img src={p.image} alt=""/>:<span className="sk"/>}<span className="grow">{p.name}<small>{p.stock} in stock · {type==='auction'?'auction from ':''}{naira(type==='auction'?Number(startBid(p)):p.price)}</small></span><button type="button" className="ib" aria-label={`Remove ${p.name}`} onClick={()=>setLots(rows=>rows.filter(row=>row._id!==p._id))}>×</button></div>)}</div>{items.length>20&&<p className="err" role="alert">Choose up to 20 colour lots for one show.</p>}<div className="colour-order-next" data-keyboard-bar><span>{items.length} items</span><button type="button" className="btn" disabled={!items.length || items.length>20} onClick={()=>setReview(true)}>Next</button></div></>}
      {step === 2 && review && (
        <div className="st-inner" style={{ paddingBottom: 32 }}>
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Title and description">
            <div className="fl"><label className="lab" htmlFor="ptitle">Show title</label><input id="ptitle" className="in" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} style={{ fontFamily: 'var(--font-display)' }} /></div>
            <div className="fl"><label className="lab" htmlFor="pdesc">Description</label><textarea id="pdesc" className="in ta" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} /></div>
          </section>

          {LEGACY_COMBINED_RUNNING_ORDER&&<>
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Running order">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><h2 className="h2">Running order</h2><span className="hint">{items.length} items</span></div>
            <p className="hint">Drag to change the order. Each colour runs as its own item.</p>
            {items.length > 2 && <div className="soft s-primary" style={{ fontSize: 'var(--t-small)', lineHeight: 1.45 }}>Tip: start with a cheaper item to warm up the room and save the best for last, when the most people are watching.</div>}
            {items.map((p, i) => (
              <div key={p._id} draggable onDragStart={()=>setDragged(i)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged===null)return;setLots(rows=>{const next=[...rows];const [row]=next.splice(dragged,1);next.splice(i,0,row);return next;});setDragged(null);}} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 18, background: 'var(--surface-page)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.image ? <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 44, height: 44 }} />}
                  <span style={{ flex: 1, fontWeight: 'var(--w-medium)', minWidth: 0 }}>{i + 1} · {p.name}<small className="hint" style={{display:'block'}}>{p.stock} in stock · {type==='auction'?'auction from ':''}{naira(Number(startBid(p)))}</small></span>
                  <button type="button" className="ib" style={{ width: 40, height: 40 }} aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="ib" style={{ width: 40, height: 40 }} aria-label={`Move ${p.name} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                </div>
                {type === 'auction' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <label htmlFor={`bid-${p._id}`} className="hint" style={{ fontWeight: 'var(--w-medium)' }}>Bids start at ₦</label>
                    <input id={`bid-${p._id}`} className="in" inputMode="numeric" style={{ width: 130 }} value={startBid(p)} onChange={(e) => setBids((b) => ({ ...b, [p._id]: e.target.value.replace(/[^\d]/g, '') }))} />
                    <span className="hint">Listed at {naira(p.price)} · {p.stock} in stock{p.stock > 1 ? ': sells one at a time, then "Run again"' : ''}</span>
                    <div style={{ display: 'flex', gap: 6, width: '100%' }} role="group" aria-label={`Auction time for ${p.name}`}>
                      {[[30, '30s'], [60, '60s'], [120, '2 min']].map(([v, l]) => (
                        <button key={v} type="button" className={`chip${lengthOf(p) === v ? ' on' : ''}`} aria-pressed={lengthOf(p) === v} onClick={() => setLengths((m) => ({ ...m, [p._id]: v }))}>{l}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="hint">{naira(p.price)} · {p.stock} in stock</span>
                )}
              </div>
            ))}
            {type === 'auction' && <span className="hint">Each auction runs for the time you pick once you start it. A bid in the last 5 seconds adds 5 seconds. Bids hold money in the buyer's wallet, so winners are charged straight away.</span>}
          </section>

          </>}
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="When">
            <h2 className="h2">When?</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className={`chip${now ? ' on' : ''}`} aria-pressed={now} onClick={() => setNow(true)}>Go live now</button>
              {nextDays().map((d, i) => <button key={i} type="button" className={`chip${!now && day === i ? ' on' : ''}`} aria-pressed={!now && day === i} onClick={() => { setNow(false); setDay(i); }}>{dayLabel(d, i)}</button>)}
            </div>
            {!now && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {TIMES.map(([v, l]) => <button key={v} type="button" className={`chip${time === v ? ' on' : ''}`} aria-pressed={time === v} onClick={() => setTime(v)}>{l}</button>)}
                <label className="sr" htmlFor="ptime">Other time</label>
                <input id="ptime" type="time" className="in" style={{ width: 130 }} value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            )}
            <span className="hint">{now ? 'You go straight to the camera check.' : `Starts ${when(startAt())}. Buyers who open the link get a reminder.`}</span>
          </section>

          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Cover image">
            <h2 className="h2">Cover <span className="hint" style={{ fontWeight: 'var(--w-medium)' }}>(optional)</span></h2>
            {cover && <img src={cover.dataUrl} alt="Show cover" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 20 }} />}
            <label className="btn3" style={{ cursor: 'pointer' }}>
              {cover ? 'Use another photo' : 'Upload a cover photo'}
              <input type="file" accept="image/*" className="sr" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setCover(await shrinkPhoto(f, 1280)); } catch (err) { setSaveError(err.message); } } }} />
            </label>
            {!cover && <span className="hint">Without one, buyers see your first item's photo.</span>}
          </section>

          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Show notes">
            <h2 className="h2">Pin these notes</h2>
            <span className="hint">Buyers see them under your name all show: how to buy, delivery, payment and sizes.</span>
            {notesState === 'drafting' ? (
              <span className="mut">Writing your notes from the plan…</span>
            ) : !notes ? (
              <>
                {notesState === 'error' && <span className="hint">I couldn't draft them this time. Write them yourself, or try again.</span>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn2" onClick={draftNotes}>Write them for me</button>
                  <button type="button" className="btn3" onClick={() => { setNotes({}); setEditingNotes(true); }}>Write my own</button>
                </div>
              </>
            ) : editingNotes ? (
              <>
                <NotesEditor notes={notes} onChange={setNotes} idPrefix="plan-notes" />
                <button type="button" className="btn3" onClick={() => setEditingNotes(false)}>Done</button>
              </>
            ) : (
              <>
                {NOTE_SECTIONS.filter(([k]) => (k === 'payment' ? true : notes[k])).map(([k, label]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="cap">{label.toUpperCase()}</span>
                    <span>{k === 'payment' ? `${ALWAYS} ${paymentExtra(notes.payment)}`.trim() : notes[k]}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn3" onClick={() => setEditingNotes(true)}>Edit</button>
                  <button type="button" className="link" onClick={draftNotes}>Write them again</button>
                </div>
              </>
            )}
            {notes && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontWeight: 'var(--w-medium)' }}>
                <input type="checkbox" checked={reuseNotes} onChange={(e) => setReuseNotes(e.target.checked)} style={{ width: 22, height: 22 }} />
                Use these notes for my next shows
              </label>
            )}
          </section>

          {saveError && <Problem text={saveError} />}
          <button type="button" className="btn" disabled={busy || notesLength(notes) > NOTES_MAX} onClick={create}>{busy ? 'Creating…' : now ? 'Create and go live' : 'Schedule show'}</button>
        </div>
      )}
    </div>
  );
}
