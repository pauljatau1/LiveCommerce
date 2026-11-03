import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import { useGetNewAuqliQuery } from "@/services/products";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, memo } from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const ForYouNewAuqliSection = ({ source }: any) => {
  const {
    data: products,
    error,
    isLoading,
  } = useGetNewAuqliQuery({ limit: 10 });

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

  const renderFooter = useCallback(() => {
    return (
      <View
        className="h-[auto] items-center justify-center pl-[12px]"
        style={{
          flexGrow: 1,
        }}
      >
        <Pressable
          className="rounded-[16px] p-[5px] px-[10px] bg-[#16783A]"
          onPress={() => router.navigate("/(root)/(tabs)/home/marketplace")}
        >
          <Text className="font-LexendDecaMedium text-[#fff] text-[10px] self-center justify-center">
            See More
          </Text>
        </Pressable>
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
          No New Products right now
        </Text>
      </View>
    );
  }, [products]);

  return (
    <View className="pt-[30px] w-[100%] pb-[8px]">
      <SectionHeader
        title={source == "live" ? "New in Marketplace" : "New on Auqli"}
        btnText={source == "live" ? "" : "View All"}
      />
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
            renderItem={renderContent}
            keyExtractor={(item, index) => item?._id || `group-${index}`}
            horizontal={products?.data?.length > 0}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
            }}
            className="pt-[14px]"
            ListEmptyComponent={renderEmptyPlaceholder}
            ListFooterComponent={source == "live" ? renderFooter : null}
          />
        )}
      </View>
    </View>
  );
};

export default memo(ForYouNewAuqliSection);
