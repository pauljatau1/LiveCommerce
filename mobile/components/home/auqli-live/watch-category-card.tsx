import { View, Text, Image } from "react-native";
import React from "react";

const WatchCategoryCard = ({ item }: any) => {
  return (
    <View className="rounded-[4.15px] overflow-visible relative">
      <Image
        source={{ uri: item?.image?.url }}
        className=" rounded-[4.15px] w-full  h-full opacity-50"
        resizeMode="cover"
      />
      <Text className=" text-[14px] text-left font-LexendDecaMedium text-white absolute bottom-8 px-[8.41px]">
        {item?.name}
      </Text>
    </View>
  );
};

export default WatchCategoryCard;
