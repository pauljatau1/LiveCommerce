import { View, Text, FlatList, TouchableOpacity } from "react-native";
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

const FavouriteExplore = ({ category }: any) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [liveFilter, setLiveFilter] = useState<string>("open_show");
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [filteredStreams, setFilteredStremas] = useState<any[]>([]);

  const fetchSpotlightLiveStreams = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/category/${category?.toLowerCase()}?status=live&type=${liveFilter}&sortByView=${filter}`,
      );
      if (response.status === 200) {
        console.log("spotlight streams", response.data?.streams?.length);
        setSpotLight(response.data?.streams);
        setFilteredStremas(response.data?.streams);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSortType = (type: string) => {
    setShowSortSheet(false);
    setFilter(type);
    const sortedStreams = catalogSort([], type);
    setFilteredStremas(sortedStreams);
  };

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, []);

  const handleSelectFilterType = (type: string) => {
    setShowFilterSheet(false);
    setLiveFilter(type);
  };

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Streams for this category
        </Text>
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
      </View>
    );
  }, [filter]);

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, [liveFilter, filter]);

  return (
    <View className=" w-[100%] pb-[15.5px]">
      {
        loading ? (
          <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
        ) : (
          // spotLight?.length < 1 ? (
          <View
            style={{
              paddingHorizontal: 16,
            }}
          >
            <FlatList
              data={spotLight}
              renderItem={({ item }) => (
                <View className="w-1/2 py-2 shrink">
                  <LiveProductCard item={item} />
                </View>
              )}
              keyExtractor={(item, index) => item?._id || index.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
              scrollEnabled={false}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyStreams}
            />
          </View>
        )
        // ) : (
        //   renderEmptyStreams()
        // )
      }
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
