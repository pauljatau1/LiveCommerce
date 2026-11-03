import { Pressable, ViewStyle } from "react-native";
import React, { memo } from "react";
import Entypo from "@expo/vector-icons/Entypo";

type Props = {
  onPress?: () => void;
  bgColor?: string;
  style?: ViewStyle;
};

const BackButton = (props: Props) => {
  return (
    <Pressable
      className="p-[8px] rounded-[5px] bg-[#FFFFFF1A]"
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: props?.bgColor ?? "#FFFFFF1A",
          borderCurve: "continuous",
        },
        props?.style,
      ]}
      onPress={props.onPress}
    >
      <Entypo name="chevron-left" size={24} color="#F4FFF8" />
    </Pressable>
  );
};

export default memo(BackButton);
