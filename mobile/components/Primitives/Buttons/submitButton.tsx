import { View, Text, PressableProps, ActivityIndicator } from "react-native";
import React, { memo } from "react";
import AnimatedButton from "./animatedButton";
import { cn } from "@/core";

type Props = {
  canSubmit: boolean;
  text: string;
  isLoading: boolean;
  onPress: () => void;
};

const SubmitButton = ({
  canSubmit,
  text,
  isLoading,
  onPress = () => null,
}: Props) => {
  return (
    <AnimatedButton
      btnClassname={cn(
        "px-[16px] h-[50px] rounded-[10px] bg-[#16783A] items-center justify-center",
        {
          "bg-[#BFBFBF]": !canSubmit || isLoading,
        },
      )}
      btnStyle={{
        borderCurve: "continuous",
      }}
      onPress={onPress}
      disabled={!canSubmit || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size={15} color="#F4FFF8" />
      ) : (
        <Text className="text-[15px] text-[#F4FFF8] font-LexendDecaMedium tracking-[-0.22px]">
          {text}
        </Text>
      )}
    </AnimatedButton>
  );
};

export default memo(SubmitButton);
