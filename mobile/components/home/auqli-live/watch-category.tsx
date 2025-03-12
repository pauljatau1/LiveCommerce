import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import WatchCategoryCard from "./watch-category-card";
import { data, icons } from "@/constants";
import { useGetAllCategoriesQuery } from "@/services/categories";

const WatchCategory = () => {
  const { data: categories, isLoading, isError } = useGetAllCategoriesQuery({});
  return (
    <View className="w-[100%] py-[29.81px] ">
      <SectionHeader title="Watch By Category" />
      <View
        style={{
          paddingLeft: 16,
        }}
      >
        <FlatList
          data={categories}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) => (
            <View className="w-[178px] h-[214.185px] pr-[8.43px]">
              <View className="flex-row items-center pb-[6px] ">
                <Image source={icons.radio_buttonIcon} />
                <Text className="text-white pl-[10.5px] font-LexendDecaMedium text-xs ">
                  {item.statistics?.streams?.active}
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
