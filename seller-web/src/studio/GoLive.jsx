// Go Live (design: S-GoLive-Check). Pick a show, check camera and mic, go live.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studio, errorText, naira, when } from './api';
import { Icon, Empty, Problem, Skeleton, TopBar } from './ui';

function ShowPicker() {
  const navigate = useNavigate();
  const [shows, setShows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { studio.shows().then((r) => setShows(r.shows)).catch((e) => setError(errorText(e, "Couldn't load your shows."))); }, []);
  return (
    <main className="st-main" style={{ maxWidth: 720 }}>
      <h1 className="f" style={{ margin: 0, fontSize: 26 }}>Go live</h1>
      {error && <Problem text={error} />}
      {!shows && !error && <><Skeleton h={80} /><Skeleton h={80} /></>}
      {shows && !shows.length && <Empty icon={Icon.live('var(--primary)', 32)} title="No show planned" text="Pick the items you'll sell and choose auction or drop. It takes a minute." action={<Link to="/studio/plan" className="btn">Plan a show</Link>} />}
      {shows && shows.map((s) => (
        <button key={s._id} type="button" className="st-row" onClick={() => navigate(s.status === 'live' ? `/studio/live/${s._id}` : `/studio/golive/${s._id}`)}>
          {s.images[0] ? <img src={s.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="cap">{s.status === 'live' ? 'LIVE NOW' : when(s.scheduledStartTime).toUpperCase()} · {s.type === 'drop' ? 'DROP' : 'AUCTION'} · {s.itemCount} ITEMS</span>
            <span style={{ fontWeight: 800 }}>{s.title}</span>
          </span>
          {s.status === 'live' ? <span className="pill p-live">● Live</span> : Icon.chevron('var(--text-muted)')}
        </button>
      ))}
      {shows && shows.length > 0 && <Link to="/studio/plan" className="btn2">Plan another show</Link>}
    </main>
  );
}

function Check({ showId }) {
  const navigate = useNavigate();
  const video = useRef(null);
  const streamRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [camError, setCamError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [level, setLevel] = useState(0);

  useEffect(() => {
    studio.show(showId).then((r) => {
      if (r.show.status === 'live') navigate(`/studio/live/${showId}`, { replace: true });
      else if (r.show.status === 'ended') navigate(`/studio/recap/${showId}`, { replace: true });
      else setData(r);
    }).catch((e) => setError(errorText(e, "Couldn't load this show.")));
  }, [showId, navigate]);

  const stop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };

  const open = useCallback(async (camId, mId) => {
    stop();
    setCamError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mId ? { deviceId: { exact: mId } } : true,
      });
      streamRef.current = s;
      if (video.current) video.current.srcObject = s;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === 'videoinput'));
      setMics(devices.filter((d) => d.kind === 'audioinput'));
      setCameraId(s.getVideoTracks()[0]?.getSettings().deviceId || camId || '');
      setMicId(s.getAudioTracks()[0]?.getSettings().deviceId || mId || '');
    } catch (e) {
      setCamError(e?.name === 'NotAllowedError'
        ? 'Camera or microphone is blocked. Allow them for this site in your browser settings (the lock icon by the address), then try again.'
        : "Couldn't start your camera. Close other apps using it and try again.");
    }
  }, []);

  useEffect(() => { open(); return stop; }, [open]);

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
  const go = () => { stop(); navigate(`/studio/live/${showId}`, { state: { cameraId, micId } }); };

  return (
    <div className="studio-app">
      <TopBar title="Ready to go live?" sub={data?.show?.title} onBack={() => navigate('/studio/golive')} />
      <div className="st-inner" style={{ paddingBottom: 120 }}>
        {error && <Problem text={error} />}
        <div style={{ position: 'relative', height: 'min(56vh, 420px)', borderRadius: 24, overflow: 'hidden', background: '#2A2F2C' }}>
          <video ref={video} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {camError && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, color: '#fff', textAlign: 'center' }}><span>{camError}</span><button type="button" className="btn2" onClick={() => open()}>Try again</button></div>}
          {!camError && <span aria-label="Microphone level" style={{ position: 'absolute', left: 12, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 3, height: 22, padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,.95)' }}>
            {[0.15, 0.35, 0.55, 0.75].map((t) => <i key={t} style={{ width: 4, height: 6 + t * 12, background: level > t ? 'var(--primary)' : 'var(--border-strong)', borderRadius: 2 }} />)}
          </span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cameras.length > 1 && (
            <div className="fl" style={{ flex: '1 1 160px' }}><label className="lab" htmlFor="cam">Camera</label>
              <select id="cam" className="sel" style={{ height: 48, fontSize: 15 }} value={cameraId} onChange={(e) => open(e.target.value, micId)}>{cameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}</select>
            </div>
          )}
          {mics.length > 1 && (
            <div className="fl" style={{ flex: '1 1 160px' }}><label className="lab" htmlFor="mic">Mic</label>
              <select id="mic" className="sel" style={{ height: 48, fontSize: 15 }} value={micId} onChange={(e) => open(cameraId, e.target.value)}>{mics.map((m, i) => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${i + 1}`}</option>)}</select>
            </div>
          )}
        </div>
        {first && (
          <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            {first.image ? <img src={first.image} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : <span className="sk" style={{ width: 52, height: 52 }} />}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><span className="cap">FIRST UP · 1 OF {data.items.length} · {data.show.type === 'drop' ? 'DROP' : 'AUCTION'}</span><span style={{ fontWeight: 800 }}>{first.name} · {data.show.type === 'drop' ? naira(first.price) : `bids from ${naira(first.minBid)}`}</span></div>
          </div>
        )}
        {data && <div className="bot"><span className="av" aria-hidden="true" /><div className="bub" style={{ fontSize: 15 }}>{data.show.type === 'drop' ? 'Once live, tap an item to put it on sale. Buyers tap Buy now.' : 'Once live, tap an item, then Start bidding. Each auction runs 30 seconds.'}</div></div>}
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px max(18px, env(safe-area-inset-bottom))', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn" style={{ minHeight: 60, fontSize: 19, background: 'var(--live)', width: '100%', maxWidth: 688, margin: '0 auto' }} disabled={!data || Boolean(camError)} onClick={go}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />Go live
        </button>
      </div>
    </div>
  );
}

export function GoLiveCheck() {
  const { showId } = useParams();
  return <Check showId={showId} />;
}

export default ShowPicker;
