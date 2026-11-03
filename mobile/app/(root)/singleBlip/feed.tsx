import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Dimensions,
  FlatList,
  Platform,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import VideoItem from "@/components/blips/videoItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import axios from "axios";
import { toast } from "@/core/toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getToken } from "@/store/features/auth/utils";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import Constants from "expo-constants";
import { difference } from "lodash";
import { createVideoPlayer, VideoPlayer } from "expo-video";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useCreateVideoPlayers } from "@/contexts/videoPlayerContext";

const { height } = Dimensions.get("window");

type CurrentSource = {
  source: string;
} | null;

const BlipsFeed = () => {
  const isFocused = useIsFocused();
  const { id, productId, itmSource } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Constants.statusBarHeight;
  const tabBarHeight = insets.bottom;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewHeight, setViewHeight] = useState<number | null>(null);
  // const [players, setPlayers] = useState<VideoPlayer[] | null>(null);
  const [currentSources, setCurrentSources] = useState<
    [CurrentSource, CurrentSource, CurrentSource]
  >([null, null, null]);

  const { players, createThreePlayers, clearPlayers } = useCreateVideoPlayers();

  // const createVideoPlayers = useCallback((sources: string[]) => {
  //   const bufferOptions = {
  //     preferredForwardBufferDuration: Platform.select({
  //       ios: 2, // Reduce from 5 to 3
  //       android: 3,
  //     }),
  //   };
  //   const player1 = createVideoPlayer(sources?.[0]);
  //   player1.loop = true;
  //   player1.bufferOptions = bufferOptions;
  //   const player2 = createVideoPlayer(sources?.[1]);
  //   player2.loop = true;
  //   player2.bufferOptions = bufferOptions;
  //   const player3 = createVideoPlayer(sources?.[2]);
  //   player3.loop = true;
  //   player3.bufferOptions = bufferOptions;
  //   return [player1, player2, player3];
  // }, []);

  const updateVideoState = useCallback(
    (index: number) => {
      if (!videos?.length) return;
      const prevVideo = videos?.at(index - 1)?.blipUrl;
      const currentVideo = videos?.at(index)?.blipUrl;
      const nextVideo = videos?.at(index + 1)?.blipUrl;

      const prevPlayerCurrentSource = currentSources[(index + 2) % 3];
      const currPlayerCurrentSource = currentSources[index % 3];
      const nextPlayerCurrentSource = currentSources[(index + 1) % 3];

      if (!players) {
        const args = ["", "", ""] satisfies [string, string, string];
        if (prevVideo) args[(index + 2) % 3] = prevVideo;
        if (currentVideo) args[index % 3] = currentVideo;
        if (nextVideo) args[(index + 1) % 3] = nextVideo;

        // const [player1, player2, player3] = createVideoPlayers(args);
        createThreePlayers({ sources: args, key: "secondary_blips_feed" });

        // setPlayers([player1, player2, player3]);

        // if (currentVideo) {
        //   const currPlayer = [player1, player2, player3][index % 3];
        //   currPlayer.play();
        // }
      } else {
        const [player1, player2, player3] = players;

        const prevPlayer = [player1, player2, player3][(index + 2) % 3];
        const currPlayer = [player1, player2, player3][index % 3];
        const nextPlayer = [player1, player2, player3][(index + 1) % 3];

        if (prevVideo && prevPlayerCurrentSource?.source !== prevVideo) {
          prevPlayer.replace(prevVideo);
        }
        prevPlayer.pause();

        if (currentVideo) {
          if (currPlayerCurrentSource?.source !== currentVideo)
            currPlayer.replace(currentVideo);
          currPlayer.play();
        }

        if (nextVideo && nextPlayerCurrentSource?.source !== nextVideo) {
          nextPlayer.replace(nextVideo);
        }
        nextPlayer.pause();
      }

      const updatedSources: [CurrentSource, CurrentSource, CurrentSource] = [
        ...currentSources,
      ];
      if (prevVideo && prevVideo !== prevPlayerCurrentSource?.source) {
        updatedSources[(index + 2) % 3] = {
          source: prevVideo,
        };
      }
      if (currentVideo && currentVideo !== currPlayerCurrentSource?.source) {
        updatedSources[index % 3] = {
          source: currentVideo,
        };
      }
      if (nextVideo && nextVideo !== nextPlayerCurrentSource?.source) {
        updatedSources[(index + 1) % 3] = {
          source: nextVideo,
        };
      }

      if (
        updatedSources[0]?.source !== currentSources[0]?.source ||
        updatedSources[1]?.source !== currentSources[1]?.source ||
        updatedSources[2]?.source !== currentSources[2]?.source
      ) {
        setCurrentSources(updatedSources);
      }
    },
    [videos, players, currentSources],
  );

  const refreshBlips = useCallback(async () => {
    setRefreshing(true);
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips/personalized?page=${1}&limit=5`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newVideos = response.data.blips;

      if (newVideos.length > 0) {
        setVideos(newVideos);
        setPage(2);
      }
    } catch (error) {
      console.error("Error fetching blips:", error);
      toast.error("couldn't load blips");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      console.log("viewable changed outside ");

      if (viewableItems[0] && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        console.log("viewable changed ", newIndex);
        updateVideoState(newIndex);
      }
    },
    [updateVideoState],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 90,
    minimumViewTime: 200,
  };

  const getBlip = async () => {
    console.log({
      id,
      productId,
      itmSource,
    });

    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/${productId.toString()}/blips/${id?.toString()}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setVideos([response.data?.blips?.[0]]);
      //   console.log(response.data?.blips?.[0]);
    } catch (error) {
      console.error("Error fetching single blip:", error);
    }
  };

  const fetchMoreVideos = useCallback(async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips/${id?.toString()}/related?page=${page}&limit=10`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newVideos = response.data.blips;

      if (newVideos.length > 0) {
        setVideos((prevVideos) => {
          return [...prevVideos, ...newVideos];
        });
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error("Error fetching more blips:", error);
    }
  }, [page]);

  useEffect(() => {
    getBlip();
    fetchMoreVideos();
  }, [id, productId]);

  const renderVideo = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (players) {
        return (
          <VideoItem
            id={item?.blipId}
            item={item}
            videoUrl={item?.blipUrl}
            isVisible={
              index === currentIndex &&
              currentSources[index % 3]?.source === item?.blipUrl &&
              isFocused
            }
            seller={item?.seller}
            engagement={{
              likes: item?.blipEngagement?.likesCount,
              comments: item?.blipEngagement?.commentsCount,
              views: item?.blipEngagement?.viewCount,
              isLiked: item?.blipEngagement?.isLiked,
            }}
            product={{
              id: item?._id,
              name: item?.productName,
              price: item?.price,
              image: item?.images,
            }}
            singularBlip={true}
            shared={itmSource?.toString() == "share"}
            viewHeight={viewHeight!}
            index={index}
            player={players?.[index % 3]}
            adjacent={index === currentIndex - 1 || index === currentIndex + 1}
            thumbnail={item?.thumbnail}
          />
        );
      }
      return null;
    },
    [currentIndex, viewHeight, players, isFocused, currentSources],
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
  }, [refreshing]);

  // const handleInitialRender = useCallback(() => {
  //   if (!players) {
  //     updateVideoState(currentIndex);
  //   }
  // }, [players, videos]);

  // useEffect(() => {
  //   handleInitialRender();
  // }, []);

  useEffect(() => {
    !refreshing && videos.length && Platform.OS === "android"
      ? updateVideoState(0)
      : null;
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      console.log("focusing on something");
    }, []),
  );

  useEffect(() => {
    console.log("hello i am trying to FOCUSSSS!!!!");

    if (!isFocused) {
      if (players) {
        players.forEach((player) => {
          try {
            player.pause();
          } catch (e) {
            console.log("Error releasing player:", e);
          }
        });
      }
      console.log("😇😇😇😇 PLAYERS PAUSED");
    } else {
      updateVideoState(currentIndex);
    }
  }, [isFocused, players]);

  useEffect(() => {
    console.log("😃😃😃 re rendering blips");

    return () => {
      if (players) {
        players.forEach((player) => {
          try {
            player.pause();
            player.replace(""); // Clear the source first
            // player.release();
          } catch (e) {
            console.log("Error releasing player:", e);
          }
        });
        // clearPlayers();
        // setPlayers(null);
        // console.log("🚀🚀🚀 PLAYERS RELEASED");
      }
    };
  }, [players]);

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={["bottom"]}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          flex: 1,
        }}
        onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
      >
        {videos?.length < 1 && !players?.length && !viewHeight ? (
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
          viewHeight &&
          isFocused && (
            <View className="flex-1">
              <FlashList
                ref={flatListRef}
                data={videos}
                renderItem={renderVideo}
                keyExtractor={(item, index) => index.toString()}
                pagingEnabled
                // overrideItemLayout={(_, index) => ({
                //   length:
                //     Platform.OS == "ios"
                //       ? viewHeight || height - insets.bottom
                //       : viewHeight || height - statusBarHeight,
                //   offset:
                //     (Platform.OS == "ios"
                //       ? viewHeight || height - insets.bottom
                //       : viewHeight || height - statusBarHeight) * index,
                //   index,
                // })}
                // pagingEnabled={Platform.select({
                //   ios: true,
                //   android: false,
                // })}
                onEndReached={fetchMoreVideos}
                onEndReachedThreshold={1}
                // estimatedItemSize={viewHeight}
                // initialNumToRender={1}
                // maxToRenderPerBatch={1}
                // windowSize={3}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                // getItemLayout={(_, index) => ({
                //   length:
                //     Platform.OS == "ios"
                //       ? viewHeight || height - insets.bottom
                //       : viewHeight || height - statusBarHeight,
                //   offset:
                //     (Platform.OS == "ios"
                //       ? viewHeight || height - insets.bottom
                //       : viewHeight || height - statusBarHeight) * index,
                //   index,
                // })}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={refreshBlips}
                progressViewOffset={Platform.OS == "ios" ? 120 : 0}
                ListHeaderComponent={renderFooter}
                // removeClippedSubviews={true}

                //flashlist props below
                // disableIntervalMomentum
                // drawDistance={viewHeight}
                // drawDistance={Platform.select({
                //   ios: viewHeight * 3,
                //   android: viewHeight,
                // })}
                drawDistance={viewHeight}
                decelerationRate={0.8}
                // extraData={currentIndex}
                maintainVisibleContentPosition={{ disabled: true }}
                // snapToInterval={Platform.select({
                //   ios: undefined,
                //   android: viewHeight,
                // })}
              />
            </View>
          )
        )}
      </View>
    </SafeAreaView>
  );
};

export default BlipsFeed;
