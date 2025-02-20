import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { useGetSellerProductsQuery } from "@/services/products";
import AntDesign from "@expo/vector-icons/AntDesign";
import CatalogCard from "../catalog/catalogCard";
import ShopCard from "../sellerProfile/shopItem";

const tabs = ["Auctions", "Buy Now", "Categories"];

const BlipsShop = ({ id, closeSheet }: { id: string; closeSheet: any }) => {
  const { data, isLoading, isFetching, isError, refetch } =
    useGetSellerProductsQuery({ id });

  const [tab, setTab] = useState<string>("Buy Now");
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [products, setProducts] = useState<any[]>([]);

  const fetchMoreProducts = useCallback(() => {
    if (!isFetching && !hasReachedEnd) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasReachedEnd]);

  useEffect(() => {
    if (data?.products) {
      setProducts([...products, ...data.products]);
    }
  }, [data]);

  const renderShopProducts = useCallback(
    (item: any) => {
      return (
        <View
          className="w-[100%] basis-[45%]"
          style={{
            flexBasis: "47%",
          }}
        >
          <ShopCard
            key={item?._id}
            id={item?._id}
            title={item?.name}
            price={item?.price}
            category={item?.category}
            sellerName={item?.seller?.storeName}
            imageUrl={item?.images}
            sellerRating={item?.stats?.averageRating}
            moreDetails={item}
            profileImage={undefined}
            location={""}
            isTopSeller={false}
            isOnline={false}
            isLive={false}
            isVerified={false}
            showNike={false}
            discount={item?.discount}
            onAddToCart={function (): void {
              throw new Error("Function not implemented.");
            }}
            closeSheet={closeSheet}
          />
        </View>
      );
    },
    [tab],
  );

  const renderAuctions = useCallback(
    (item: any) => {
      return (
        <View style={{ width: "100%" }}>
          <Text
            style={{
              marginHorizontal: "auto",
              marginVertical: 12,
              color: "#fff",
            }}
          >
            Auctions
          </Text>
        </View>
      );
    },
    [tab],
  );

  const renderCategories = useCallback(
    (item: any) => {
      return (
        <View style={{ width: "100%" }}>
          <Text
            style={{
              marginHorizontal: "auto",
              marginVertical: 12,
              color: "#fff",
            }}
          >
            Categories
          </Text>
        </View>
      );
    },
    [tab],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View style={styles.tabs}>
        {tabs.map((tabLabel, index) => (
          <TouchableOpacity
            style={[styles.tab, tabLabel == tab ? styles.activeTab : null]}
            onPress={() => setTab(tabLabel)}
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

  return (
    <View className="p-[8px] pb-[28px] h-full">
      {isLoading ? (
        <ActivityIndicator size={"small"} color="#16783A" />
      ) : (
        <View className="h-[100%]">
          <View
            className="w-full flex-row items-center justify-between "
            style={{ marginBottom: 10 }}
          >
            <Pressable
              onPress={closeSheet}
              className="flex-end "
              style={{ marginLeft: "auto" }}
            >
              <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
                <AntDesign name="closecircle" size={30} color="#F9C7B3" />
              </View>
            </Pressable>
          </View>
          <View className="w-full h-[98%]">
            <FlatList
              data={
                tab == "Auctions"
                  ? [{ _id: 1 }]
                  : tab == "Buy Now"
                    ? products
                    : [{ _id: 1 }]
              }
              renderItem={({ item, index }) =>
                tab == "Auctions"
                  ? renderAuctions(item)
                  : tab == "Buy Now"
                    ? renderShopProducts(item)
                    : renderCategories(item)
              }
              keyExtractor={(item, index) => item?._id.toString()}
              numColumns={2}
              onEndReached={fetchMoreProducts}
              onEndReachedThreshold={0.5}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 16,
              }}
              contentContainerStyle={{
                paddingBottom: 10,
              }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              ListHeaderComponent={renderListHeader}
            />
          </View>
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
    marginBottom: 16,
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

export default BlipsShop;
