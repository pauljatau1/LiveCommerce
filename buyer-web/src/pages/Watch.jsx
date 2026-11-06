// Watch a live show: video, chat, bid on the current item, Buy Now.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API, api, errorMessage, getToken, imageOf, naira } from '../api';
import { useAuth } from '../auth';
import AddressSheet from '../components/AddressSheet';
import TopUpSheet from '../components/TopUpSheet';
import { Header, Icon, Sheet } from '../components/ui';

const idOf = (p) => String(p?.product?.productId || p?.product?._id || '');
const stepFor = (bid) => (bid < 10000 ? 500 : bid < 50000 ? 1000 : 2500);
const nextBidFor = (p) => (p.currentBid > 0 ? p.currentBid + stepFor(p.currentBid) : Math.max(p.minBid || 0, 500));
const who = (u) => u?.username || u?.firstName || 'someone';

export default function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { buyer, wallet, signedIn, loading, refresh, refreshWallet } = useAuth();
  const [show, setShow] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | preview | joining | watching | ended | error
  const [items, setItems] = useState([]);
  const [feed, setFeed] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [timer, setTimer] = useState({}); // productId -> seconds left
  const [hasVideo, setHasVideo] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null); // {type:'topup', need} | {type:'address', then} | {type:'items'} | {type:'bid'}
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [customBid, setCustomBid] = useState('');
  const stageRef = useRef(null);
  const clientRef = useRef(null);
  const socketRef = useRef(null);
  const feedRef = useRef(null);
  const remoteAudio = useRef(null);
  const soundUnlocked = useRef(false);
  const leadRef = useRef(false); // am I leading the current auction?
  const myIdRef = useRef(null);

  const say = useCallback((kind, msg, ms = 3500) => {
    setToast({ kind, msg });
    window.clearTimeout(say.t);
    say.t = window.setTimeout(() => setToast(null), ms);
  }, []);

  const push = useCallback((entry) => setFeed((f) => [...f.slice(-80), { id: `${Date.now()}-${Math.random()}`, ...entry }]), []);

  const patchItem = useCallback((productId, patch) => {
    setItems((list) => list.map((p) => (idOf(p) === String(productId) ? { ...p, ...patch } : p)));
  }, []);

  // 1. Load the show
  useEffect(() => {
    let cancelled = false;
    api.show(streamId)
      .then((s) => {
        if (cancelled) return;
        setShow(s);
        setItems(s.products || []);
        setViewers(s.viewers?.length || 0);
        setPhase(s.status === 'live' ? 'preview' : s.status === 'ended' ? 'ended' : 'preview');
      })
      .catch((e) => { if (!cancelled) { setLoadError(errorMessage(e, "We couldn't find this show.")); setPhase('error'); } });
    return () => { cancelled = true; };
  }, [streamId]);

  // 2. Join: video + live events (signed-in buyers, live shows only)
  useEffect(() => {
    if (!show || show.status !== 'live' || !signedIn) return undefined;
    let cancelled = false;
    let client;
    let socket;

    const start = async () => {
      setPhase('joining');
      let joined;
      try {
        joined = await api.join(streamId);
      } catch (e) {
        if (e?.response?.status === 410) { setPhase('ended'); return; }
        setLoadError(errorMessage(e, "Couldn't join the show."));
        setPhase('error');
        return;
      }
      if (cancelled) return;
      const live = joined.stream || {};
      if (live.products) setItems(live.products);
      if (typeof live.viewerCount === 'number') setViewers(live.viewerCount);
      setPhase('watching');

      // Chat history
      api.chat(streamId).then((history) => {
        if (cancelled || !Array.isArray(history)) return;
        setFeed(history.filter((m) => m.type === 'comment').slice(-30).map((m) => ({ id: m.id || m._id, kind: 'comment', user: m.user, text: m.content })));
      }).catch(() => {});

      // Live events
      socket = io(API, { auth: { token: getToken() }, transports: ['websocket', 'polling'], reconnectionDelayMax: 5000 });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('stream_notification_subscribe', { streamId }));
      socket.on('stream_notification', (n) => {
        const d = n?.data || {};
        switch (n?.type) {
          case 'comment':
            push({ kind: 'comment', user: n.user, text: n.content });
            break;
          case 'join':
            if (typeof d.viewerCount === 'number') setViewers(d.viewerCount);
            break;
          case 'auction_start':
            if (d.product) { patchItem(idOf(d.product), { ...d.product, bidStatus: 'active', isVisible: true }); setItems((l) => l.map((p) => (idOf(p) === idOf(d.product) ? p : { ...p, isVisible: false }))); }
            push({ kind: 'sys', text: `Bidding is open: ${d.product?.product?.name || 'new item'}` });
            break;
          case 'new_bid':
            if (d.product) patchItem(idOf(d.product), { currentBid: d.bidAmount, currentBidder: d.currentBidder, bidStatus: d.product.bidStatus || 'active' });
            // Someone else took the lead from me: my hold is released
            if (leadRef.current && d.buyerId && String(d.buyerId) !== String(myIdRef.current)) {
              say('err', `You've been outbid: ${naira(d.bidAmount)}`);
              refreshWallet();
            }
            push({ kind: 'bid', user: n.user, text: `bid ${naira(d.bidAmount)}` });
            break;
          case 'auction_winner':
            if (d.product) patchItem(idOf(d.product), { bidStatus: 'ended', bidWinner: d.bidWinner });
            push({ kind: 'win', user: who(d.bidWinner?.buyer) || n.user, text: `won it for ${naira(d.bidWinner?.bidAmount)}` });
            break;
          case 'auction_end':
            if (d.product) patchItem(idOf(d.product), { bidStatus: 'ended' });
            break;
          case 'product_display':
            if (d.product) setItems((l) => l.map((p) => ({ ...p, isVisible: idOf(p) === idOf(d.product) })));
            break;
          case 'buy_now':
            if (d.productId) setItems((l) => l.map((p) => (idOf(p) === String(d.productId) ? { ...p, product: { ...p.product, quantity: d.stockLeft } } : p)));
            push({ kind: 'bid', user: n.user, text: n.content });
            break;
          case 'stream_ended':
            setPhase('ended');
            break;
          default:
        }
      });
      socket.on('viewer_joined_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
      socket.on('bid_timer_update', (t) => t?.productId && setTimer((m) => ({ ...m, [String(t.productId)]: t.secondsLeft })));
      socket.on('bid_timer_complete', (t) => t?.productId && setTimer((m) => ({ ...m, [String(t.productId)]: 0 })));
      socket.on('bid_placed', (r) => { setBusy(false); if (r?.product) patchItem(idOf(r.product), r.product); say('ok', r?.isWinner ? 'You won it!' : "You're the top bidder"); refreshWallet(); });
      socket.on('bid_error', (r) => { setBusy(false); say('err', r?.message || 'Your bid did not go through'); refreshWallet(); });
      socket.on('auction_order_created', (r) => { say('ok', `You won! Order #${r?.orderId} is paid from your wallet.`, 6000); refreshWallet(); });
      socket.on('auction_order_error', () => { if (leadRef.current) { say('err', "We couldn't create your winning order. Your money is no longer held; the host will sort it out.", 7000); refreshWallet(); } });

      // Video
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        AgoraRTC.setLogLevel(3);
        AgoraRTC.onAutoplayFailed = () => setNeedsTap(true);
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        clientRef.current = client;
        await client.setClientRole('audience', { level: 1 });
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video' && stageRef.current) { user.videoTrack.play(stageRef.current, { fit: 'cover' }); setHasVideo(true); }
          if (mediaType === 'audio') {
            remoteAudio.current = user.audioTrack;
            user.audioTrack.play();
            // Phones block sound until the viewer taps; ask unless they already have
            if (!soundUnlocked.current) setNeedsTap(true);
          }
        });
        client.on('user-unpublished', (user, mediaType) => { if (mediaType === 'video') setHasVideo(false); });
        await client.join(joined.agoraAppId, joined.channelName, joined.token, joined.uid);
      } catch (e) {
        if (!cancelled) say('err', "The video couldn't start. Chat and bidding still work.", 6000);
      }
    };

    start();
    return () => {
      cancelled = true;
      socket?.disconnect();
      client?.leave().catch(() => {});
      api.leave(streamId);
    };
  }, [show, signedIn, streamId, push, patchItem, say, refreshWallet]);

  // The first tap anywhere turns the sound on (phone browsers require a tap)
  useEffect(() => {
    const unlock = () => {
      soundUnlocked.current = true;
      setNeedsTap(false);
      try { remoteAudio.current?.play(); } catch { /* not ready yet */ }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' }); }, [feed]);

  const current = useMemo(() => items.find((p) => p.bidStatus === 'active') || items.find((p) => p.isVisible) || null, [items]);
  const isAuction = current && (show?.type === 'auction' || current.bidStatus === 'active' || current.minBid > 0);
  const available = wallet?.availableBalance || 0;
  const hasAddress = (buyer?.shippingAddresses || []).length > 0;
  const iLead = current && buyer && String(current.currentBidder?._id || current.currentBidder) === String(buyer._id);
  myIdRef.current = buyer?._id;
  leadRef.current = Boolean(iLead || (current?.bidStatus !== 'active' && current?.bidWinner && String(current.bidWinner?.buyer?._id || current.bidWinner?.buyer) === String(buyer?._id)));

  // Make sure the buyer can pay and be delivered to before an action
  const ready = (cost, then) => {
    if (!signedIn) { navigate(`/signin?next=/live/${streamId}`); return false; }
    if (!hasAddress) { setSheet({ type: 'address', then }); return false; }
    if (cost > available) { setSheet({ type: 'topup', need: cost - available }); return false; }
    return true;
  };

  const placeBid = (amount) => {
    if (!current || busy) return;
    const bid = Math.round(Number(amount));
    if (!(bid > (current.currentBid || 0)) || bid < (current.minBid || 0)) { say('err', `Bid at least ${naira(Math.max(nextBidFor(current), current.minBid || 0))}`); return; }
    // Holding the bid is checked on the server too; a lead bid is held, not charged
    if (!ready(bid - (iLead ? current.currentBid : 0), () => placeBid(bid))) return;
    setBusy(true);
    socketRef.current?.emit('stream_place_bid', { streamId, productId: idOf(current), bidAmount: bid });
    window.setTimeout(() => setBusy(false), 8000);
  };

  const buyNow = async (item, quantity = 1) => {
    if (busy) return;
    const price = item.product?.discountedPrice || item.product?.price || 0;
    if (!ready(price * quantity, () => buyNow(item, quantity))) return;
    setBusy(true);
    try {
      const r = await api.buyNow(streamId, idOf(item), quantity);
      say('ok', `Bought! Order #${r.order?.orderId} is paid from your wallet.`, 6000);
      setSheet(null);
      refreshWallet();
    } catch (e) {
      const reason = e?.response?.data?.reason;
      if (reason === 'insufficient_funds') setSheet({ type: 'topup', need: price * quantity - available });
      else if (reason === 'no_address') setSheet({ type: 'address' });
      else say('err', errorMessage(e, "Couldn't complete the purchase. You weren't charged."));
    } finally {
      setBusy(false);
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (!signedIn) { navigate(`/signin?next=/live/${streamId}`); return; }
    socketRef.current?.emit('stream_comment', { streamId, content: content.slice(0, 300) });
    setText('');
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: show?.title, url });
      else { await navigator.clipboard.writeText(url); say('ok', 'Link copied'); }
    } catch { /* cancelled */ }
  };

  const host = show?.seller || {};
  const secs = current ? timer[idOf(current)] : undefined;

  // ---------- not live / not signed in ----------
  if (phase === 'loading' || loading) return <div className="app"><Header back="/" /><div className="center"><span className="mut">Loading the show…</span></div></div>;
  if (phase === 'error') return <div className="app"><Header back="/" /><div className="center"><div className="card empty"><span className="f" style={{ fontSize: 18 }}>{loadError}</span><Link to="/" className="btn2">See other shows</Link></div></div></div>;
  if (phase === 'ended' || (show && show.status !== 'live') || (show && !signedIn)) {
    const scheduled = show?.status === 'scheduled';
    return (
      <div className="app">
        <Header back="/" />
        <main className="wrap" style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', background: 'var(--surface-sunken)' }}>
            {show?.coverImage?.url && <img src={show.coverImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <span className={`pill ${show?.status === 'live' && phase !== 'ended' ? 'p-live' : 'p-draft'}`} style={{ position: 'absolute', left: 12, top: 12 }}>
              {phase === 'ended' || show?.status === 'ended' ? 'Ended' : scheduled ? `Starts ${new Date(show.scheduledStartTime).toLocaleString('en-NG', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : `LIVE · ${viewers} watching`}
            </span>
          </div>
          <div>
            <h1 className="f" style={{ margin: 0, fontSize: 24 }}>{show?.title}</h1>
            <p className="mut" style={{ margin: '4px 0 0' }}>{host.storeName || host.businessName}{items.length ? ` · ${items.length} item${items.length > 1 ? 's' : ''}` : ''}</p>
          </div>
          {phase === 'ended' || show?.status === 'ended' ? (
            <div className="soft s-warm" style={{ color: 'var(--warm)', fontWeight: 700 }}>This show has ended. Follow the host so you don't miss the next one.</div>
          ) : !signedIn ? (
            <>
              <Link to={`/signin?next=/live/${streamId}`} className="btn" style={{ minHeight: 56, fontSize: 17 }}>{show?.status === 'live' ? 'Join to watch' : 'Join so you can watch'}</Link>
              <span className="hint" style={{ textAlign: 'center' }}>Free. Takes 20 seconds. You'll come straight back here.</span>
            </>
          ) : (
            <div className="soft s-primary" style={{ fontWeight: 700 }}>You're signed in. Come back when the show starts.</div>
          )}
          {items.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="h2">In this show</h2>
              <div className="list">
                {items.map((p) => (
                  <div key={idOf(p)} className="li">
                    {imageOf(p) ? <img src={imageOf(p)} alt="" /> : <span className="sk" style={{ width: 56, height: 56 }} />}
                    <span style={{ flex: 1, fontWeight: 700 }}>{p.product?.name}</span>
                    <span className="f">{p.minBid ? `from ${naira(p.minBid)}` : naira(p.product?.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  // ---------- watching ----------
  return (
    <div className="watch">
      <div ref={stageRef} className="stage" aria-label="Live video" />
      {!hasVideo && (
        <div className="stage-msg" style={show?.coverImage?.url ? { backgroundImage: `linear-gradient(rgba(15,21,18,.55),rgba(15,21,18,.75)),url(${show.coverImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <span className="dt" aria-hidden="true" style={{ background: '#fff' }} />
          <span className="f" style={{ fontSize: 18 }}>{phase === 'joining' ? 'Joining the show…' : 'Waiting for the host’s video…'}</span>
        </div>
      )}

      <div className="overlay-top">
        <button type="button" className="round glass" aria-label="Leave the show" onClick={() => navigate('/')}>{Icon.back}</button>
        <div className="host">
          <span className="av2">{host.storeAvatar?.url ? <img src={host.storeAvatar.url} alt="" /> : null}</span>
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{host.storeName || host.businessName || 'Host'}</span>
            <span style={{ fontSize: 12, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show?.title}</span>
          </span>
        </div>
        <span className="pill p-live">LIVE</span>
        <span className="pill glass">{Icon.eye}{viewers}</span>
        <button type="button" className="round glass" aria-label="Share this show" onClick={share}>{Icon.share}</button>
      </div>

      {needsTap && (
        <button type="button" className="btn" style={{ position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', minHeight: 44, zIndex: 5 }} onClick={() => { soundUnlocked.current = true; remoteAudio.current?.play(); setNeedsTap(false); }}>
          {Icon.sound}Tap for sound
        </button>
      )}

      <div className="bottom">
        <div ref={feedRef} className="feed" aria-live="polite">
          {feed.map((m) => (
            <div key={m.id} className={`msg ${m.kind === 'comment' ? '' : m.kind}`}>
              {m.user && <b>{m.user}</b>}{m.text}
            </div>
          ))}
        </div>

        {toast && <div className={`soft ${toast.kind === 'err' ? 's-danger' : 's-primary'}`} role="status" style={{ fontWeight: 800, fontSize: 15, color: toast.kind === 'err' ? 'var(--danger)' : 'var(--primary-strong)' }}>{toast.msg}</div>}

        {current ? (
          <div className="item">
            {imageOf(current) ? <img src={imageOf(current)} alt="" /> : <span className="sk" style={{ width: 64, height: 64 }} />}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{current.product?.name}</span>
              {isAuction ? (
                <span style={{ fontSize: 14 }}>
                  {current.currentBid > 0 ? <><span className="f" style={{ fontSize: 18 }}>{naira(current.currentBid)}</span> <span className="mut">{iLead ? '· you lead' : `· ${who(current.currentBidder)}`}</span></> : <span className="mut">Starts at {naira(current.minBid)}</span>}
                </span>
              ) : (
                <span style={{ fontSize: 14 }}><span className="f" style={{ fontSize: 18 }}>{naira(current.product?.discountedPrice || current.product?.price)}</span> <span className="mut">· {current.product?.quantity ?? '?'} left</span></span>
              )}
            </div>
            {isAuction && current.bidStatus === 'active' && typeof secs === 'number' && <span className={`timer${secs <= 10 ? ' hot' : ''}`} aria-label={`${secs} seconds left`}>{secs}s</span>}
          </div>
        ) : (
          <div className="item" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>The host is getting the next item ready.</span>
            {items.length > 0 && <button type="button" className="btn2" style={{ minHeight: 44 }} onClick={() => setSheet({ type: 'items' })}>See items</button>}
          </div>
        )}

        {current && isAuction && current.bidStatus === 'active' && (
          <div className="bidrow">
            <button type="button" className="btn" disabled={busy} onClick={() => placeBid(nextBidFor(current))}>{busy ? 'Bidding…' : `Bid ${naira(nextBidFor(current))}`}</button>
            <button type="button" className="btn2" style={{ flex: 'none' }} disabled={busy} onClick={() => { setCustomBid(String(nextBidFor(current) + stepFor(nextBidFor(current)))); setSheet({ type: 'bid' }); }}>Custom</button>
          </div>
        )}
        {current && !isAuction && (
          <div className="bidrow">
            <button type="button" className="btn" disabled={busy || current.product?.quantity === 0} onClick={() => buyNow(current)}>
              {current.product?.quantity === 0 ? 'Sold out' : busy ? 'Buying…' : `Buy now · ${naira(current.product?.discountedPrice || current.product?.price)}`}
            </button>
          </div>
        )}

        <form className="composer2" onSubmit={sendChat}>
          <label htmlFor="w-chat" className="sr">Say something</label>
          <input id="w-chat" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Say something…" autoComplete="off" />
          <button type="submit" className="round" aria-label="Send" style={{ background: 'var(--primary)', color: '#fff', width: 46, height: 46 }}>{Icon.send}</button>
          <button type="button" className="wallet-chip" onClick={() => setSheet({ type: 'topup', need: 0 })} aria-label={`Wallet ${naira(available)}. Top up`}>{Icon.wallet}{naira(available)}</button>
        </form>
      </div>

      {sheet?.type === 'topup' && <TopUpSheet need={sheet.need} onClose={() => setSheet(null)} />}
      {sheet?.type === 'address' && <AddressSheet onClose={() => setSheet(null)} onSaved={async () => { setSheet(null); await refresh(); say('ok', 'Address saved. You can bid and buy now.'); }} />}
      {sheet?.type === 'bid' && current && (
        <Sheet title="Your bid" onClose={() => setSheet(null)}>
          <p className="mut" style={{ margin: 0 }}>Highest bid is {current.currentBid > 0 ? naira(current.currentBid) : `none yet (starts at ${naira(current.minBid)})`}. Your bid is held in your wallet, not charged, unless you win.</p>
          <div className="fl">
            <label className="lab" htmlFor="w-bid">Bid amount</label>
            <input id="w-bid" className="in" inputMode="numeric" autoFocus value={Number(String(customBid).replace(/[^\d]/g, '')).toLocaleString('en-NG')} onChange={(e) => setCustomBid(e.target.value)} style={{ font: '600 22px var(--font-display)' }} />
          </div>
          <button type="button" className="btn" onClick={() => { const v = Number(String(customBid).replace(/[^\d]/g, '')); setSheet(null); placeBid(v); }}>Place bid</button>
        </Sheet>
      )}
      {sheet?.type === 'items' && (
        <Sheet title="In this show" onClose={() => setSheet(null)}>
          <div className="list">
            {items.map((p) => (
              <div key={idOf(p)} className="li">
                {imageOf(p) ? <img src={imageOf(p)} alt="" /> : <span className="sk" style={{ width: 56, height: 56 }} />}
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700 }}>{p.product?.name}</div><div className="mut" style={{ fontSize: 13 }}>{p.bidStatus === 'ended' ? 'Sold in auction' : p.minBid ? `Auction from ${naira(p.minBid)}` : `${p.product?.quantity ?? '?'} left`}</div></div>
                {!p.minBid && p.product?.quantity !== 0 && <button type="button" className="btn" style={{ minHeight: 44, padding: '0 14px' }} disabled={busy} onClick={() => buyNow(p)}>{naira(p.product?.discountedPrice || p.product?.price)}</button>}
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
