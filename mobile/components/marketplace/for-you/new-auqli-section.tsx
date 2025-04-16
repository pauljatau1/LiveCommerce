import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import { useGetNewAuqliQuery } from "@/services/products";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { FlatList, View, Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const ForYouNewAuqliSection = () => {
  const {
    data: products,
    error,
    isLoading,
  } = useGetNewAuqliQuery({ limit: 10 });

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
          No New Products right now
        </Text>
      </View>
    );
  }, [products]);

  return (
    <View className="pt-[30px] w-[100%] pb-[8px]">
      <SectionHeader title="New on Auqli" btnText="View All" />
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
            horizontal={products?.data?.length > 0}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
            }}
            className="pt-[14px]"
            ListEmptyComponent={renderEmptyPlaceholder}
          />
        )}
      </View>
    </View>
  );
};

export default ForYouNewAuqliSection;
