import { Text, ViewStyle, TextStyle, Pressable } from "react-native";
import React, { memo, ReactNode } from "react";
import Feather from "@expo/vector-icons/Feather";

type Props = {
  icon?: ReactNode;
  name: string;
  showDownIcon?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress: () => void;
};

const FilterButton = ({
  icon,
  name,
  showDownIcon = false,
  style,
  textStyle,
  onPress,
}: Props) => {
  return (
    <Pressable
      className="flex-row items-center p-[8px] gap-[10px] rounded-[5px] bg-[#FFFFFF1A] "
      style={{
        borderCurve: "continuous",
      }}
      onPress={onPress}
    >
      {icon}
      <Text className="text-[14px] text-[#BFBFBF] font-LexendDecaLight tracking-[-0.22px] capitalize">
        {name}
      </Text>
      {showDownIcon && (
        <Feather name="chevron-down" size={16} color="#FFFFFF80" />
      )}
    </Pressable>
  );
};

export default memo(FilterButton);
