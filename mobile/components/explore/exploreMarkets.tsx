import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useState, memo } from "react";
import {
  useDeepSearchProductsQuery,
  useGetAllProductsQuery,
} from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import CatalogCard from "../catalog/catalogCard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BottomSheet from "../global/bottom-sheet";
import { catalogFilterPrice, catalogSort } from "@/helpers/helpers";
import FilterSheet from "../catalog/filterSheet";
import ProductEmptyState from "../global/empty-states/productEmptyState";
import AuctionCard from "../global/auction-card";
import LottieView from "lottie-react-native";
import MainAuctionCard from "../global/auction-card/main";
import CustomButton from "../global/button/CustomButton";
import { router } from "expo-router";

const ExploreMarket = ({ name, switchMode }: any) => {
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const { data, isFetching, refetch, error, isLoading } =
    useGetAllProductsQuery({
      category: encodeURIComponent(name),
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
        {item?.status == "offline_auction" ? (
          <MainAuctionCard item={item} closeSheet={() => null} />
        ) : (
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
        )}
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

  const renderEmptyPlaceholder = useCallback(() => {
    return <ProductEmptyState />;
  }, [filteredProducts]);

  useEffect(() => {
    if (data) {
      if (page == 1) {
        setProducts(data?.data?.products);
        setFilteredProducts(data?.data?.products);
      } else {
        setProducts([...products, ...data?.data?.products]);
        setFilteredProducts([...filteredProducts, ...data?.data?.products]);
      }

      if (!data?.data?.pagination.hasNextPage) {
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  // useEffect(() => {
  //   refetch();
  // }, [page]);

  return (
    <View className="px-[16px] flex-1 ">
      {isLoading ? (
        <View>
          <ActivityIndicator size={"small"} color="#fff" />
        </View>
      ) : (
        <View>
          <FlatList
            data={filteredProducts}
            renderItem={({ item, index }) => renderProducts(item)}
            keyExtractor={(item, index) => item?._id || index.toString()}
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
            ListFooterComponent={renderListFooter}
          />
        </View>
      )}

      {/* <View
        className="flex-row justify-around w-[260px] mx-auto absolute bottom-[20px] self-center"
        style={{
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
            },
            android: {
              elevation: 5,
            },
          }),
        }}
      >
        <CustomButton
          title="Live Show"
          className="!w-[130px]   rounded-tr-none rounded-br-none !bg-primary-200"
          onPress={() => {
            switchMode("liveshow");
          }}
        />
        <CustomButton
          title="Markets"
          textStyle="!text-[#141B34]"
          className="!w-[130px] rounded-tl-none rounded-bl-none !bg-[#F2F2F2] rounded-[40px]  "
          //   onPress={() => {
          //     router.push("/(root)/(tabs)/home/marketplace");
          //   }}
        />
      </View> */}

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

export default memo(ExploreMarket);
