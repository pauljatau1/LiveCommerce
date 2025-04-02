import AuctionCard from "@/components/global/auction-card";
import LiveProductCard from "@/components/global/live-product-card";
import ProductCard from "@/components/global/product-card";
import SectionHeader from "@/components/global/section-header";
import { data } from "@/constants";
import useCarousel from "@/hooks/useCarousel";
import {
  useGetAllAuctionProductsQuery,
  useGetAllBuyerAuctionProductsQuery,
} from "@/services/products";
import { useIsFocused } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MainAuctionCard from "../global/auction-card/main";
import ProductSkeleton from "../skeleton/productSkeleton";

const tabs = ["ongoing", "ended"];

const MyBids = ({ scrollY, headerHeight, index }: any) => {
  const isFocused = useIsFocused();
  const [status, setStatus] = useState<string>("ongoing");
  const [page, setPage] = useState<number>(1);
  const [tab, setTab] = useState<string>("ongoing");
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [myBids, setMyBids] = useState<any[]>([]);
  const {
    data: products,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllBuyerAuctionProductsQuery({
    status,
    page,
    limit: 5,
  });
  const flatListRef = useRef<FlatList>(null);

  const fetchMoreProducts = () => {
    if (!isFetching && !hasReachedEnd) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    refetch();
  }, [index]);

  useEffect(() => {
    // if (products?.products?.length > 0) {
    if (page == 1) {
      setMyBids(products?.products);
    } else {
      setMyBids([...myBids, ...products?.products]);
    }

    if (
      products?.pagination?.totalPages == products?.pagination?.currentPage ||
      products?.pagination?.totalPages < 1
    ) {
      setHasReachedEnd(true);
    }
    // }
  }, [products]);

  const renderEmptyAuctions = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          You are not participating in any auctions right now
        </Text>
      </View>
    );
  }, []);

  const renderMyBids = useCallback(({ item }: any) => {
    return (
      <View className="shrink basis-[49%] h-[299px] shrink">
        <MainAuctionCard item={item} closeSheet={() => null} />
      </View>
    );
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <View style={styles.tabs}>
        {tabs.map((tabLabel, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, tabLabel == tab ? styles.activeTab : null]}
            onPress={() => {
              setStatus(tabLabel);
              setPage(1);
              setHasReachedEnd(false);
              setTab(tabLabel);
            }}
          >
            <Text
              style={[
                styles.tabText,
                tabLabel == tab ? styles.activeTabText : null,
              ]}
            >
              {tabLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [tab]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [index]);
  return (
    <View className=" w-[100%] pb-[15px]">
      {(isFetching && page == 1) || isLoading ? (
        <View
          style={{
            paddingTop: headerHeight + 12,
          }}
        >
          <ProductSkeleton numOfLoaders={2} height={157} padding={16} />
        </View>
      ) : (
        <View className="">
          <Animated.FlatList
            ref={flatListRef}
            data={myBids}
            renderItem={renderMyBids}
            keyExtractor={(item, index) => item?._id || index?.toString()}
            numColumns={2}
            nestedScrollEnabled={true}
            contentContainerStyle={{
              paddingTop: headerHeight + 12,
              paddingHorizontal: 16,
              paddingBottom: 20,
              gap: 16,
            }}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 16,
            }}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyAuctions}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            onEndReached={fetchMoreProducts}
            onEndReachedThreshold={0.5}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: "rgba(204, 204, 204, 0.25)",
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 10,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
  activeTabText: {
    color: "#2F2E41",
  },
});

export default memo(MyBids);
