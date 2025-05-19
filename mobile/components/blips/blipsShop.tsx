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
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import SellerCategories from "./sellerCategories";
import BlipsAuctions from "./blipsAuctions";

const tabs = ["Auctions", "Buy Now"];

const BlipsShop = ({ id, closeSheet }: { id: string; closeSheet: any }) => {
  const [tab, setTab] = useState<string>("Buy Now");
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetSellerProductsQuery({ id, page, limit: 15 });
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [products, setProducts] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>();

  const fetchMoreProducts = () => {
    if (!isFetching && !hasReachedEnd) {
      console.log("details ", {
        isFetching,
        hasReachedEnd,
      });

      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    refetch();
  }, [page]);

  const getSellerProfile = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/seller/${id}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setSeller(response.data);
    } catch (error) {
      console.error("Error fetching blips:", error);
    }
  }, []);

  useEffect(() => {
    if (data?.products?.length > 0) {
      setProducts([...products, ...data.products]);
    }

    if (data?.currentPage == data?.totalPages || data?.totalPages < 1) {
      setHasReachedEnd(true);
    }
  }, [data]);

  useEffect(() => {
    getSellerProfile();
  }, []);

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
    [tab, page, products],
  );

  const renderAuctions = useCallback(
    (item: any) => {
      return (
        <View style={{ width: "100%" }}>
          <BlipsAuctions id={item?._id} closeSheet={closeSheet} />
        </View>
      );
    },
    [tab],
  );

  const renderCategories = useCallback(
    (item: any) => {
      return (
        <View style={{ width: "100%" }}>
          <SellerCategories sellerId={id} />
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
            key={index}
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
    <View className="pt-[8px] pb-[28px] h-full">
      {isLoading ? (
        <ActivityIndicator size={"small"} color="#16783A" />
      ) : (
        <View className="h-[100%]">
          <View
            className="w-full flex-row items-center justify-between "
            style={{ marginBottom: 10, paddingHorizontal: 0 }}
          >
            <Pressable
              onPress={closeSheet}
              className="flex-end "
              style={{ marginLeft: "auto" }}
            >
              <View className=" w-[30px] h-[30px] rounded-[50%]">
                <AntDesign name="close" size={20} color="#fff" />
              </View>
            </Pressable>
          </View>
          <View className="w-full h-[98%]">
            <FlatList
              data={
                tab == "Auctions"
                  ? [{ _id: id }]
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
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 16,
                paddingHorizontal: tab == "Buy Now" ? 16 : 0,
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
    paddingHorizontal: 16,
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
