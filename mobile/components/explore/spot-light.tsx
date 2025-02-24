import { View, Text, FlatList } from "react-native";
import React from "react";
import LiveProductCard from "@/components/global/live-product-card";

const SpotLightExplore = () => {
  return (
    <View className="mt-[9px] w-[100%] bg-[#3A3A3A]  pb-[15.5px]">
      <Text className="text-white text-[14px] font-LexendDecaBold px-[16px] pt-[12px]">
        Popular Shows
      </Text>
      <View
        style={{
          paddingHorizontal: 16,
        }}
      >
        <FlatList
          data={[1, 2, 3, 4, 5, 6, 7]}
          renderItem={(item) => <LiveProductCard {...item} showBtn={false} />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
          pagingEnabled
        />
      </View>
    </View>
  );
};

export default SpotLightExplore;
