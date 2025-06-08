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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { router } from "expo-router";
import HomeHeader from "@/components/home/home-header";
import { useGetAllCategoriesQuery } from "@/services/categories";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SimpleLineIcons } from "@expo/vector-icons";
import { formatNumber } from "@/helpers/helpers";
import { useIsFocused } from "@react-navigation/native";
import { GlassImage } from "../../livestream/components";
import ExploreSkeleton from "@/components/skeleton/exploreSkeleton";

const Explore = () => {
  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  const isFocused = useIsFocused();
  const { data, isLoading, refetch } = useGetAllCategoriesQuery({});
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("Popular");

  //   useEffect(() => {
  //     setCategoriesData(data);
  //   }, [data]);

  const renderCategories = useCallback(
    (category: any, index: number) => {
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
            flexShrink: 1,
            width: "100%",
            // flexBasis: "48%",
          }}
        >
          <View className="relative items-center rounded-[8px] overflow-hidden pb-[8px] bg-[#2e2e2e] gap-[8px]">
            <GlassImage
              source={{ uri: category?.image?.url, width: 200, height: 200 }}
              resizeMode="cover"
              imageStyle={{
                width: "100%",
                height: 100,
              }}
              glassStyle={{
                width: "100%",
                height: 100,
              }}
              containerStyle={{
                width: "100%",
                height: 100,
              }}
              placeholderColor="rgba(255, 255, 255, 0.1)"
              tint="dark"
              blurIntensity={25}
              showActivityIndicator={false}
            />

            <View className=" shrink flex-row items-center justify-between">
              <View className="gap-[6px] shrink px-[4px]">
                <Text
                  className="text-[#fff] text-[12px] font-LexendDecaMedium shrink text-center self-center"
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
                <View className="flex-row gap-[4px] items-center justify-center">
                  <View
                    className="rounded-[4px] p-[2px] bg-[#DEFFEE] items-center justify-center"
                    style={{
                      backgroundColor: "#DEFFEE",
                    }}
                  >
                    <SimpleLineIcons name="chart" size={7} color="#66CB9F" />
                  </View>
                  <Text className="text-[8px] text-[#fff] font-LexendDeca">
                    {formatNumber(category?.statistics?.streams?.active)}{" "}
                    Streams |{" "}
                    {formatNumber(category?.statistics?.totalProducts)} Products
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [filter, categoriesData],
  );

  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

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
        <Text className="text-[#ccc] text-[18px] font-LexendDecaSemiBold mb-[14px]">
          Browse by Category
        </Text>
        <View className="flex-row items-center gap-[8px] mb-[13px]">
          <TouchableOpacity
            className={` rounded-[6px] py-[8px] px-[12px] justify-center items-center`}
            style={{
              backgroundColor:
                filter == "Popular" ? "#fff" : "rgba(204, 204, 204, 0.25)",
            }}
            onPress={() => setFilter("Popular")}
          >
            <Text
              className={`${filter == "Popular" ? "text-[#2F2E41]" : "text-[#cccccc]"}  text-[12px] font-LexendDecaMedium`}
            >
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={` rounded-[6px] py-[8px] px-[12px] justify-center items-center`}
            style={{
              backgroundColor:
                filter == "A-Z" ? "#fff" : "rgba(204, 204, 204, 0.25)",
            }}
            onPress={() => setFilter("A-Z")}
          >
            <Text
              className={`${filter == "A-Z" ? "text-[#2F2E41]" : "text-[#cccccc]"}  text-[12px] font-LexendDecaMedium`}
            >
              A-Z
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }, [filter]);

  return (
    <View
      className="flex-1 h-full bg-[#121212]"
      style={{ paddingTop: insets.top }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="pt-[30px] flex-1">
        <HomeHeader />

        <View className="flex-1">
          {isLoading ? (
            <ExploreSkeleton numOfLoaders={8} padding={16} height={140} />
          ) : (
            <FlatList
              data={categoriesData}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item, index }) => renderCategories(item, index)}
              numColumns={2}
              columnWrapperStyle={{
                gap: 12,
                justifyContent: "space-between",
              }}
              contentContainerStyle={{
                paddingTop: 24,
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={exploreHeader}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Explore;
