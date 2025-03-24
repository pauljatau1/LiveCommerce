import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";
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
import ProductEmptyState from "@/components/global/empty-states/productEmptyState";

const SubCatProducts = () => {
  const { name, mainCat, subCat } = useLocalSearchParams();
  const [filter, setFilter] = useState<string>("None");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState<any>();
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const handleGetProductData = async () => {
    if (hasReachedEnd) {
      return;
    }
    let endpoint = `api/products/category/${mainCat}/subcategory/${subCat}`;

    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `${endpoint}?page=${page}&limit=10&sortBy=newest&order=desc`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setProducts([...products, ...response.data.data]);
      setFilteredProducts([...filteredProducts, ...response.data.data]);

      if (
        response.data?.currentPage == response.data?.totalPages ||
        response.data?.totalPages < 1
      ) {
        return setHasReachedEnd(true);
      }
      setPage((prevPage) => prevPage + 1);
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
    return <ProductEmptyState />;
  }, []);

  const renderListHeader = useCallback(() => {
    return (
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
    );
  }, [filter]);

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

            <Text className="text-white font-LexendDecaMedium text-[22px]">
              {name}
            </Text>
          </View>

          {isLoading ? (
            <View>
              <ActivityIndicator size={"small"} color="#16783A" />
            </View>
          ) : (
            <View className="px-[16px] flex-1">
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
                ListHeaderComponent={renderListHeader}
                ListEmptyComponent={renderEmptyPlaceholder}
                onEndReached={handleGetProductData}
              />
            </View>
          )}

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[11px]"
            showCloseIcon={false}
            show={showSortSheet}
            titleColor="!text-white"
            snapPoints={["60%"]}
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

const SortSheet = ({
  selectSortType,
  currentSelection,
}: {
  selectSortType: any;
  currentSelection: any;
}) => {
  const options = [
    "None",
    "Price: High to Low",
    "Price: Low to High",
    "Newest to Oldest",
    "Oldest to Newest",
  ];
  const [selectedType, setSelectedType] = useState<string>(currentSelection);
  return (
    <View className="my-[10px]" style={{ paddingBottom: 60 }}>
      <Text className="self-center font-LexendDeca text-[18px] text-[#fff]">
        Sort
      </Text>
      <View style={{ paddingBottom: 20 }}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            style={{
              paddingVertical: 15,
              paddingHorizontal: 10,
              borderBottomColor: "#888787",
              borderBottomWidth: StyleSheet.hairlineWidth,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setSelectedType(option)}
          >
            <Text className="text-[14px] text-[#fff] font-LexendDeca">
              {option}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
                borderColor: "#fff",
                borderWidth: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12,
                  backgroundColor: selectedType == option ? "#fff" : "",
                }}
              ></View>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-[20px] py-[2px]">
        <Pressable
          className="w-full py-[12px] items-center justify-center bg-[#16783A]"
          style={{ borderRadius: 25 }}
          onPress={() => selectSortType(selectedType)}
        >
          <Text className="text-[14px] text-[#fff] font-LexendDeca">
            Show Results
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SubCatProducts;
