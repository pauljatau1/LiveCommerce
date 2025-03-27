import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useState, memo } from "react";
import {
  useDeepSearchProductsQuery,
  useGetAllProductsQuery,
} from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import CatalogCard from "./catalogCard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BottomSheet from "../global/bottom-sheet";
import { catalogFilterPrice, catalogSort } from "@/helpers/helpers";
import FilterSheet from "./filterSheet";
import ProductEmptyState from "../global/empty-states/productEmptyState";
import AuctionCard from "../global/auction-card";

const CatalogComponent = ({ searchQuery }: { searchQuery: any }) => {
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const { data, isLoading, isFetching, isError, refetch } =
    useDeepSearchProductsQuery({
      query: searchQuery,
      page,
      limit: 10,
    });
  const [filter, setFilter] = useState<string>("None");
  const [selectedFilters, setSelectedFilters] = useState<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);

  const fetchMoreProducts = () => {
    if (!isFetching && !hasReachedEnd) {
      console.log("catalog pagination ", {
        isFetching,
        hasReachedEnd,
      });

      setPage((prev) => prev + 1);
    }
  };

  const handleSelectSortType = (type: string) => {
    setShowSortSheet(false);
    setFilter(type);
    const sortedProducts = catalogSort(products, type);
    setFilteredProducts(sortedProducts);
  };

  const handleFilter = (filters: any) => {
    let appliedFilters = products?.slice();
    if (filters.price) {
      appliedFilters = catalogFilterPrice(appliedFilters, filters.price);
    }
    if (filters.condition) {
      appliedFilters = appliedFilters.filter(
        (product) =>
          product?.condition ==
          filters.condition.toLowerCase().replace(" ", "-"),
      );
    }

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
  }, [filteredProducts]);

  const renderEmptyPlaceholder = useCallback(() => {
    return <ProductEmptyState />;
  }, [filteredProducts]);

  useEffect(() => {
    if (data?.products?.length > 0) {
      setProducts([...products, ...data?.products]);
      setFilteredProducts([...filteredProducts, ...data?.products]);

      if (data?.pagination.total == data?.pagination?.pages) {
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [page]);

  return (
    <View className="px-[16px] py-[12px] ">
      {isLoading ? (
        <View>
          <ActivityIndicator size={"small"} color="#16783A" />
        </View>
      ) : (
        <View>
          <FlatList
            data={filteredProducts}
            renderItem={({ item, index }) => renderProducts(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 8,
            }}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyPlaceholder}
            onEndReached={fetchMoreProducts}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={renderListHeader}
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

export default memo(CatalogComponent);
