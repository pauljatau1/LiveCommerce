import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useGetAllProductsQuery } from "@/services/products";
import { category } from "@/services/categories";
import ProductCard from "@/components/global/product-card";
import { ScrollView } from "react-native-gesture-handler";
import CustomButton from "@/components/global/button/CustomButton";
import Favourite from "@/components/home/auqli-live/favourite";
import FavouriteExplore from "@/components/explore/favourite";
import SpotLightExplore from "@/components/explore/spot-light";
import SectionHeader from "@/components/global/section-header";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "@/components/global/bottom-sheet";
import SortSheet from "@/components/explore/exploreSortSheet";
import { catalogSort } from "@/helpers/helpers";
import ExploreMarkets from "@/components/explore/exploreMarkets";

const SingleExplore = () => {
  const { id, name: categoryName, subCategories } = useLocalSearchParams();
  const { data, error, isLoading } = useGetAllProductsQuery({
    category: categoryName || "fake",
  });
  const [tabOption, setTabOption] = useState<string>("");
  const [parsedSubCats, setParsedSubCats] = useState<Array<string>>();
  const [subCategory, setSubCategory] = useState<string>("");

  const [products, setProducts] = useState<any[]>([]);
  const [mode, setMode] = useState<string>("liveshow");

  const switchMode = useCallback((channel: string) => {
    setMode(channel);
  }, []);

  const numColumns = data?.data?.products?.length <= 2 ? 1 : 2;

  useEffect(() => {
    setParsedSubCats(subCategories?.toString().split(","));
  }, [subCategories]);

  useEffect(() => {
    const groupedforYouProducts = data?.data?.products?.reduce(
      (rows: any, product: any, index: any) => {
        if (index % numColumns === 0) rows.push([]);
        rows[rows.length - 1].push(product);
        return rows;
      },
      [] as any[][],
    );
    setProducts(groupedforYouProducts);
  }, [data]);

  const renderSubCategory = useCallback(
    (subCat: string) => {
      return (
        <TouchableOpacity
          className="bg-[#2e2e2e] rounded-[4px] items-center justify-center p-[8px] px-[10px]"
          style={{
            marginRight: 10,
          }}
          onPress={() => {
            if (mode == "liveshow") {
              return router.push({
                pathname: "/(root)/catalog/subCategoriesStreams",
                params: { category: categoryName, subCategory: subCat },
              });
            }
            router.push({
              pathname: "/(root)/catalog/subCategoriesCatalog",
              params: { name: subCat, mainCat: categoryName, subCat },
            });
          }}
        >
          <Text className="text-[#ccc] font-LexendDecaMedium text-[12px]">
            {subCat}
          </Text>
        </TouchableOpacity>
      );
    },
    [mode],
  );

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <View className="h-full relative flex-1">
          <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] mb-[24px] mt-[30px] relative">
            <TouchableOpacity
              className="absolute left-[12px]"
              onPress={() => router.replace("/(root)/(tabs)/explore/explore")}
            >
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>

            <Text className="text-white font-LexendDecaMedium text-[20px]">
              {categoryName}
            </Text>
          </View>
          <View className="w-full mb-[16px]">
            <FlatList
              data={parsedSubCats}
              renderItem={({ item }) => renderSubCategory(item)}
              keyExtractor={(item) => item.toString()}
              horizontal
              contentContainerStyle={{
                paddingHorizontal: 16,
              }}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {mode == "liveshow" ? (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 80,
              }}
            >
              <FavouriteExplore category={categoryName} />
              <SpotLightExplore />
            </ScrollView>
          ) : (
            <ExploreMarkets name={categoryName} switchMode={switchMode} />
          )}

          <View
            className="flex-row justify-around w-[260px] mx-auto absolute bottom-[20px] self-center"
            style={{
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 5,
                },
              }),
            }}
          >
            <CustomButton
              title="Live & Videos"
              textStyle={`${mode == "liveshow" ? "!text-[#fff]" : "!text-[#141B34]"}`}
              className={`rounded-tr-none rounded-br-none !w-[130px] rounded-[40px]  ${mode == "liveshow" ? "    !bg-primary-200" : "!bg-[#F2F2F2]  "}`}
              onPress={() => {
                switchMode("liveshow");
              }}
            />
            <CustomButton
              title="Marketplace"
              textStyle={`${mode == "marketplace" ? "!text-[#fff]" : "!text-[#141B34]"}`}
              className={`!w-[130px]   rounded-tl-none rounded-bl-none rounded-[40px] ${mode == "marketplace" ? "!bg-primary-200" : "!bg-[#F2F2F2]   "}`}
              onPress={() => {
                switchMode("marketplace");
              }}
            />
          </View>
        </View>

        {/* <View className="">
              <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
                Still Searching
              </Text>
              <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
                <CustomButton
                  title="Explore Categories"
                  textStyle="!font-LexendDecaSemiBold text-xs"
                  className="border !w-[175px]  rounded-md border-[#EDF2F7] bg-transparent"
                  onPress={() => {
                    router.push("/(root)/(tabs)/explore/explore");
                  }}
                />
                <CustomButton
                  title="Visit Community"
                  textStyle="!font-LexendDecaSemiBold text-xs"
                  className="!w-[175px] !bg-primary-200  rounded-md  "
                  onPress={() => {
                    router.push("/(root)/(tabs)/connect");
                  }}
                />
              </View>
            </View> */}
      </SafeAreaView>
    </>
  );
};

export default SingleExplore;
