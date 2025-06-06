import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { memo, useCallback } from "react";
import SectionHeader from "@/components/global/section-header";
import WatchCategoryCard from "./category-card";
import { data, icons } from "@/constants";
import ForYouCategoryCard from "./category-card";
import { useGetAllCategoriesQuery } from "@/services/categories";
import { router } from "expo-router";

const ForYouCatetorySection = () => {
  const {
    data: categoriesData,
    isLoading,
    isError,
  } = useGetAllCategoriesQuery({});

  const renderCategories = useCallback(({ item }: any) => {
    return <ForYouCategoryCard item={item} />;
  }, []);

  const renderFooter = useCallback(() => {
    return (
      <View className="h-[215px] items-center justify-center px-[12px] mr-[8px]">
        <Pressable
          className="rounded-[16px] p-[5px] px-[8px] bg-[#16783A]"
          onPress={() => router.navigate("/(root)/(tabs)/explore/explore")}
        >
          <Text className="font-LexendDeca text-[#fff] text-[10px] self-center justify-center">
            View More
          </Text>
        </Pressable>
      </View>
    );
  }, []);

  return (
    <View className="w-[100%] pb-[9.81px] pt-[8px] ">
      <SectionHeader title="Categories" btnText="" />
      <View style={{}}>
        <FlatList
          data={categoriesData?.slice(0, 15)}
          keyExtractor={(item) => item._id}
          renderItem={renderCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 16,
          }}
          className="pt-[15px]"
          ListFooterComponent={renderFooter}
        />
      </View>
    </View>
  );
};

export default memo(ForYouCatetorySection);
