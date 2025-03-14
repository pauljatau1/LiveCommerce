import React, { useRef, useEffect, useState, useCallback, memo } from "react";
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
import { formatNumber, timeFromNow } from "@/helpers/helpers";
import { TextInput } from "react-native-gesture-handler";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import moment from "moment";
import CheckoutNow from "./checkoutNow";
import ProductPreview from "./productPreview";
import BlipsShop from "./blipsShop";
import AuthSheet from "../auth/authSheet";
import { data } from "@/constants";
import Comment from "./comment";
import CommentsSheet from "./commentsSheet";
const { height, width } = Dimensions.get("window");
const VideoItem = ({
  id,
  videoUrl,
  isVisible,
  seller,
  engagement,
  product,
  item,
}: {
  id: string;
  videoUrl: string;
  isVisible: boolean;
  seller: any;
  engagement: any;
  product: any;
  item: any;
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
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [following, setFollowing] = useState<boolean>(
    item?.seller?.isFollowing || false,
  );

  const handlePlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    setTimeout(
      () =>
        setLoading(
          (!status.isPlaying && status.shouldPlay) || status.isBuffering,
        ),
      1000,
    );
  };

  const handleCloseCheckout = useCallback(() => {
    setShowCheckout(false);
  }, []);

  const handleLike = async () => {
    const token = await getToken();
    if (!token) {
      return setShowAuthSheet(true);
    }
    if (liked) {
      setLiked(false);
      setLikes(likes - 1);
    } else {
      setLiked(true);
      setLikes(likes + 1);
    }
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

  const handleCantComment = () => {
    setShowComments(false);
    setShowAuthSheet(true);
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

  const tabBarHeight = useBottomTabBarHeight();

  const handleBuyNow = useCallback(async () => {
    const token = await getToken();
    if (!token) return setShowAuthSheet(true);
    setShowCheckout(true);
  }, []);

  const handleFollow = async (action: string) => {
    let method = "";
    if (action == "follow") {
      setFollowing(true);
      method = "POST";
    } else {
      setFollowing(false);
      method = "DELETE";
    }
    const token = await getToken();
    const config = {
      url:
        process.env.EXPO_PUBLIC_API_URL +
        `api/buyer/follow/${item?.seller?._id}`,
      method,
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {},
    };
    try {
      const response = await axios(config);
    } catch (error) {
      console.error("Error following seller:", error);
    }
  };

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
            paddingBottom: tabBarHeight,
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
          className="px-[10px] py-[16px] gap-[8px] flex-row items-center justify-between"
          style={{
            marginTop: statusBarHeight,
          }}
        >
          <View className="flex-row items-center gap-[8px] ">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(root)/sellerProfile",
                  params: {
                    sellerId: seller?._id,
                    sellerAvatar: seller?.storeAvatar?.url,
                  },
                })
              }
            >
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
            </Pressable>

            <View className="space-between mr-2">
              <Text
                className="text-[#fff] text-[14px] font-LexendDecaSemiBold"
                style={styles.text}
              >
                {seller.storeName || seller?.firstName + " " + seller?.lastName}
              </Text>
              <View className="flex-row items-center gap-[8px]">
                {seller?.isFeatured && (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 2.5,
                      backgroundColor: "#E8C300",
                    }}
                  >
                    <Text className="font-LexendDecaMedium text-[6px] ">
                      Top seller
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center gap-[4px]">
                  <AntDesign name="star" size={12} color="#FFD700" />
                  <Text
                    className="text-white text-[12px] font-LexendDecaMedium"
                    style={styles.text}
                  >
                    {item?.seller?.storeRating}
                  </Text>
                </View>
              </View>
            </View>

            {following ? (
              <Pressable
                className="py-[4px] px-[8px] rounded-[8px] items-center justify-center border-[#16783A] border-[1px]"
                // style={styles.buttonShadow}
                onPress={() => handleFollow("unfollow")}
              >
                <Text
                  className="text-[#16783A] font-LexendDecaMedium text-[10px]"
                  style={styles.text}
                >
                  following
                </Text>
              </Pressable>
            ) : (
              <Pressable
                className="py-[4px] px-[8px] rounded-[8px] items-center justify-center bg-[#16783A]"
                style={styles.buttonShadow}
                onPress={() => handleFollow("follow")}
              >
                <Text className="text-white text-[10px] font-LexendDecaMedium">
                  + Follow
                </Text>
              </Pressable>
            )}
          </View>
          <View
            className="flex-row items-center justify-center px-[4px] py-[2px] gap-[4px] rounded-[8px]"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <Ionicons name="eye-outline" size={16} color="#EFF0FA" />
            <Text
              className="font-LexendDeca text-[12px]"
              style={{ color: "#EFF0FA" }}
            >
              {formatNumber(engagement?.views || 0)}
            </Text>
          </View>
        </View>
        <View className="p-[10px]">
          <View className="gap-2 mb-[16px]">
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
                {formatNumber(likes)}
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
                {formatNumber(comments)}
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
          </View>
          <View>
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
                <View className="flex-row items-end gap-[8px] justify-between w-full shrink">
                  <View className="flex-row items-end gap-[8px] flex-wrap shrink">
                    <Text className="text-[18px] text-[#000] font-LexendDecaMedium">
                      ₦
                      {item?.discount?.isActive
                        ? item?.discount?.discountedPrice?.toLocaleString() || 0
                        : item?.price?.toLocaleString()}
                    </Text>
                    <Text className="text-[12px] text-[#000] font-LexendDecaMedium shrink">
                      {item?.discount?.isActive ? (
                        <Text className="text-[#16783A]">
                          ₦{item?.discount?.value}
                          {item?.discount?.type == "percentage" && "%"} off
                        </Text>
                      ) : null}
                    </Text>
                    {item?.discount?.isActive ? (
                      <Text className="text-[12px] text-[#FF0A0A] font-LexendDecaMedium line-through">
                        ₦{item?.price?.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    className={`text-[14px] ${item?.stock < 10 ? "text-[#FF6652]" : "text-[#000]"} font-LexendDecaMedium `}
                  >
                    {formatNumber(item.stock)} left
                  </Text>
                </View>
              </View>
            </Pressable>
            <TouchableOpacity
              className="p-[12px] rounded-[6px] bg-[#16783A] items-center justify-center"
              onPress={handleBuyNow}
              style={styles.buttonShadow}
            >
              <Text className="text-white tex-[12px] font-[600]">Buy now</Text>
            </TouchableOpacity>
          </View>
        </View>
        {loading && Platform.OS == "ios" && (
          <View style={[styles.loaderContainer, { bottom: tabBarHeight }]}>
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
          <View style={[styles.loaderContainer, { bottom: tabBarHeight }]}>
            <Entypo
              name="controller-play"
              size={90}
              color="#ccc"
              style={{
                opacity: 0.4,
              }}
            />
          </View>
        )}

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[0px]"
          showCloseIcon={false}
          title=""
          show={showComments}
          titleColor="!text-white"
          snapPoints={["70%"]}
          enableDynamicSizing={false}
          onRequestClose={() => setShowComments(false)}
          keyboardBehavior="extend"
        >
          <CommentsSheet
            handleIncreaseCommentCount={handleIncreaseCommentCount}
            product={product}
            id={id}
            commentCount={comments}
            handleCantComment={handleCantComment}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showCheckout}
          snapPoints={["70%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowCheckout(false)}
          keyboardBehavior={"interactive"}
        >
          <CheckoutNow
            productId={product.id}
            closeSheet={handleCloseCheckout}
            sellerId={seller._id}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showProduct}
          snapPoints={["70%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowProduct(false)}
          keyboardBehavior={"interactive"}
        >
          <ProductPreview
            product={product}
            closeSheet={() => setShowProduct(false)}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[0px]"
          showCloseIcon={false}
          title=""
          show={showShop}
          snapPoints={["70%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowShop(false)}
          keyboardBehavior={"interactive"}
          enableDynamicSizing={false}
        >
          <BlipsShop id={seller._id} closeSheet={() => setShowShop(false)} />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showAuthSheet}
          titleColor="!text-white"
          snapPoints={["20%"]}
          enableDynamicSizing={false}
          onRequestClose={() => setShowAuthSheet(false)}
          keyboardBehavior="interactive"
        >
          <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
        </BottomSheet>
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

export default memo(VideoItem);
