import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import { data } from "@/constants";
import { useGetAllProductsQuery, useGetForYouQuery } from "@/services/products";
import { Skeleton } from "@rneui/themed";

const ForYouSection = () => {
  const { data: products, error, isLoading } = useGetForYouQuery({});

  const numColumns = products?.products.length <= 2 ? 1 : 2;
  const forYouProducts = products?.products ?? [];

  const groupedforYouProducts = forYouProducts.reduce(
    (rows: any, product: any, index: any) => {
      if (index % numColumns === 0) rows.push([]);
      rows[rows.length - 1].push(product);
      return rows;
    },
    [] as any[][],
  );

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
          />
        ))}
      </View>
    );
  };

  const renderSkeletonLoader = (row: any) => {
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
  };

  return (
    <View className="w-[100%]">
      <SectionHeader title="For You" btnText="View All" />
      <View style={{ paddingLeft: 22 }}>
        {isLoading ? (
          <FlatList
            key={1}
            data={Array(4).fill(0)}
            renderItem={({ item: row }) => renderSkeletonLoader(row)}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            className="pt-[14px]"
            numColumns={2}
            style={{
              justifyContent: "space-between",
            }}
          />
        ) : (
          <FlatList
            key={2}
            data={groupedforYouProducts}
            renderItem={({ item: row }) => renderContent(row)}
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

export default ForYouSection;
