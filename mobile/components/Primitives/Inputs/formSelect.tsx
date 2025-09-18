import { View, Text, Pressable } from "react-native";
import React from "react";
import { clsx } from "clsx";
import Colors from "@/constants/Colors";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";

type FormSelectType = {
  hasError: boolean;
  name: string;
  value?: string;
  showLabel?: boolean;
  error?: string | null;
  placeholder: string;
  onPress: () => void;
};

const FormSelect = ({
  hasError,
  name,
  value,
  showLabel = false,
  error,
  placeholder,
  onPress,
}: FormSelectType) => {
  return (
    <Pressable className="w-full shrink" onPress={onPress}>
      {showLabel && (
        <View className="flex-row items-center justify-between">
          <Text
            className={clsx(
              " text-[14px] font-LexendDecaLight tracking-[-0.22px] leading-[24px] mb-[8px] capitalize",
              hasError ? "text-errorRed" : "text-[#FFFFFF]",
            )}
          >
            {name}
          </Text>
          {hasError && (
            <Feather
              name="alert-triangle"
              size={18}
              color={Colors.dark.errorRed}
            />
          )}
        </View>
      )}

      <View
        className={clsx(
          "flex-row items-center gap-[6px] bg-[#FFFFFF05] px-[16px] py-[16px] rounded-[10px] border-[1px] border-[#FFFFFF33]",

          hasError ? "border-errorRed" : "border-[#FFFFFF33]",
        )}
      >
        <Text
          className={clsx(
            "w-full shrink p-0 text-[16px] font-LexendDecaLight tracking-[-0.22px] capitalize",
            value ? "text-[#FFFFFF]" : "text-[#FFFFFF99]",
          )}
        >
          {value || placeholder || name}
        </Text>
        <Entypo name="chevron-down" size={20} color="#FFFEFE4D" />
      </View>

      {hasError && error && (
        <Text className="mt-[10px] text-errorRed text-[12px] font-LexendDeca tracking-[-0.22px] capitalize">
          {error}
        </Text>
      )}
    </Pressable>
  );
};

export default FormSelect;
