import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  style = {},
  className = '',
  ...rest
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHls = /\.m3u8($|\?)/i.test(src);

    if (!isHls) {
      // mp4 / webm / ogg … rely on native playback
      video.src = src;
      video.load();
      if (autoPlay) video.play().catch(() => {});
      return; // ✅ done
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS).
      video.src = src;
      video.load();
      if (autoPlay) video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      // MSE + hls.js fallback
      const hls = new Hls({ enableWorker: true, maxBufferLength: 3 });
      hls.loadSource(src);
      hls.attachMedia(video);

      if (autoPlay) {
        hls.on(Hls.Events.MANIFEST_PARSED, () =>
          video.play().catch(() => {})
        );
      }
      return () => hls.destroy();
    }

    console.warn('This browser does not support HLS.');
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      style={style}
      className={['hls-video', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
