import {releaseTrack} from './localMedia.js';
export const LEGACY_DISABLED_MIC = false;
export const LEGACY_FULL_SESSION_RECOVERY = false;
export const LEGACY_LOW_QUALITY = false;
export const deadTrack = track => !track || track.getMediaStreamTrack?.()?.readyState === 'ended';
export const mediaMessage = error => /permission|NotAllowed|PERMISSION_DENIED/i.test(`${error?.code} ${error?.message}`)
  ? 'Allow camera and microphone access for this site, then try again.'
  : "Couldn't reconnect your camera. Check your connection and try again.";
export async function muteTrack(track, muted) {
  if (!track || deadTrack(track)) return;
  if (LEGACY_DISABLED_MIC) await track.setEnabled(!muted);
  else await track.setMuted(muted);
}
export async function publishTracks(client, tracks) {
  const ready = tracks.filter(t => !deadTrack(t) && t.enabled !== false);
  if (ready.length) await client.publish(ready);
}
// Same capabilities clamp used in the classic studio; never request more than
// the camera exposes. A poor uplink uses the retained lower-quality profile.
export function encoderFor(track, poor = false) {
  const caps = track?.getMediaStreamTrack?.()?.getCapabilities?.() || track?.getCapabilities?.() || {};
  const target = poor || LEGACY_LOW_QUALITY ? {width:640,height:480,frameRate:24,bitrateMax:650} : {width:1280,height:720,frameRate:30,bitrateMax:1500};
  for (const key of ['width','height','frameRate']) if (caps[key]?.max) target[key] = Math.min(target[key],Math.floor(caps[key].max));
  return target;
}
export async function repairTracks({client,tracks,scope,createAudio,createVideo,micOn,hidden,rejoin,poor=false}) {
  // The SDK handles RECONNECTING itself. Never create a second client/session.
  if(scope.closed)return false;
  if (client.connectionState === 'RECONNECTING' || client.connectionState === 'CONNECTING') return false;
  const joined = client.connectionState === 'DISCONNECTED';
  if (joined) await rejoin();
  if(scope.closed){await client.leave().catch(()=>{});return false;}
  const fresh = [];
  for (const [kind,create] of [['audio',createAudio],['video',createVideo]]) {
    if (deadTrack(tracks[kind])) {
      const old = tracks[kind];
      if (old) { try { await client.unpublish(old); } catch { /* an OS-ended track may already be unpublished */ } scope.release(old); }
      const next = scope.own(await create());
      if (scope.closed) { releaseTrack(next);await client.leave().catch(()=>{});return false; }
      tracks[kind] = next;fresh.push(next);
      if(kind==='video')await next.setEncoderConfiguration?.(encoderFor(next,poor)).catch(()=>{});
    }
  }
  if (scope.closed) return false;
  await muteTrack(tracks.audio,!micOn);await muteTrack(tracks.video,hidden);
  const all=[tracks.audio,tracks.video];
  await publishTracks(client,joined?all:all.filter(t=>fresh.includes(t)||(Array.isArray(client.localTracks)&&!client.localTracks.includes(t))));
  return true;
}
export function deviceChoice(kind,initial) { try { return initial || localStorage.getItem(`studio-${kind}`) || ''; } catch { return initial || ''; } }
export function rememberDevice(kind,id) { try { localStorage.setItem(`studio-${kind}`,id); } catch { /* private mode */ } }
