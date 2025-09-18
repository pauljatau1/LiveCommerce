import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Text,
} from "react-native";
import React, { memo, useState } from "react";
import { clsx } from "clsx";
import { Noop } from "react-hook-form";
import Feather from "@expo/vector-icons/Feather";
import Colors from "@/constants/Colors";

interface TextInputType
  extends Omit<TextInputProps, "onBlur" | "onChangeText"> {
  isFocused: boolean;
  hasError: boolean;
  name: string;
  showLabel?: boolean;
  error?: string | null;
  onBlur?: Noop;
  onChangeText?: any;
}

const FormInput = ({
  onBlur,
  onFocus,
  onChangeText,
  placeholder,
  value,
  isFocused,
  hasError,
  error = null,
  showLabel = false,
  ...rest
}: TextInputType) => {
  const [showSecureEntry, setShowSecureEntry] = useState<boolean>(
    rest?.secureTextEntry ? true : false,
  );
  return (
    <View className="w-full shrink">
      {showLabel && (
        <View className="flex-row items-center justify-between">
          <Text
            className={clsx(
              " text-[14px] font-LexendDecaLight tracking-[-0.22px] leading-[24px] mb-[8px] capitalize",
              hasError ? "text-errorRed" : "text-[#FFFFFF]",
            )}
          >
            {rest?.name}
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
          isFocused
            ? "border-primary"
            : hasError
              ? "border-errorRed"
              : "border-[#FFFFFF33]",
        )}
      >
        <TextInput
          placeholder={placeholder}
          onBlur={onBlur}
          onFocus={onFocus}
          onChangeText={onChangeText}
          value={value}
          placeholderTextColor={"#FFFFFF99"}
          className="w-full shrink p-0 text-[#FFFFFF] text-[16px] font-LexendDecaLight tracking-[-0.22px]"
          style={{ borderCurve: "continuous" }}
          textContentType={rest.textContentType}
          keyboardType={rest.keyboardType}
          autoCapitalize={rest.autoCapitalize}
          autoCorrect={rest.autoCorrect}
          secureTextEntry={showSecureEntry}
        />
        {rest?.secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowSecureEntry(!showSecureEntry)}
          >
            <Feather
              name={!showSecureEntry ? "eye" : "eye-off"}
              size={20}
              color={isFocused ? Colors.dark.primaryGreen : "#FFFEFE4D"}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasError && error && (
        <Text className="mt-[10px] text-errorRed text-[12px] font-LexendDeca tracking-[-0.22px] capitalize">
          {error}
        </Text>
      )}
    </View>
  );
};

export default memo(FormInput);
