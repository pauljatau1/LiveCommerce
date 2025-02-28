import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import WatchCategoryCard from "./watch-category-card";
import { data, icons } from "@/constants";

const WatchCategory = () => {
  return (
    <View className="w-[100%] py-[29.81px] ">
      <SectionHeader title="Watch By Category" />
      <View
        style={{
          paddingLeft: 16,
        }}
      >
        <FlatList
          data={data.watchCategories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="w-[178px] h-[214.185px] pr-[8.43px]">
              <View className="flex-row items-center pb-[6px] ">
                <Image source={icons.radio_buttonIcon} />
                <Text className="text-white pl-[10.5px] font-LexendDecaMedium text-xs ">
                  149 Live Shows
                </Text>
              </View>
              <WatchCategoryCard item={item} />
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
        />
      </View>
    </View>
  );
};

export default WatchCategory;
