import { Pressable } from "react-native";
import React, { memo } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type Props = {
  active: boolean;
  onPress?: () => void;
  size?: number;
};

const RadioButton = ({ active, onPress, size = 17 }: Props) => {
  return (
    <Pressable
      className="w-[17px] h-[17px] rounded-full p-[2.5px] border-[1px] border-[#16783A]"
      onPress={onPress}
      hitSlop={6}
    >
      {active && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            width: 12,
            height: 12,
            aspectRatio: 1,
            borderRadius: "100%",
            backgroundColor: "#16783ACC",
            flexShrink: 1,
          }}
        ></Animated.View>
      )}
    </Pressable>
  );
};

export default memo(RadioButton);
