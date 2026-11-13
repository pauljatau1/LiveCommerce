import { usePickupArea, PickupAreaBanner } from './ServiceArea';
// Go Live (design: S-GoLive-Check). Pick a show, check camera and mic, go live.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';
import { Icon, Empty, Problem, Skeleton, TopBar } from './ui';
import { releaseStream } from './localMedia';
import ShareSheet from './ShareSheet';

function GoLiveOriginal() {
  const navigate = useNavigate();
  const [shows, setShows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { studio.shows().then((r) => setShows(r.shows)).catch((e) => setError(errorText(e, "Couldn't load your shows."))); }, []);
  return (
    <main className="st-main" style={{ maxWidth: 720 }}>
      <h1 className="f" style={{ margin: 0, fontSize: 'var(--t-display)' }}>Go live</h1>
      {error && <Problem text={error} />}
      {!shows && !error && <><Skeleton h={80} /><Skeleton h={80} /></>}
      {shows && !shows.length && <Empty icon={Icon.live('var(--primary)', 32)} title="No show planned" text="Pick the items you'll sell and choose auction or drop. It takes a minute." action={<Link to="/studio/plan" className="btn">Plan a show</Link>} />}
      {shows && shows.map((s) => (
        <button key={s._id} type="button" className="st-row" onClick={() => navigate(s.status === 'live' ? `/studio/live/${s._id}` : `/studio/golive/${s._id}`)}>
          {s.images[0] ? <img src={s.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="cap">{s.status === 'live' ? 'LIVE NOW' : when(s.scheduledStartTime).toUpperCase()} · {s.type === 'drop' ? 'DROP' : 'AUCTION'} · {s.itemCount} ITEMS</span>
            <span style={{ fontWeight: 'var(--w-medium)' }}>{s.title}</span>
          </span>
          {s.status === 'live' ? <span className="pill p-live">● Live</span> : Icon.chevron('var(--text-muted)')}
        </button>
      ))}
      {shows && shows.length > 0 && <Link to="/studio/plan" className="btn2">Plan another show</Link>}
    </main>
  );
}

function Check({ showId }) {
  const area=usePickupArea();
  const navigate = useNavigate();
  const video = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [camError, setCamError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [level, setLevel] = useState(0);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    studio.show(showId).then((r) => {
      if (r.show.status === 'live') navigate(`/studio/live/${showId}`, { replace: true });
      else if (r.show.status === 'ended') navigate(`/studio/recap/${showId}`, { replace: true });
      else setData(r);
    }).catch((e) => setError(errorText(e, "Couldn't load this show.")));
  }, [showId, navigate]);

  const stop = useCallback(() => {
    requestRef.current += 1;
    releaseStream(streamRef.current);
    streamRef.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  const open = useCallback(async (camId, mId) => {
    stop();
    const request = requestRef.current;
    setCamError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mId ? { deviceId: { exact: mId } } : true,
      });
      if (request !== requestRef.current) { releaseStream(s); return; }
      streamRef.current = s;
      if (video.current) video.current.srcObject = s;
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (request !== requestRef.current) return;
      setCameras(devices.filter((d) => d.kind === 'videoinput'));
      setMics(devices.filter((d) => d.kind === 'audioinput'));
      setCameraId(s.getVideoTracks()[0]?.getSettings().deviceId || camId || '');
      setMicId(s.getAudioTracks()[0]?.getSettings().deviceId || mId || '');
    } catch (e) {
      if (request !== requestRef.current) return;
      setCamError(e?.name === 'NotAllowedError'
        ? 'Camera or microphone is blocked. Allow them for this site in your browser settings (the lock icon by the address), then try again.'
        : "Couldn't start your camera. Close other apps using it and try again.");
    }
  }, [stop]);

  useEffect(() => { open(); return stop; }, [open, stop]);

  // Simple mic level meter
  useEffect(() => {
    const s = streamRef.current;
    if (!s || !s.getAudioTracks().length || !window.AudioContext) return undefined;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(s).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let raf;
    const tick = () => { analyser.getByteFrequencyData(buf); setLevel(Math.min(1, buf.reduce((a, b) => a + b, 0) / buf.length / 60)); raf = requestAnimationFrame(tick); };
    tick();
    return () => { cancelAnimationFrame(raf); ctx.close().catch(() => {}); };
  }, [cameraId, micId]);

  const first = data?.items?.[0];
  const go = () => { if(area.allowed!==true)return;stop(); navigate(`/studio/live/${showId}`, { state: { cameraId, micId } }); };

  return (
    <div className="studio-app">
      <TopBar title={area.allowed===false?'Go live':'Ready to go live?'} sub={area.allowed===false?null:data?.show?.title} backTo="/studio/golive" right={area.allowed!==false && data?.show?.link && <button type="button" className="btn2" onClick={() => setSharing(true)}>{Icon.share}Share</button>} />
      <div className="st-inner" style={{ paddingBottom: 120 }}>
        {error && <Problem text={error} />}
        <div style={{ position: 'relative', height:area.allowed===false?300:'min(56vh, 420px)', borderRadius: 24, overflow: 'hidden', background: '#2A2F2C' }}>
          <video ref={video} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {area.allowed===false&&<span className="pickup-preview-label">Camera preview</span>}
          {camError && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, color: '#fff', textAlign: 'center' }}><span>{camError}</span><button type="button" className="btn2" onClick={() => open()}>Try again</button></div>}
          {!camError && area.allowed!==false && <span aria-label="Microphone level" style={{ position: 'absolute', left: 12, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 3, height: 22, padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,.95)' }}>
            {[0.15, 0.35, 0.55, 0.75].map((t) => <i key={t} style={{ width: 4, height: 6 + t * 12, background: level > t ? 'var(--primary)' : 'var(--border-strong)', borderRadius: 2 }} />)}
          </span>}
        </div>
        {area.allowed===false?<span className="cap">{data?.show?.title} · {data?.items?.length || 0} {data?.items?.length===1?'ITEM':'ITEMS'} · {data?.show?.type==='drop'?'DROP':'AUCTION'}</span>:<>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cameras.length > 1 && (
            <div className="fl" style={{ flex: '1 1 160px' }}><label className="lab" htmlFor="cam">Camera</label>
              <select id="cam" className="sel" style={{ height: 48 }} value={cameraId} onChange={(e) => open(e.target.value, micId)}>{cameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}</select>
            </div>
          )}
          {mics.length > 1 && (
            <div className="fl" style={{ flex: '1 1 160px' }}><label className="lab" htmlFor="mic">Mic</label>
              <select id="mic" className="sel" style={{ height: 48 }} value={micId} onChange={(e) => open(cameraId, e.target.value)}>{mics.map((m, i) => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${i + 1}`}</option>)}</select>
            </div>
          )}
        </div>
        {first && (
          <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            {first.image ? <img src={first.image} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><span className="cap">FIRST UP · 1 OF {data.items.length} · {data.show.type === 'drop' ? 'DROP' : 'AUCTION'}</span><span style={{ fontWeight: 'var(--w-medium)' }}>{first.name} · {data.show.type === 'drop' ? naira(first.price) : `bids from ${naira(first.minBid)}`}</span></div>
          </div>
        )}
        {data && <div className="bot"><span className="av" aria-hidden="true" /><div className="bub" style={{ fontSize: 'var(--t-body)' }}>{data.show.type === 'drop' ? 'Once live, tap an item to put it on sale. Buyers tap Buy now.' : 'Once live, tap an item, then Start bidding. Each auction runs 30 seconds.'}</div></div>}
        </>}
      </div>
      <div data-keyboard-bar style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px max(18px, env(safe-area-inset-bottom))', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        {area.allowed===false?<div className="pickup-live-block"><p>Update your pickup address to go live.</p><p className="mut">Your pickup address is in {area.address?.state || 'a state outside our service area'}. We deliver within {area.config.states.join(' and ')} for now, so couriers can't collect from there yet.</p><Link className="btn" to="/studio/pickup" state={{from:`/studio/golive/${showId}`}}>Update pickup address</Link></div>:<button type="button" className="btn" style={{  fontSize: 'var(--t-h2)', background: 'var(--live)', width: '100%', maxWidth: 688, margin: '0 auto' }} disabled={!data || Boolean(camError) || area.allowed!==true} onClick={go}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />Go live
        </button>}
      </div>
      {sharing && <ShareSheet show={data.show} onClose={() => setSharing(false)} />}
    </div>
  );
}

function GoLiveCheckOriginal() {
  const { showId } = useParams();
  return <Check showId={showId} />;
}

// The original full-page gate is retained for rollback.
const LEGACY_FULL_PAGE_AREA_GATE=false;

function ServiceAreaGate({children}) { const area=usePickupArea(); const navigate=useNavigate(); if(area.error) return <div className="studio-app"><div className="st-inner"><Problem text={area.error} onRetry={() => location.reload()} /></div></div>; if(area.allowed === null) return <div className="studio-app"><div className="st-inner" role="status">Checking pickup address…</div></div>; if(LEGACY_FULL_PAGE_AREA_GATE&&!area.allowed) return <div className="studio-app"><TopBar title="Go live" backTo="/studio" /><div className="st-inner"><PickupAreaBanner config={area.config} primary /></div></div>; return children; }
export default function GoLive() { return <ServiceAreaGate><GoLiveOriginal /></ServiceAreaGate>; }
export function GoLiveCheck() { return <ServiceAreaGate><GoLiveCheckOriginal /></ServiceAreaGate>; }
