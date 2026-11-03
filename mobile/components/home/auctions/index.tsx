import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import SectionHeader from "@/components/global/section-header";
import { router } from "expo-router";
import { icons } from "@/constants";
import LottieView from "lottie-react-native";

const Auctions = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const fetchAuctionLiveStreams = async () => {
    if (page > 1) {
      setFetching(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams?status=live&type=auction&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        if (response.data?.streams) {
          if (page == 1) {
            setSpotLight(response.data?.streams);
          } else {
            setSpotLight([...spotLight, ...response.data?.streams]);
          }

          setPage((prevPage) => prevPage + 1);
        }
        if (!response.data?.pagination?.hasMore) {
          setHasReachedEnd(true);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => {
    setPage(1);
    setRefreshing(true);
  };

  useEffect(() => {
    if (refreshing && page == 1) {
      fetchAuctionLiveStreams();
      setRefreshing(false);
    }
  }, [refreshing, page]);

  useEffect(() => {
    fetchAuctionLiveStreams();
  }, []);

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
            No Live Auction events right now!
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
      <View
        className="flex-row justify-between items-center"
        style={{ marginBottom: 16 }}
      >
        <Text className="text-white font-LexendDecaBold text-[16px]">
          Live Auctions
        </Text>
      </View>
    );
  }, []);

  const renderListFooter = useCallback(() => {
    if (fetching && !hasReachedEnd) {
      return (
        <View
          style={{
            marginTop: 20,
            width: "100%",

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
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
  }, [fetching, hasReachedEnd]);

  return (
    <View className="mt-[16px] w-[100%] pb-[15.5px] flex-1">
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
            renderItem={({ item }) => (
              <View className="w-1/2 py-2 shrink">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            onEndReached={fetchAuctionLiveStreams}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyStreams}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
          />
        </View>
      )}
    </View>
  );
};

export default Auctions;
