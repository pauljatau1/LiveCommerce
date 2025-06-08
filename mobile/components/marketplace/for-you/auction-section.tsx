import AuctionCard from "@/components/global/auction-card";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import useCarousel from "@/hooks/useCarousel";
import { useGetAllAuctionProductsQuery } from "@/services/products";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, memo } from "react";
import { FlatList, Text, View } from "react-native";

const ForYouAuctionSection = () => {
  const isFocused = useIsFocused();
  const {
    data: products,
    error,
    isLoading,
    refetch,
  } = useGetAllAuctionProductsQuery({ status: "ongoing", limit: 10 });
  const { activeIndex, flatlistRef, handleScroll } = useCarousel({
    dataLength: data.productsData.length,
    autoScroll: false,
  });

  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  const renderContent = useCallback(({ item }: any) => {
    return (
      <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
        <AuctionCard item={item} showNike={false} />
      </View>
    );
  }, []);

  const renderDotIndicators = useCallback(() => {
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
  }, [activeIndex]);

  const renderEmptyAuctions = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <MaterialIcons
          name="local-offer"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5 }}
        />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Auctions right now
        </Text>
      </View>
    );
  }, [products]);
  return (
    <View className=" w-[100%] pb-[15px]">
      <View className="flex-row items-center justify-between">
        <SectionHeader title="Auctions" />
        <View className="mr-3">
          <View className="flex-row">{renderDotIndicators()}</View>
        </View>
      </View>

      {products?.products?.length > 0 ? (
        <View
          style={{
            paddingLeft: 22,
          }}
        >
          <FlatList
            data={products?.products}
            renderItem={renderContent}
            keyExtractor={(item, index) => item?._id || index?.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pt-[15px]"
            // pagingEnabled
            ListEmptyComponent={renderEmptyAuctions}
            onScroll={handleScroll}
          />
        </View>
      ) : (
        renderEmptyAuctions()
      )}
    </View>
  );
};

export default memo(ForYouAuctionSection);
