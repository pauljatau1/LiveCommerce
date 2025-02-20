import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import WatchCategoryCard from "./category-card";
import { data, icons } from "@/constants";
import ForYouCategoryCard from "./category-card";
import { useGetAllCategoriesQuery } from "@/services/categories";

const ForYouCatetorySection = () => {
  const { data: categoriesData } = useGetAllCategoriesQuery({});

  return (
    <View className="w-[100%] pb-[9.81px] pt-[8px] ">
      <SectionHeader title="Categories" btnText="" />
      <View style={{}}>
        <FlatList
          data={categoriesData}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ForYouCategoryCard item={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 16,
          }}
          className="pt-[15px]"
        />
      </View>
    </View>
  );
};

export default ForYouCatetorySection;
