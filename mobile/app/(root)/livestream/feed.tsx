import {
  View,
  Text,
  Dimensions,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  RefreshControl,
} from "react-native";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import LivestreamStudioFeed from "@/app/(root)/livestream/livestreamStudioFeed";
import LiveAuctionStudioFeed from "@/app/(root)/livestream/liveAuctionStudioFeed";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import LottieView from "lottie-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken } from "@/store/features/auth/utils";

const { height } = Dimensions.get("window");

const LivestreamFeed = () => {
  const { id, type, itmSource } = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.authState.token);
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [lives, setLives] = useState<any[]>([{ _id: id, type }]);
  const [page, setPage] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const flatlistRef = useRef<FlatList>(null);

  const refreshLives = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/${id}/related?status=live&page=1&limit=5`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newStreams = response.data.streams;
      
      if (newStreams.length > 0) {
        setLives([{ _id: id, type }, ...newStreams]);
        setPage(2);
      }
    } catch (error) {
      console.error("Error refreshing livestreams:", error);
    } finally {
      setRefreshing(false);
    }
  }, [id, type]);

  const fetchNextLives = async () => {
    if (hasReachedEnd || fetching) {
      return;
    }
    setFetching(true);
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/${id}/related?status=live&page=${page}&limit=5`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newStreams = response.data.streams;

      if (newStreams.length > 0) {
        setLives((prevLives) => {
          return [...prevLives, ...newStreams];
        });
        setPage((prevPage) => prevPage + 1);
      } else {
        setHasReachedEnd(true);
      }
    } catch (error) {
      console.error("Error fetching more liveshows:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNextLives();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  const renderLive = useCallback(
    ({ item, index }: any) => {
      if (item?.type == "open_show") {
        return (
          <LivestreamStudioFeed
            id={item._id}
            isVisible={index === currentIndex}
            shared={itmSource?.toString() == "share"}
          />
        );
      }
      return (
        <LiveAuctionStudioFeed
          id={item._id}
          isVisible={index === currentIndex}
          shared={itmSource?.toString() == "share"}
        />
      );
    },
    [currentIndex, itmSource],
  );

  const renderFooter = useCallback(() => {
    if (refreshing && Platform.OS == "ios") {
      return (
        <View
          className="justify-between items-center"
          style={{
            marginTop: statusBarHeight,
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
            autoPlay
            loop
            style={{
              width: 40,
              height: 40,
            }}
          />
        </View>
      );
    } else {
      return null;
    }
  }, [refreshing, statusBarHeight]);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          height: height,
        }}
      >
        {lives?.length < 1 ? (
          <View className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
            <Image
              source={require("../../../assets/icons/auqli-logo.png")}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <LottieView
              source={require("../../../assets/lottie/dots-loading.json")}
              autoPlay
              loop
              style={{
                width: 50,
                height: 30,
              }}
            />
          </View>
        ) : (
          <FlatList
            ref={flatlistRef}
            data={lives}
            renderItem={renderLive}
            keyExtractor={(item, index) =>
              item?._id + index.toString() || index.toString()
            }
            pagingEnabled
            onEndReached={fetchNextLives}
            onEndReachedThreshold={1}
            initialNumToRender={5}
            maxToRenderPerBatch={3}
            windowSize={5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
   
            progressViewOffset={Platform.OS == "ios" ? 120 : 0}
            ListHeaderComponent={renderFooter}
            removeClippedSubviews={false}
            updateCellsBatchingPeriod={50}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="center"
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          />
        )}
      </View>
    </>
  );
};

export default LivestreamFeed;
