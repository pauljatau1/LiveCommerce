import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "../global/bottom-sheet";
import SortSheet from "./exploreSortSheet";
import { catalogSort } from "@/helpers/helpers";
import ExploreFilterSheet from "./exploreFilterSheet";
import { icons } from "@/constants";

const FavouriteExplore = ({ category }: any) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [liveFilter, setLiveFilter] = useState<string>("open_show");
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [filteredStreams, setFilteredStremas] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const fetchSpotlightLiveStreams = async () => {
    if (hasReachedEnd) {
      return;
    }
    if (page == 1) {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/category/${category?.toLowerCase()}?status=live&type=${liveFilter}&sortByView=${filter}&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        if (page == 1) {
          setSpotLight(response.data?.streams);
        } else {
          setSpotLight([...spotLight, ...response.data?.streams]);
        }
      }

      if (!response.data?.pagination.hasMore) {
        return setHasReachedEnd(true);
      }
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSortType = (type: string) => {
    setPage(1);
    setHasReachedEnd(false);
    setShowSortSheet(false);
    setFilter(type);
    const sortedStreams = catalogSort([], type);
    setFilteredStremas(sortedStreams);
  };

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, []);

  const handleSelectFilterType = (type: string) => {
    setPage(1);
    setHasReachedEnd(false);
    setShowFilterSheet(false);
    setLiveFilter(type);
  };

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          // paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 48,
            alignItems: "center",
            backgroundColor: "#000",
            borderRadius: 8,
            flexShrink: 1,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 102,
              height: 102,
              borderRadius: "50%",
              backgroundColor: "#DDF9E7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <Image
              source={icons.sadEmoji}
              resizeMode="contain"
              className="w-[40px] h-[40px]"
            />
          </View>

          <Text
            className="mb-[10px] text-center text-[16px] font-LexendDecaSemiBold text-white"
            style={{
              lineHeight: 22,
            }}
          >
            No Live Shopping events right now!
          </Text>
          <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            Follow your favourite sellers to get notified when they go live.
          </Text>
        </View>
      </View>
    );
  }, [spotLight]);

  const renderListHeader = useCallback(() => {
    return (
      <View className="flex-row items-center gap-[8px] mb-[17px]">
        <TouchableOpacity
          className={` rounded-[8px] py-[8px] px-[12px] justify-center items-center`}
          style={{
            backgroundColor: "rgba(204, 204, 204, 0.25)",
          }}
          onPress={() => setShowFilterSheet(true)}
        >
          <FontAwesome6 name="sliders" size={15} color="#f2f2f2" />
        </TouchableOpacity>
        {/* <TouchableOpacity
          className={` rounded-[8px] py-[8px] px-[12px] gap-[8px] flex-row justify-center items-center`}
          style={{
            backgroundColor:
              filter == "Auction" ? "#fff" : "rgba(204, 204, 204, 0.25)",
          }}
          onPress={() => {
            filter == "Auction" ? setFilter("") : setFilter("Auction");
          }}
        >
          <Text
            className={`${filter == "Auction" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
          >
            Auction
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          className={` rounded-[8px] py-[8px] px-[12px] gap-[8px] flex-row justify-center items-center`}
          style={{
            backgroundColor:
              filter && filter !== "Auction"
                ? "#fff"
                : "rgba(204, 204, 204, 0.25)",
          }}
          onPress={() => setShowSortSheet(true)}
        >
          <Text
            className={`${filter && filter !== "Auction" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
          >
            Sort
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={16}
            color={filter && filter !== "Auction" ? "#2F2E41" : "#f2f2f2"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          className={` rounded-[8px] py-[8px] px-[12px] gap-[8px] flex-row justify-center items-center`}
          style={{
            backgroundColor:
              liveFilter && liveFilter == "auction"
                ? "#fff"
                : "rgba(204, 204, 204, 0.25)",
          }}
          onPress={() => {
            setPage(1);
            setHasReachedEnd(false);
            liveFilter == "auction"
              ? setLiveFilter("")
              : setLiveFilter("auction");
          }}
        >
          <Text
            className={`${liveFilter && liveFilter == "auction" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
          >
            Live Auctions
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [filter, liveFilter]);

  const renderItems = useCallback(({ item }: any) => {
    return (
      <View className="w-1/2 py-2 shrink">
        <LiveProductCard item={item} />
      </View>
    );
  }, []);

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, [liveFilter, filter]);

  return (
    <View className=" w-[100%] pb-[15.5px]">
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={spotLight}
            renderItem={renderItems}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
            scrollEnabled={false}
            onEndReached={fetchSpotlightLiveStreams}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyStreams}
          />
        </View>
      )}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[0px]"
        showCloseIcon={false}
        show={showSortSheet}
        titleColor="!text-white"
        snapPoints={["60%"]}
        enableDynamicSizing={false}
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
        childrenStyle="!px-[0px]"
        showCloseIcon={false}
        show={showFilterSheet}
        titleColor="!text-white"
        snapPoints={["60%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowFilterSheet(false)}
        keyboardBehavior="interactive"
      >
        <ExploreFilterSheet
          selectFilterType={handleSelectFilterType}
          currentSelection={{ condition: liveFilter }}
        />
      </BottomSheet>
    </View>
  );
};

export default FavouriteExplore;
