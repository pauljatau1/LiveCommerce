import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useState, memo } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import SectionHeader from "@/components/global/section-header";
import { router } from "expo-router";
import { icons } from "@/constants";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "../global/bottom-sheet";
import ExploreFilterSheet from "../explore/exploreFilterSheet";
import SortSheet from "../explore/exploreSortSheet";
import { catalogSort } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import { getToken } from "@/store/features/auth/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const SellerCatalog = ({ query }: any) => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [sellers, setSellers] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("desc");
  const [liveFilter, setLiveFilter] = useState<string>("open_show");
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);

  const handleSelectSortType = (type: string) => {
    setPage(1);
    setHasReachedEnd(false);
    setShowSortSheet(false);
    setFilter(type);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleSelectFilterType = (type: string) => {
    console.log("sort tyope", type);

    setPage(1);
    setHasReachedEnd(false);
    setShowFilterSheet(false);
    setLiveFilter(type);
  };

  const fetchSellers = async () => {
    if (fetching || hasReachedEnd) {
      return;
    }
    if (page == 1) {
      setLoading(true);
    } else {
      setFetching(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/seller/search?query=${query}&page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 200) {
        if (page == 1) {
          setSellers(response.data?.sellers);
        } else {
          setSellers([...sellers, ...response.data?.sellers]);
        }

        setPage((prevPage) => prevPage + 1);
      }

      if (response.data?.sellers?.length < 1) {
        return setHasReachedEnd(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setFetching(false);

      setLoading(false);
    }
  };

  //   useEffect(() => {
  //     fetchSellers();
  //   }, []);

  //   useEffect(() => {
  //     fetchSellers();
  //   }, [liveFilter, filter]);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 48,
            alignItems: "center",
            // backgroundColor: "#000",
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
            No Sellers Found!
          </Text>
          {/* <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            Follow your favourite sellers to get notified when they go live.
          </Text> */}
        </View>
      </View>
    );
  }, [sellers]);

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

  return (
    <View className="mt-[9px] w-[100%] pb-[15.5px] flex-1">
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            flex: 1,
          }}
        >
          <FlatList
            data={sellers}
            renderItem={({ item }) => <SellerCard item={item} />}
            keyExtractor={(item, index) => item?._id || index.toString()}
            onEndReached={fetchSellers}
            onEndReachedThreshold={0.5}
            // ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyStreams}
            showsVerticalScrollIndicator={false}
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

const SellerCard = memo(({ item }: any) => {
  const [following, setFollowing] = useState<boolean>(
    item?.isFollowing || false,
  );
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const handleFollow = async (action: string, item: any) => {
    let method = "";
    if (action == "follow") {
      method = "POST";
    } else {
      method = "DELETE";
    }
    setFollowLoading(true);
    const token = await getToken();
    const config = {
      url: process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${item?._id}`,
      method,
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {},
    };
    try {
      const response = await axios(config);
      console.log("follow from profile ", response.data);
      if (action == "follow") {
        setFollowing(true);
      } else {
        setFollowing(false);
      }
    } catch (error) {
      console.error("Error following seller:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <Pressable
      style={styles.followingCard}
      onPress={() =>
        router.push({
          pathname: "/(root)/sellerProfile",
          params: { sellerId: item?._id, sellerAvatar: item?.sellerAvatar },
        })
      }
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}
      >
        <View className="bg-[#2e2e2e] rounded-full">
          <Image
            source={{ uri: item?.storeAvatar }}
            style={styles.followingImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.followingText} numberOfLines={1}>
          {item?.storeName || item?.businessName || "Filler Store"}
        </Text>
      </View>
      <Pressable
        className="w-[100px] items-center justify-center rounded-[6px] border-[#16783A] border-[1px]"
        style={{
          height: 31,
          paddingVertical: 7.5,
          width: 100,
          backgroundColor: following ? "#121212" : "#16783A",
        }}
        onPress={() => handleFollow(following ? "unfollow" : "follow", item)}
      >
        <Text className="text-white font-LexendDeca text-[10px]">
          {followLoading ? (
            <ActivityIndicator size={10} color="#fff" />
          ) : following ? (
            "Following"
          ) : (
            "Follow"
          )}
        </Text>
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  followingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 24,
  },
  followingText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "LexendDeca",
    flexShrink: 1,
  },
  followingImage: {
    width: 45,
    height: 45,
    borderRadius: 45,
  },
});

export default memo(SellerCatalog);
