import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedbackComponent,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useIsFocused } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import axios from "axios";
import { getToken, getUser } from "@/store/features/auth/utils";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Shadow, ShadowProps } from "react-native-shadow-2";
import BottomSheet from "../global/bottom-sheet";
import { timeFromNow } from "@/helpers/helpers";
import { TextInput } from "react-native-gesture-handler";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import moment from "moment";
import CheckoutNow from "../blips/checkoutNow";
import ProductPreview from "../blips/productPreview";
import BlipsShop from "../blips/blipsShop";
const { height, width } = Dimensions.get("window");
const BlipItem = ({
  id,
  videoUrl,
  isVisible,
  seller,
  engagement,
  product,
  closeModal,
}: {
  id: string;
  videoUrl: string;
  isVisible: boolean;
  seller: any;
  engagement: any;
  product: any;
  closeModal: any;
}) => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const videoRef = useRef<any>(null);
  const [cachedUrl, setCachedUrl] = useState(videoUrl);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState<boolean>(false);
  const [pausedTriggered, setPauseTriggered] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [likes, setLikes] = useState<number>(engagement.likes);
  const [liked, setLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<number>(engagement.comments);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showProduct, setShowProduct] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    setLoading((!status.isPlaying && status.shouldPlay) || status.isBuffering);
  };

  const handleLike = async () => {
    if (liked) {
      setLiked(false);
      setLikes(likes - 1);
    } else {
      setLiked(true);
      setLikes(likes + 1);
    }
    const token = await getToken();
    try {
      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${product.id}/blips/${id}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: null,
      };
      const response = await axios(config);
    } catch (e: any) {
      console.log("error liking blip ", e.response.data);
    }
  };

  const handleView = async () => {
    const token = await getToken();
    try {
      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${product.id}/blips/${id}/view`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: null,
      };
      const response = await axios(config);
    } catch (e: any) {
      console.log("error viewing blip ", e.response.data);
    }
  };

  const handleIncreaseCommentCount = () => {
    setComments(comments + 1);
  };

  const PauseVideo = useCallback(() => {
    if (paused && videoRef.current) {
      videoRef.current.playAsync?.();
    } else {
      videoRef.current.pauseAsync?.();
    }
    setPaused(!paused);
  }, [paused]);

  useEffect(() => {
    if (isFocused && videoRef.current) {
      if (isVisible) {
        videoRef.current.playAsync?.();
      } else {
        if (paused) setPaused(false);
        videoRef.current.pauseAsync?.();
        videoRef.current?.setPositionAsync(0);
      }
      handleView();
    }
  }, [isFocused, isVisible]);

  useEffect(() => {
    if (!isFocused || !isVisible) {
      setPaused(false);
      videoRef.current.pauseAsync?.();
    }
  }, [isFocused]);

  // useEffect(() => {
  //   return () => {
  //     if (videoRef.current) {
  //       videoRef.current.unloadAsync();
  //     }
  //   };
  // }, []);

  const handleBuyNow = useCallback(() => {
    setShowCheckout(true);
  }, []);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        PauseVideo();
      }}
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={[
          styles.container,
          {
            height: height,

            paddingTop: Platform.OS == "ios" ? 0 : 0,
          },
        ]}
      >
        <Video
          ref={videoRef}
          source={{
            uri: videoUrl,
          }}
          style={[
            styles.video,
            {
              height: "100%",
              position: "absolute",
              top: Platform.OS == "ios" ? 0 : 0,
              left: 0,
            },
          ]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isVisible}
          isLooping
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          isMuted={false}
        />
        <View
          className="px-[16px] py-[16px] gap-[8px] flex-row items-center"
          style={{
            marginTop: statusBarHeight,
          }}
        >
          <Pressable onPress={closeModal}>
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </Pressable>
          <Image
            source={{ uri: seller?.storeAvatar?.url }}
            resizeMode="cover"
            style={[
              {
                height: 31,
                width: 31,
                borderRadius: 31,
              },
              styles.imageShadow,
            ]}
          />

          <View className="space-between mr-2">
            <Text
              className="text-[#fff] text-[14px] font-LexendDecaSemiBold"
              style={styles.text}
            >
              {seller.storeName || seller?.firstName + " " + seller?.lastName}
            </Text>
            <View className="flex-row items-center gap-[4px]">
              <AntDesign name="star" size={12} color="#FFD700" />
              <Text className="text-white text-[12px]" style={styles.text}>
                4.7
              </Text>
            </View>
          </View>

          {/* <Pressable
            className="py-[4px] px-[8px] rounded-[4px] items-center justify-center bg-[#16783A]"
            style={styles.buttonShadow}
          >
            <Text className="text-white text-[10px]">+ Follow</Text>
          </Pressable> */}
        </View>
        <View className="p-[10px]">
          {/* <View className="gap-2 mb-[16px]">
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className="bg-[#2E3038] rounded-[8px] h-[40px] w-[40px] items-center justify-center"
                onPress={handleLike}
              >
                {liked ? (
                  <AntDesign name="heart" size={18} color="red" />
                ) : (
                  <AntDesign name="hearto" size={18} color="#14AE5C" />
                )}
              </TouchableOpacity>
              <Text
                className="text-white text-[12px] font-LexendDecaMedium"
                style={styles.text}
              >
                {likes}
              </Text>
            </View>
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className="bg-[#2E3038] rounded-[8px] h-[40px] w-[40px] items-center justify-center"
                onPress={() => setShowComments(true)}
              >
                <Octicons name="comment" size={18} color="#14AE5C" />
              </TouchableOpacity>
              <Text
                className="text-white text-[12px] font-LexendDecaMedium"
                style={styles.text}
              >
                {comments}
              </Text>
            </View>
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity className="bg-[#2E3038] rounded-[8px] h-[40px] w-[40px] items-center justify-center">
                <Ionicons name="arrow-redo-sharp" size={18} color="#14AE5C" />
              </TouchableOpacity>
              <Text
                className="text-white text-[12px] font-LexendDecaMedium"
                style={styles.text}
              >
                Share
              </Text>
            </View>
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className="bg-[#2E3038] rounded-[8px] h-[40px] w-[40px] items-center justify-center"
                onPress={() => setShowShop(true)}
              >
                <SimpleLineIcons name="bag" size={18} color="#14AE5C" />
              </TouchableOpacity>
              <Text
                className="text-white text-[12px] font-LexendDecaMedium"
                style={styles.text}
              >
                Shop
              </Text>
            </View>
          </View> */}
          {/* <View>
            <Pressable
              className="px-[10px] py-[4px] gap-[12px] bg-[#f2f2f2] mb-[8px] rounded-[5px] flex-row items-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
              onPress={() => setShowProduct(true)}
            >
              <Image
                source={{ uri: product?.image }}
                resizeMode="contain"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                }}
              />
              <View className="shrink">
                <Text className="text-[12px] text-[#000] font-LexendDecaSemiBold shrink">
                  {product?.name}
                </Text>
                <Text className="text-[18px] text-[#000] font-LexendDecaMedium shrink">
                  {product?.discount?.isActive ? (
                    <Text className="text-[#16783A]">
                      ₦{product?.discount?.value}
                      {product?.discount?.type == "percentage" && "%"} off
                    </Text>
                  ) : (
                    <Text className="text-[#16783A]">
                      ₦{product?.price?.toLocaleString()}
                    </Text>
                  )}
                </Text>
              </View>
            </Pressable>
            <TouchableOpacity
              className="p-[12px] rounded-[6px] bg-[#16783A] items-center justify-center"
              onPress={handleBuyNow}
              style={styles.buttonShadow}
            >
              <Text className="text-white tex-[12px] font-[600]">Buy now</Text>
            </TouchableOpacity>
          </View> */}
        </View>
        {loading && Platform.OS == "ios" && (
          <View style={styles.loaderContainer}>
            <View
              style={{
                width: 50,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 6,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          </View>
        )}
        {paused && (
          <View style={styles.loaderContainer}>
            <Entypo
              name="controller-play"
              size={100}
              color="#ccc"
              style={{
                opacity: 1,
              }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    backgroundColor: "#000",
    // overflow: "hidden",
    position: "relative",
    justifyContent: "space-between",
    // alignItems: "center",
  },
  video: {
    width: "100%",
    // aspectRatio: 16 / 9,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  text: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 31,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

export default BlipItem;
