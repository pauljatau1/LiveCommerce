import { View, Text, TouchableOpacity, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useGetAllProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import ProductCard from "@/components/global/product-card";
import CatalogCard from "@/components/catalog/catalogCard";
import ProductSkeleton from "@/components/skeleton/productSkeleton";
import ProductEmptyState from "@/components/global/empty-states/productEmptyState";
import { router } from "expo-router";

interface GeneralCategoryProps {
  name: string;
  category: any;
}

const GeneralCategory = ({ name, category }: GeneralCategoryProps) => {
  const [limit, setLimit] = useState<number>(10);
  const [subCategory, setSubCategory] = useState<string>("");
  const {
    data: categoryData,
    error,
    isLoading,
  } = useGetAllProductsQuery({ category: name, limit, subCategory });
  const strippedCategory = category?.subCategories?.map(
    (subcat: any) => subcat.name,
  );

  const renderSubCategory = (subCat: string) => {
    return (
      <TouchableOpacity
        className="bg-[#2e2e2e] rounded-[4px] items-center justify-center p-[8px] px-[10px]"
        style={{
          marginRight: 10,
        }}
        onPress={() =>
          router.push({
            pathname: "/(root)/catalog/subCategoriesCatalog",
            params: { name: subCat, mainCat: name, subCat },
          })
        }
      >
        <Text className="text-[#ccc] font-LexendDecaMedium text-[12px]">
          {subCat}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryData = (item: any) => {
    return (
      <View className="w-[100%] basis-[49%] h-[299px]">
        <CatalogCard
          key={item.id}
          id={item._id}
          title={item.name}
          price={item.price}
          category={item.category}
          sellerName={item.seller?.storeName}
          imageUrl={item.images}
          sellerRating={item.stats?.averageRating}
          moreDetails={item}
        />
      </View>
    );
  };

  const renderEmptyPlaceholder = () => {
    return <ProductEmptyState />;
  };

  return (
    <View className="w-full ">
      <View className="w-full mb-[20px]">
        <FlatList
          data={strippedCategory}
          renderItem={({ item }) => renderSubCategory(item)}
          keyExtractor={(item) => item.toString()}
          horizontal
          contentContainerStyle={{
            paddingHorizontal: 16,
          }}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {isLoading ? (
        <ProductSkeleton numOfLoaders={4} height={157} padding={16} />
      ) : (
        <View className="w-full justify-between gap-[8px] px-[16px]">
          <FlatList
            data={categoryData?.data?.products}
            renderItem={({ item, index }) => renderCategoryData(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between", // Add space between columns
              marginBottom: 8, // Add space between rows
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyPlaceholder}
          />
        </View>
      )}
    </View>
  );
};

export default GeneralCategory;
