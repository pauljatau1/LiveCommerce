import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Platform, Image, Linking, Pressable } from "react-native";
import VideoItem from "@/components/blips/videoItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import axios from "axios";
import { toast } from "@/core/toast";
import { getToken } from "@/store/features/auth/utils";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PromotionModal from "@/components/modals/promotion";
import { Settings } from "react-native-fbsdk-next";
import { checkVersion } from "react-native-check-version";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import BottomSheet from "@/components/global/bottom-sheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import Constants from "expo-constants";
import { createVideoPlayer, VideoPlayer } from "expo-video";
import { FlashList } from "@shopify/flash-list";
import { useCreateVideoPlayers } from "@/contexts/videoPlayerContext";

type CurrentSource = {
  source: string;
} | null;

const Blips = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Constants.statusBarHeight;
  const tabBarHeight = useBottomTabBarHeight();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isPromotionVisible, setIsPromotionVisible] = useState<boolean>(false);
  const [promotionAmount, setPromotionAmount] = useState<number>();
  const [version, setVersion] = useState<any>();
  const [showUpdateSheet, setShowUpdateSheet] = useState<boolean>(false);
  const [viewHeight, setViewHeight] = useState<number>();
  // const [players, setPlayers] = useState<VideoPlayer[] | null>(null);
  const [currentSources, setCurrentSources] = useState<
    [CurrentSource, CurrentSource, CurrentSource]
  >([null, null, null]);

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

  const { players, createThreePlayers, clearPlayers } = useCreateVideoPlayers();
  const updateVideoState = useCallback(
    (index: number, withForce?: boolean) => {
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

        // const [player1, player2, player3] = createThreePlayers({sources:args,key:"main_blips"});
        createThreePlayers({ sources: args, key: "main_blips" });

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

        if (
          prevVideo &&
          (prevPlayerCurrentSource?.source !== prevVideo || withForce)
        ) {
          prevPlayer.replace(prevVideo);
        }
        prevPlayer.pause();

        console.log({ currentVideo, currPlayerCurrentSource });

        if (currentVideo) {
          if (currPlayerCurrentSource?.source !== currentVideo || withForce)
            currPlayer.replace(currentVideo);
          currPlayer.play();
        }

        if (
          nextVideo &&
          (nextPlayerCurrentSource?.source !== nextVideo || withForce)
        ) {
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

  const verifyAppVersion = async () => {
    const version = await checkVersion();
    // console.log("Got version info:", version);

    if (version.needsUpdate) {
      setVersion(version);
      return router.push({
        pathname: "/update",
        params: {
          url: version.url,
        },
      });
      setShowUpdateSheet(true);
    }
  };

  const requestTrackingPermission = async () => {
    const { status } = await requestTrackingPermissionsAsync();
    if (status === "granted") {
      console.log("Yay! I have user permission to track data");
      await Settings.setAdvertiserTrackingEnabled(true);
      console.log("Facebook Tracking Enabled ✅");
    } else {
      console.log("Shucks! I dont have user permission to track data ", {
        status,
      });
    }
  };

  const closeModal = useCallback(() => {
    console.log("calling out");

    setIsPromotionVisible(false);
  }, [isPromotionVisible]);

  const showPromotion = useCallback(async () => {
    const isFirstTime = await AsyncStorage.getItem("isFirstTime");
    const fromVerify = await AsyncStorage.getItem("fromVerify");
    const verifyPayload = JSON.parse(fromVerify!);
    const token = await AsyncStorage.getItem("token");

    if (isFirstTime && verifyPayload && verifyPayload.bonus?.amount && token) {
      setPromotionAmount(verifyPayload.bonus?.amount);
      setTimeout(() => setIsPromotionVisible(true), 3000);
      await AsyncStorage.removeItem("fromVerify");
    }
  }, []);

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

  const fetchMoreVideos = useCallback(async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/v2/blips/personalized?page=${page}&limit=5`,
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
    fetchMoreVideos();
  }, []);

  useEffect(() => {
    async function setIsFirstTime() {
      await AsyncStorage.setItem("isFirstTime", "false");
    }
    requestTrackingPermission();
    showPromotion();
    setIsFirstTime();
    verifyAppVersion();
  }, []);

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
            singularBlip={false}
            shared={false}
            viewHeight={viewHeight}
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

  const renderKeyExtractor = useCallback(
    (item: any, index: number) => item?.blipId + index?.toString(),
    [],
  );

  // const handleInitialRender = useCallback(() => {
  //   if (!players && isFocused) {
  //     updateVideoState(currentIndex);
  //   }
  // }, [players, videos, isFocused]);

  // useEffect(() => {
  //   handleInitialRender();
  // }, []);

  useEffect(() => {
    !refreshing && videos.length && Platform.OS === "android"
      ? updateVideoState(0)
      : null;
  }, [refreshing]);

  useEffect(() => {
    if (!isFocused) {
      if (players) {
        players.forEach((player) => {
          try {
            player.pause();
            // player.replace(""); // Clear the source first
            // player.release();
          } catch (e) {
            console.log("Error releasing player:", e);
          }
        });
        // clearPlayers();
      }
      console.log("😇😇😇😇 PLAYERS PAUSED");
    } else {
      updateVideoState(currentIndex, true);
    }
  }, [isFocused]);

  useEffect(() => {
    console.log("😃😃😃 re rendering blips");

    return () => {
      if (players) {
        players.forEach((player) => {
          try {
            player.pause();
            player.replace(""); // Clear the source first
            player.release();
          } catch (e) {
            console.log("Error releasing player:", e);
          }
        });
        // setPlayers(null);
        clearPlayers();
        console.log("🚀🚀🚀 PLAYERS RELEASED");
      }
    };
  }, []);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#121212",
      }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          flex: 1,
        }}
        onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
      >
        {videos?.length < 1 && !players?.length ? (
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
          viewHeight && (
            <FlashList
              ref={flatListRef}
              data={videos}
              renderItem={renderVideo}
              keyExtractor={renderKeyExtractor}
              pagingEnabled
              // overrideItemLayout={(_, index) => ({
              //   length: viewHeight,
              //   offset: viewHeight * index,
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
              progressViewOffset={Platform.OS == "ios" ? insets.top : 0}
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
              // extraData={refreshing}
              maintainVisibleContentPosition={{ disabled: true }}
              // snapToInterval={Platform.select({
              //   ios: undefined,
              //   android: viewHeight,
              // })}
            />
          )
        )}
      </View>
      <PromotionModal
        isVisible={isPromotionVisible}
        closeModal={closeModal}
        promotionAmount={promotionAmount}
      />
    </View>
  );
};

export default Blips;
