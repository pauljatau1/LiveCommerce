import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import React from "react";
import { FlatList, View } from "react-native";

const ForYouTrendingSection = () => {
  return (
    <View className="pt-[30px] w-[100%] pb-[50px]">
      <SectionHeader title="Trending" btnText="View All" />
      <View
        style={{
          paddingLeft: 22,
        }}
      >
        <FlatList
          data={data.productsData}
          renderItem={({ item: row }) => (
            <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
              <ProductCard {...row} showNike={false} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
        />
      </View>
    </View>
  );
};

export default ForYouTrendingSection;
