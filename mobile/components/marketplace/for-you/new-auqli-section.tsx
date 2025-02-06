import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import {
  useGetAllProductsQuery,
  useGetNewAuqliQuery,
} from "@/services/products";
import React from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const ForYouNewAuqliSection = () => {
  const {
    data: products,
    error,
    isLoading,
  } = useGetNewAuqliQuery({ limit: 10 });

  return (
    <View className="pt-[30px] w-[100%] pb-[8px]">
      <SectionHeader title="New on Auqli" btnText="View All" />
      <View
        style={{
          paddingLeft: 22,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size={"small"} color={"16783A"} />
        ) : (
          <FlatList
            data={products.data}
            renderItem={({ item: row }) => (
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
            )}
            keyExtractor={(item, index) => `group-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pt-[14px]"
          />
        )}
      </View>
    </View>
  );
};

export default ForYouNewAuqliSection;
