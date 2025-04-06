import { View, Text, Dimensions, FlatList, Image } from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import LivestreamStudioFeed from "@/app/(root)/livestream/livestreamStudioFeed";
import LiveAuctionStudioFeed from "@/app/(root)/livestream/liveAuctionStudioFeed";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import LottieView from "lottie-react-native";

const { height } = Dimensions.get("window");

const LivestreamFeed = () => {
  const { id, type } = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.authState.token);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [lives, setLives] = useState<any[]>([{ _id: id, type }]);
  const [page, setPage] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);

  // const fetchCurrentLive = async() => {

  // }

  const fetchNextLives = async () => {
    if (hasReachedEnd || fetching) {
      return;
    }
    setFetching(true);
    try {
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
      console.log(
        "gotten related new style",
        newStreams?.map((st: any) => st._id),
      );

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
            isVisible={index == currentIndex}
          />
        );
      }
      return (
        <LiveAuctionStudioFeed
          id={item._id}
          isVisible={index == currentIndex}
        />
      );
    },
    [currentIndex],
  );

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
            data={lives}
            renderItem={renderLive}
            keyExtractor={(item, index) =>
              item?._id + index.toString() || index.toString()
            }
            pagingEnabled
            onEndReached={fetchNextLives}
            onEndReachedThreshold={0.5}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            nestedScrollEnabled={true}
            // windowSize={0}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            // refreshing={refreshing}
            // onRefresh={refreshBlips}
            // progressViewOffset={Platform.OS == "ios" ? 120 : 0}
            // ListHeaderComponent={renderFooter}
          />
        )}
      </View>
    </>
  );
};

export default LivestreamFeed;
