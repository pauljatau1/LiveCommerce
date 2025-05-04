import { View, Text, TouchableOpacity, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useGetAllProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import ProductCard from "@/components/global/product-card";
import CatalogCard from "@/components/catalog/catalogCard";
import ProductSkeleton from "@/components/skeleton/productSkeleton";
import ProductEmptyState from "@/components/global/empty-states/productEmptyState";
import { router } from "expo-router";
import LottieView from "lottie-react-native";

interface GeneralCategoryProps {
  name: string;
  category: any;
}

const GeneralCategory = ({ name, category }: GeneralCategoryProps) => {
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [subCategory, setSubCategory] = useState<string>("");
  const { data, isFetching, refetch, error, isLoading } =
    useGetAllProductsQuery({ category: name, page, limit, subCategory });

  const [products, setProducts] = useState<any[]>([]);
  const strippedCategory = category?.subCategories?.map(
    (subcat: any) => subcat.name,
  );

  const fetchMoreProducts = () => {
    if (!isFetching && !hasReachedEnd) {
      console.log("catalog pagination ", {
        isFetching,
        hasReachedEnd,
      });

      setPage((prev) => prev + 1);
    }
  };

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
      <View className="w-[100%] basis-[49%]">
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

  const renderListFooter = useCallback(() => {
    if (isFetching && !hasReachedEnd) {
      return (
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
            autoPlay
            loop
            style={{
              width: 70,
              height: 30,
            }}
          />
        </View>
      );
    } else {
      return null;
    }
  }, [isFetching, hasReachedEnd]);

  useEffect(() => {
    if (data) {
      setProducts([...products, ...data?.data?.products]);

      if (!data?.data?.pagination?.hasNextPage) {
        console.log({
          isFetching,
          hasReachedEnd,
        });
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [page]);

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
            data={products}
            renderItem={({ item, index }) => renderCategoryData(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between", // Add space between columns
              marginBottom: 8, // Add space between rows
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyPlaceholder}
            ListFooterComponent={renderListFooter}
            onEndReached={fetchMoreProducts}
            onEndReachedThreshold={0.5}
          />
        </View>
      )}
    </View>
  );
};

export default GeneralCategory;
