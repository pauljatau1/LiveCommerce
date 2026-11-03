import { View, FlatList, Text, Dimensions, Animated } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import { useLivestream } from "../../contexts/livestreamContext";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import axios from "axios";
import LottieView from "lottie-react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const Shows = ({
  sellerId,
  scrollY,
  headerHeight,
  index,
}: {
  sellerId: string;
  scrollY: any;
  headerHeight: any;
  index: any;
}) => {
  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingActive, setLoadingActive] = useState<boolean>(true);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const fetchActiveLiveStreams = async () => {
    setLoadingActive(true);
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/seller/${sellerId}?status=live&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        if (response.data?.streams?.length > 0) {
          // setPage((prevPage) => prevPage + 1);
          setActiveStreams(response.data?.streams);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingActive(false);
    }
  };
  const fetchSpotlightLiveStreams = async () => {
    console.log("page : ", page);

    if (fetching || hasReachedEnd) {
      return;
    }
    if (page > 1) {
      setFetching(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/seller/${sellerId}?status=scheduled&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        if (response.data?.streams?.length > 0) {
          setPage((prevPage) => prevPage + 1);
          setSpotLight([...spotLight, ...response.data?.streams]);
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
    fetchActiveLiveStreams();
    fetchSpotlightLiveStreams();
  }, []);

  const renderEmptyActiveStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons
          name="videocam-outline"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5 }}
        />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center opacity-50">
          No Active Streams from this seller
        </Text>
      </View>
    );
  }, [activeStreams]);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons
          name="videocam-outline"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5 }}
        />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center opacity-50">
          No Upcoming Streams from this seller
        </Text>
      </View>
    );
  }, [spotLight]);

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
  }, [fetching, hasReachedEnd]);

  // useEffect(() => {
  //   if (flatListRef.current) {
  //     flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
  //   }
  // }, [index]);

  return (
    <View style={{ flex: 1 }}>
      <View>
        <View
          className="flex-row justify-between items-center"
          style={{ marginVertical: 12, paddingHorizontal: 16 }}
        >
          <Text className="text-white font-LexendDecaBold text-[16px]">
            Active Streams
          </Text>
        </View>
        {loading ? (
          <View
            style={{
              paddingTop: headerHeight + 12,
            }}
          >
            <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <Animated.FlatList
              ref={flatListRef}
              data={activeStreams}
              renderItem={({ item }) => (
                <View className="w-1/2 py-2 shrink">
                  <LiveProductCard item={item} />
                </View>
              )}
              keyExtractor={(item, index) => item?._id || index.toString()}
              nestedScrollEnabled={true}
              numColumns={2}
              contentContainerStyle={{
                justifyContent: "space-between",
                paddingTop: 0,
                paddingBottom: 20,
                gap: 12,
              }}
              ListEmptyComponent={renderEmptyActiveStreams}
            />
          </View>
        )}
      </View>
      <View>
        <View
          className="flex-row justify-between items-center"
          style={{ marginVertical: 12, paddingHorizontal: 16 }}
        >
          <Text className="text-white font-LexendDecaBold text-[16px]">
            Upcoming Streams
          </Text>
        </View>
        {loading ? (
          <View
            style={{
              paddingTop: headerHeight + 12,
            }}
          >
            <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <Animated.FlatList
              ref={flatListRef}
              data={spotLight}
              renderItem={({ item }) => (
                <View className="w-1/2 py-2 shrink">
                  <LiveProductCard item={item} />
                </View>
              )}
              keyExtractor={(item, index) => item?._id || index.toString()}
              nestedScrollEnabled={true}
              numColumns={2}
              contentContainerStyle={{
                justifyContent: "space-between",
                paddingTop: 0,
                paddingBottom: 20,
                gap: 12,
              }}
              ListEmptyComponent={renderEmptyStreams}
              // onEndReached={fetchSpotlightLiveStreams}
              // ListFooterComponent={renderListFooter}
              // onScroll={Animated.event(
              //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              //   { useNativeDriver: true },
              // )}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default memo(Shows);
