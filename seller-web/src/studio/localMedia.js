// Device release must be synchronous and independent of network/unpublish.
// stop() only stops an Agora preview; close() and the native track release capture.
export function releaseTrack(track) {
  if (!track) return;
  try { track.getMediaStreamTrack?.()?.stop(); } catch { /* SDK track may already be closed */ }
  try { track.stop?.(); } catch { /* still close it below */ }
  try { track.close?.(); } catch { /* already closed */ }
}

export function releaseStream(stream) {
  for (const track of stream?.getTracks() || []) releaseTrack(track);
}

// Own tracks as each permission request resolves, including late results after
// unmount/end and partial failure (camera succeeds, microphone fails, or vice versa).
export function createTrackScope() {
  const tracks = new Set();
  let closed = false;
  return {
    get closed() { return closed; },
    own(track) { if (closed) releaseTrack(track); else tracks.add(track); return track; },
    release(track) { tracks.delete(track); releaseTrack(track); },
    close() { closed = true; for (const track of tracks) releaseTrack(track); tracks.clear(); },
  };
}

export async function acquireTracks(scope, factories) {
  try { return await Promise.all(factories.map(async (create) => scope.own(await create()))); }
  catch (error) { scope.close(); throw error; }
}
