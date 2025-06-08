import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import { useGetNewAuqliQuery, useGetTrendingQuery } from "@/services/products";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, memo } from "react";
import { FlatList, View, Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const ForYouTrendingSection = () => {
  const {
    data: products,
    error,
    isLoading,
  } = useGetTrendingQuery({ limit: 10 });

  const renderContent = useCallback(({ item: row, index }: any) => {
    return (
      <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
        <ProductCard
          price={row?.price}
          id={row?._id}
          imageUrl={row?.images}
          sellerName={row?.seller?.storeName}
          category={row?.category}
          // showNike={false}
          title={row?.name}
          sellerRating={row?.stats?.averageRating}
          moreDetails={row}
        />
      </View>
    );
  }, []);

  const renderEmptyPlaceholder = useCallback(() => {
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
          name="inventory"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5 }}
        />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center mx-[10px] mb-[10px]">
          No Trending Products right now
        </Text>
      </View>
    );
  }, [products]);

  return (
    <View className="pt-[30px] w-[100%] pb-[8px]">
      <SectionHeader title="Trending" btnText="View All" />
      <View
        style={
          {
            // paddingLeft: 16,
          }
        }
      >
        {isLoading ? (
          <ActivityIndicator size={"small"} color={"16783A"} />
        ) : (
          <FlatList
            data={products?.data}
            // data={[]}
            renderItem={renderContent}
            keyExtractor={(item, index) => item?._id || `group-${index}`}
            horizontal={products?.data?.length > 0}
            showsHorizontalScrollIndicator={false}
            className="pt-[14px]"
            contentContainerStyle={{
              paddingHorizontal: 16,
            }}
            ListEmptyComponent={renderEmptyPlaceholder}
          />
        )}
      </View>
    </View>
  );
};

export default memo(ForYouTrendingSection);
