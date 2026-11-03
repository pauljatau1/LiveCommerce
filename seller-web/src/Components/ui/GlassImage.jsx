import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * GlassImage Component - JavaScript Version
 * 
 * A React component that displays images with a glassmorphism effect.
 * Shows a blurred, tinted placeholder until the image loads, providing
 * a smooth loading experience with customizable styling options.
 * 
 * Features:
 * - Glassmorphism blur effect during loading
 * - Customizable tint overlays (light, dark, default)
 * - Loading indicator with customizable colors
 * - Error handling with fallback display
 * - Flexible styling through props
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {Object} props.containerStyle - Custom styles for the container div
 * @param {string} props.containerClassName - CSS classes for the container div
 * @param {Object} props.glassStyle - Custom styles for the glass overlay
 * @param {string} props.glassClassName - CSS classes for the glass overlay
 * @param {Object} props.imageStyle - Custom styles for the image element
 * @param {string} props.imageClassName - CSS classes for the image element
 * @param {string} props.placeholderColor - Color for the placeholder background
 * @param {boolean} props.showActivityIndicator - Whether to show loading spinner
 * @param {string} props.indicatorColor - Color for the loading indicator
 * @param {number} props.blurIntensity - Blur intensity in pixels
 * @param {string} props.tint - Tint overlay type ('light', 'dark', 'default')
 * @param {Function} props.onLoad - Image load event handler
 * @param {Function} props.onLoadStart - Image load start event handler
 * @param {Function} props.onLoadCapture - Image load capture event handler
 * @param {Function} props.onError - Image error event handler
 * @param {Object} props.imgProps - Additional props passed to the img element
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
    showActivityIndicator = true,
    indicatorColor = '#FFFFFF',
    blurIntensity = 20,
    tint = 'dark',
    onLoad,
    onLoadStart,
    onLoadCapture,
    onError,
    ...imgProps
}) {
    // State management for loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Effect hook to handle loading start when src changes
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        if (onLoadStart) {
            onLoadStart({});
        }
    }, [src, onLoadStart]);


    /**
     * Handles successful image load
     * Calls the optional onLoad callback with the event
     * @param {React.SyntheticEvent} e - The load event
     */
    const handleLoad = (e) => {
        if (onLoad) {
            onLoad(e);
        }
    };

    /**
     * Handles the end of image loading
     * Updates loading state to false
     */
    const handleLoadEnd = () => {
        setIsLoading(false);
    };

    /**
     * Handles image loading errors
     * Sets error state and stops loading
     * @param {React.SyntheticEvent} e - The error event
     */
    const handleError = (e) => {
        setHasError(true);
        setIsLoading(false);
        if (onError) {
            onError(e);
        }
    };

    /**
     * Determines the tint overlay style based on the tint prop
     * Returns appropriate background color for light, dark, or default tint
     */
    const getTintOverlay = () => {
        switch (tint) {
            case 'light':
                return { backgroundColor: 'rgba(255,255,255,0.25)' };
            case 'dark':
                return { backgroundColor: 'rgba(0,0,0,0.25)' };
            default:
                return {};
        }
    };

    // Get the tint overlay styles
    const tintOverlay = getTintOverlay();

    // Combine class names, filtering out any falsy values
    const containerClasses = [
        'relative overflow-hidden',
        containerClassName,
    ].filter(Boolean).join(' ');

    const glassClasses = [
        'absolute inset-0 flex items-center justify-center z-[1]',
        glassClassName,
    ].filter(Boolean).join(' ');

    const imageClasses = [
        'relative z-[2]',
        imageClassName,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={containerClasses}
            style={containerStyle}
        >
            {/* Glass overlay with blur effect and loading indicator */}
            <div
                className={glassClasses}
                style={{
                    ...tintOverlay,
                    backgroundColor: placeholderColor,
                    backdropFilter: `blur(${blurIntensity}px)`,
                    WebkitBackdropFilter: `blur(${blurIntensity}px)`,
                    transition: 'opacity 200ms ease',
                    opacity: !isLoading && !hasError ? 0 : 1,
                    pointerEvents: 'none',
                    ...(glassStyle || {}),
                }}
                aria-hidden
            >
                {/* Loading spinner - only shown when loading and indicator is enabled */}
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

            {/* Main image element */}
            {
                !hasError && (
                    <img
                        src={src}
                        alt={alt}
                        className={imageClasses}
                        style={imageStyle}
                        onLoad={(e) => {
                            handleLoad(e);
                            handleLoadEnd();
                        }}
                        onLoadCapture={onLoadCapture}
                        onError={(e) => handleError(e)}
                        {...imgProps}
                    />
                )
            }
        </div>
    );
}

GlassImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    containerStyle: PropTypes.object,
    containerClassName: PropTypes.string,
    glassStyle: PropTypes.object,
    glassClassName: PropTypes.string,
    imageStyle: PropTypes.object,
    imageClassName: PropTypes.string,
    placeholderColor: PropTypes.string,
    showActivityIndicator: PropTypes.bool,
    indicatorColor: PropTypes.string,
    blurIntensity: PropTypes.number,
    tint: PropTypes.string,
    onLoad: PropTypes.func,
    onLoadStart: PropTypes.func,
    onLoadCapture: PropTypes.func,
    onError: PropTypes.func,
    imgProps: PropTypes.object,
};
