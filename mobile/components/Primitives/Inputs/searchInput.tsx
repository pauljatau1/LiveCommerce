import { View, TextInputProps, TextInput } from "react-native";
import React, { memo, useCallback, useEffect, useRef } from "react";
import SearchIcon from "@/assets/icons/search.svg";
import CloseIcon from "@/assets/icons/close.svg";

type Props = {
  borderRadius?: number;
  placeholder?: string;
  readonly?: boolean;
  autoFocus?: boolean;
  onChangeText?: TextInputProps["onChangeText"];
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  onFocus?: TextInputProps["onFocus"];
  showCloseIcon?: boolean;
  removeFocus?: boolean;
};

const SearchInput = ({
  borderRadius = 200,
  placeholder = "Search...",
  readonly = false,
  autoFocus = false,
  onChangeText = () => null,
  onSubmitEditing = () => null,
  onFocus,
  showCloseIcon = true,
  removeFocus = false,
}: Props) => {
  const textInputRef = useRef<TextInput>(null);

  const handleClearInput = useCallback(() => {
    textInputRef?.current?.clear();
    onChangeText("");
  }, [onChangeText]);

  useEffect(() => {
    if (removeFocus) {
      handleClearInput();
      textInputRef?.current?.blur();
    }
  }, [removeFocus]);
  return (
    <View
      className={`w-full shrink flex-row items-center gap-[8px] p-[16px] py-[12px] rounded-[${borderRadius}px] border-[1px] border-[#FFFFFF33]`}
      style={{ borderCurve: "continuous" }}
    >
      <SearchIcon width={20} height={20} strokeOpacity={0.6} />
      <TextInput
        ref={textInputRef}
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={"#FFFFFF4D"}
        className="w-full shrink p-0 text-[#FFFFFF] text-[16px] font-LexendDecaLight tracking-[-0.22px]"
        style={{ borderCurve: "continuous" }}
        cursorColor={"white"}
        autoCorrect={false}
        autoFocus={autoFocus}
        readOnly={readonly}
        returnKeyType="search"
      />
      {showCloseIcon && (
        <CloseIcon width={20} height={20} onPress={handleClearInput} />
      )}
    </View>
  );
};

export default memo(SearchInput);
