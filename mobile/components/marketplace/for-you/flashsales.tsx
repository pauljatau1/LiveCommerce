import { View, Text, FlatList } from "react-native";
import React, { useCallback } from "react";
import { useGetDiscountedProductsQuery } from "@/services/products";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { useRouter } from "expo-router";

const Flashsales = () => {
  const router = useRouter();
  const { data, error, isLoading } = useGetDiscountedProductsQuery({
    limit: 10,
  });

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
  return (
    <View>
      {data?.data?.products?.length > 0 && (
        <View>
          {isLoading ? (
            <></>
          ) : (
            <View className="bg-[#C65E46] w-[100%] py-[8px] pt-[24px]">
              <SectionHeader
                title="Flash Sales 🎉"
                btnText="See All"
                action={() => router.push("/catalog/flashSalesCatalog")}
              />

              <FlatList
                data={data?.data?.products}
                // data={[]}
                renderItem={renderContent}
                keyExtractor={(item, index) => item?._id || `group-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pt-[14px]"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default Flashsales;
