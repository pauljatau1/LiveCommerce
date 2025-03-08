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
    <View
      className="flex-row justify-between items-center"
      style={{ paddingHorizontal: 16, marginBottom: 5 }}
    >
      <Text className="text-white font-LexendDecaBold text-[16px]">
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
          <Text className="text-primary-200 font-LexendDecaMedium text-[8px]">
            {btnText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;
