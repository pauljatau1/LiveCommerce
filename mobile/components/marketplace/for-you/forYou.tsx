import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useMemo } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import { data } from "@/constants";
import { useGetAllProductsQuery, useGetForYouQuery } from "@/services/products";
import { Skeleton } from "@rneui/themed";
import ProductSkeleton from "@/components/skeleton/productSkeleton";

const ForYouSection = () => {
  const { data: products, error, isLoading } = useGetForYouQuery({ limit: 10 });

  const numColumns = products?.products.length <= 2 ? 1 : 2;
  const forYouProducts = products?.products ?? [];

  const groupedforYouProducts = useMemo(
    () =>
      forYouProducts.reduce((rows: any, product: any, index: any) => {
        if (index % numColumns === 0) rows.push([]);
        rows[rows.length - 1].push(product);
        return rows;
      }, [] as any[][]),
    [forYouProducts],
  );

  const renderContent = useCallback(({ item }: any) => {
    return (
      <View
        className="w-[100%] basis-[49%] h-[299px]"
        style={{
          flexShrink: 1,
        }}
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
      <View className="">
        <Text className="text-white font-LexendDecaMedium text-[14px] text-center">
          No Products
        </Text>
      </View>
    );
  }, []);

  const renderSkeletonLoader = useCallback(({ item: row }: any) => {
    return (
      <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
        <View className=" bg-black rounded-lg p-[11.85px]  w-[173px] h-[299px] gap-[10px] shrink">
          <Skeleton
            style={{
              backgroundColor: "#121212",
            }}
            skeletonStyle={{
              backgroundColor: "rgba(0,0,0,0.05)",
              borderRadius: 5,
            }}
            animation="wave"
            width={149}
            height={157}
          />
          <Skeleton
            style={{
              backgroundColor: "#121212",
            }}
            skeletonStyle={{
              backgroundColor: "rgba(0,0,0,0.1)",
              borderRadius: 5,
            }}
            animation="wave"
            width={149}
            height={20}
          />
          <Skeleton
            style={{
              backgroundColor: "#121212",
            }}
            skeletonStyle={{
              backgroundColor: "rgba(0,0,0,0.02)",
              borderRadius: 5,
            }}
            animation="wave"
            width={50}
            height={20}
          />
        </View>
      </View>
    );
  }, []);

  return (
    <View className="w-[100%]">
      <SectionHeader title="For You" btnText="View All" />
      {isLoading ? (
        <ProductSkeleton numOfLoaders={2} height={157} padding={16} />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <FlatList
            key={2}
            data={products?.products}
            renderItem={renderContent}
            keyExtractor={(item, index) => item?._id || `group-${index}`}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
            className="pt-[14px]"
            ListEmptyComponent={renderEmptyPlaceholder}
          />
        </View>
      )}
    </View>
  );
};

export default ForYouSection;
