import { View, Text, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import VideoItem from "@/components/blips/videoItem";
import { useLocalSearchParams } from "expo-router";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import LottieView from "lottie-react-native";
import { Image } from "expo-image";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
const { height } = Dimensions.get("window");

const singleBlip = () => {
  const { id, blipId } = useLocalSearchParams();

  const [blip, setBlip] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);

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
    } catch (error) {
      console.error("Error fetching more blips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBlip();
  }, []);
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          height: height,
        }}
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
        ) : blip?.blipId ? (
          <VideoItem
            id={blip?.blipId}
            item={blip}
            videoUrl={blip?.blipUrl}
            isVisible={true}
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
    </>
  );
};

export default singleBlip;
