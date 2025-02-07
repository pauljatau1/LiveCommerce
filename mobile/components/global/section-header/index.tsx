import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

const SectionHeader = ({
  title,
  btnText,
}: {
  title: string;
  btnText?: string;
}) => {
  return (
    <View className="flex-row pl-[24px] pr-[18px] justify-between items-center">
      <Text className="text-white font-LexendDecaBold text-[14px] font-bold">
        {title}
      </Text>
      {btnText && (
        <TouchableOpacity
          className="bg-white px-[9px] py-[5px] border-[0.717px] border-primary-200 rounded-[2.881px]"
          onPress={() => {
            router.push({
              pathname: `/(root)/catalog/moreProducts`,
              params: { name: title },
            });
          }}
        >
          <Text className="text-primary-200 font-normal font-LexendDeca text-[7.279px]">
            {btnText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;
