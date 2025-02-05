import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { router } from "expo-router";
import HomeHeader from "@/components/home/home-header";
import { useGetAllCategoriesQuery } from "@/services/categories";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const Explore = () => {
  const { data, isLoading } = useGetAllCategoriesQuery({});
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("Popular");

  //   useEffect(() => {
  //     setCategoriesData(data);
  //   }, [data]);

  const renderCategories = (category: any, index: number) => {
    return (
      <TouchableOpacity
        key={index}
        className="relative flex-row items-center w-full rounded-[4px] overflow-hidden mb-[24px]"
        onPress={() =>
          router.push({
            pathname: `../explore/${category._id}`,
            params: { name: category.name },
          })
        }
      >
        <Image
          source={{ uri: category?.image?.url }}
          resizeMode="cover"
          style={{
            width: 70,
            height: "100%",
          }}
        />
        <View className="bg-[#f2f2f2] w-full shrink flex-row items-center justify-between p-[15px] py-[20px]">
          <Text className="text-[#3A3A3A] text-[12px] font-LexendDecaMedium">
            {category.name}
          </Text>
          <FontAwesome6 name="caret-right" size={16} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (filter == "Popular") {
      return setCategoriesData(data);
    }
    var temp1 = [...data];
    const tempData = temp1?.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    setCategoriesData(tempData);
  }, [data, filter]);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <View className="pt-[30px]">
          <HomeHeader />

          <View className="p-[23px] h-full ">
            <Text className="text-[#ccc] text-[18px] font-LexendDecaMedium mb-[14px]">
              Browse by Category
            </Text>
            <View className="flex-row items-center gap-[24px] mb-[26px]">
              <TouchableOpacity
                className={` rounded-[4px] py-[8px] px-[12px] justify-center items-center`}
                style={{
                  backgroundColor:
                    filter == "Popular" ? "#fff" : "rgba(204, 204, 204, 0.25)",
                }}
                onPress={() => setFilter("Popular")}
              >
                <Text
                  className={`${filter == "Popular" ? "text-[#2F2E41]" : "text-[#cccccc]"}  text-[10px] font-LexendDecaMedium`}
                >
                  Popular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={` rounded-[4px] py-[8px] px-[12px] justify-center items-center`}
                style={{
                  backgroundColor:
                    filter == "A-Z" ? "#fff" : "rgba(204, 204, 204, 0.25)",
                }}
                onPress={() => setFilter("A-Z")}
              >
                <Text
                  className={`${filter == "A-Z" ? "text-[#2F2E41]" : "text-[#cccccc]"}  text-[10px] font-LexendDecaMedium`}
                >
                  A-Z
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator
                size={"small"}
                color={"#16783A"}
                style={{ marginTop: 30 }}
              />
            ) : (
              <FlatList
                data={categoriesData}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => renderCategories(item, index)}
                style={{
                  gap: 24,
                  paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Explore;
