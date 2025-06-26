import React, { useMemo } from "react";
import { TouchableWithoutFeedback } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { BottomSheetBackdropProps, useBottomSheet } from "@gorhom/bottom-sheet";

/**
 * This is a custom backdrop that seems to have less lag when used vs. rendering a default backdrop.
 * Copied from Bluesky's custom backdrop in their social-app repo.
 */
export function createCustomBackdrop(
  onClose?: (() => void) | undefined,
): React.FC<BottomSheetBackdropProps> {
  const CustomBackdrop = ({
    animatedIndex,
    style,
  }: BottomSheetBackdropProps) => {
    const { close } = useBottomSheet();
    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.value, // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolation.CLAMP,
      ),
    }));

    const containerStyle = useMemo(
      () => [style, { backgroundColor: "#000" }, opacity],
      [style, opacity],
    );

    return (
      <TouchableWithoutFeedback
        onPress={() => close()}
        accessibilityLabel="Close bottom drawer"
        accessibilityHint=""
        onAccessibilityEscape={() => {
          if (onClose !== undefined) {
            onClose();
          }
        }}
      >
        <Animated.View style={containerStyle} />
      </TouchableWithoutFeedback>
    );
  };
  return CustomBackdrop;
}
