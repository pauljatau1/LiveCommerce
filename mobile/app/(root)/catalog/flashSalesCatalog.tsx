import {
  View,
  Text,
  Pressable,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import BottomSheet from "@/components/global/bottom-sheet";
import FilterSheet from "@/components/catalog/filterSheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import CatalogCard from "@/components/catalog/catalogCard";
import { useGetDiscountedProductsQuery } from "@/services/products";
import ProductEmptyState from "@/components/global/empty-states/productEmptyState";
import LottieView from "lottie-react-native";
import ProductSkeleton from "@/components/skeleton/productSkeleton";
import { debounce } from "lodash";

const sortMap = {
  None: "",
  "Price: High to Low": "price_desc",
  "Price: Low to High": "price_asc",
  "Newest to Oldest": "newest",
  "Oldest to Newest": "oldest",
} as any;

const FlashSalesCatalog = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const [filter, setFilter] = useState<string>("None");
  const [selectedFilters, setSelectedFilters] = useState<any>();
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDiscountedProductsQuery({
      page,
      limit: 10,
      sortBy: filter,
      minPrice: selectedFilters?.price?.min,
      maxPrice: selectedFilters?.price?.max,
      condition: selectedFilters?.condition?.toLowerCase()?.replace(" ", "-"),
    });
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);

  const fetchMoreProducts = useCallback(
    debounce(() => {
      if (!isFetching && !hasReachedEnd) {
        console.log("flash sales catalog pagination ", {
          isFetching,
          hasReachedEnd,
          page,
        });
        setPage((prev) => prev + 1);
      }
    }, 500),
    [isFetching, hasReachedEnd],
  );

  const handleSelectSortType = (type: string) => {
    setShowSortSheet(false);
    console.log("catalog sort applied", {
      value: sortMap[type],
    });

    setFilter(sortMap[type]);
    setPage(1);
    setHasReachedEnd(false);
  };

  const handleFilter = (filters: any) => {
    setShowFilterSheet(false);
    setSelectedFilters(filters);
    setPage(1);
    setHasReachedEnd(false);
  };

  const renderProducts = ({ item }: any) => {
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

  const renderListHeader = useCallback(() => {
    return (
      <View>
        <View
          className="w-full mb-[12px]"
          style={{
            height: insets.top + 200,
            backgroundColor: "#5466B5",
          }}
        >
          <Image
            source={require("@/assets/images/flash-sales-banner.png")}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="fill"
          />
        </View>
        <View className="flex-row items-center gap-[8px] mb-[12px] px-[16px]">
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
              className={`${filter != "None" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDeca tracking-[-0.16px]`}
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
      </View>
    );
  }, [filter]);

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
            source={require("@/assets/lottie/dots-loading.json")}
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
  }, []);

  useEffect(() => {
    if (data && data?.success) {
      if (page == 1) {
        setProducts(data?.data?.products);
        setFilteredProducts(data?.data?.products);
      } else {
        setProducts([...products, ...data?.data?.products]);
        setFilteredProducts([...filteredProducts, ...data?.data?.products]);
      }

      if (!data?.data?.pagination?.hasNextPage) {
        setHasReachedEnd(true);
      }
    }
  }, [data]);

  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212]" edges={["bottom"]}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 pt-[12px] items-center justify-center">
            {/* <ProductSkeleton numOfLoaders={4} /> */}
            <ActivityIndicator size={"small"} color="#fff" />
          </View>
        ) : (
          <View className="flex-1 pt-[12px]">
            <View
              className="absolute z-[10000]"
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: 20,
              }}
            >
              <Pressable
                className="p-[8px] bg-[#FFFFFF1A] items-center justify-center rounded-[5px] self-start"
                onPress={() => router.back()}
              >
                <Feather name="chevron-left" size={20} color="#F4FFF8" />
              </Pressable>
            </View>
            <FlatList
              data={filteredProducts}
              renderItem={renderProducts}
              keyExtractor={(item, index) => item?._id}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 8,
                paddingHorizontal: 16,
              }}
              contentContainerStyle={{
                paddingBottom: 80,
              }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyPlaceholder}
              onEndReached={fetchMoreProducts}
              onEndReachedThreshold={0.8}
              ListHeaderComponent={renderListHeader}
              ListFooterComponent={renderListFooter}
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
                    backgroundColor:
                      selectedType == option ||
                      sortMap[options[index]] == selectedType
                        ? "#fff"
                        : "",
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

export default FlashSalesCatalog;
