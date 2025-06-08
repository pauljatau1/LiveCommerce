import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import React, { useCallback, useEffect, useMemo, memo } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import { data } from "@/constants";
import { useGetAllProductsQuery, useGetForYouQuery } from "@/services/products";
import { Skeleton } from "@rneui/themed";
import ProductSkeleton from "@/components/skeleton/productSkeleton";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const ForYouSection = () => {
  const { data: products, error, isLoading } = useGetForYouQuery({ limit: 10 });

  // const numColumns = products?.products.length <= 2 ? 1 : 2;
  // const forYouProducts = products?.products ?? [];

  // const groupedforYouProducts = useMemo(
  //   () =>
  //     forYouProducts.reduce((rows: any, product: any, index: any) => {
  //       if (index % numColumns === 0) rows.push([]);
  //       rows[rows.length - 1].push(product);
  //       return rows;
  //     }, [] as any[][]),
  //   [forYouProducts],
  // );

  const renderContent = useCallback(({ item }: any) => {
    return (
      <View
        className="w-[100%] basis-[49%]"
        style={{
          flexShrink: 1,
        }}
        key={item?._id}
      >
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
          width={"100%"}
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
          Add more categories to get personalized products
        </Text>
        <Pressable
          className="rounded-[50px] px-[20px] py-[8px] bg-[#16783A]"
          onPress={() => router.push("/settings/updateCategories")}
        >
          <Text className="font-LexendDecaMedium text-[11px] text-[#fff]">
            Add a Category
          </Text>
        </Pressable>
      </View>
    );
  }, [products]);

  return (
    <View className="w-[100%]">
      <SectionHeader title="For You" btnText="View All" />
      {isLoading ? (
        <ProductSkeleton numOfLoaders={2} height={157} padding={16} />
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            paddingTop: 14,
            gap: 4,
          }}
        >
          {products?.products?.length > 0 &&
            products?.products?.map((item: any, index: number) =>
              renderContent({ item }),
            )}
          {/* <FlatList
            data={products?.products}
            renderItem={renderContent}
            keyExtractor={(item, index) => item?._id || `group-${index}`}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 8,
            }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            className="pt-[14px]"
            ListEmptyComponent={renderEmptyPlaceholder}
          /> */}
        </View>
      )}
    </View>
  );
};

export default memo(ForYouSection);
