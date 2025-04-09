import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { router } from "expo-router";
import HomeHeader from "@/components/home/home-header";
import { useGetAllCategoriesQuery } from "@/services/categories";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SimpleLineIcons } from "@expo/vector-icons";
import { formatNumber } from "@/helpers/helpers";

const Explore = () => {
  const { data, isLoading } = useGetAllCategoriesQuery({});
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("Popular");

  //   useEffect(() => {
  //     setCategoriesData(data);
  //   }, [data]);

  const renderCategories = (category: any, index: number) => {
    const subCats = category?.subCategories?.map((sub: any) => sub?.name);
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: `../explore/${category._id}`,
            params: {
              name: category.name,
              subCategories: subCats,
            },
          })
        }
        style={{
          marginBottom: 12,
        }}
      >
        <View className="relative flex-row items-center w-full rounded-[4px] overflow-hidden p-[1px] bg-[#f2f2f2]">
          <Image
            source={{ uri: category?.image?.url }}
            resizeMode="cover"
            style={{
              width: 70,
              height: "100%",
              borderTopLeftRadius: 4,
              borderBottomLeftRadius: 4,
            }}
          />
          <View className="bg-[#f2f2f2] w-full shrink flex-row items-center justify-between p-[15px]">
            <View className="gap-[2px]">
              <Text className="text-[#3A3A3A] text-[13px] font-LexendDecaSemiBold">
                {category.name}
              </Text>
              <View className="flex-row gap-[4px] items-center">
                <View
                  className="rounded-[4px] p-[5px] bg-[#DEFFEE] items-center justify-center"
                  style={{
                    backgroundColor: "#DEFFEE",
                  }}
                >
                  <SimpleLineIcons name="chart" size={10} color="#66CB9F" />
                </View>
                {/* <Image
                  source={require("../../../../assets/icons/explore-live-icon.png")}
                  style={{
                    width: 15,
                    height: 15,
                  }}
                /> */}
                <Text className="text-[9px] text-[#3A3A3A] font-LexendDecaMedium">
                  {formatNumber(category?.statistics?.streams?.active)} Streams
                  | {formatNumber(category?.statistics?.streams?.active)}{" "}
                  Products
                </Text>
              </View>
            </View>

            <FontAwesome6 name="caret-right" size={16} color="#ccc" />
          </View>
        </View>
      </Pressable>
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

  const exploreHeader = useCallback(() => {
    return (
      <>
        <Text className="text-[#ccc] text-[18px] font-LexendDecaMedium mb-[14px]">
          Browse by Category
        </Text>
        <View className="flex-row items-center gap-[8px] mb-[26px]">
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
      </>
    );
  }, [filter]);

  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="pt-[30px]">
        <HomeHeader />

        <View className="p-[23px] px-[16px] pb-[50px] h-full ">
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
              contentContainerStyle={{
                paddingBottom: Platform.OS == "android" ? 50 : 20,
                // gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={exploreHeader}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Explore;
