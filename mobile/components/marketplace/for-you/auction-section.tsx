import AuctionCard from "@/components/global/auction-card";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import useCarousel from "@/hooks/useCarousel";
import { useGetAllAuctionProductsQuery } from "@/services/products";
import React from "react";
import { FlatList, View } from "react-native";

const ForYouAuctionSection = () => {
  const {
    data: products,
    error,
    isLoading,
  } = useGetAllAuctionProductsQuery({ status: "ongoing", limit: 10 });
  const { activeIndex, flatlistRef, handleScroll } = useCarousel({
    dataLength: data.productsData.length,
    autoScroll: false,
  });

  const renderDotIndicators = () => {
    return [1, 2, 3].map((_, index) => (
      <View
        key={index}
        style={{
          backgroundColor: activeIndex === index ? "#CCCCCC" : "#F2F2F2",
          height: 6,
          width: activeIndex === index ? 40 : 6,
          borderRadius: 3,
          marginHorizontal: 3,
        }}
      />
    ));
  };
  return (
    <View className=" w-[100%] pb-[15px]">
      <View className="flex-row items-center justify-between">
        <SectionHeader title="Auctions" />
        <View className="mr-3">
          <View className="flex-row">{renderDotIndicators()}</View>
        </View>
      </View>
      <View
        style={{
          paddingLeft: 22,
        }}
      >
        <FlatList
          data={products?.products}
          renderItem={({ item }) => (
            <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
              <AuctionCard item={item} showNike={false} />
            </View>
          )}
          keyExtractor={(item, index) => item?._id || index?.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[15px]"
          pagingEnabled
          onScroll={handleScroll}
        />
      </View>
    </View>
  );
};

export default ForYouAuctionSection;
