import { View, Text, Image } from "react-native";
import React from "react";

const ForYouCategoryCard = ({ item }: any) => {
  return (
    <View>
      <View className="w-[178px] relative h-[214.185px] pr-[8.43px]">
        <Image
          source={{ uri: item?.image?.url }}
          className=" rounded-[4.15px] h-full w-full"
          resizeMode="cover"
        />
      </View>
      <Text className="text-[12px] font-normal  !text-white font-LexendDecaSemiBold mt-[8.43px]">
        {item.name}
      </Text>
    </View>
  );
};

export default ForYouCategoryCard;
