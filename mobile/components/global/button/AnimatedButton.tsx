import { ViewStyle, Pressable } from "react-native";
import React, { ReactNode } from "react";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type Props = {
  btnStyle?: ViewStyle;
  btnClassname?: string;
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  hapticsStrength?: HapticsStrength;
};

type HapticsStrength = "heavy" | "medium" | "light";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const hapticsMap = {
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  light: Haptics.ImpactFeedbackStyle.Light,
};

const AnimatedButton = ({
  btnStyle = {},
  btnClassname = "",
  children,
  onPress = () => {},
  disabled = false,
  hapticsStrength = "light",
  ...rest
}: Props) => {
  const btnScale = useSharedValue(1);

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      className={btnClassname}
      style={[btnStyle, animatedBtnStyle]}
      onPressIn={() => {
        btnScale.set(
          withTiming(0.99, {
            duration: 100,
            easing: Easing.out(Easing.ease),
          }),
        );
      }}
      onPressOut={() => {
        btnScale.set(
          withTiming(1, {
            duration: 100,
            easing: Easing.inOut(Easing.linear),
          }),
        );
      }}
      onPress={() => {
        Haptics.impactAsync(hapticsMap[hapticsStrength]);
        onPress();
      }}
    >
      {children}
    </AnimatedPressable>
  );
};

export default AnimatedButton;
