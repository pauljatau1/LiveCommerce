import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router, useGlobalSearchParams } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import CatalogCard from "@/components/catalog/catalogCard";
import { catalogFilterPrice, catalogSort } from "@/helpers/helpers";
import {
  useGetForYouQuery,
  useGetNewAuqliQuery,
  useGetTrendingQuery,
} from "@/services/products";
import BottomSheet from "@/components/global/bottom-sheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ActivityIndicator } from "react-native-paper";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/store/features/auth/utils";
import FilterSheet from "@/components/catalog/filterSheet";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import SortSheet from "@/components/global/sheets/sortSheet";

const MoreProducts = () => {
  const { name } = useGlobalSearchParams();
  // const { data, isLoading, isFetching, isError } =
  //   name == "For You"
  //     ? useGetForYouQuery({ limit: 50 })
  //     : name == "New on Auqli"
  //       ? useGetNewAuqliQuery({})
  //       : name == "Trending"
  //         ? useGetTrendingQuery({})
  //         : {};

  const [filter, setFilter] = useState<string>("None");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState<any>();
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);

  const handleGetProductData = async () => {
    let endpoint = "";

    switch (name) {
      case "For You":
        endpoint = "api/products/personalized";
        break;
      case "New on Auqli":
        endpoint = "api/products/just-arrived";
        break;
      case "Trending":
        endpoint = "api/products/trending";
        break;
    }

    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `${endpoint}?limit=50&period=month`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setProducts(response.data.data || response.data.products || []);
      setFilteredProducts(response.data.data || response.data.products);
    } catch (e) {
      console.log("ERROR GETTING MORE PRODUCT DATA", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSortType = (type: string) => {
    setShowSortSheet(false);
    setFilter(type);
    handleFilter(selectedFilters, type);
    // const sortedProducts = catalogSort(products, type);
    // setFilteredProducts(sortedProducts);
  };

  const handleFilter = (filters: any, sortType = "") => {
    let appliedFilters = products?.slice();
    if (filters?.price) {
      appliedFilters = catalogFilterPrice(appliedFilters, filters?.price);
    }
    if (filters?.condition) {
      appliedFilters = appliedFilters.filter(
        (product) =>
          product?.condition ==
          filters?.condition?.toLowerCase()?.replace(" ", "-"),
      );
    }
    appliedFilters = catalogSort(appliedFilters, sortType || filter);
    setFilteredProducts(appliedFilters);
    setShowFilterSheet(false);
    setSelectedFilters(filters);
  };

  const renderProducts = (item: any) => {
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
          profileImage={undefined}
          location={""}
          isTopSeller={false}
          isOnline={false}
          isLive={false}
          isVerified={false}
          showNike={false}
          onAddToCart={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      </View>
    );
  };

  const renderEmptyPlaceholder = useCallback(() => {
    return (
      <View className="">
        <Text className="text-white font-LexendDecaMedium text-[14px] text-center">
          No Products
        </Text>
      </View>
    );
  }, []);

  useEffect(() => {
    handleGetProductData();
  }, []);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <View className="w-full h-full">
          <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mt-4 relative">
            <TouchableOpacity
              activeOpacity={0.5}
              className="absolute left-[18px]"
              onPress={() => router.back()}
            >
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>

            <Text className="text-white font-LexendDecaMedium text-[24px]">
              {name}
            </Text>
          </View>

          {isLoading ? (
            <View>
              <ActivityIndicator size={"small"} color="#fff" />
            </View>
          ) : (
            <View className="px-[16px] flex-1">
              <View className="flex-row items-center gap-[8px] mb-[12px]">
                <TouchableOpacity
                  className={` rounded-[8px] py-[8px] px-[12px] justify-center items-center`}
                  style={{
                    backgroundColor: "rgba(204, 204, 204, 0.25)",
                  }}
                  onPress={() => setShowFilterSheet(true)}
                >
                  <FontAwesome6 name="sliders" size={15} color="#f2f2f2" />
                </TouchableOpacity>
                <TouchableOpacity
                  className={` rounded-[8px] py-[8px] px-[12px] gap-[8px] flex-row justify-center items-center`}
                  style={{
                    backgroundColor:
                      filter != "None" ? "#fff" : "rgba(204, 204, 204, 0.25)",
                  }}
                  onPress={() => setShowSortSheet(true)}
                >
                  <Text
                    className={`${filter != "None" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
                  >
                    Sort
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={16}
                    color={filter != "None" ? "#2F2E41" : "#f2f2f2"}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredProducts}
                renderItem={({ item, index }) => renderProducts(item)}
                keyExtractor={(item, index) => item._id.toString()}
                numColumns={2}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyPlaceholder}
              />
            </View>
          )}

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[11px]"
            showCloseIcon={false}
            show={showSortSheet}
            titleColor="!text-white"
            // snapPoints={["60%"]}
            onRequestClose={() => setShowSortSheet(false)}
            keyboardBehavior="interactive"
          >
            <SortSheet
              selectSortType={handleSelectSortType}
              currentSelection={filter}
            />
          </BottomSheet>

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[11px]"
            showCloseIcon={false}
            show={showFilterSheet}
            titleColor="!text-white"
            onRequestClose={() => setShowFilterSheet(false)}
            keyboardBehavior="interactive"
          >
            <FilterSheet
              selectFilterType={handleFilter}
              currentSelection={selectedFilters}
            />
          </BottomSheet>
        </View>
      </SafeAreaView>
    </>
  );
};

export default MoreProducts;
