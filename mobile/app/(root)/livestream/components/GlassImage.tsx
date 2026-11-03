import React, { useState, useEffect, memo } from "react";
import {
  View,
  Image,
  ImageProps,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  ImageStyle,
  NativeSyntheticEvent,
  ImageErrorEventData,
  ImageLoadEventData,
} from "react-native";
import { BlurView } from "expo-blur";

interface GlassImageProps extends Omit<ImageProps, "style"> {
  // Container styling
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;

  // Glass/blur view styling
  glassStyle?: StyleProp<ViewStyle>;
  glassClassName?: string;

  // Image styling
  imageStyle?: StyleProp<ImageStyle>;
  imageClassName?: string;

  // Other props
  placeholderColor?: string;
  showActivityIndicator?: boolean;
  indicatorColor?: string;
  blurIntensity?: number;
  tint?: "light" | "dark" | "default";
}

/**
 * A custom image component with a glass-like background placeholder
 * Shows a blurred background until the image loads
 *
 * Usage with Tailwind:
 *   <GlassImage
 *     source={{ uri: imageUrl }}
 *     containerClassName="w-12 h-12 rounded-full overflow-hidden"
 *     imageClassName="w-full h-full"
 *     placeholderColor="rgba(100, 100, 100, 0.3)"
 *   />
 */
const GlassImage: React.FC<GlassImageProps> = ({
  source,
  containerStyle,
  containerClassName,
  glassStyle,
  glassClassName,
  imageStyle,
  imageClassName,
  placeholderColor = "rgba(200, 200, 200, 0.3)",
  showActivityIndicator = true,
  indicatorColor = "#FFFFFF",
  blurIntensity = 20,
  tint = "dark",
  onLoad,
  onLoadStart,
  onLoadEnd,
  onError,
  resizeMode = "cover",
  ...rest
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // For debugging - warn if styling props are missing
  useEffect(() => {
    if (__DEV__) {
      if (!imageClassName && !imageStyle) {
        //console.warn('GlassImage: No imageClassName or imageStyle provided for the image');
      }
      if (!containerClassName && !containerStyle) {
        //console.warn('GlassImage: No containerClassName or containerStyle provided for the container');
      }
    }
  }, [imageClassName, containerClassName, imageStyle, containerStyle]);

  // Handle image load start
  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  // Handle image load completion
  const handleLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
    onLoad?.(event);
  };

  // Handle image load end (whether success or failure)
  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  // Handle image load error
  const handleError = (error: NativeSyntheticEvent<ImageErrorEventData>) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      className={containerClassName}
    >
      {/* Glass-like background that shows when image is loading or has error */}
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={[
          styles.glassBackground,
          { backgroundColor: placeholderColor },
          glassStyle,
          !isLoading && !hasError && styles.hiddenGlass,
        ]}
        className={glassClassName}
      >
        {isLoading && showActivityIndicator && (
          <ActivityIndicator color={indicatorColor} size="small" />
        )}
      </BlurView>

      {/* Actual image */}
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        className={imageClassName}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode={resizeMode}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  glassBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  hiddenGlass: {
    opacity: 0,
  },
  image: {
    zIndex: 2,
  },
});

export default memo(GlassImage);
