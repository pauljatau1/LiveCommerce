import { View, Text, Dimensions, Platform } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import VideoItem from "@/components/blips/videoItem";
import { useLocalSearchParams } from "expo-router";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import LottieView from "lottie-react-native";
import { Image } from "expo-image";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { createVideoPlayer, VideoPlayer } from "expo-video";
import { useIsFocused } from "@react-navigation/native";
const { height } = Dimensions.get("window");

type CurrentSource = {
  source: string;
} | null;

const singleBlip = () => {
  const { id, blipId } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const [blip, setBlip] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [viewHeight, setViewHeight] = useState<number>();
  const [player, setPlayer] = useState<VideoPlayer | null>(null);

  const createVideoPlayers = useCallback((sources: string[]) => {
    const bufferOptions = {
      preferredForwardBufferDuration: Platform.select({
        ios: 2, // Reduce from 5 to 3
        android: 3,
      }),
    };
    const player1 = createVideoPlayer(sources?.[0]);
    player1.loop = true;
    player1.bufferOptions = bufferOptions;

    return player1;
  }, []);

  const getBlip = async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/${id?.toString()}/blips/${blipId?.toString()}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setBlip(response.data?.blips?.[0]);
      setPlayer(createVideoPlayers([response.data?.blips?.[0]?.blipUrl]));
    } catch (error) {
      console.error("Error fetching more blips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBlip();
  }, []);

  useEffect(() => {
    if (player) {
      if (isFocused) {
        player?.play();
      } else {
        player?.pause?.();
      }
    }
  }, [player, isFocused]);

  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
          player.replace(""); // Clear the source first
          player.release();
        } catch (e) {
          console.log("Error releasing player:", e);
        }
        setPlayer(null);
        console.log("🚀 SINGLE PLAYER RELEASED");
      }
    };
  }, [player]);

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
        {loading ? (
          <View className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
            <Image
              source={require("../../../assets/icons/auqli-logo.png")}
              contentFit="contain"
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
        ) : blip?.blipId && player ? (
          <VideoItem
            id={blip?.blipId}
            item={blip}
            videoUrl={blip?.blipUrl}
            isVisible={isFocused && !!player}
            seller={blip?.seller}
            engagement={{
              likes: blip?.blipEngagement?.likesCount,
              comments: blip?.blipEngagement?.commentsCount,
              views: blip?.blipEngagement?.viewCount,
            }}
            product={{
              id: blip?._id,
              name: blip?.productName,
              price: blip?.price,
              image: blip?.images,
            }}
            singularBlip={true}
            viewHeight={viewHeight}
            thumbnail={blip?.thumbnail}
            player={player}
          />
        ) : (
          <View className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] items-center">
            <Image
              source={require("../../../assets/icons/auqli-logo.png")}
              contentFit="contain"
              style={{ width: 50, height: 50 }}
            />
            <Text className="text-white text-[16px] font-LexendDeca">
              Blip Not Found !
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default singleBlip;
