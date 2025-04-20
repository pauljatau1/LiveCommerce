import { View, Text, Image } from "react-native";
import React from "react";
import { GlassImage } from "@/app/(root)/livestream/components";

const WatchCategoryCard = ({ item }: any) => {
  return (
    <View className="rounded-[4.15px] overflow-visible relative">
      <GlassImage
        source={{ uri: item?.image?.url }}
        imageClassName=" rounded-[4.15px] w-full  h-full opacity-50"
        placeholderColor="rgba(30, 30, 30, 0.5)"
        blurIntensity={25}
        tint="dark"
        showActivityIndicator={false}
        resizeMode="cover"
      />
      <Text className=" text-[14px] text-left font-LexendDecaMedium text-white absolute bottom-8 px-[8.41px]">
        {item?.name}
      </Text>
    </View>
  );
};

export default WatchCategoryCard;
