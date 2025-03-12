import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useCallback, useMemo } from "react";
import SectionHeader from "@/components/global/section-header";
import WatchCategoryCard from "./watch-category-card";
import { data, icons } from "@/constants";
import { useGetAllCategoriesQuery } from "@/services/categories";
import { router } from "expo-router";

const WatchCategory = () => {
  const { data: categories, isLoading, isError } = useGetAllCategoriesQuery({});

  const renderCategories = useCallback(({ item }: { item: any }) => {
    const subCats = item?.subCategories?.map((sub: any) => sub?.name);

    return (
      <Pressable
        className="w-[178px] h-[214.185px] pr-[8.43px]"
        onPress={() =>
          router.push({
            pathname: `/(root)/(tabs)/explore/${item._id}`,
            params: {
              name: item.name,
              subCategories: subCats,
            },
          })
        }
      >
        <View className="flex-row items-center pb-[6px] ">
          <Image source={icons.radio_buttonIcon} />
          <Text className="text-white pl-[10.5px] font-LexendDecaMedium text-xs ">
            {item.statistics?.streams?.active}
          </Text>
        </View>
        <WatchCategoryCard item={item} />
      </Pressable>
    );
  }, []);

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
          renderItem={renderCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
        />
      </View>
    </View>
  );
};

export default WatchCategory;
