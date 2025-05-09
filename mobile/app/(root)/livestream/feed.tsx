import {
  View,
  Text,
  Dimensions,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
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
  const { id, type, itmSource } = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.authState.token);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [lives, setLives] = useState<any[]>([{ _id: id, type }]);
  const [page, setPage] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const flatlistRef = useRef<FlatList>(null);
  const scrollBeginOffset = useRef(0);
  const isScrolling = useRef(false);
  const scrollThreshold = height * 0.3; // Threshold for deciding if scroll should snap to next or back

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

  const handleScrollBegin = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    // Save the starting position of the scroll
    scrollBeginOffset.current = event.nativeEvent.contentOffset.y;
    isScrolling.current = true;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // More aggressive tracking during scroll
    if (isScrolling.current) {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const scrollDistance = Math.abs(
        currentOffset - scrollBeginOffset.current,
      );

      // If we've scrolled a significant distance but less than the threshold,
      // prepare for a possible aggressive snap back
      if (scrollDistance > 20 && scrollDistance < scrollThreshold) {
        // We'll let the onMomentumScrollEnd handle the actual snap
      }
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isScrolling.current) return;

    isScrolling.current = false;
    const endOffset = event.nativeEvent.contentOffset.y;
    const scrollDistance = Math.abs(endOffset - scrollBeginOffset.current);

    // If scroll didn't move far enough, force snap back to original position
    if (scrollDistance < scrollThreshold) {
      // Force snap back to the original position
      flatlistRef.current?.scrollToOffset({
        offset: currentIndex * height,
        animated: true,
      });
    } else {
      // Determine if we should move to next or previous
      const direction = endOffset > scrollBeginOffset.current ? 1 : -1;
      const targetIndex = currentIndex + direction;

      // Ensure index is within bounds
      if (targetIndex >= 0 && targetIndex < lives.length) {
        flatlistRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0,
        });
        setCurrentIndex(targetIndex);
      } else {
        // Snap back if out of bounds
        flatlistRef.current?.scrollToOffset({
          offset: currentIndex * height,
          animated: true,
        });
      }
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
            shared={itmSource?.toString() == "share"}
          />
        );
      }
      return (
        <LiveAuctionStudioFeed
          id={item._id}
          isVisible={index == currentIndex}
          shared={itmSource?.toString() == "share"}
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
            ref={flatlistRef}
            data={lives}
            renderItem={renderLive}
            keyExtractor={(item, index) =>
              item?._id + index.toString() || index.toString()
            }
            pagingEnabled
            onEndReached={fetchNextLives}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="center"
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          />
        )}
      </View>
    </>
  );
};

export default LivestreamFeed;
