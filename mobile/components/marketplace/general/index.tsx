import { View, Text, TouchableOpacity, FlatList } from "react-native";
import React, { useCallback, useEffect, useState, memo } from "react";
import { useGetAllProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import ProductCard from "@/components/global/product-card";
import CatalogCard from "@/components/catalog/catalogCard";
import ProductSkeleton from "@/components/skeleton/productSkeleton";
import ProductEmptyState from "@/components/global/empty-states/productEmptyState";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { FlashList } from "@shopify/flash-list";
import { debounce } from "lodash";

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
        page,
      });

      setPage((prev) => prev + 1);
    }
  };

  const renderSubCategory = useCallback((subCat: string) => {
    return (
      <TouchableOpacity
        className="bg-[#2e2e2e] rounded-[10px] items-center justify-center p-[8px] px-[10px]"
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
  }, []);

  const renderCategoryData = ({ item }: any) => {
    return (
      <View
        className="w-[100%]"
        style={{
          flexShrink: 1,
          margin: 4,
        }}
      >
        <CatalogCard
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

  const renderEmptyPlaceholder = useCallback(() => {
    return <ProductEmptyState />;
  }, [products]);

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
      if (page == 1) {
        setProducts(data?.data?.products);
      } else {
        setProducts([...products, ...data?.data?.products]);
      }

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
    <View className="w-full flex-1">
      <View
        className="w-full mb-[20px] mt-[20px]"
        style={{
          marginTop: 20,
        }}
      >
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

      {isLoading || (isFetching && page == 1) ? (
        <ProductSkeleton numOfLoaders={4} height={157} padding={16} />
      ) : (
        <View className="w-full justify-between gap-[8px] px-[16px] flex-1">
          <FlashList
            data={products}
            renderItem={renderCategoryData}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            // columnWrapperStyle={{
            //   justifyContent: "space-between",
            //   marginBottom: 8,
            // }}
            contentContainerStyle={{
              paddingBottom: 60,
            }}
            estimatedItemSize={300}
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

export default memo(GeneralCategory);
