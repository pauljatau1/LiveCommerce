import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

interface GlassImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'style'> {
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  glassStyle?: React.CSSProperties;
  glassClassName?: string;
  imageStyle?: React.CSSProperties;
  imageClassName?: string;
  placeholderColor?: string;
  showActivityIndicator?: boolean;
  indicatorColor?: string;
  blurIntensity?: number; // pixels
  fetchpriority?: 'high' | 'low' | 'auto';
  tint?: 'light' | 'dark' | 'default';
}

/**
 * Web version of GlassImage.
 * Shows a blurred, tinted placeholder until the image loads.
 */
export default function GlassImage({
  src,
  alt,
  containerStyle,
  containerClassName,
  glassStyle,
  glassClassName,
  imageStyle,
  imageClassName,
  placeholderColor = 'rgba(200, 200, 200, 0.3)',
  showActivityIndicator = false,
  indicatorColor = '#FFFFFF',
  blurIntensity = 20,
  tint = 'dark',
  onLoad,
  onLoadStart,
  onLoadCapture,
  onError,
  ...imgProps
}: GlassImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    if (src) {
      setIsLoading(true);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setIsLoaded(false);
    onLoadStart?.({} as React.SyntheticEvent<HTMLImageElement, Event>);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    setIsLoaded(false);
    onError?.(e);
  };

  const tintOverlay: CSSProperties = tint === 'light'
    ? { backgroundColor: 'rgba(255,255,255,0.25)' }
    : tint === 'dark'
      ? { backgroundColor: 'rgba(0,0,0,0.25)' }
      : {};

  return (
    <div
      className={[
        'relative overflow-hidden',
        containerClassName,
      ].filter(Boolean).join(' ')}
      style={containerStyle}
    >
      {/* Loading State - Glass Overlay */}
      {!isLoaded && !hasError && (
        <div
          className={[
            'absolute inset-0 flex items-center justify-center z-[1]',
            glassClassName,
          ].filter(Boolean).join(' ')}
          style={{
            ...(tintOverlay as CSSProperties),
            backgroundColor: placeholderColor,
            backdropFilter: `blur(${blurIntensity}px)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px)`,
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
            ...(glassStyle || {}),
          }}
          aria-hidden
        >
          {isLoading && showActivityIndicator && (
            <span
              className="inline-block animate-spin rounded-full border-2"
              style={{
                width: 16,
                height: 16,
                borderColor: `${indicatorColor}55`,
                borderTopColor: indicatorColor,
              }}
            />
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div
          className={[
            'absolute inset-0 flex items-center justify-center z-[1]',
            glassClassName,
          ].filter(Boolean).join(' ')}
          style={{
            backgroundColor: placeholderColor,
            pointerEvents: 'none',
            ...(glassStyle || {}),
          }}
          aria-hidden
        />
      )}

      {/* Image - Only render when no error */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={[
            'relative z-[2] transition-opacity duration-300 ease-in-out',
            isLoaded ? 'opacity-100' : 'opacity-0',
            imageClassName,
          ].filter(Boolean).join(' ')}
          style={imageStyle}
          onLoad={handleLoad}
          onLoadStart={handleLoadStart}
          onLoadCapture={onLoadCapture}
          onError={handleError}
          {...imgProps}
        />
      )}
    </div>
  );
}


