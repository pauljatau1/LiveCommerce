import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
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

const SingleExplore = () => {
  const { id, name: categoryName } = useGlobalSearchParams();
  const { data, error, isLoading } = useGetAllProductsQuery({
    category: categoryName || "fake",
  });
  const [tabOption, setTabOption] = useState<string>("");

  const [products, setProducts] = useState<any[]>([]);

  const numColumns = data?.data?.products?.length <= 2 ? 1 : 2;

  //   useEffect(() => {
  //     setProducts(data?.data?.products);
  //   }, [data]);

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

  const renderContent = (row: any[]) => {
    return (
      <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
        {row?.map((item) => (
          <ProductCard
            key={item._id}
            id={item._id}
            title={item.name}
            price={item.price}
            category={item.category}
            sellerName={item.seller?.storeName}
            imageUrl={item.images}
            sellerRating={item.stats?.averageRating}
            moreDetails={item}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <View className="h-full relative">
          <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mt-4 relative">
            <TouchableOpacity
              className="absolute left-[18px]"
              onPress={() => router.back()}
            >
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>

            <Text className="text-white font-LexendDecaMedium text-[24px]">
              {categoryName}
            </Text>
          </View>
          <View className="flex-row items-center gap-[8px] mb-[17px] mx-[23px]">
            <TouchableOpacity
              className={` rounded-[4px] py-[8px] px-[12px] justify-center items-center`}
              style={{
                backgroundColor: "rgba(204, 204, 204, 0.25)",
              }}
            >
              <FontAwesome6 name="sliders" size={12.5} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className={` rounded-[4px] py-[8px] px-[12px] justify-center items-center`}
              style={{
                backgroundColor: "rgba(204, 204, 204, 0.25)",
              }}
            >
              <Text
                className={`text-[#cccccc]  text-[10px] font-LexendDecaMedium`}
              >
                Sort
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            className="w-full h-[100%]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20,
            }}
          >
            <FavouriteExplore />
            <SpotLightExplore />
            <View style={{ paddingHorizontal: 23 }}>
              {isLoading ? (
                <ActivityIndicator
                  color="#16783A"
                  size="small"
                  style={{ marginTop: 20 }}
                />
              ) : products?.length < 1 ? (
                <Text className="text-white text-[18px] self-center m-[20px] font-LexendDecaBold">
                  No Products Found!
                </Text>
              ) : (
                <FlatList
                  data={products}
                  renderItem={({ item: row }) => renderContent(row)}
                  keyExtractor={(item, index) => `group-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pt-[14px]"
                />
              )}
            </View>

            <View className="pb-[50px]">
              <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
                Still Searching
              </Text>
              <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
                <CustomButton
                  title="Explore Categories"
                  textStyle="!font-LexendDecaSemiBold text-xs"
                  className="border !w-[175px]  rounded-md border-[#EDF2F7] bg-transparent"
                  onPress={() => {}}
                />
                <CustomButton
                  title="Visit Community"
                  textStyle="!font-LexendDecaSemiBold text-xs"
                  className="!w-[175px] !bg-primary-200  rounded-md  "
                  onPress={() => {}}
                />
              </View>
            </View>
            <View className="pb-[50px] flex-row justify-around w-[260px] mx-auto">
              <CustomButton
                title="Live Show"
                textStyle="!text-[#141B34]"
                className="!w-[130px] !bg-[#F2F2F2]  rounded-tr-none rounded-br-none"
                onPress={() => {
                  router.push("/(root)/(tabs)/home/home");
                }}
              />
              <CustomButton
                title="Markets"
                className="!w-[130px] rounded-tl-none rounded-bl-none rounded-[40px] !bg-primary-200 "
                onPress={() => {
                  router.push("/(root)/(tabs)/home/marketplace");
                }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

export default SingleExplore;
