import {clearOpenAnnouncements} from './liveFeed';
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
import { feedEntryFor, winnerName } from './liveFeed';
import LiveChat from './LiveChat';
import { hasNotes } from './NotesEditor';
import NotesSheet from './NotesSheet';
import RunSheet from './RunSheet';
import { acquireTracks, createTrackScope } from './localMedia';
import { createLiveRecovery, studioTimers, selectedItem, runState } from './liveRecovery';
import useKeyboardInset from './useKeyboardInset';
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
  const mediaScopeRef = useRef(null);
  const endedRef = useRef(false);
  const socketRef = useRef(null);
  const recoveryRef = useRef(null);
  const restoreRef = useRef(() => {});
  const [recoveryStatus, setRecoveryStatus] = useState('syncing');
  const [socketUp, setSocketUp] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [rtcSession, setRtcSession] = useState(0);
  const [runError, setRunError] = useState('');

  const [phase, setPhase] = useState('connecting'); // connecting | live | reconnecting | error | ending
  const [error, setError] = useState('');
  const [show, setShow] = useState(null);
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState({ count: 0, amount: 0 });
  const [currentId, setCurrentId] = useState(null);
  const [timer, setTimer] = useState({});
  const deadlinesRef = useRef({});
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
  const [notesOpen, setNotesOpen] = useState(false);
  const [runFor, setRunFor] = useState(null); // { item, again } for the run sheet
  const [typing, setTyping] = useState(false); // host typing in chat: hide the item panel and controls
  const keyboard = useKeyboardInset();
  const chatInput = useRef(null);
  const [notesBusy, setNotesBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // assistant: "4 people asked about … Add it?"
  const [queueOpen, setQueueOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shownKeys = useRef(new Set()); // lines shown once ("Bidding is open" per item)
  const push = useCallback((entry) => {
    if (entry.key) { if (shownKeys.current.has(entry.key)) return; shownKeys.current.add(entry.key); }
    setFeed((f) => [...f.slice(-80), { id: `${Date.now()}-${Math.random()}`, ...entry }]);
  }, []);
  const say = useCallback((t) => setToast(t), []);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    const recovery = createLiveRecovery({
      load: async () => {
        const [snapshot, history] = await Promise.all([studio.show(id), studio.chat(id)]);
        return { ...snapshot, history };
      },
      apply: (r) => {
        if (endedRef.current) return;
        if (r.show.status === 'ended') {
          endedRef.current = true; mediaScopeRef.current?.close();
          clientRef.current?.leave().catch(() => {});
          navigate(`/studio/recap/${id}`, { replace: true }); return;
        }
        setShow(r.show); setItems(r.items); setSales(r.sales);
        setViewers(r.show.viewers || 0); setTimer(studioTimers(r.items));
        deadlinesRef.current = Object.fromEntries(r.items.filter((i) => i.bidStatus === 'active' && Number.isFinite(Date.parse(i.auctionEndsAt))).map((i) => [i.productId, Date.parse(i.auctionEndsAt)]));
        setCurrentId((previous) => selectedItem(r.items, previous));
        if (r.show.actualStartTime) { const started = Date.parse(r.show.actualStartTime); setStartedAt(started); setElapsed((Date.now() - started) / 1000); }
        const list = Array.isArray(r.history) ? r.history : r.history?.chatInteractions || [];
        setFeed(list.filter((m) => !m.hidden).slice(-40).map((m) => { const entry = feedEntryFor(m); return entry ? { id: m.id || m._id, ...entry } : null; }).filter(Boolean));
      },
      status: setRecoveryStatus,
    });
    recoveryRef.current = recovery;
    const resume = () => {
      if (document.visibilityState === 'hidden' || endedRef.current) return;
      setOnline(navigator.onLine);
      const socket = socketRef.current;
      if (socket?.connected) socket.emit('stream_notification_subscribe', { streamId: id });
      else socket?.connect();
      recovery.refresh().then((r) => { if (r?.show.status === 'live' && !endedRef.current) restoreRef.current(); }).catch(() => {});
    };
    const offline = () => setOnline(false);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume); window.addEventListener('focus', resume);
    window.addEventListener('online', resume); window.addEventListener('offline', offline);
    const poll = setInterval(() => { if (document.visibilityState !== 'hidden' && !endedRef.current) recovery.refresh({ quiet: true }).catch(() => {}); }, 30000);
    return () => {
      recovery.dispose(); if (recoveryRef.current === recovery) recoveryRef.current = null;
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume); window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume); window.removeEventListener('offline', offline);
      clearInterval(poll);
    };
  }, [id, navigate]);
  const refresh = useCallback((options) => recoveryRef.current?.refresh(options), [id]);

  // Preserve the host's device choices and muted microphone on an RTC restart.
  const micRef = useRef(micOn); micRef.current = micOn;
  const facingRef = useRef(facing); facingRef.current = facing;
  restoreRef.current = () => {
    if (endedRef.current) return;
    const client = clientRef.current, tracks = tracksRef.current;
    const dead = [tracks.audio, tracks.video].some((t) => t?.getMediaStreamTrack?.()?.readyState === 'ended');
    if (client?.connectionState === 'DISCONNECTED' || dead) setRtcSession((n) => n + 1);
    else if (tracks.video && videoRef.current) { try { tracks.video.play(videoRef.current, { fit: 'cover', mirror: facingRef.current === 'user' }); } catch { /* SDK can recover on its next connection event */ } }
  };

  // 1. Start (or rejoin) the show, join Agora as host, publish camera + mic
  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;
    const scope = createTrackScope();
    mediaScopeRef.current = scope;
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    clientRef.current = client;

    const run = async () => {
      try {
        const r = await refresh();
        if (cancelled || scope.closed || !r) return;
        if (r.show.status === 'ended') { scope.close(); endedRef.current = true; navigate(`/studio/recap/${id}`, { replace: true }); return; }
        if (r.show.status !== 'live') await studio.startShow(id);
        const creds = await studio.hostToken(id);
        if (cancelled || scope.closed) return;
        await client.setClientRole('host');
        client.on('connection-state-change', (cur) => {
          if (cur === 'RECONNECTING' || cur === 'DISCONNECTED') setPhase((p) => (p === 'ending' ? p : 'reconnecting'));
          if (cur === 'CONNECTED') { setPhase((p) => (p === 'reconnecting' ? 'live' : p)); refresh().catch(() => {}); }
        });
        const renew = async () => {
          try { const t = await studio.hostToken(id); if (!cancelled && !scope.closed) await client.renewToken(t.token); }
          catch { refresh().catch(() => {}); }
        };
        client.on('token-privilege-will-expire', renew);
        client.on('token-privilege-did-expire', renew);
        // Don't spin forever on a bad connection
        await Promise.race([
          client.join(creds.agoraAppId || import.meta.env.VITE_AGORA_API_KEY, creds.channelName, creds.token, creds.uid),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Couldn't connect your video. Check your internet, then try again.")), 30000)),
        ]);
        if (cancelled || scope.closed) return;
        const [audio, video] = await acquireTracks(scope, [
          () => AgoraRTC.createMicrophoneAudioTrack({ ...(nav?.micId ? { microphoneId: nav.micId } : {}), AEC: true, ANS: true, AGC: true }),
          () => AgoraRTC.createCameraVideoTrack({ ...(nav?.cameraId ? { cameraId: nav.cameraId } : { facingMode: facingRef.current }), encoderConfig: '480p_1', optimizationMode: 'motion' }),
        ]);
        if (cancelled || scope.closed) { scope.close(); return; }
        tracksRef.current = { audio, video };
        if (!micRef.current) await audio.setEnabled(false);
        if (videoRef.current) video.play(videoRef.current, { fit: 'cover', mirror: facingRef.current === 'user' });
        await client.publish([audio, video]);
        if (cancelled || scope.closed) return;
        setStartedAt((s) => s || Date.now());
        setPhase('live');
      } catch (e) {
        scope.close();
        if (cancelled || endedRef.current) return;
        const blocked = e?.code === 'PERMISSION_DENIED' || /permission|NotAllowed/i.test(e?.message || '');
        setError(blocked ? 'Camera or microphone is blocked. Allow them for this site, then reload.' : errorText(e, e?.message || "Couldn't start the show."));
        setPhase('error');
      }
    };
    run();
    return () => {
      cancelled = true;
      scope.close();
      if (mediaScopeRef.current === scope) { tracksRef.current = { audio: null, video: null }; mediaScopeRef.current = null; }
      client.removeAllListeners();
      client.leave().catch(() => {});
    };
  }, [id, refresh, navigate, nav, rtcSession]);

  // 2. Live events
  useEffect(() => {
    const origin = new URL(BASE_URL).origin;
    const socket = io(origin, { auth: { token: tokenUtils.getBearerToken() }, transports: ['websocket', 'polling'], reconnectionDelayMax: 5000 });
    socketRef.current = socket;
    socket.on('connect', () => { setSocketUp(true); socket.emit('stream_notification_subscribe', { streamId: id }); refresh().catch(() => {}); });
    socket.on('disconnect', () => setSocketUp(false));
    socket.on('connect_error', () => setSocketUp(false));
    // Chat safety: messages with phone numbers, account numbers or links are hidden from buyers
    socket.on('notes_suggestion', (sg) => setSuggestions((l) => [...l.filter((x) => x.text !== sg.text), sg].slice(-3)));
    socket.on('chat_hidden_detail', (h) => push({ kind: 'hidden', hiddenId: h.id, user: h.user, text: h.content, notice: h.notice }));
    socket.on('chat_unhidden', (h) => setFeed((f) => f.filter((m) => m.hiddenId !== h.id)));
    socket.on('chat_unhide_error', (h) => say(h?.message || "Couldn't show that message."));
    socket.on('chat_hidden_self', (h) => say(h?.message || 'Phone numbers, account numbers and links stay out of chat.'));
    socket.on('stream_notification', (n) => {
      const d = n?.data || {};
      if (['auction_start', 'new_bid', 'auction_winner', 'auction_end', 'product_display', 'buy_now', 'stream_ended'].includes(n?.type)) recoveryRef.current?.invalidate();
      // Chat lines are built the same way as on the buyer's Watch (liveFeed.js)
      const line = feedEntryFor(n);
      if (line) push(line);
      switch (n?.type) {
        case 'stream_ended':
          endedRef.current = true;
          mediaScopeRef.current?.close();
          clientRef.current?.leave().catch(() => {});
          navigate(`/studio/recap/${id}`, { replace: true });
          break;
        case 'join': if (typeof d.viewerCount === 'number') setViewers(d.viewerCount); break;
        case 'new_bid':
          if (d.product) setItems((l) => l.map((p) => (p.productId === pid(d.product) ? { ...p, currentBid: d.bidAmount, currentBidder: n.user || p.currentBidder, bidStatus: 'active' } : p)));
          break;
        case 'auction_start':
        case 'product_display': refresh().catch(() => {}); break;
        case 'auction_winner':
          setFeed(feed=>clearOpenAnnouncements(feed,d.product));
          say(`${winnerName(d)} won it for ${naira(d.bidWinner?.bidAmount)}`);
          refresh().catch(() => {});
          break;
        case 'auction_end':
          setFeed(feed=>clearOpenAnnouncements(feed,d.product));
          setToast(previous=>/^Bidding is open/i.test(previous)?'':previous);
          if (d.product) setItems((l) => l.map((p) => (p.productId === pid(d.product) ? { ...p, bidStatus: 'ended' } : p)));
          refresh().catch(() => {});
          break;
        case 'buy_now':
          if (d.productId) setItems((l) => l.map((p) => (p.productId === String(d.productId) ? { ...p, stock: typeof d.stockLeft === 'number' ? d.stockLeft : p.stock, sold: p.sold + (d.quantity || 1) } : p)));
          refresh().catch(() => {});
          break;
        default:
      }
    });
    socket.on('viewer_joined_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
    socket.on('viewer_left_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
    socket.on('bid_timer_update', (t) => {
      if (!t?.productId) return;
      if (t.extended) recoveryRef.current?.invalidate();
      deadlinesRef.current[String(t.productId)] = Number.isFinite(Date.parse(t.endsAt)) ? Date.parse(t.endsAt) : Date.now() + t.secondsLeft * 1000;
      setTimer((m) => ({ ...m, [String(t.productId)]: t.secondsLeft }));
    });
    socket.on('bid_timer_complete', (t) => { if (t?.productId) { setTimer((m) => ({ ...m, [String(t.productId)]: 0 })); refresh({ quiet: true }).catch(() => {}); } });
    return () => { socket.emit('stream_notification_unsubscribe', { streamId: id }); socket.disconnect(); };
  }, [id, push, say, refresh, navigate]);

  // The deadline survives suspended iOS timers; socket ticks can extend it.
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const remaining = Object.fromEntries(Object.entries(deadlinesRef.current).map(([id, end]) => [id, Math.max(0, Math.ceil((end - Date.now()) / 1000))]));
      setTimer((previous) => Object.entries(remaining).every(([id, left]) => previous[id] === left) ? previous : { ...previous, ...remaining });
    }, 500);
    return () => clearInterval(tick);
  }, []);

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
  useEffect(()=>{if(current?.bidStatus==='ended'||current?.winner)setFeed(feed=>clearOpenAnnouncements(feed,{productId:current.productId,run:current.run}));},[current?.productId,current?.bidStatus,current?.winner]);
  const { running, settling, canRunAgain } = runState(current, secs);
  const reconnecting = !online || !socketUp || recoveryStatus !== 'ready' || phase === 'reconnecting';
  const canAct = phase === 'live' && !reconnecting;
  useEffect(() => {
    if (!settling) return undefined;
    const poll = setInterval(() => refresh({ quiet: true }).catch(() => {}), 1500);
    return () => clearInterval(poll);
  }, [settling, refresh]);
  const queue = items.filter((i) => i.productId !== current?.productId);
  // "3 sold · ₦4,000 · 1 item not shown yet" (or "1 auction still running")
  const notShown = items.filter((i) => i.bidStatus === 'pending' && !i.isVisible && !i.winner && !(i.sold > 0)).length;
  const endSummary = [
    `${sales.count} sold`,
    naira(sales.amount),
    running ? '1 auction still running' : notShown ? `${notShown} item${notShown === 1 ? '' : 's'} not shown yet` : null,
  ].filter(Boolean).join(' · ');

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
  // A run: the note, starting bid and time, then bidding starts (Run again resets the item first)
  const startRun = async ({ note, minBid, seconds }) => {
    setBusy('bid'); setRunError('');
    try {
      const latest = await refresh();
      const item = latest?.items.find((i) => i.productId === runFor.item.productId);
      if (!item || (runFor.again && !item.canRunAgain)) throw new Error(item?.bidStatus === 'active' ? 'This auction is still running.' : 'Finishing the last sale. Please wait a moment.');
      await studio.prepareRun(id, item.productId, { note, minBid, seconds });
      if (!item.isVisible) await studio.displayProduct(id, item.productId);
      await studio.startBidding(id, item.productId, seconds);
      setCurrentId(item.productId); setRunFor(null);
      await refresh(); say(`Bidding is open: ${clock(seconds)}`);
    } catch (error) { setRunError(errorText(error, error.message || "Couldn't start this run.")); await refresh().catch(() => {}); }
    finally { setBusy(''); }
  };
  const addTime = () => act('time', () => studio.addTime(id, current.productId, 30), 'Added 30 seconds');
  // "End now · sell": close the auction now; the top bid wins and is charged
  const endNow = () => act('end', () => studio.endBidding(id, current.productId), current?.currentBid ? `Sold to ${current.currentBidder || 'the top bidder'}` : 'Auction ended');
  const endDrop = () => act('hide', () => studio.hideProduct(id, current.productId), 'Item taken off sale');
  const pick = (item) => { setCurrentId(item.productId); setQueueOpen(false); if (!isAuction || item.bidStatus !== 'ended') putUp(item); };

  const flip = async () => {
    const old = tracksRef.current.video;
    if (!old) return;
    const next = facing === 'user' ? 'environment' : 'user';
    const scope = mediaScopeRef.current;
    if (!scope || scope.closed) return;
    let track;
    try {
      track = scope.own(await AgoraRTC.createCameraVideoTrack({ facingMode: next, encoderConfig: '480p_1', optimizationMode: 'motion' }));
      if (scope.closed) return;
      await clientRef.current.unpublish(old);
      scope.release(old);
      if (scope.closed) return;
      tracksRef.current.video = track;
      track.play(videoRef.current, { fit: 'cover', mirror: next === 'user' });
      await clientRef.current.publish(track);
      setFacing(next);
    } catch { if (track) scope.release(track); say("Couldn't switch camera"); }
  };
  const toggleMic = async () => { const a = tracksRef.current.audio; if (a) { await a.setEnabled(!micOn); setMicOn(!micOn); } };

  const send = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('stream_comment', { streamId: id, content: text });
    setMessage('');
    chatInput.current?.blur();
  };

  const end = async () => {
    setPhase('ending');
    setConfirmEnd(false);
    endedRef.current = true;
    mediaScopeRef.current?.close();
    tracksRef.current = { audio: null, video: null };
    try {
      // Never wait for a stuck RTC leave/unpublish before telling buyers it ended.
      clientRef.current?.leave().catch(() => {});
      await studio.endShow(id);
      socketRef.current?.emit('stream_notification', { type: 'host_disconnect', data: { streamId: id, message: 'Host has ended the stream' } });
      navigate(`/studio/recap/${id}`, { replace: true });
    } catch (e) {
      setPhase('error');
      setError(errorText(e, "Your camera is off, but the show could not be marked ended. Tap End show to retry."));
      say("Camera and microphone are off. Retry End show to finish.");
    }
  };

  // The current item as text on the bottom fade, like the buyer's Watch
  const soldOut = current && current.stock <= 0;
  const ItemCard = (
    current ? (
      <section aria-label="Current item" className="lv-panel">
        <div className="lv-now">
          {current.image ? <img src={current.image} alt="" className="lv-thumb" /> : <span className="sk lv-thumb" />}
          <div className="lv-now-tx">
            <span className="lv-cap">Item {items.indexOf(current) + 1} of {items.length} · {isAuction ? 'Auction' : 'Buy Now drop'}{isAuction && current.run > 1 ? ` · Run ${current.run}` : ''}</span>
            <span className="lv-title">{current.name}</span>
            {current.runNote && <span className="lv-note">{current.runNote}</span>}
          </div>
        </div>
        <div className="lv-price-row">
          <span className="f lv-price">{naira(isAuction ? current.winner?.amount || current.currentBid || current.minBid : current.price)}</span>
          <span className="lv-grow" />
          {isAuction && running && <span className={`f lv-clock${(secs ?? total) <= 10 ? ' hot' : ''}`} role="timer" aria-label={`${secs ?? total} seconds left`}>{clock(secs ?? total)}</span>}
        </div>
        <span className="lv-meta" role="status">
          {isAuction
            ? settling ? 'Finishing sale…' : current.winner ? `${current.winner.name || 'A buyer'} won it` : current.currentBid ? `${current.currentBidder || 'Someone'} winning` : running ? 'No bids yet' : `Bids start at ${naira(current.minBid)}`
            : `${current.stock} of ${current.stock + current.sold} left${current.sold ? ` · ${current.sold} sold · ${naira(current.soldAmount)}` : ''}`}
        </span>
        {isAuction && !running && !settling && !canRunAgain && !current.winner && current.bidStatus !== 'ended' && (
          <>
            <button type="button" className="btn lv-go" disabled={Boolean(busy) || !canAct} onClick={startBids}>{busy === 'bid' ? 'Starting…' : `Start bidding · ${clock(current.auctionSeconds || 30)}`}</button>
            <button type="button" className="lv-all" style={{ alignSelf: 'center' }} onClick={() => setRunFor({ item: current, again: false })}>{current.runNote ? 'Change note' : 'Add a note for this run'}</button>
          </>
        )}
        {isAuction && running && !settling && (
          <div className="lv-actions">
            <button type="button" className="lv-ghost" style={{ flex: 'none' }} disabled={Boolean(busy) || !canAct} onClick={addTime}>{busy === 'time' ? 'Adding…' : '+30s'}</button>
            <button type="button" className="lv-ghost" style={{ flex: 1 }} disabled={Boolean(busy) || !canAct} onClick={endNow}>{busy === 'end' ? 'Ending…' : current.currentBid ? 'End now · sell' : 'End now'}</button>
          </div>
        )}
        {isAuction && canRunAgain && queue.find((q) => q.bidStatus !== 'ended') && <button type="button" className="btn lv-go" disabled={Boolean(busy) || !canAct} onClick={() => pick(queue.find((q) => q.bidStatus !== 'ended'))}>Next item</button>}
        {!isAuction && (current.isVisible
          ? <button type="button" className="lv-ghost" disabled={Boolean(busy) || !canAct} onClick={endDrop}>{busy === 'hide' ? 'Ending…' : 'Take off sale'}</button>
          : <button type="button" className="btn lv-go" disabled={Boolean(busy) || !canAct || soldOut} onClick={() => putUp(current)}>{soldOut ? 'Sold out' : busy === 'show' ? 'Putting on sale…' : 'Put on sale'}</button>)}
      </section>
    ) : null
  );

  // Up next: one compact row (32px photo, name, price), then "All"
  // An auction item with stock left can run again once its run has ended
  const nextItem = queue.find((q) => q.bidStatus !== 'ended' && !q.winner && !(!isAuction && q.stock <= 0));
  const Queue = (
    <div className="lv-upnext" aria-label="Up next">
      {nextItem ? (
        <button type="button" className="lv-un" onClick={() => pick(nextItem)}>
          {nextItem.image ? <img src={nextItem.image} alt="" className="lv-un-img" /> : <span className="sk lv-un-img" />}
          <span className="lv-un-tx"><b>Up next</b> · {nextItem.name}</span>
          {/* With "Run again" in the row, the name gets the room instead of the price */}
          {!canRunAgain && <span className="lv-un-price">{isAuction ? `from ${naira(nextItem.minBid)}` : naira(nextItem.price)}</span>}
        </button>
      ) : <span className="lv-un-tx lv-un-none">Nothing else in this show</span>}
      {canRunAgain && <button type="button" className="lv-run" disabled={!canAct || Boolean(busy)} onClick={() => { setRunError(''); setRunFor({ item: current, again: true }); }}>Run again · {current.colour?`${current.colour} · `:''}{current.stock} left</button>}
      <button type="button" className="lv-all" onClick={() => setQueueOpen(true)}>All</button>
    </div>
  );

  const Chat = <LiveChat feed={feed} onUndo={(m) => socketRef.current?.emit('stream_unhide_comment', { streamId: id, id: m.hiddenId })} />;

  const saveNotes = async (next, doneText = 'Show notes updated') => {
    setNotesBusy(true);
    try {
      const r = await studio.saveNotes(id, next);
      setShow((sh) => ({ ...sh, notes: r.notes }));
      say(doneText);
      return true;
    } catch (e) {
      say(errorText(e, "Couldn't save the notes. Try again."));
      return false;
    } finally {
      setNotesBusy(false);
    }
  };
  const addSuggestion = async (sg) => {
    const current = show?.notes || {};
    const section = sg.section === 'payment' ? 'payment' : sg.section;
    const next = { ...current, [section]: [current[section], sg.line].filter(Boolean).join(' ') };
    if (await saveNotes(next, 'Added to your show notes')) setSuggestions((l) => l.filter((x) => x !== sg));
  };

  // Assistant lines: plain text, one action each
  const Prompts = (
    <div className="lv-prompts">
      <div className="lv-prompt">
        {hasNotes(show?.notes)
          ? <><span>Show notes pinned · </span><button type="button" className="lv-undo" onClick={() => setNotesOpen(true)}>Edit</button></>
          : <><span>No show notes yet · </span><button type="button" className="lv-undo" onClick={() => setNotesOpen(true)}>Pin notes</button></>}
      </div>
      {suggestions.map((sg) => (
        <div key={sg.text} className="lv-prompt">
          <span>{sg.text} </span>
          <button type="button" className="lv-undo" disabled={notesBusy} onClick={() => addSuggestion(sg)}>Add it</button>
          <button type="button" className="lv-undo" onClick={() => setSuggestions((l) => l.filter((x) => x !== sg))}>Not now</button>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`studio-app lv${typing ? ' typing' : ''}`} style={{ '--kb-bottom': `${typing ? keyboard.bottom : 0}px` }}>
      {/* One slim row: the LIVE chip with the viewer count, the show time, End show */}
      <header className="lv-top">
        <span className={`lv-live${reconnecting ? ' warn' : ''}`} aria-label={`${phase === 'connecting' ? 'Starting' : phase === 'reconnecting' ? 'Reconnecting' : 'Live'}, ${viewers} watching`}>
          {phase === 'connecting' ? 'Starting…' : reconnecting ? 'Syncing…' : '● LIVE'} · {viewers}
        </span>
        <span className="lv-time">{clock(elapsed)}</span>
        <span className="lv-desk-only lv-title-top">{show?.title}</span>
        <span className="lv-desk-only lv-time">{sales.count} sold · {naira(sales.amount)}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="lv-end" onClick={() => setConfirmEnd(true)} disabled={phase === 'ending'}>{phase === 'ending' ? 'Ending…' : 'End show'}</button>
      </header>

      <div className="lv-mobile-prompts lv-phone-only">{Prompts}</div>
      {recoveryStatus === 'failed' && <button className="lv-refresh" type="button" onClick={() => refresh().catch(() => {})}>Couldn’t refresh · Retry</button>}
      <div className="lv-body">
        <aside className="lv-left"><div className="lv-desk-only" style={{ flexDirection: 'column', gap: 8 }}><span className="h2">Items in this show</span>{Queue}</div></aside>
        <section className="lv-cam" aria-label="Your camera">
          <div ref={videoRef} className="lv-video" />
          {phase === 'error' && (
            <div className="lv-overlay"><span>{error}</span><button type="button" className="btn2" onClick={() => window.location.reload()}>Try again</button><button type="button" className="link" style={{ color: '#fff' }} onClick={() => navigate('/studio')}>Back to studio</button></div>
          )}
          {phase === 'connecting' && <div className="lv-overlay"><span>Starting your show…</span></div>}
          <div className="lv-bottom">
            {/* Chat on the left, controls on the right, like the buyer's Watch */}
            <div className="lv-chatzone">
              <div className="lv-chatcol lv-phone-only">
                {Chat}
                {/* The host replies here, like buyers do on Watch */}
                <form className="lv-composer" onSubmit={send}>
                  <label htmlFor="lv-chat" className="sr">Say something</label>
                  <input
                    id="lv-chat"
                    ref={chatInput}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setTyping(true)}
                    onBlur={() => window.setTimeout(() => setTyping(false), 120)}
                    maxLength={200}
                    placeholder="Say something…"
                    autoComplete="off"
                    enterKeyHint="send"
                  />
                  {message.trim() && <button type="submit" className="lv-send" aria-label="Send" onMouseDown={(e) => e.preventDefault()}>{Icon.send}</button>}
                </form>
              </div>
              <span className="lv-grow lv-desk-only" />
              <nav className="lv-rail" aria-label="Show controls">
                {show?.link && <button type="button" className="lv-rb" onClick={() => setSharing(true)} aria-label="Share your show">{Icon.share}</button>}
                <button type="button" className={`lv-rb${micOn ? '' : ' off'}`} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={!micOn} onClick={toggleMic}>{micOn ? Icon.mic : Icon.micOff}</button>
                <button type="button" className="lv-rb" aria-label="Flip camera" onClick={flip}>{Icon.flip}</button>
              </nav>
            </div>
            {ItemCard}
            <div className="lv-queue-wrap lv-phone-only">{Queue}</div>
          </div>
        </section>
        <aside className="lv-right card">
          {Prompts}
          <span className="f" style={{ fontSize: 17 }}>Chat</span>
          {Chat}
          <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
            <label htmlFor="lvmsg" className="sr">Say something to chat</label>
            <input id="lvmsg" className="in" placeholder="Say something to chat" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} style={{ border: 0, background: 'var(--surface-sunken)', borderRadius: 999 }} />
            <button type="submit" className="ib" aria-label="Send" style={{ background: 'var(--primary)', color: '#fff' }}>{Icon.send}</button>
          </form>
        </aside>
      </div>

      {notesOpen && <NotesSheet notes={show?.notes} busy={notesBusy} onSave={(next) => saveNotes(next)} onClose={() => setNotesOpen(false)} />}
      {runFor && <RunSheet item={items.find((i) => i.productId === runFor.item.productId) || runFor.item} again={runFor.again} blocked={!canAct || (runFor.again && !canRunAgain)} error={runError} busy={busy === 'bid'} onStart={startRun} onClose={() => setRunFor(null)} />}
      {confirmEnd && (
        <Sheet label="End the show?" onClose={() => setConfirmEnd(false)}>
          <h2 className="f" style={{ margin: 0, fontSize: 22 }}>End the show?</h2>
          <span style={{ fontWeight: 700 }}>{endSummary}</span>
          <span className="mut">Buyers get their delivery quotes right after.</span>
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
      {toast && !runFor && <div className="toast" role="status" style={{ position: 'fixed', left: 16, right: 16, top: 70, maxWidth: 480, margin: '0 auto', zIndex: 60 }}><span style={{ flex: 1 }}>{toast}</span></div>}
    </div>
  );
}
