import { Pressable } from "react-native";
import React, { memo } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type Props = {
  active: boolean;
  onPress?: () => void;
  size?: number;
  color?: string;
};

const RadioButton = ({
  active,
  onPress,
  size = 17,
  color = "#16783ACC",
}: Props) => {
  return (
    <Pressable
      className={`w-[${size}px] h-[${size}px] rounded-full border-[1px] items-center justify-center relative`}
      style={{
        borderColor: color,
        flexShrink: 0,
      }}
      onPress={onPress}
      hitSlop={6}
    >
      {active && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            width: "60%",
            height: "60%",
            borderRadius: "100%",
            backgroundColor: color,
            flexShrink: 1,
          }}
        ></Animated.View>
      )}
    </Pressable>
  );
};

export default memo(RadioButton);
