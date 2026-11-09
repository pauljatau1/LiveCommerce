// Live Studio (design: S-Live-Auction / S-Live-Drop / S-Live-Desktop).
// Phone: full-screen camera with the current item card at the bottom.
// Desktop: item + queue | camera | chat.
// Video: Agora (host). Live events: the same socket the buyer app uses.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { io } from 'socket.io-client';
import { BASE_URL } from '@/Constants/Server';
import { tokenUtils } from '@/util/auth';
import { studio, errorText, naira } from './api';
import { Icon, Sheet } from './ui';
import ShareSheet from './ShareSheet';
import { useIntercomVisibility } from '@/Hooks/useIntercomVisibility';

AgoraRTC.setLogLevel(3);

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pid = (p) => String(p?.product?.productId || p?.productId || p?.product?._id || p?._id || '');

export default function Live() {
  useIntercomVisibility(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: nav } = useLocation();
  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef({ audio: null, video: null });
  const socketRef = useRef(null);
  const feedEnd = useRef(null);

  const [phase, setPhase] = useState('connecting'); // connecting | live | reconnecting | error | ending
  const [error, setError] = useState('');
  const [show, setShow] = useState(null);
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState({ count: 0, amount: 0 });
  const [currentId, setCurrentId] = useState(null);
  const [timer, setTimer] = useState({});
  const [viewers, setViewers] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [feed, setFeed] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [facing, setFacing] = useState('user');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const push = useCallback((entry) => setFeed((f) => [...f.slice(-60), { id: `${Date.now()}-${Math.random()}`, ...entry }]), []);
  const say = useCallback((t) => setToast(t), []);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { feedEnd.current?.scrollIntoView({ block: 'end' }); }, [feed]);

  const refresh = useCallback(async () => {
    const r = await studio.show(id);
    setShow(r.show);
    setItems(r.items);
    setSales(r.sales);
    setViewers((v) => v || r.show.viewers || 0);
    const visible = r.items.find((i) => i.isVisible || i.bidStatus === 'active');
    setCurrentId((c) => c || visible?.productId || r.items[0]?.productId || null);
    return r;
  }, [id]);

  // 1. Start (or rejoin) the show, join Agora as host, publish camera + mic
  useEffect(() => {
    let cancelled = false;
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    clientRef.current = client;

    const run = async () => {
      try {
        const r = await refresh();
        if (cancelled) return;
        if (r.show.status === 'ended') { navigate(`/studio/recap/${id}`, { replace: true }); return; }
        if (r.show.status !== 'live') await studio.startShow(id);
        const creds = await studio.hostToken(id);
        if (cancelled) return;
        await client.setClientRole('host');
        client.on('connection-state-change', (cur) => {
          if (cur === 'RECONNECTING' || cur === 'DISCONNECTED') setPhase((p) => (p === 'ending' ? p : 'reconnecting'));
          if (cur === 'CONNECTED') setPhase((p) => (p === 'reconnecting' ? 'live' : p));
        });
        client.on('token-privilege-will-expire', async () => {
          try { const t = await studio.hostToken(id); await client.renewToken(t.token); } catch { /* retried on next warning */ }
        });
        // Don't spin forever on a bad connection
        await Promise.race([
          client.join(creds.agoraAppId || import.meta.env.VITE_AGORA_API_KEY, creds.channelName, creds.token, creds.uid),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Couldn't connect your video. Check your internet, then try again.")), 30000)),
        ]);
        const [audio, video] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack({ ...(nav?.micId ? { microphoneId: nav.micId } : {}), AEC: true, ANS: true, AGC: true }),
          AgoraRTC.createCameraVideoTrack({ ...(nav?.cameraId ? { cameraId: nav.cameraId } : { facingMode: 'user' }), encoderConfig: '480p_1', optimizationMode: 'motion' }),
        ]);
        if (cancelled) { audio.close(); video.close(); return; }
        tracksRef.current = { audio, video };
        if (videoRef.current) video.play(videoRef.current, { fit: 'cover', mirror: true });
        await client.publish([audio, video]);
        setStartedAt((s) => s || Date.now());
        setPhase('live');
      } catch (e) {
        if (cancelled) return;
        const blocked = e?.code === 'PERMISSION_DENIED' || /permission|NotAllowed/i.test(e?.message || '');
        setError(blocked ? 'Camera or microphone is blocked. Allow them for this site, then reload.' : errorText(e, e?.message || "Couldn't start the show."));
        setPhase('error');
      }
    };
    run();
    return () => {
      cancelled = true;
      const { audio, video } = tracksRef.current;
      audio?.close(); video?.close();
      client.removeAllListeners();
      client.leave().catch(() => {});
    };
  }, [id, refresh, navigate, nav]);

  // 2. Live events
  useEffect(() => {
    const origin = new URL(BASE_URL).origin;
    const socket = io(origin, { auth: { token: tokenUtils.getBearerToken() }, transports: ['websocket', 'polling'], reconnectionDelayMax: 5000 });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('stream_notification_subscribe', { streamId: id }));
    studio.chat(id).then((res) => {
      const list = Array.isArray(res) ? res : res?.chatInteractions || res?.data || [];
      setFeed(list.filter((m) => m.type === 'comment').slice(-20).map((m) => ({ id: m.id || m._id, kind: 'comment', user: m.user, text: m.content })));
    });
    // Chat safety: messages with phone numbers, account numbers or links are hidden from buyers
    socket.on('chat_hidden_detail', (h) => push({ kind: 'hidden', hiddenId: h.id, user: h.user, text: h.content, notice: h.notice }));
    socket.on('chat_unhidden', (h) => setFeed((f) => f.filter((m) => m.hiddenId !== h.id)));
    socket.on('chat_unhide_error', (h) => say(h?.message || "Couldn't show that message."));
    socket.on('chat_hidden_self', (h) => say(h?.message || 'Phone numbers, account numbers and links stay out of chat.'));
    socket.on('stream_notification', (n) => {
      const d = n?.data || {};
      switch (n?.type) {
        case 'comment': push({ kind: 'comment', user: n.user, text: n.content }); break;
        case 'join': if (typeof d.viewerCount === 'number') setViewers(d.viewerCount); break;
        case 'new_bid':
          if (d.product) setItems((l) => l.map((p) => (p.productId === pid(d.product) ? { ...p, currentBid: d.bidAmount, currentBidder: n.user || p.currentBidder, bidStatus: 'active' } : p)));
          push({ kind: 'bid', user: n.user, text: `bid ${naira(d.bidAmount)}` });
          break;
        case 'auction_winner':
          push({ kind: 'win', user: n.user, text: `won it for ${naira(d.bidWinner?.bidAmount)}` });
          say(`${n.user || 'A buyer'} won it for ${naira(d.bidWinner?.bidAmount)}`);
          refresh().catch(() => {});
          break;
        case 'auction_end':
          if (d.product) setItems((l) => l.map((p) => (p.productId === pid(d.product) ? { ...p, bidStatus: 'ended' } : p)));
          refresh().catch(() => {});
          break;
        case 'buy_now':
          push({ kind: 'buy', user: n.user, text: n.content || 'bought one' });
          if (d.productId) setItems((l) => l.map((p) => (p.productId === String(d.productId) ? { ...p, stock: typeof d.stockLeft === 'number' ? d.stockLeft : p.stock, sold: p.sold + (d.quantity || 1) } : p)));
          refresh().catch(() => {});
          break;
        default:
      }
    });
    socket.on('viewer_joined_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
    socket.on('viewer_left_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
    socket.on('bid_timer_update', (t) => t?.productId && setTimer((m) => ({ ...m, [String(t.productId)]: t.secondsLeft })));
    socket.on('bid_timer_complete', (t) => t?.productId && setTimer((m) => ({ ...m, [String(t.productId)]: 0 })));
    return () => { socket.emit('stream_notification_unsubscribe', { streamId: id }); socket.disconnect(); };
  }, [id, push, say, refresh]);

  useEffect(() => {
    if (!startedAt) return undefined;
    const t = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const current = items.find((i) => i.productId === currentId) || items[0];
  const isAuction = show?.type !== 'drop';
  const secs = current ? timer[current.productId] : undefined;
  // Ring length: the auction time, or longer if time was added
  const total = Math.max(current?.auctionSeconds || 30, secs || 0);
  const running = current && current.bidStatus === 'active' && (secs === undefined || secs > 0);
  const queue = items.filter((i) => i.productId !== current?.productId);

  const act = async (label, fn, done) => {
    setBusy(label);
    try { await fn(); if (done) say(done); await refresh(); } catch (e) { say(errorText(e)); } finally { setBusy(''); }
  };
  const putUp = (item) => act('show', () => studio.displayProduct(id, item.productId), isAuction ? null : `${item.name} is on sale`);
  const startBids = () => act('bid', async () => {
    if (!current.isVisible) await studio.displayProduct(id, current.productId);
    await studio.startBidding(id, current.productId, current.auctionSeconds || 30);
    setTimer((m) => ({ ...m, [current.productId]: current.auctionSeconds || 30 }));
  }, `Bidding is open: ${clock(current?.auctionSeconds || 30)}`);
  const addTime = () => act('time', () => studio.addTime(id, current.productId, 30), 'Added 30 seconds');
  const endDrop = () => act('hide', () => studio.hideProduct(id, current.productId), 'Item taken off sale');
  const pick = (item) => { setCurrentId(item.productId); setQueueOpen(false); if (!isAuction || item.bidStatus !== 'ended') putUp(item); };

  const flip = async () => {
    const old = tracksRef.current.video;
    if (!old) return;
    const next = facing === 'user' ? 'environment' : 'user';
    try {
      const track = await AgoraRTC.createCameraVideoTrack({ facingMode: next, encoderConfig: '480p_1', optimizationMode: 'motion' });
      await clientRef.current.unpublish(old);
      old.close();
      tracksRef.current.video = track;
      track.play(videoRef.current, { fit: 'cover', mirror: next === 'user' });
      await clientRef.current.publish(track);
      setFacing(next);
    } catch { say("Couldn't switch camera"); }
  };
  const toggleMic = async () => { const a = tracksRef.current.audio; if (a) { await a.setEnabled(!micOn); setMicOn(!micOn); } };

  const send = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('stream_comment', { streamId: id, content: text });
    setMessage('');
  };

  const end = async () => {
    setPhase('ending');
    setConfirmEnd(false);
    try {
      const { audio, video } = tracksRef.current;
      audio?.close(); video?.close();
      await clientRef.current?.leave().catch(() => {});
      await studio.endShow(id);
      socketRef.current?.emit('stream_notification', { type: 'host_disconnect', data: { streamId: id, message: 'Host has ended the stream' } });
      navigate(`/studio/recap/${id}`, { replace: true });
    } catch (e) {
      setPhase('live');
      say(errorText(e, "Couldn't end the show. Try again."));
    }
  };

  const ItemCard = (
    current ? (
      <section aria-label="Current item" className="lv-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {current.image ? <img src={current.image} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 56, height: 56 }} />}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className="cap">ITEM {items.indexOf(current) + 1} OF {items.length} · {isAuction ? 'AUCTION' : 'BUY NOW DROP'}</span>
            <span style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.name}</span>
            {isAuction
              ? <span className="f" style={{ fontSize: 28, lineHeight: 1.05 }}>{naira(current.winner?.amount || current.currentBid || current.minBid)}</span>
              : <span className="f" style={{ fontSize: 24, lineHeight: 1.05 }}>{naira(current.price)}</span>}
            {isAuction && <span className="mut" style={{ fontSize: 13 }}>{current.winner ? <><strong style={{ color: 'var(--text)' }}>{current.winner.name || 'A buyer'}</strong> won it</> : current.currentBid ? <><strong style={{ color: 'var(--text)' }}>{current.currentBidder || 'Someone'}</strong> winning</> : running ? 'No bids yet' : `Bids start at ${naira(current.minBid)}`}</span>}
          </div>
          {isAuction && running && (
            <div aria-label={`${secs ?? total} seconds left`} style={{ flex: 'none', width: 76, height: 76, borderRadius: '50%', background: `conic-gradient(${(secs ?? total) <= 5 ? 'var(--danger)' : (secs ?? total) <= 10 ? 'var(--warning)' : 'var(--primary)'} 0 ${Math.min(100, ((secs ?? total) / total) * 100)}%, var(--primary-soft) 0 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="f" style={{ width: 62, height: 62, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{clock(secs ?? total)}</span>
            </div>
          )}
        </div>
        {!isAuction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} role="status">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span className="f" style={{ fontSize: 20 }}>{current.stock} left</span><span style={{ fontWeight: 800, color: 'var(--accent)' }}>{current.sold} sold{current.soldAmount ? ` · ${naira(current.soldAmount)}` : ''}</span></div>
            <div style={{ height: 12, borderRadius: 999, background: 'var(--surface-sunken)' }}><div style={{ width: `${(current.sold / Math.max(1, current.sold + current.stock)) * 100}%`, height: '100%', borderRadius: 999, background: 'var(--accent)' }} /></div>
          </div>
        )}
        {isAuction && !running && !current.winner && current.bidStatus !== 'ended' && <button type="button" className="btn" style={{ minHeight: 56 }} disabled={Boolean(busy) || phase !== 'live'} onClick={startBids}>{busy === 'bid' ? 'Starting…' : `Start bidding · ${clock(current.auctionSeconds || 30)}`}</button>}
        {isAuction && running && <button type="button" className="btn2" style={{ minHeight: 48 }} disabled={Boolean(busy)} onClick={addTime}>{busy === 'time' ? 'Adding…' : '+30s'}</button>}
        {isAuction && running && <span className="hint" style={{ textAlign: 'center' }}>The highest bid when the timer ends wins and is charged. A bid in the last 5 seconds adds 5 seconds.</span>}
        {isAuction && (current.winner || current.bidStatus === 'ended') && queue.find((q) => q.bidStatus !== 'ended') && <button type="button" className="btn" style={{ minHeight: 56 }} disabled={Boolean(busy)} onClick={() => pick(queue.find((q) => q.bidStatus !== 'ended'))}>Next item</button>}
        {!isAuction && (current.isVisible
          ? <button type="button" className="btn3" style={{ minHeight: 52 }} disabled={Boolean(busy)} onClick={endDrop}>{busy === 'hide' ? 'Ending…' : 'Take off sale'}</button>
          : <button type="button" className="btn" style={{ minHeight: 56 }} disabled={Boolean(busy) || phase !== 'live' || current.stock <= 0} onClick={() => putUp(current)}>{current.stock <= 0 ? 'Sold out' : busy === 'show' ? 'Putting on sale…' : 'Put on sale'}</button>)}
      </section>
    ) : null
  );

  const Queue = (
    <div className="lv-queue" aria-label="Up next">
      <span style={{ font: '800 12px var(--font-body)', paddingRight: 2 }}>Up next</span>
      {queue.map((q) => (
        <button key={q.productId} type="button" className="lv-q" aria-label={`${q.name}${q.bidStatus === 'ended' || q.winner ? ' (done)' : ''}`} onClick={() => pick(q)} style={{ opacity: q.winner || q.bidStatus === 'ended' || q.stock <= 0 ? 0.45 : 1 }}>
          {q.image ? <img src={q.image} alt="" /> : <span className="sk" style={{ width: '100%', height: '100%' }} />}
        </button>
      ))}
      <button type="button" className="lv-q lv-all" aria-label="See all items" onClick={() => setQueueOpen(true)}>All</button>
    </div>
  );

  const Chat = (
    <div className="lv-feed" aria-live="polite" aria-label="Live chat">
      {feed.map((m) => (
        m.kind === 'comment'
          ? <div key={m.id} className="lv-ch"><b>{m.user}</b> {m.text}</div>
          : m.kind === 'hidden'
            ? (
              <div key={m.id} className="lv-hid">
                <span>{m.notice} · </span>
                <button type="button" className="lv-undo" onClick={() => socketRef.current?.emit('stream_unhide_comment', { streamId: id, id: m.hiddenId })}>Undo</button>
                <span className="lv-hid-tx">{m.user}: “{m.text}”</span>
              </div>
            )
            : <div key={m.id} className={`lv-ev lv-${m.kind}`}>{m.kind === 'bid' ? '↑ ' : ''}{m.user} {m.text}</div>
      ))}
      <span ref={feedEnd} />
    </div>
  );

  return (
    <div className="studio-app lv">
      <header className="lv-top">
        <span className="lv-tp" style={{ background: phase === 'reconnecting' ? 'var(--warning)' : 'var(--live)', color: '#fff' }}>{phase === 'connecting' ? 'Starting…' : phase === 'reconnecting' ? 'Reconnecting…' : '● LIVE'}</span>
        <span className="lv-tp" aria-label={`${viewers} watching`}>{Icon.eye}{viewers}</span>
        <span className="lv-tp">{clock(elapsed)}</span>
        <span className="lv-tp lv-desk-only" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{show?.title}</span>
        <span className="lv-tp lv-desk-only">{sales.count} sold · {naira(sales.amount)}</span>
        <span style={{ flex: 1 }} />
        {show?.link && <button type="button" className="lv-tp" style={{ minHeight: 44, border: 0, cursor: 'pointer' }} onClick={() => setSharing(true)} aria-label="Share your show">{Icon.share}<span className="lv-desk-only">Share</span></button>}
        <button type="button" className="lv-tp" style={{ minHeight: 44, border: 0, cursor: 'pointer' }} onClick={() => setConfirmEnd(true)} disabled={phase === 'ending'}>{phase === 'ending' ? 'Ending…' : 'End show'}</button>
      </header>

      <div className="lv-body">
        <aside className="lv-left">{ItemCard}<div className="card lv-desk-only" style={{ padding: 12 }}>{Queue}</div></aside>
        <section className="lv-cam" aria-label="Your camera">
          <div ref={videoRef} className="lv-video" />
          {phase === 'error' && (
            <div className="lv-overlay"><span>{error}</span><button type="button" className="btn2" onClick={() => window.location.reload()}>Try again</button><button type="button" className="link" style={{ color: '#fff' }} onClick={() => navigate('/studio')}>Back to studio</button></div>
          )}
          {phase === 'connecting' && <div className="lv-overlay"><span>Starting your show…</span></div>}
          <div className="lv-tools">
            <button type="button" className="ib" aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={!micOn} onClick={toggleMic} style={{ background: micOn ? 'rgba(255,255,255,.95)' : 'var(--danger)', color: micOn ? 'var(--text)' : '#fff' }}>{micOn ? Icon.mic : Icon.micOff}</button>
            <button type="button" className="ib" aria-label="Flip camera" onClick={flip} style={{ background: 'rgba(255,255,255,.95)' }}>{Icon.flip}</button>
          </div>
          <div className="lv-phone-only lv-chat-over">{Chat}</div>
          <div className="lv-phone-only lv-bottom">
            <div className="lv-queue-wrap">{Queue}</div>
            {ItemCard}
          </div>
        </section>
        <aside className="lv-right card">
          <span className="f" style={{ fontSize: 17 }}>Chat</span>
          {Chat}
          <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
            <label htmlFor="lvmsg" className="sr">Say something to chat</label>
            <input id="lvmsg" className="in" placeholder="Say something to chat" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} style={{ border: 0, background: 'var(--surface-sunken)', borderRadius: 999 }} />
            <button type="submit" className="ib" aria-label="Send" style={{ background: 'var(--primary)', color: '#fff' }}>{Icon.send}</button>
          </form>
        </aside>
      </div>

      {confirmEnd && (
        <Sheet label="End show" onClose={() => setConfirmEnd(false)}>
          <h2 className="f" style={{ margin: 0, fontSize: 22 }}>End the show?</h2>
          <span style={{ fontSize: 15, lineHeight: 1.45 }}>{sales.count ? `You sold ${sales.count} item${sales.count === 1 ? '' : 's'} for ${naira(sales.amount)}. ` : ''}Buyers will see the show has ended. Delivery for each buyer is priced and paid automatically.</span>
          {running && <span className="err-text">An auction is still running. If you end now, it closes with the current top bid.</span>}
          <div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn3" style={{ flex: 1 }} onClick={() => setConfirmEnd(false)}>Keep going</button><button type="button" className="btn btn-d" style={{ flex: 1.3 }} onClick={end}>End show</button></div>
        </Sheet>
      )}
      {sharing && show && <ShareSheet show={{ ...show, status: 'live' }} onClose={() => setSharing(false)} />}
      {queueOpen && (
        <Sheet label="All items" onClose={() => setQueueOpen(false)}>
          <h2 className="h2">Items in this show</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
            {items.map((i, n) => (
              <button key={i.productId} type="button" className="st-row" onClick={() => pick(i)} aria-current={i.productId === current?.productId}>
                {i.image ? <img src={i.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 44, height: 44 }} />}
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={{ fontWeight: 800 }}>{n + 1} · {i.name}</span><span className="mut" style={{ fontSize: 13 }}>{isAuction ? (i.winner ? `Won by ${i.winner.name || 'a buyer'} · ${naira(i.winner.amount)}` : i.bidStatus === 'ended' ? 'No winner' : `Bids from ${naira(i.minBid)}`) : `${naira(i.price)} · ${i.stock} left · ${i.sold} sold`}</span></span>
                {i.productId === current?.productId && <span className="pill p-show">Now</span>}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {toast && <div className="toast" role="status" style={{ position: 'fixed', left: 16, right: 16, top: 70, maxWidth: 480, margin: '0 auto', zIndex: 60 }}><span style={{ flex: 1 }}>{toast}</span></div>}
    </div>
  );
}
