import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
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

const SingleExplore = () => {
  const { id, name: categoryName, subCategories } = useGlobalSearchParams();
  const { data, error, isLoading } = useGetAllProductsQuery({
    category: categoryName || "fake",
  });
  const [tabOption, setTabOption] = useState<string>("");
  const [parsedSubCats, setParsedSubCats] = useState<Array<string>>();
  const [subCategory, setSubCategory] = useState<string>("");

  const [products, setProducts] = useState<any[]>([]);

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

  // const renderContent = (row: any[]) => {
  //   return (
  //     <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
  //       {row?.map((item) => (
  //         <ProductCard
  //           key={item._id}
  //           id={item._id}
  //           title={item.name}
  //           price={item.price}
  //           category={item.category}
  //           sellerName={item.seller?.storeName}
  //           imageUrl={item.images}
  //           sellerRating={item.stats?.averageRating}
  //           moreDetails={item}
  //         />
  //       ))}
  //     </View>
  //   );
  // };

  const renderSubCategory = (name: string) => {
    return (
      <TouchableOpacity
        className="bg-[#2e2e2e] rounded-[4px] items-center justify-center p-[8px] px-[10px]"
        style={{
          marginRight: 10,
        }}
        onPress={() => setSubCategory(name)}
      >
        <Text className="text-[#ccc] font-LexendDecaMedium text-[12px]">
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

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

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
          >
            <FavouriteExplore category={categoryName} />
            <SpotLightExplore />
            {/* <View>
              <SectionHeader title="Products" btnText="" />
              {isLoading ? (
                <ActivityIndicator
                  color="#16783A"
                  size="small"
                  style={{ marginTop: 20 }}
                />
              ) : products?.length < 1 ? (
                <Text
                  className="text-[#ccc] text-[14px] self-center m-[20px] my-[40px] font-LexendDecaBold"
                  style={{ marginVertical: 40 }}
                >
                  No Products Found
                </Text>
              ) : (
                <FlatList
                  data={products}
                  renderItem={({ item: row }) => renderContent(row)}
                  keyExtractor={(item, index) => `group-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                  }}
                  className="pt-[14px]"
                />
              )}
            </View> */}

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
          </ScrollView>
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
              title="Live Show"
              className="!w-[130px]   rounded-tr-none rounded-br-none !bg-primary-200"
              onPress={() => {
                router.push("/(root)/(tabs)/home/home");
              }}
            />
            <CustomButton
              title="Markets"
              textStyle="!text-[#141B34]"
              className="!w-[130px] rounded-tl-none rounded-bl-none !bg-[#F2F2F2] rounded-[40px]  "
              onPress={() => {
                router.push("/(root)/(tabs)/home/marketplace");
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default SingleExplore;
