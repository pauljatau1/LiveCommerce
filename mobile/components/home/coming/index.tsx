import { View, Text, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import SectionHeader from "@/components/global/section-header";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import LiveProductCard from "@/components/global/live-product-card";
import LottieView from "lottie-react-native";

const Coming = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [upcoming, setupcoming] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const fetchupcomingLiveStreams = async () => {
    if (page > 1) {
      setFetching(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams?status=scheduled&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        console.log("upcoming streams", response.data?.streams?.length);
        if (response.data?.streams?.length > 0) {
          setupcoming([...upcoming, ...response.data?.streams]);
          setPage((prevPage) => prevPage + 1);
        }
        if (!response.data?.pagination?.hasMore) {
          setHasReachedEnd(true);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchupcomingLiveStreams();
  }, []);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Upcoming Streams
        </Text>
      </View>
    );
  }, [upcoming]);

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
    <View className="mt-[16px] w-[100%] pb-[18px]">
      <View
        className="flex-row justify-between items-center"
        style={{ paddingHorizontal: 16, marginBottom: 16 }}
      >
        <Text className="text-white font-LexendDecaBold text-[16px]">
          Upcoming Streams
        </Text>
      </View>
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : upcoming?.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={upcoming}
            renderItem={({ item }) => (
              <View className="w-1/2 py-2 shrink">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
            onEndReached={fetchupcomingLiveStreams}
            ListFooterComponent={renderListFooter}
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
    </View>
  );
};

export default Coming;
