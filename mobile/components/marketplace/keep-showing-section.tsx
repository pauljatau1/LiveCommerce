import AuctionCard from "@/components/global/auction-card";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import useCarousel from "@/hooks/useCarousel";
import { useGetAllProductsQuery } from "@/services/products";
import { MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useState, memo } from "react";
import { FlatList, View, Text } from "react-native";
import ForYouHeader from "./for-you/for-you-header";

const KeepShowingSection = () => {
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [products, setProducts] = useState<any[]>([]);
  const { data, isFetching, refetch, error, isLoading } =
    useGetAllProductsQuery({ page, limit: 10 });
  // const { activeIndex, flatlistRef, handleScroll } = useCarousel({
  //   dataLength: data.productsData.length,
  //   autoScroll: false,
  // });

  // const renderDotIndicators = () => {
  //   return [1, 2, 3].map((_, index) => (
  //     <View
  //       key={index}
  //       style={{
  //         backgroundColor: activeIndex === index ? "#CCCCCC" : "#F2F2F2",
  //         height: 6,
  //         width: activeIndex === index ? 40 : 6,
  //         borderRadius: 3,
  //         marginHorizontal: 3,
  //       }}
  //     />
  //   ));
  // };
  const fetchMoreProducts = () => {
    if (!isFetching && !hasReachedEnd) {
      console.log("keep showing section ", {
        isFetching,
        hasReachedEnd,
        page,
      });

      setPage((prev) => prev + 1);
    }
  };

  const renderContent = useCallback(
    ({ item, index }: any) => {
      return (
        <View
          className="w-[100%]"
          style={{
            flexShrink: 1,
            marginVertical: 8,
            marginLeft: (index + 1) % 2 == 0 ? 4 : 16,
            marginRight: (index + 1) % 2 == 0 ? 16 : 4,
          }}
        >
          <ProductCard
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
    },
    [products],
  );

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
          No Products
        </Text>
      </View>
    );
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
            source={require("../../assets/lottie/dots-loading.json")}
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

  const renderListHeader = useCallback(() => {
    return (
      <>
        <ForYouHeader />
        <View className="flex-row items-center justify-between mb-[14px]">
          <SectionHeader title="Keep shopping" />
        </View>
      </>
    );
  }, []);

  useEffect(() => {
    if (data) {
      setProducts([...products, ...data?.data?.products]);

      if (!data?.data?.pagination?.hasNextPage) {
        console.log({
          isFetching,
          hasReachedEnd,
          page,
        });
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [page]);

  return (
    <View className=" w-[100%] pb-[10px] flex-1">
      <View className="flex-row items-center justify-between">
        <SectionHeader title="Keep shopping" />
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={products}
          renderItem={renderContent}
          keyExtractor={(item, index) => item?._id || `group-${index}`}
          onEndReached={fetchMoreProducts}
          onEndReachedThreshold={0.5}
          numColumns={2}
          // columnWrapperStyle={{
          //   justifyContent: "space-between",
          //   marginBottom: 8,
          //   paddingHorizontal: 16,
          // }}
          contentContainerStyle={{
            paddingBottom: 60,
          }}
          // estimatedItemSize={300}
          // scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          className="pt-[14px]"
          ListEmptyComponent={renderEmptyPlaceholder}
          ListFooterComponent={renderListFooter}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={100}
          windowSize={6}
          initialNumToRender={6}
          removeClippedSubviews={true}
          // ListHeaderComponent={renderListHeader}
        />
      </View>
    </View>
  );
};

export default memo(KeepShowingSection);
