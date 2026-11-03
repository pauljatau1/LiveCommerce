import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";

const SectionHeader = ({ title, btnText, action }: any) => {
  return (
    <View
      className="flex-row justify-between items-center"
      style={{ paddingHorizontal: 16, marginBottom: 5 }}
    >
      <Text
        className="text-white font-LexendDecaMedium text-[20px] tracking-[-0.2px] shrink"
        numberOfLines={1}
      >
        {title}
      </Text>
      {btnText && (
        <TouchableOpacity
          className=" px-[9px] py-[5px] border-primary-200 flex-row items-center justify-center gap-[4px]"
          onPress={() => {
            if (action) {
              return action();
            }
            router.push({
              pathname: `/(root)/catalog/moreProducts`,
              params: { name: title },
            });
          }}
        >
          <Text className="text-white font-LexendDecaLight text-[14px] tracking-[-0.14px]">
            {btnText}
          </Text>
          {/* <AntDesign
            name="right"
            size={12}
            color="#fff"
            style={{ marginTop: 2 }}
          /> */}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;
