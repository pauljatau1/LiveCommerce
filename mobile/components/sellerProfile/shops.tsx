import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useGetSellerProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import CatalogCard from "../catalog/catalogCard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BottomSheet from "../global/bottom-sheet";
import { catalogFilterPrice, catalogSort } from "@/helpers/helpers";
import ShopCard from "./shopItem";
import FilterSheet from "../catalog/filterSheet";
import { debounce } from "lodash";

const Shops = ({ sellerId, headerHeight, index }: any) => {
  const [page, setPage] = useState<number>(1);
  const { data, isLoading, isFetching, isError, refetch } =
    useGetSellerProductsQuery({
      id: sellerId,
      page: page,
      visibility: "visible",
      status: "active",
      limit: 10,
    });
  const [filter, setFilter] = useState<string>("None");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState<any>();
  const flatListRef = useRef<FlatList>(null);

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

  const renderProducts = useCallback(({ item }: any) => {
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
          closeSheet={() => null}
        />
      </View>
    );
  }, []);

  const fetchMoreProducts = debounce(() => {
    if (isFetching || hasReachedEnd) {
      return;
    }
    if (!isFetching && !hasReachedEnd) {
      console.log("catalog pagination ", {
        isFetching,
        hasReachedEnd,
        page,
      });
      setPage((prevPage) => prevPage + 1);
    }
  }, 400);

  useEffect(() => {
    if (data) {
      if (data?.products) {
        setProducts([...products, ...data.products]);
        setFilteredProducts([...filteredProducts, ...data.products]);
      }

      if (data?.currentPage == data?.totalPages || data?.totalPages == 0) {
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  // useEffect(() => {
  //   if (flatListRef.current) {
  //     flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
  //   }
  // }, [index]);

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
          No Products for this seller
        </Text>
      </View>
    );
  }, [filter, filteredProducts, products]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {isLoading ? (
        <View
          style={{
            paddingTop: headerHeight + 12,
          }}
        >
          <ActivityIndicator size={"small"} color="#16783A" />
        </View>
      ) : (
        <View>
          <FlatList
            ref={flatListRef}
            data={filteredProducts}
            renderItem={renderProducts}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            onEndReached={fetchMoreProducts}
            // nestedScrollEnabled={true}
            // onEndReachedThreshold={0.5}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 20,
            }}
            contentContainerStyle={{
              paddingTop: headerHeight + 12,
            }}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyPlaceholder}
            showsVerticalScrollIndicator={false}
            // onScroll={Animated.event(
            //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            //   { useNativeDriver: true },
            // )}
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
  );
};

const SortSheet = memo(
  ({
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
  },
);

export default memo(Shops);
