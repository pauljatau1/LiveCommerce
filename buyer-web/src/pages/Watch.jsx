// Watch a live show: full-screen video, chat on the video, bid on the current item, Buy Now.
// Phone first: top bar, side rail, then chat, state line, item, price, timer and actions at the bottom.
// Desktop: items on the left, video in the middle, chat on the right.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API, api, errorMessage, getToken, imageOf, naira } from '../api';
import { useAuth } from '../auth';
import { resolveWalletIntent } from '../walletIntents';
import { createRecovery, timersFor } from '../watchRecovery';
import { LATE_BID_SECONDS } from '../config';
import AddressSheet from '../components/AddressSheet';
import TopUpSheet from '../components/TopUpSheet';
import BidMoreSheet from '../components/BidMoreSheet';
import OneStepSheet from '../components/OneStepSheet';
import { googleCalendarUrl, icsHref, showEvent } from '../calendar';
import { Header, Icon, Sheet } from '../components/ui';
import {
  ChatFeed, ItemThumb, ItemsList, MiniBidBar, RailButton, Timer, UpNextRow, deliveryLine, shipsLine, useKeyboardInset,
  idOf, nextBidFor, plural, priceOf, usePulse, who,
} from '../components/watch';

const REPORT_REASONS = ['Selling fakes as original', 'Asking to pay outside the app', 'Rude or abusive', 'Something else'];

export default function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { buyer, wallet, signedIn, loading, refresh, refreshWallet } = useAuth();
  const [show, setShow] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [transfer, setTransfer] = useState(null);
  const [fundsOffer, setFundsOffer] = useState(null);
  const pendingIntent = useRef(null), fundingPending = useRef(false);
  const lastBidIntent = useRef(null), beginTopUpRef = useRef(null);
  const creditedRefs = useRef(new Set()), receiveCreditRef = useRef(() => {});
  const methods = wallet?.topUpMethods || paymentMethods;
  const [loadError, setLoadError] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | preview | joining | watching | ended | error
  const [items, setItems] = useState([]);
  const [feed, setFeed] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [timer, setTimer] = useState({}); // productId -> seconds left
  const [plusSecs, setPlusSecs] = useState(0); // "+5s" flash when a late bid extends the timer
  const [bidCounts, setBidCounts] = useState({}); // productId -> bids so far
  const [soldCounts, setSoldCounts] = useState({}); // productId -> units sold in this show
  const [myBids, setMyBids] = useState({}); // productId -> my latest accepted bid
  const [outbid, setOutbid] = useState(null); // { productId, by, amount }
  const [hasVideo, setHasVideo] = useState(false);
  const [videoMode, setVideoMode] = useState('on'); // on | paused | audio
  const videoModeRef = useRef('on');
  const recoveryRef = useRef(null);
  const quoteItemRef = useRef(''); // item the delivery quote is for (read by recovery)
  const lastBidRef = useRef(null); // last bid sent, to reopen the one-step sheet if delivery can't be priced
  const restoreMediaRef = useRef(() => {});
  const [syncState, setSyncState] = useState('ready');
  const [rtcSession, setRtcSession] = useState(0);
  const [socketUp, setSocketUp] = useState(true);
  const [agoraState, setAgoraState] = useState('CONNECTED');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [needsTap, setNeedsTap] = useState(false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null); // {type:'topup', need} | {type:'address', then} | {type:'items'} | {type:'bid'} | {type:'more'} | {type:'report'}
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [reportState, setReportState] = useState({ reason: '', sending: false, done: '' });
  const stageRef = useRef(null);
  const clientRef = useRef(null);
  const hostUserRef = useRef(null);
  const socketRef = useRef(null);
  const announced = useRef(new Set()); // "Bidding is open" once per item
  const remoteAudio = useRef(null);
  const soundUnlocked = useRef(false);
  const lastSecs = useRef({});
  // ?debug=1 shows whether host audio is arriving (for testing on phones)
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  const [audioDebug, setAudioDebug] = useState('no audio track yet');
  const leadRef = useRef(false); // am I leading the current auction?
  const myIdRef = useRef(null);
  const myBidsRef = useRef({});
  const walletRef = useRef(0);
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;
  const startedAsGuest = useRef(false);
  // Delivery deposit this buyer owes before a first item: a Shipbubble quote to their
  // saved address. null = not known yet, or can't be priced (deliveryProblem says why)
  const [depositDue, setDepositDue] = useState(null);
  const [deliveryProblem, setDeliveryProblem] = useState('');
  const [wentLive, setWentLive] = useState(false);
  const [estimate, setEstimate] = useState(null); // delivery estimate to the buyer's area
  const [notes, setNotes] = useState({ notes: null, firstLine: '', sections: [] }); // the host's pinned show notes
  const [notesUpdated, setNotesUpdated] = useState(false);
  const [hostStats, setHostStats] = useState(null); // { rating, ratings, isNew }
  const [following, setFollowing] = useState(false);
  // Typing in chat: only the top bar, the chat lines and the input, pinned above the keyboard
  const [typing, setTyping] = useState(false);
  const chatInputRef = useRef(null);
  const keyboard = useKeyboardInset();

  const say = useCallback((kind, msg, ms = 3500) => {
    setToast({ kind, msg });
    window.clearTimeout(say.t);
    say.t = window.setTimeout(() => setToast(null), ms);
  }, []);

  const push = useCallback((entry) => setFeed((f) => [...f.slice(-80), { id: `${Date.now()}-${Math.random()}`, ...entry }]), []);

  const patchItem = useCallback((productId, patch) => {
    setItems((list) => list.map((p) => (idOf(p) === String(productId) ? { ...p, ...patch } : p)));
  }, []);

  // 1. Load the show, plus what sold and how many bids so far
  useEffect(() => {
    let cancelled = false;
    api.show(streamId)
      .then((s) => {
        if (cancelled) return;
        setShow(s);
        setItems(s.products || []);
        setTimer(timersFor(s.products || []));
        setViewers(s.viewers?.length || 0);
        setPhase(s.status === 'live' ? 'preview' : s.status === 'ended' ? 'ended' : 'preview');
      })
      .catch((e) => { if (!cancelled) { setLoadError(errorMessage(e, "We couldn't find this show.")); setPhase('error'); } });
    api.notes(streamId).then((r) => { if (!cancelled && r) setNotes({ notes: r.notes, firstLine: r.firstLine, sections: r.sections || [] }); }).catch(() => {});
    api.watchSummary(streamId)
      .then((sum) => { if (!cancelled) { setSoldCounts(sum?.sold || {}); setBidCounts(sum?.bids || {}); setHostStats(sum?.host || null); setPaymentMethods(sum?.topUpMethods || {}); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [streamId]);

  // The item a delivery quote is for: the one on screen now
  const quoteItemId = useMemo(() => {
    const c = items.find((p) => p.bidStatus === 'active') || items.find((p) => p.isVisible) || items[0];
    return c ? idOf(c) : '';
  }, [items]);
  const addressKey = (buyer?.shippingAddresses || []).map((a) => `${a.addressLine1}|${a.city}|${a.state}|${a.phoneNumber}`).join(',');
  const applyMe = useCallback((r) => {
    if (!r) return;
    setDepositDue(r.depositDue === null || r.depositDue === undefined ? null : Number(r.depositDue));
    setDeliveryProblem(r.deliveryProblem || '');
    setFollowing(Boolean(r.following));
    // The same Shipbubble quote doubles as the delivery line on screen
    setEstimate(r.delivery ? { available: true, ...r.delivery } : null);
  }, []);

  // What a signed-in buyer owes for delivery in this show: Shipbubble, from the
  // host's pickup address to their saved address (refetched when either changes)
  useEffect(() => {
    if (!signedIn) { setDepositDue(null); setDeliveryProblem(''); setEstimate(null); return; }
    api.watchMe(streamId, quoteItemId).then(applyMe).catch(() => setDepositDue(null));
  }, [signedIn, streamId, quoteItemId, addressKey, applyMe]);

  // A scheduled show page notices when the host goes live
  useEffect(() => {
    if (show?.status !== 'scheduled') return undefined;
    const t = window.setInterval(() => {
      api.show(streamId).then((s) => { if (s?.status === 'live') { setWentLive(true); window.clearInterval(t); } }).catch(() => {});
    }, 30000);
    return () => window.clearInterval(t);
  }, [show?.status, streamId]);

  // Connection state for the "Reconnecting…" line
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const endShow = useCallback(() => {
    recoveryRef.current?.invalidate();
    setShow((s) => s ? { ...s, status: 'ended' } : s);
    setPhase('ended');
    setSheet(null);
    setTyping(false);
    setBusy(false);
  }, []);

  const live = show?.status === 'live';
  // iOS may freeze the page without disconnecting either SDK. Reload the scene
  // on foreground/pageshow as well as socket reconnect; never reload the page.
  useEffect(() => {
    if (!live || loading) return undefined;
    const recovery = createRecovery({
      load: async () => {
        const [scene, summary, pinned, history, me] = await Promise.all([
          api.show(streamId), api.watchSummary(streamId).catch(() => null),
          api.notes(streamId).catch(() => null), api.publicChat(streamId).catch(() => null),
          signedInRef.current ? api.watchMe(streamId, quoteItemRef.current).catch(() => null) : null,
        ]);
        return { scene, summary, pinned, history, me };
      },
      apply: ({ scene, summary, pinned, history, me }) => {
        setShow(scene);
        if (scene.status === 'ended') { endShow(); return; }
        setItems(scene.products || []);
        const clocks = timersFor(scene.products || []);
        setTimer(clocks); lastSecs.current = clocks; setPlusSecs(0);
        setOutbid(null);
        setViewers(scene.viewers?.length || 0);
        if (summary) { setBidCounts(summary.bids || {}); setSoldCounts(summary.sold || {}); }
        if (pinned) setNotes({ notes: pinned.notes, firstLine: pinned.firstLine, sections: pinned.sections || [] });
        if (history) setFeed(history.slice(-40).map((m) => ({ id: m.id || m._id, kind: 'comment', user: m.user, avatar: m.avatar, text: m.content, host: Boolean(m.isHost) })));
        if (me) applyMe(me);
      },
      status: setSyncState,
    });
    recoveryRef.current = recovery;
    const resume = () => {
      if (document.visibilityState === 'hidden') return;
      const sock = socketRef.current;
      if (sock?.connected) sock.emit('stream_notification_subscribe', { streamId });
      else sock?.connect();
      recovery.refresh();
      if (signedInRef.current) refreshWallet();
      restoreMediaRef.current(true);
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    // Poll only while visible, also catching a missed end event on iOS.
    const poll = window.setInterval(() => { if (document.visibilityState !== 'hidden') recovery.refresh({ quiet: true }); }, 30000);
    return () => {
      recovery.dispose();
      if (recoveryRef.current === recovery) recoveryRef.current = null;
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      window.clearInterval(poll);
    };
  }, [live, loading, streamId, endShow, refreshWallet]);

  // 2a. Video: join as a buyer, or as a guest without an account (watch-only)
  useEffect(() => {
    if (!live || loading) return undefined;
    let cancelled = false;
    let client;

    const start = async () => {
      setPhase('joining');
      let joined;
      try {
        if (signedInRef.current) joined = await api.join(streamId);
        else { joined = await api.guestJoin(streamId); startedAsGuest.current = true; }
      } catch (e) {
        if (cancelled) return;
        if (e?.response?.status === 410) { endShow(); return; }
        setLoadError(errorMessage(e, "Couldn't join the show."));
        setPhase('error');
        return;
      }
      if (cancelled) return;
      const st = joined.stream || {};
      if (st.status === 'ended') { endShow(); return; }
      if (st.products) { setItems(st.products); setTimer(timersFor(st.products)); }
      if (typeof st.viewerCount === 'number') setViewers(st.viewerCount);
      setPhase('watching');
      recoveryRef.current?.refresh();

      // Chat history (read-only for everyone)
      api.publicChat(streamId).then((history) => {
        if (cancelled || !Array.isArray(history)) return;
        setFeed(history.slice(-30).map((m) => ({ id: m.id || m._id, kind: 'comment', user: m.user, avatar: m.avatar, text: m.content, host: Boolean(m.isHost) })));
      }).catch(() => {});

      // Video
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        if (cancelled) return;
        AgoraRTC.setLogLevel(3);
        AgoraRTC.onAutoplayFailed = () => setNeedsTap(true);
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        clientRef.current = client;
        await client.setClientRole('audience', { level: 1 });
        client.on('connection-state-change', (state, previous) => {
          if (cancelled) return;
          setAgoraState(state);
          if (state === 'CONNECTED' && previous === 'RECONNECTING') {
            recoveryRef.current?.refresh(); restoreMediaRef.current(true);
          }
        });
        client.on('user-published', async (user, mediaType) => {
          if (cancelled) return;
          hostUserRef.current = user;
          if (mediaType === 'video' && videoModeRef.current === 'audio') return;
          try { await client.subscribe(user, mediaType); } catch { return; }
          if (cancelled) return;
          if (mediaType === 'video') {
            setHasVideo(true);
            if (videoModeRef.current === 'on' && stageRef.current) user.videoTrack?.play(stageRef.current, { fit: 'cover' });
          }
          if (mediaType === 'audio') {
            remoteAudio.current = user.audioTrack;
            user.audioTrack.play();
            // Phones block sound until the viewer taps; ask unless they already have
            if (!soundUnlocked.current) setNeedsTap(true);
            setAudioDebug('audio track received');
          }
        });
        client.on('user-unpublished', (user, mediaType) => { if (mediaType === 'video') setHasVideo(false); });
        await client.join(joined.agoraAppId, joined.channelName, joined.token, joined.uid);
        if (cancelled) { await client.leave(); return; }
        const renew = async () => {
          try {
            const credentials = signedInRef.current ? await api.join(streamId) : await api.guestJoin(streamId);
            if (!cancelled) {
              if (credentials.stream?.status === 'ended') { endShow(); return; }
              await client.renewToken(credentials.token);
            }
          } catch { if (!cancelled) recoveryRef.current?.refresh(); }
        };
        client.on('token-privilege-will-expire', renew);
        client.on('token-privilege-did-expire', renew);
      } catch (e) {
        if (!cancelled) say('err', "The video couldn't start. Chat and bidding still work.", 6000);
      }
    };

    start();
    return () => {
      cancelled = true;
      try { hostUserRef.current?.videoTrack?.stop(); } catch { /* already stopped */ }
      try { remoteAudio.current?.stop(); } catch { /* already stopped */ }
      client?.removeAllListeners();
      client?.leave().catch(() => {});
      if (clientRef.current === client) {
        clientRef.current = null; hostUserRef.current = null; remoteAudio.current = null;
        setHasVideo(false);
      }
      if (signedInRef.current) api.leave(streamId);
    };
  }, [live, loading, streamId, say, rtcSession, endShow]);

  // 2b. Live events: a watch-only guest socket until the viewer signs in, then their own
  useEffect(() => {
    if (!live || loading) return undefined;
    const token = signedIn ? getToken() : null;
    const socket = io(API, { auth: token ? { token } : { guest: true }, transports: ['websocket', 'polling'], reconnectionDelayMax: 5000 });
    socket.authed = Boolean(token);
    socketRef.current = socket;
    // Signed up mid-show: count them as a viewer now (the video keeps playing)
    if (signedIn && startedAsGuest.current) { startedAsGuest.current = false; api.join(streamId).catch(() => {}); }

    // Live events
    socket.on('connect', () => { setSocketUp(true); socket.emit('stream_notification_subscribe', { streamId }); recoveryRef.current?.refresh(); });
    socket.on('disconnect', () => setSocketUp(false));
    socket.on('connect_error', () => setSocketUp(false));
    socket.on('streamEnded', endShow);
    socket.on('stream_notification', (n) => {
      const d = n?.data || {};
      if (['auction_start', 'new_bid', 'auction_winner', 'auction_end', 'product_display', 'buy_now', 'stream_ended'].includes(n?.type)) recoveryRef.current?.invalidate();
      switch (n?.type) {
        case 'comment':
          push({ kind: 'comment', user: n.user, avatar: n.avatar, text: n.content, host: Boolean(n.data?.isHost) });
          break;
        case 'join':
          if (typeof d.viewerCount === 'number') setViewers(d.viewerCount);
          break;
        case 'auction_start':
          if (d.product) { patchItem(idOf(d.product), { ...d.product, bidStatus: 'active', isVisible: true }); setItems((l) => l.map((p) => (idOf(p) === idOf(d.product) ? p : { ...p, isVisible: false }))); }
          setOutbid(null);
          // Once per run of an item; a fresh run starts its bid count again
          if (d.product && !announced.current.has(`${idOf(d.product)}:${d.product.run || 1}`)) {
            announced.current.add(`${idOf(d.product)}:${d.product.run || 1}`);
            setBidCounts((m) => ({ ...m, [idOf(d.product)]: 0 }));
            myBidsRef.current = { ...myBidsRef.current, [idOf(d.product)]: 0 };
            setMyBids(myBidsRef.current);
            push({ kind: 'sys', text: `Bidding is open: ${d.product?.product?.name || 'new item'}` });
          }
          break;
        case 'new_bid': {
          const pid = d.product ? idOf(d.product) : '';
          if (d.product) patchItem(pid, { currentBid: d.bidAmount, currentBidder: d.currentBidder, bidStatus: d.product.bidStatus || 'active' });
          if (pid) setBidCounts((m) => ({ ...m, [pid]: (m[pid] || 0) + 1 }));
          // Someone else took the lead from me: my hold comes back to my wallet
          if (leadRef.current && d.buyerId && String(d.buyerId) !== String(myIdRef.current)) {
            setOutbid({ productId: pid, by: n.user || who(d.currentBidder), amount: myBidsRef.current[pid] || 0 });
            refreshWallet();
          }
          if (String(d.buyerId) === String(myIdRef.current)) setOutbid(null);
          push({ kind: 'bid', user: n.user, avatar: n.avatar, text: `bid ${naira(d.bidAmount)}` });
          break;
        }
        case 'auction_winner':
          if (d.product) patchItem(idOf(d.product), { bidStatus: 'ended', bidWinner: d.bidWinner });
          push({ kind: 'win', user: who(d.bidWinner?.buyer) || n.user, text: `won it for ${naira(d.bidWinner?.bidAmount)}` });
          break;
        case 'auction_end':
          if (d.product) patchItem(idOf(d.product), { bidStatus: 'ended' });
          break;
        case 'product_display':
          if (d.product) setItems((l) => l.map((p) => ({ ...p, isVisible: idOf(p) === idOf(d.product) })));
          setOutbid(null);
          break;
        case 'buy_now':
          if (d.productId) {
            setItems((l) => l.map((p) => (idOf(p) === String(d.productId) ? { ...p, product: { ...p.product, quantity: d.stockLeft } } : p)));
            setSoldCounts((m) => ({ ...m, [String(d.productId)]: (m[String(d.productId)] || 0) + (Number(d.quantity) || 1) }));
          }
          push({ kind: 'bid', user: n.user, avatar: n.avatar, text: n.content });
          break;
        case 'notes_updated':
          push({ kind: 'sys', text: n.content });
          break;
        case 'stream_ended':
          endShow();
          break;
        default:
      }
    });
    // Chat safety: a short notice instead of the hidden message
    socket.on('chat_hidden', (h) => push({ kind: 'hidden', text: h?.notice || 'A message was hidden' }));
    socket.on('chat_hidden_self', (h) => say('err', h?.message || 'Your message was hidden.', 6000));
    // The host changed the show notes: "Updated", one soft pulse
    socket.on('show_notes_updated', (u) => {
      setNotes((n) => ({ ...n, notes: u?.notes || null, firstLine: u?.firstLine || '' }));
      setNotesUpdated(true);
      window.clearTimeout(setNotesUpdated.t);
      setNotesUpdated.t = window.setTimeout(() => setNotesUpdated(false), 60000);
    });
    socket.on('viewer_joined_stream', (n) => { if (typeof n?.data?.viewerCount === 'number') setViewers(n.data.viewerCount); });
    socket.on('bid_timer_update', (t) => {
      if (!t?.productId) return;
      const pid = String(t.productId);
      const before = lastSecs.current[pid];
      // The timer went up while running: a late bid extended it
      if (typeof before === 'number' && before > 0 && t.secondsLeft > before) {
        setPlusSecs(t.secondsLeft - before);
        window.clearTimeout(setPlusSecs.t);
        setPlusSecs.t = window.setTimeout(() => setPlusSecs(0), 1500);
      }
      lastSecs.current[pid] = t.secondsLeft;
      setTimer((m) => ({ ...m, [pid]: t.secondsLeft }));
    });
    socket.on('bid_timer_complete', (t) => t?.productId && setTimer((m) => ({ ...m, [String(t.productId)]: 0 })));
    socket.on('bid_placed', (r) => {
      recoveryRef.current?.invalidate();
      setBusy(false);
      if (r?.product) {
        patchItem(idOf(r.product), r.product);
        const pid = idOf(r.product);
        myBidsRef.current = { ...myBidsRef.current, [pid]: r.product.currentBid };
        setMyBids(myBidsRef.current);
      }
      setOutbid(null);
      refreshWallet();
    });
    socket.on('bid_error', (r) => {
      setBusy(false);
      refreshWallet();
      // Not enough to hold this bid (plus the show's delivery deposit on a first item)
      if (r?.details?.totalRequired && /insufficient/i.test(r?.message || '')) {
        beginTopUpRef.current(r.details.totalRequired - (walletRef.current || 0), lastBidIntent.current);
        return;
      }
      // Delivery couldn't be priced for this buyer: fix the address in the one sheet
      if (r?.code === 'no_address' && lastBidRef.current) { setSheet({ type: 'onestep', action: { kind: 'bid', ...lastBidRef.current } }); return; }
      say('err', r?.message || 'Your bid did not go through. Nothing was held.');
    });
    socket.on('wallet_credited', (receipt) => receiveCreditRef.current(receipt));
    socket.on('wallet_dva_ready', (account) => {
      setTransfer((waiting) => waiting ? { ...waiting, ...account } : null);
      window.dispatchEvent(new CustomEvent('gbam:wallet_dva_ready', { detail: account }));
    });
    socket.on('auction_order_created', (r) => { setSheet({ type: 'won', name: r?.productName, amount: r?.amount, orderId: r?.orderId }); refreshWallet(); });
    socket.on('auction_order_error', () => { if (leadRef.current) { say('err', "We couldn't create your winning order. Your money is back in your wallet, and the host will sort it out.", 7000); refreshWallet(); } });

    return () => socket.disconnect();
  }, [live, loading, signedIn, streamId, push, patchItem, say, refreshWallet, endShow]);

  useEffect(() => {
    if (!debug) return undefined;
    const t = window.setInterval(() => {
      const tr = remoteAudio.current;
      if (!tr) return;
      const level = typeof tr.getVolumeLevel === 'function' ? tr.getVolumeLevel() : 0;
      setAudioDebug(`audio: ${tr.isPlaying ? 'playing' : 'NOT playing'} · level ${level.toFixed(2)}${soundUnlocked.current ? ' · unlocked' : ' · locked'}`);
    }, 1000);
    return () => window.clearInterval(t);
  }, [debug]);

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

  // Playback is restarted on the existing remote track after a foreground
  // transition. Keep the user's paused/audio-only choice through republishing.
  const restoreMedia = useCallback(async (restart = false) => {
    const client = clientRef.current;
    if (!client) return;
    if (client.connectionState === 'DISCONNECTED') { setRtcSession((n) => n + 1); return; }
    const user = client.remoteUsers?.find((u) => u.hasVideo) || hostUserRef.current;
    if (!user) return;
    hostUserRef.current = user;
    try {
      if (videoModeRef.current === 'on') {
        if (!user.videoTrack && user.hasVideo) await client.subscribe(user, 'video');
        if (videoModeRef.current !== 'on') return;
        if (user.videoTrack && stageRef.current) {
          if (restart) user.videoTrack.stop();
          user.videoTrack.play(stageRef.current, { fit: 'cover' });
          setHasVideo(true);
        }
      }
      if (soundUnlocked.current) remoteAudio.current?.play();
    } catch { setNeedsTap(true); }
  }, []);
  restoreMediaRef.current = restoreMedia;

  const setVideo = async (mode) => {
    const client = clientRef.current;
    const user = hostUserRef.current;
    setSheet(null);
    videoModeRef.current = mode;
    setVideoMode(mode);
    try {
      if (mode === 'audio' && client && user?.hasVideo) await client.unsubscribe(user, 'video');
      if (mode === 'paused') user?.videoTrack?.stop();
      if (mode === 'on') {
        soundUnlocked.current = true;
        await restoreMedia(true);
        recoveryRef.current?.refresh();
      }
    } catch { say('err', "Couldn't change the video. Try again."); }
  };

  const current = useMemo(() => items.find((p) => p.bidStatus === 'active') || items.find((p) => p.isVisible) || null, [items]);
  const isAuction = current && (current.bidStatus === 'active' || current.minBid > 0);
  const available = wallet?.availableBalance || 0;
  walletRef.current = available;
  const hasAddress = (buyer?.shippingAddresses || []).length > 0;
  const curId = current ? idOf(current) : '';
  const iLead = Boolean(current && buyer && String(current.currentBidder?._id || current.currentBidder) === String(buyer._id));
  const winnerId = current?.bidWinner ? String(current.bidWinner?.buyer?._id || current.bidWinner?.buyer) : '';
  const iWon = Boolean(winnerId && buyer && winnerId === String(buyer._id));
  myIdRef.current = buyer?._id;
  leadRef.current = Boolean(iLead || (current?.bidStatus !== 'active' && iWon));

  // The last auction I bid on and didn't win, so the next step is never a dead end
  const lostLast = useMemo(() => {
    const ended = items.filter((p) => p.bidStatus === 'ended' && myBids[idOf(p)]);
    const last = ended[ended.length - 1];
    if (!last || !buyer) return null;
    const won = String(last.bidWinner?.buyer?._id || last.bidWinner?.buyer || '') === String(buyer._id);
    return won ? null : last;
  }, [items, myBids, buyer]);
  const nextUp = useMemo(() => items.find((p) => p.bidStatus !== 'ended' && p.bidStatus !== 'active' && !p.isVisible && !(p.minBid === undefined && p.product?.quantity === 0)) || null, [items]);

  const deposit = depositDue; // null until Shipbubble has priced it for this buyer
  quoteItemRef.current = quoteItemId;

  // Bids go out on the buyer's own socket; after signing up mid-show, wait for it
  const authedSocket = () => new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const sock = socketRef.current;
      if (sock?.authed && sock.connected) return resolve(sock);
      if (Date.now() - t0 > 10000) return resolve(null);
      return window.setTimeout(tick, 100);
    };
    tick();
  });

  const beginTopUp = (need, action, buyerId = myIdRef.current) => {
    const productId = action?.productId || (action?.item ? idOf(action.item) : '');
    if ((methods.dva || methods.savedCards) && action && ['bid', 'buy'].includes(action.kind)) pendingIntent.current = { ...action, buyerId, streamId,
      productId, quantity: action.quantity || 1, run: action.run || action.item?.run || current?.run || 1 };
    setSheet({ type: 'topup', need });
  };
  beginTopUpRef.current = beginTopUp;
  const closeTopUp = () => {
    if (!fundingPending.current) pendingIntent.current = null;
    setSheet(null);
  };

  // Anything missing (account, address, money) is handled in one sheet, then the action runs
  const ready = (cost, action) => {
    if (signedIn && hasAddress && deposit !== null && cost + deposit <= available) return true;
    // Address saved but delivery can't be priced (e.g. the host's pickup address
    // is unfinished): say why instead of reopening the address form
    if (signedIn && hasAddress && deposit === null && deliveryProblem && !/your delivery address|phone number/i.test(deliveryProblem)) {
      say('err', deliveryProblem, 6000);
      return false;
    }
    const chosen = { ...action, run: action.run || action.item?.run || current?.run || 1 };
    // Priced and only short on money: top up over the show (transfer or saved card)
    if (signedIn && hasAddress && deposit !== null && (methods.dva || methods.savedCards)) beginTopUp(cost + deposit - available, chosen);
    else setSheet({ type: 'onestep', action: chosen });
    return false;
  };

  const sendBid = async (productId, bid, expectedRun) => {
    setBusy(true);
    const sock = await authedSocket();
    if (!sock) { setBusy(false); say('err', "Couldn't reach the show. Your bid wasn't placed. Try again."); return; }
    lastBidRef.current = { amount: bid, productId };
    lastBidIntent.current = { kind: 'bid', productId, amount: bid, run: current?.run || 1 };
    sock.emit('stream_place_bid', { streamId, productId, bidAmount: bid, ...(expectedRun === undefined ? {} : { expectedRun }) });
    window.setTimeout(() => setBusy(false), 8000);
  };

  const placeBid = (amount) => {
    if (!current || busy || reconnecting) return;
    const bid = Math.round(Number(amount));
    // Bids move in steps; the server checks this too
    if (bid < nextBidFor(current)) { say('err', `Bid at least ${naira(nextBidFor(current))}`); return; }
    // Holding the bid is checked on the server too; a lead bid is held, not charged
    if (!ready(bid - (iLead ? current.currentBid : 0), { kind: 'bid', amount: bid, productId: idOf(current) })) return;
    sendBid(idOf(current), bid);
  };

  const doBuy = async (item, quantity = 1, expected) => {
    const price = priceOf(item);
    setBusy(true);
    try {
      const r = await api.buyNow(streamId, idOf(item), quantity, expected);
      const left = typeof item.product?.quantity === 'number' ? item.product.quantity : null;
      setSheet({ type: 'yours', name: item.product?.name, amount: price * quantity, quantity, orderId: r.order?.orderId, deposit: r.delivery?.firstItem ? r.delivery?.depositHeld || 0 : 0, firstItem: Boolean(r.delivery?.firstItem), lastOf: left });
      refreshWallet();
    } catch (e) {
      const reason = e?.response?.data?.reason;
      if (reason === 'insufficient_funds') beginTopUp((e?.response?.data?.needed || price * quantity) - available, { kind: 'buy', item, amount: price * quantity, quantity });
      else if (reason === 'no_address') setSheet({ type: 'onestep', action: { kind: 'buy', amount: price * quantity, item, quantity } });
      else say('err', errorMessage(e, "Couldn't complete the purchase. You weren't charged."));
    } finally {
      setBusy(false);
    }
  };

  const fulfillIntent = async (intent) => {
    if (intent.streamId !== streamId) return;
    const intentItem = intent.productId || (intent.item ? idOf(intent.item) : quoteItemRef.current);
    const [scene, freshWallet, me] = await Promise.all([api.show(streamId), refreshWallet(), api.watchMe(streamId, intentItem)]);
    if (scene.status === 'ended') { endShow(); return; }
    setShow(scene); setItems(scene.products || []);
    const clocks = timersFor(scene.products || []);
    setTimer(clocks); lastSecs.current = clocks; setPlusSecs(0);
    applyMe(me);
    const decision = resolveWalletIntent(intent, scene, freshWallet?.availableBalance, Number(me.depositDue) || 0, myIdRef.current);
    if (decision.type === 'auto') {
      setSheet(null); setFundsOffer(null);
      if (decision.action.kind === 'bid') await sendBid(decision.action.productId, decision.action.amount, decision.action.run);
      else await doBuy(decision.action.item, decision.action.quantity, { expectedAmount: decision.action.amount, expectedRun: decision.action.run });
    } else {
      setSheet(null);
      setFundsOffer(decision.type === 'ask' ? decision.action : null);
      say('ok', decision.type === 'ask' ? 'Money’s in. Confirm your next move.' : 'Money’s in. Pick an item when you’re ready.', 7000);
    }
  };
  receiveCreditRef.current = async (receipt) => {
    if (!receipt?.reference || creditedRefs.current.has(receipt.reference)) return;
    creditedRefs.current.add(receipt.reference);
    window.dispatchEvent(new CustomEvent('gbam:wallet_credited', { detail: receipt }));
    const intent = fundingPending.current ? pendingIntent.current : null;
    if (intent) pendingIntent.current = null;
    fundingPending.current = false; setTransfer(null);
    say('ok', `${naira(receipt.amount)} ${receipt.source === 'transfer' ? 'received' : 'added'}`);
    try { if (intent) await fulfillIntent(intent); else await refreshWallet(); }
    catch { say('ok', 'Money’s in. Check your wallet, then choose your bid.', 7000); }
  };
  useEffect(() => {
    if (!transfer?.since) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const account = await api.dva(transfer.since);
        if (!active) return;
        setTransfer((waiting) => waiting ? { ...waiting, ...account } : waiting);
        if (account.latestCredit) receiveCreditRef.current(account.latestCredit);
      } catch { /* funds remain safe on the server; retry next poll */ }
    };
    const timer = setInterval(poll, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [transfer?.since]);

  const buyNow = (item, quantity = 1) => {
    if (busy || reconnecting) return;
    if (!ready(priceOf(item) * quantity, { kind: 'buy', amount: priceOf(item) * quantity, item, quantity })) return;
    doBuy(item, quantity);
  };

  const sendChat = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content) return;
    // Guests read chat; posting needs an account (no payment)
    if (!signedIn) { setSheet({ type: 'onestep', action: { kind: 'chat' } }); return; }
    const sock = await authedSocket();
    if (!sock) { say('err', "Couldn't send. Check your connection."); return; }
    sock.emit('stream_comment', { streamId, content: content.slice(0, 300) });
    setText('');
    chatInputRef.current?.blur(); // sent: put the show back
  };

  // After the one-step sheet: do what the viewer tapped
  const afterOneStep = async (action) => {
    setSheet(null);
    if (action.kind === 'bid') await sendBid(action.productId, action.amount);
    else if (action.kind === 'buy') await doBuy(action.item, action.quantity);
    else if (action.kind === 'chat') say('ok', "You're in. Say hi.");
    else if (action.kind === 'account') setSheet({ type: 'topup', need: 0 });
    else if (action.kind === 'follow') await follow(true);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: show?.title, url });
      else { await navigator.clipboard.writeText(url); say('ok', 'Link copied'); }
    } catch { /* cancelled */ }
  };

  const follow = async (justSignedIn = false) => {
    const sellerId = show?.seller?._id;
    if (!sellerId) return;
    if (!signedIn && !justSignedIn) { setSheet({ type: 'onestep', action: { kind: 'follow' } }); return; }
    try {
      await api.follow(sellerId);
      setFollowing(true);
      say('ok', `Following ${show?.seller?.storeName || 'this host'}. We'll show you their next show.`);
    } catch (e) {
      say('err', errorMessage(e, "Couldn't follow right now. Try again."));
    }
  };

  const sendReport = async () => {
    if (!reportState.reason) return;
    if (!signedIn) { navigate(`/signin?next=/live/${streamId}`); return; }
    setReportState((r) => ({ ...r, sending: true }));
    try {
      const r = await api.report(streamId, reportState.reason);
      setReportState({ reason: '', sending: false, done: r?.message || 'Thanks. Our team will look at this show.' });
    } catch (e) {
      setReportState((r) => ({ ...r, sending: false }));
      say('err', errorMessage(e, "Couldn't send the report. Try again."));
    }
  };

  const host = show?.seller || {};
  const hostName = host.storeName || host.businessName || 'Host';
  const secs = current ? timer[curId] : undefined;
  const pricePulse = usePulse(current?.currentBid);
  const nextBid = current ? nextBidFor(current) : 0;
  const bids = bidCounts[curId] || 0;
  const reconnecting = phase === 'watching' && (!online || !socketUp || syncState !== 'ready' || ['RECONNECTING', 'DISCONNECTED'].includes(agoraState));

  // One line that says what just changed for me
  let stateLine = null;
  if (current && isAuction && current.bidStatus === 'active') {
    if (iLead) stateLine = { tone: 'good', text: "You're winning" };
    else if (outbid && outbid.productId === curId) stateLine = { tone: 'bad', text: `${outbid.by} outbid you.${outbid.amount ? ` Your ${naira(outbid.amount)} is back in your wallet.` : ' Your money is back in your wallet.'}` };
  } else if (current && current.bidStatus === 'ended') {
    stateLine = iWon ? { tone: 'good', text: `You won · ${naira(current.bidWinner?.bidAmount)}` } : current.bidWinner?.bidAmount ? { tone: 'plain', text: `Sold · ${who(current.bidWinner?.buyer)} won` } : { tone: 'plain', text: 'Not sold' };
  }
  const stateBadge = current?.bidStatus === 'ended' ? (current.bidWinner?.bidAmount ? 'Sold' : null) : iLead ? 'You lead' : outbid?.productId === curId ? 'Outbid' : null;

  // ---------- not live / not signed in ----------
  if (phase === 'loading' || loading) return <div className="app"><Header back="/" /><div className="center"><span className="mut">Loading the show…</span></div></div>;
  if (phase === 'error') return <div className="app"><Header back="/" /><div className="center"><div className="card empty"><span className="f" style={{ fontSize: 18 }}>{loadError}</span><Link to="/" className="btn2">See other shows</Link></div></div></div>;
  if (phase === 'ended' || show?.status === 'ended') return (
    <div className="app ended-show">
      <Header back="/" title="Show ended" />
      <main className="ended-content">
        {show?.coverImage?.url && <img className="ended-cover" src={show.coverImage.url} alt="" />}
        <span className="pill p-draft">SHOW ENDED</span>
        <h1 className="h1">That’s a wrap!</h1>
        <p>{hostName} has ended the show.</p>
        {signedIn && <Link to="/orders" className="btn">See your orders</Link>}
        <Link to="/" className="btn2">Discover live shows</Link>
        {!following && host._id && <button type="button" className="link" onClick={() => follow()}>Follow {hostName}</button>}
      </main>
    </div>
  );
  if (show && show.status !== 'live') {
    const scheduled = show?.status === 'scheduled';
    // A show in the host's weekly slot gets a repeating invite: "Add every Saturday to calendar"
    const slot = hostStats?.slot;
    const lagos = show?.scheduledStartTime ? new Date(new Date(show.scheduledStartTime).getTime() + 3600000) : null;
    const inSlot = Boolean(slot && lagos && lagos.getUTCDay() === slot.day && `${String(lagos.getUTCHours()).padStart(2, '0')}:${String(lagos.getUTCMinutes()).padStart(2, '0')}` === slot.time);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot?.day] || '';
    const calendar = scheduled && show?.scheduledStartTime
      ? showEvent({ title: inSlot ? `${host.storeName || host.businessName || 'Live show'} live` : show.title, host: inSlot ? '' : host.storeName || host.businessName, start: show.scheduledStartTime, url: window.location.href, weekly: inSlot })
      : null;
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
            {scheduled && deliveryLine(estimate) && <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{deliveryLine(estimate)}</p>}
          </div>
          {phase === 'ended' || show?.status === 'ended' ? (
            <p style={{ margin: 0, fontWeight: 700 }}>This show has ended. Follow the host so you don't miss the next one.</p>
          ) : wentLive ? (
            <button type="button" className="btn" style={{ minHeight: 56 }} onClick={() => window.location.reload()}>Watch now</button>
          ) : scheduled && calendar ? (
            <>
              <a className="btn" style={{ minHeight: 56 }} href={icsHref(calendar)} download="show.ics">{inSlot ? `Add every ${dayName} to calendar` : 'Add to calendar'}</a>
              <a className="link" style={{ alignSelf: 'center' }} href={googleCalendarUrl(calendar)} target="_blank" rel="noreferrer">Or add it to Google Calendar</a>
              <span className="hint" style={{ textAlign: 'center' }}>No account needed to watch. Come back to this link when it starts.</span>
            </>
          ) : null}
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
  const auctionLive = current && isAuction && current.bidStatus === 'active';
  const stock = current?.product?.quantity;
  const sold = soldCounts[curId] || 0;
  const miniAction = auctionLive
    ? <button type="button" className="btn btn-sm" disabled={busy || reconnecting} onClick={() => placeBid(nextBid)}>Bid {naira(nextBid)}</button>
    : current && !isAuction && stock !== 0
      ? <button type="button" className="btn btn-sm" disabled={busy || reconnecting} onClick={() => buyNow(current)}>Buy</button>
      : null;
  const miniState = stateBadge || (auctionLive ? plural(bids, 'bid') : null);
  const mini = <MiniBidBar current={current} secs={secs} state={miniState} action={miniAction} />;
  const miniBare = <MiniBidBar current={current} secs={secs} state={miniState} />;

  const composer = (
    <form className="composer2" onSubmit={sendChat}>
      <label htmlFor="w-chat" className="sr">Say something</label>
      <input
        id="w-chat"
        ref={chatInputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setTyping(true)}
        // A short wait lets a tap on Send land before the panel comes back
        onBlur={() => window.setTimeout(() => setTyping(false), 120)}
        maxLength={300}
        placeholder="Say something…"
        autoComplete="off"
        enterKeyHint="send"
      />
      {text.trim() && <button type="submit" className="round send" aria-label="Send" onMouseDown={(e) => e.preventDefault()}>{Icon.send}</button>}
    </form>
  );
  const deskComposer = (
    <form className="composer2" onSubmit={sendChat}>
      <label htmlFor="w-chat-desk" className="sr">Say something</label>
      <input id="w-chat-desk" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Say something…" autoComplete="off" />
      {text.trim() && <button type="submit" className="round send" aria-label="Send">{Icon.send}</button>}
    </form>
  );

  return (
    <div
      className={`watch${typing ? ' typing' : ''}`}
      style={{ '--kb-bottom': `${typing ? keyboard.bottom : 0}px`, '--vv-top': `${typing ? keyboard.top : 0}px` }}
    >
      <aside className="w-side w-items" aria-label="Items in this show">
        <h2 className="h2">Items in this show · {items.length}</h2>
        <ItemsList items={items} current={current} buyerId={buyer?._id} busy={busy} onBuy={buyNow} />
      </aside>

      <section className="w-center">
        <div ref={stageRef} className="stage" aria-label="Live video" />
        {(!hasVideo || videoMode !== 'on') && (
          <div className="stage-msg" style={show?.coverImage?.url ? { backgroundImage: `linear-gradient(rgba(15,21,18,.55),rgba(15,21,18,.75)),url(${show.coverImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {videoMode === 'on' && <span className="dt" aria-hidden="true" style={{ background: '#fff' }} />}
            <span className="f" style={{ fontSize: 16 }}>
              {videoMode === 'audio' ? 'Audio only' : videoMode === 'paused' ? 'Video paused to save data' : phase === 'joining' ? 'Joining the show…' : 'Waiting for the host’s video…'}
            </span>
            {videoMode !== 'on' && (
              <>
                <span className="stage-hint">Bids and chat stay live</span>
                <button type="button" className="btn2 on-dark" onClick={() => setVideo('on')}>{Icon.play}Show the host again</button>
              </>
            )}
          </div>
        )}

        <div className="overlay-top">
          <div className="host">
            <span className="av2">{host.storeAvatar?.url ? <img src={host.storeAvatar.url} alt="" /> : hostName.slice(0, 1)}</span>
            <span className="host-tx">
              <span className="host-nm">{hostName}</span>
              <span className="host-sub">{[hostStats && !hostStats.isNew ? `★ ${hostStats.rating.toFixed(1)}` : 'New host', shipsLine(hostStats?.shipsInDays)].filter(Boolean).join(' · ')}</span>
            </span>
            {!following && show?.seller?._id && <button type="button" className="follow" onClick={() => follow()}>Follow</button>}
          </div>
          <span className="livecount" aria-label={`Live, ${viewers} watching`}><b>LIVE</b>{viewers}</span>
        </div>
        {notes.notes && (
          <button type="button" className={`pinned${notesUpdated ? ' pulse-once' : ''}`} onClick={() => { setNotesUpdated(false); setSheet({ type: 'notes' }); }}>
            {Icon.pin}
            <span className="pinned-tx"><b>Show notes</b> · {notes.firstLine}</span>
            {notesUpdated && <span className="upd">Updated</span>}
            <span className="pinned-go" aria-hidden="true">›</span>
          </button>
        )}

        {reconnecting && (
          <div className="reconnect" role="status">
            <span className="connection-dot" aria-hidden="true" />
            <span>{!online ? 'You’re offline' : syncState === 'failed' ? 'Couldn’t refresh the show' : 'Reconnecting…'}</span>
            <button type="button" onClick={() => { recoveryRef.current?.refresh(); socketRef.current?.connect(); restoreMedia(true); }}>Retry</button>
          </div>
        )}
        {debug && <div className="dbg">{audioDebug}</div>}
        {needsTap && !reconnecting && (
          <button type="button" className="btn tap-sound" onClick={() => { soundUnlocked.current = true; remoteAudio.current?.play(); setNeedsTap(false); }}>
            {Icon.sound}Tap for sound
          </button>
        )}


        <div className="bottom">
          {/* Chat on the left, the side rail on the right; Items lines up with the input */}
          <div className="chatzone">
            <div className="chatcol w-phone">
              <ChatFeed feed={feed} />
              {composer}
            </div>
            <nav className="rail" aria-label="Show actions">
              <RailButton label="More" onClick={() => setSheet({ type: 'more' })}>{Icon.more}</RailButton>
              <RailButton label="Share" onClick={share}>{Icon.share}</RailButton>
              <RailButton label="Wallet" onClick={() => setSheet(signedIn ? { type: 'topup', need: 0 } : { type: 'onestep', action: { kind: 'account' } })}>{Icon.wallet}</RailButton>
              <RailButton label={`Items · ${items.length}`} onClick={() => setSheet({ type: 'items' })}>
                {current && imageOf(current) ? <img src={imageOf(current)} alt="" className="rail-img" /> : <span className="rail-count">{items.length}</span>}
              </RailButton>
            </nav>
          </div>

          <div className="panel">
          {transfer && <button type="button" className="btn2 on-dark btn-sm" onClick={() => setSheet({ type: 'topup', need: 0, bank: transfer })}>Waiting for your transfer{transfer.accountNumber ? ` · ${transfer.accountNumber}` : ' · setting up'}</button>}
          {fundsOffer && <button type="button" className="btn btn-sm" onClick={async () => {
            try {
              const w = await refreshWallet();
              if ((w?.availableBalance || 0) < fundsOffer.amount + deposit) { beginTopUp(fundsOffer.amount + deposit - (w?.availableBalance || 0), fundsOffer); return; }
              await fulfillIntent(fundsOffer);
            } catch { say('err', 'Couldn’t reach the show. Try again.'); }
          }}>Money’s in. {fundsOffer.kind === 'bid' ? 'Bid' : 'Buy for'} {naira(fundsOffer.amount)}?</button>}
          {toast && <div className={`toast-line ${toast.kind}`} role="status">{toast.msg}</div>}
          {stateLine && <div className={`state ${stateLine.tone}`} role="status">{stateLine.text}</div>}

          {current ? (
            <>
              <div className="now">
                <ItemThumb item={current} size={38} />
                <div className="now-tx">
                  <span className="now-nm">{current.product?.name}</span>
                  {current.runNote && <span className="now-note">{current.runNote}</span>}
                  <span className="now-meta">
                    {auctionLive
                      ? `${typeof stock === 'number' && stock > 1 ? `${stock} of ${stock + sold} left · ` : ''}${plural(bids, 'bid')}${LATE_BID_SECONDS ? ` · late bids add ${LATE_BID_SECONDS}s` : ''}`
                      : !isAuction && typeof stock === 'number'
                        ? `${stock} of ${stock + sold} left${sold ? ` · ${sold} sold` : ''}`
                        : current.bidStatus === 'ended' ? plural(bids, 'bid') : `Starts at ${naira(current.minBid)}`}
                  </span>
                </div>
              </div>
              <div className="price-row">
                <span className={`f price${pricePulse ? ' pulse' : ''}`}>{naira(isAuction ? (current.currentBid > 0 ? current.currentBid : current.minBid) : priceOf(current))}</span>
                {stateBadge && <span className={`badge ${stateBadge === 'Outbid' ? 'bad' : ''}`}>{stateBadge}</span>}
                <span className="grow" />
                {auctionLive && <Timer secs={secs} plus={plusSecs} />}
              </div>

              {(auctionLive || (!isAuction && stock !== 0)) && deliveryLine(estimate) && <span className="now-meta">{deliveryLine(estimate)}</span>}
              {auctionLive && (
                <div className="bidrow">
                  <button type="button" className="btn2 on-dark" disabled={busy || reconnecting} onClick={() => setSheet({ type: 'bid' })}>Bid more</button>
                  <button type="button" className="btn two-line" disabled={busy || reconnecting} onClick={() => placeBid(nextBid)}>
                    <span>{busy ? 'Bidding…' : `Bid ${naira(nextBid)}`}</span>

                  </button>
                </div>
              )}
              {!isAuction && (
                <div className="bidrow">
                  <button type="button" className="btn two-line" disabled={busy || reconnecting || stock === 0} onClick={() => buyNow(current)}>
                    {stock === 0 ? <span>Sold out</span> : <><span>{busy ? 'Buying…' : `Buy now · ${naira(priceOf(current))}`}</span></>}
                  </button>
                </div>
              )}
              {current.bidStatus === 'ended' && nextUp && (
                <div className="upnext">
                  {!iWon && myBids[curId] && <span className="un-lead">Not this one. Up next in a moment:</span>}
                  <UpNextRow item={nextUp} onClick={() => setSheet({ type: 'items' })} />
                </div>
              )}
            </>
          ) : (
            <div className="upnext">
              <span className="un-lead">{lostLast ? 'Not this one. Up next in a moment:' : nextUp ? `${hostName} is getting it ready…` : `${hostName} is getting the next item ready…`}</span>
              {nextUp && <UpNextRow item={nextUp} onClick={() => setSheet({ type: 'items' })} />}
            </div>
          )}
          </div>
        </div>
      </section>

      <aside className="w-side w-chat" aria-label="Chat">
        <h2 className="h2">Chat</h2>
        <ChatFeed feed={feed} className="light" />
        {deskComposer}
      </aside>

      {sheet?.type === 'topup' && <TopUpSheet need={sheet.need} methods={methods} initialBank={sheet.bank} onClose={closeTopUp}
        onPending={() => { fundingPending.current = true; }} onCancelled={() => { fundingPending.current = false; }}
        onWaiting={(account) => { if (['active', 'pending'].includes(account.status)) { fundingPending.current = true; setTransfer(account); } else if (account.status === 'failed') { fundingPending.current = false; setTransfer(null); } }}
        onDone={(reference, amount, source) => receiveCreditRef.current({ reference, amount, source })} />}
      {sheet?.type === 'onestep' && (
        <OneStepSheet action={sheet.action} deposit={deposit} quote={estimate} productId={sheet.action.productId || (sheet.action.item ? idOf(sheet.action.item) : quoteItemId)} top={sheet.action.kind === 'chat' ? null : miniBare} streamId={streamId} topUpMethods={methods} onTopUpNeeded={beginTopUp} onClose={() => setSheet(null)} onReady={() => afterOneStep(sheet.action)} />
      )}
      {sheet?.type === 'address' && <AddressSheet top={mini} onClose={() => setSheet(null)} onSaved={async () => { setSheet(null); await refresh(); say('ok', 'Address saved. You can bid and buy now.'); }} />}
      {sheet?.type === 'bid' && current && (
        <BidMoreSheet current={current} top={miniBare} onClose={() => setSheet(null)} onPlace={(v) => { setSheet(null); placeBid(v); }} />
      )}
      {sheet?.type === 'items' && (
        <Sheet title={`Items in this show · ${items.length}`} top={mini} onClose={() => setSheet(null)}>
          <ItemsList items={items} current={current} buyerId={buyer?._id} busy={busy} onBuy={buyNow} />
        </Sheet>
      )}
      {(sheet?.type === 'won' || sheet?.type === 'yours') && (
        <Sheet className={`purchase-sheet${sheet.type === 'won' ? ' won-sheet' : ''}`} title={sheet.type === 'won' ? 'You won!' : "It’s yours!"} onClose={() => setSheet(null)}>
          <div className="win-burst" aria-hidden="true">
            <span className="win-trophy">★</span>
            {sheet.type === 'won' && Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
          </div>
          <div className="purchase-item">
            <span>{sheet.name}{sheet.quantity > 1 ? ` × ${sheet.quantity}` : ''}</span>
            <strong>{naira(sheet.amount)}</strong>
            <small>Paid from your wallet ✓</small>
          </div>
          <p className="purchase-delivery">{sheet.type === 'yours' && !sheet.firstItem
            ? 'Ships with your other items. No extra delivery fee.'
            : estimate?.available ? `Delivery to ${estimate.area}: ${naira(estimate.amount)} (Shipbubble) · one fee per show`
              : 'Your items ship together · one delivery fee'}{sheet.deposit ? ` · ${naira(sheet.deposit)} held` : ''}</p>
          <button type="button" className="btn" onClick={() => setSheet(null)}>Keep watching</button>
          <div className="purchase-links">
            <Link to="/orders" className="link">View order</Link>
            {!following && show?.seller?._id && <button type="button" className="link" onClick={() => follow()}>Follow host</button>}
          </div>
        </Sheet>
      )}

      {sheet?.type === 'notes' && notes.notes && (
        <Sheet title="Show notes" top={mini} onClose={() => setSheet(null)}>
          {(notes.sections.length ? notes.sections : [['howToBuy', 'How to buy'], ['delivery', 'Delivery'], ['payment', 'Payment and safety'], ['sizes', 'Sizes and returns'], ['fromSeller', 'From the seller']])
            .filter(([k]) => notes.notes[k])
            .map(([k, label]) => (
              <section key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="cap">{label.toUpperCase()}</span>
                <span>{notes.notes[k]}</span>
              </section>
            ))}
          <span className="hint">From {hostName}. Pinned for this show.</span>
        </Sheet>
      )}
      {sheet?.type === 'more' && (
        <Sheet title="More" top={mini} onClose={() => setSheet(null)}>
          <div className="menu">
            {videoMode === 'audio'
              ? <button type="button" className="menu-row" onClick={() => setVideo('on')}>{Icon.play}Turn the video back on</button>
              : <button type="button" className="menu-row" onClick={() => setVideo('audio')}>{Icon.sound}Audio only<span className="mut">Saves data</span></button>}
            {videoMode === 'paused'
              ? <button type="button" className="menu-row" onClick={() => setVideo('on')}>{Icon.play}Play video</button>
              : videoMode === 'on' && <button type="button" className="menu-row" onClick={() => setVideo('paused')}>{Icon.pause}Pause video</button>}
            <button type="button" className="menu-row" onClick={() => { setReportState({ reason: '', sending: false, done: '' }); setSheet({ type: 'report' }); }}>{Icon.flag}Report this show</button>
            <button type="button" className="menu-row" onClick={() => navigate('/')}>{Icon.back}Leave the show</button>
          </div>
        </Sheet>
      )}
      {sheet?.type === 'report' && (
        <Sheet title="Report this show" top={mini} onClose={() => setSheet(null)}>
          {reportState.done ? (
            <>
              <p style={{ margin: 0 }}>{reportState.done}</p>
              <button type="button" className="btn" onClick={() => setSheet(null)}>Back to the show</button>
            </>
          ) : (
            <>
              <p className="mut" style={{ margin: 0 }}>What's wrong? The host won't see who reported.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="Reason">
                {REPORT_REASONS.map((r) => <button key={r} type="button" className={`chip${reportState.reason === r ? ' on' : ''}`} aria-pressed={reportState.reason === r} onClick={() => setReportState((s) => ({ ...s, reason: r }))}>{r}</button>)}
              </div>
              <button type="button" className="btn" disabled={!reportState.reason || reportState.sending} onClick={sendReport}>{reportState.sending ? 'Sending…' : 'Send report'}</button>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}
