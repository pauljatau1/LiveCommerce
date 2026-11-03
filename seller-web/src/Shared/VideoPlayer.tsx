import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

function VideoPlayerInternal({
  src,
  poster,
  autoPlay = false,
  controls,
  muted,
  style = {},
  className = '',
  ...rest
}: VideoPlayerProps, forwardedRef: React.ForwardedRef<HTMLVideoElement>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHls = /\.m3u8($|\?)/i.test(src);

    if (!isHls) {
      // mp4 / webm / ogg … rely on native playback
      video.src = src;
      video.load();
      if (autoPlay) video.play().catch(() => {});
      return;
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
      const hls = new Hls({ 
        enableWorker: true, 
        maxBufferLength: 3,
        // Mobile-optimized settings
        maxBufferSize: 0,
        maxBufferHole: 0.5,
        lowLatencyMode: true
      });
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
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <video
        ref={(node) => {
          // keep internal ref working
          (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
          // forward to parent
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
          }
        }}
        poster={poster}
        controls={controls}
        playsInline
        muted={muted ?? autoPlay}
        style={style}
        className={['hls-video', 'bg-black', 'w-full', 'h-full', 'object-cover'].join(' ')}
        {...rest}
      />
      {/* Base subtle gradient, always visible */}
      <div
        aria-hidden
        className={[
          'pointer-events-none',
          'absolute inset-0',
          'bg-gradient-to-t from-[rgba(0,0,0,0.45)] via-[rgba(0,0,0,0.15)] to-transparent'
        ].join(' ')}
      />
    </div>
  );
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(VideoPlayerInternal);
export default VideoPlayer;
