import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react";
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
  Share,
  Alert,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useIsFocused, useNavigationState } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { getToken, getUser } from "@/store/features/auth/utils";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Shadow, ShadowProps } from "react-native-shadow-2";
import BottomSheet from "../global/bottom-sheet";
import {
  formatNumber,
  formatTimeFromNow,
  timeFromNow,
} from "@/helpers/helpers";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TapGestureHandler,
  TextInput,
} from "react-native-gesture-handler";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import moment from "moment";
import CheckoutNow from "./checkoutNow";
import ProductPreview from "./productPreview";
import BlipsShop from "./blipsShop";
import AuthSheet from "../auth/authSheet";
import { data } from "@/constants";
import Comment from "./comment";
import CommentsSheet from "./commentsSheet";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { EvilIcons, Fontisto } from "@expo/vector-icons";
import { GlassImage } from "@/app/(root)/livestream/components";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent, useEventListener } from "expo";
import { trackEvent } from "@/utils/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height, width } = Dimensions.get("screen");
const VideoItem = ({
  id,
  videoUrl,
  isVisible,
  seller,
  engagement,
  product,
  item,
  singularBlip = false,
  shared = false,
}: {
  id: string;
  videoUrl: string;
  isVisible: boolean;
  seller: any;
  engagement: any;
  product: any;
  item: any;
  singularBlip: boolean;
  shared: boolean;
}) => {
  const token = useSelector((state: RootState) => state.authState?.token);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS == "ios" ? insets.top : 0;
  const videoRef = useRef<any>(null);
  const [cachedUrl, setCachedUrl] = useState(videoUrl);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState<boolean>(false);
  const [pausedTriggered, setPauseTriggered] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [likes, setLikes] = useState<number>(engagement.likes);
  const [liked, setLiked] = useState<boolean>(engagement?.isLiked);
  const [comments, setComments] = useState<number>(engagement.comments);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showProduct, setShowProduct] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [following, setFollowing] = useState<boolean>(
    item?.seller?.isFollowing || false,
  );
  const [blipType, setBlipType] = useState<string>(item?.status);
  const [offlineAuctionData, setOfflineAuctionData] = useState<any>(
    item?.status == "offline_auction" ? item?.auctionInfo : null,
  );
  const [liveStreamData, setLiveStreamData] = useState<any>();
  const [liveAuctionData, setLiveAuctionData] = useState<any>();
  const [bidTime, setBidTime] = useState<any>();

  const player = useVideoPlayer({ uri: videoUrl }, (player) => {
    player.loop = true;
    player.play();
    // player.replay();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const handleActionBtn = () => {
    if (item?.stock < 1) {
      return;
    }
    switch (blipType) {
      case "active":
        return handleBuyNow();
      case "offline_auction":
        return router?.push(`/product/${item?._id}`);
    }
  };

  const onShare = async () => {
    try {
      const result = await Share.share(
        Platform.OS == "ios"
          ? {
              url: `https://app.auqli.live/singleBlip/feed?productId=${product?.id}&id=${id}&itmSource=share`,
            }
          : {
              message: `https://app.auqli.live/singleBlip/feed?productId=${product?.id}&id=${id}&itmSource=share`,
            },
      );
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          try {
            const userData = await AsyncStorage.getItem("user");
            const user = JSON.parse(userData || "{}");
            trackEvent("blip_shared", {
              blipId: id,
              userId: user?._id,
              email: user?.email,
              firstName: user?.firstName,
              lastName: user?.lastName,
              username: user?.username,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Error sharing blip:", error);
          }
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // const handlePlaybackStatusUpdate = (status: any) => {
  //   if (!status.isLoaded) return;

  //   setTimeout(
  //     () =>
  //       setLoading(
  //         (!status.isPlaying && status.shouldPlay) || status.isBuffering,
  //       ),
  //     1000,
  //   );
  // };

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
      try {
        const userData = await AsyncStorage.getItem("user");
        const user = JSON.parse(userData || "{}");
        trackEvent("blip_unliked", {
          blipId: id,
          userId: user?._id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error liking blip:", error);
      }
    } else {
      setLiked(true);
      setLikes(likes + 1);
      try {
        const userData = await AsyncStorage.getItem("user");
        const user = JSON.parse(userData || "{}");
        trackEvent("blip_liked", {
          blipId: id,
          userId: user?._id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error liking blip:", error);
      }
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

  const handleView = useCallback(async () => {
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
  }, []);

  const handleCantComment = useCallback(() => {
    setShowComments(false);
    setShowAuthSheet(true);
  }, []);

  const handleIncreaseCommentCount = useCallback(() => {
    setComments(comments + 1);
  }, []);

  const closeCommentsSheet = useCallback(() => {
    setShowComments(false);
  }, []);

  // const PauseVideo = useCallback(() => {
  //   if (paused && videoRef.current) {
  //     videoRef.current.playAsync?.();
  //   } else {
  //     videoRef.current.pauseAsync?.();
  //   }
  //   setPaused(!paused);
  // }, [paused]);

  // useEffect(() => {
  //   if (isFocused && videoRef.current) {
  //     if (isVisible) {
  //       videoRef.current.playAsync?.();
  //     } else {
  //       if (paused) setPaused(false);
  //       videoRef.current.pauseAsync?.();
  //       videoRef.current?.setPositionAsync(0);
  //     }
  //     handleView();
  //   }
  // }, [isFocused, isVisible]);

  // useEffect(() => {
  //   if (!isFocused || !isVisible) {
  //     setPaused(false);
  //     videoRef.current.pauseAsync?.();
  //   }
  // }, [isFocused]);

  // useEffect(() => {
  //   return () => {
  //     if (videoRef.current) {
  //       videoRef.current.unloadAsync();
  //     }
  //   };
  // }, []);

  const PauseVideo = useCallback(() => {
    if (status == "loading" || status !== "readyToPlay") {
      return;
    }
    setPaused(isPlaying);
    if (!isPlaying && videoRef.current) {
      console.log("playing video ", {
        isPlaying,
      });

      player.play();
    } else {
      console.log("pausing video ", {
        isPlaying,
      });
      player.pause();
    }
  }, [paused, isPlaying]);

  useEffect(() => {
    if (isFocused && videoRef.current) {
      if (isVisible) {
        player.play();
      } else {
        if (paused) setPaused(false);
        player.replay();
        player.pause();
      }
      handleView();
    }
  }, [isFocused, isVisible]);

  useEffect(() => {
    if (!isFocused || !isVisible) {
      setPaused(false);
      player.pause();
    }
  }, [isFocused]);

  useEffect(() => {
    const statusTimeout = setTimeout(
      () => setLoading(status == "loading"),
      1000,
    );

    return () => clearTimeout(statusTimeout);
  }, [status]);

  const tabBarHeight = !singularBlip ? useBottomTabBarHeight() : 10;
  // console.log({ tabBarHeight });

  const handleBuyNow = useCallback(async () => {
    const token = await getToken();
    const userData = await AsyncStorage.getItem("user");
    const user = JSON.parse(userData || "{}");
    trackEvent("blip_checkout_initiated", {
      blipId: id,
      productId: item?._id,
      productName: item?.name,
      productPrice: `₦${
        item?.discount?.isActive
          ? item?.discount?.discountedPrice?.toLocaleString() || 0
          : item?.price?.toLocaleString()
      }`,
      isDiscounted: item?.discount?.isActive,
      productStock: item?.stock,
      userId: user?._id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username,
      timestamp: new Date().toISOString(),
    });
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

  const handleBlipProductClickTrack = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData || "{}");
      trackEvent("blip_product_clicked", {
        blipId: id,
        userId: user?._id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error tracking blip product clicked:", error);
    }
  };

  useEffect(() => {
    if (offlineAuctionData) {
      const timer = setInterval(
        () => setBidTime(formatTimeFromNow(offlineAuctionData?.endDate)),
        1000,
      );

      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    const trackBlipViewed = async () => {
      if (isVisible) {
        try {
          const userData = await AsyncStorage.getItem("user");
          const user = JSON.parse(userData || "{}");
          trackEvent("blip_viewed", {
            blipId: id,
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
          });
        } catch (error) {
          console.error("Error tracking blip viewed:", error);
        }
      }
    };

    trackBlipViewed();
  }, [isVisible]);

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
            height:
              Platform.OS == "ios"
                ? height - insets.bottom
                : height - insets.bottom - insets.top,
            // backgroundColor: "red",
            paddingTop: Platform.OS == "ios" ? 0 : 0,
            paddingBottom: singularBlip ? 0 : tabBarHeight - insets.bottom,
          },
        ]}
      >
        <VideoView
          ref={videoRef}
          style={[
            styles.video,
            {
              height: "100%",
              position: "absolute",
              top: Platform.OS == "ios" ? 0 : 0,
              left: 0,
            },
          ]}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
        <View
          className="px-[10px] py-[16px] gap-[30px] flex-row items-center justify-between"
          style={{
            marginTop: statusBarHeight,
          }}
        >
          <View className="flex-row items-center gap-[8px] shrink">
            {singularBlip ? (
              <Pressable
                // onPress={() => router.replace("/blips")}
                onPress={() => {
                  shared
                    ? router.replace("/(root)/(tabs)/blips")
                    : router.back();
                }}
                style={styles.buttonShadow}
              >
                <Entypo name="chevron-left" size={24} color="#fff" />
              </Pressable>
            ) : null}
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
              <GlassImage
                source={{ uri: seller?.storeAvatar?.url }}
                resizeMode="cover"
                imageStyle={[
                  {
                    height: 31,
                    width: 31,
                    borderRadius: 31,
                  },
                  styles.imageShadow,
                ]}
                containerStyle={{
                  borderRadius: 31,
                }}
                glassStyle={{
                  width: 31,
                  height: 31,
                  borderRadius: 31,
                }}
                showActivityIndicator={false}
                placeholderColor="rgba(255, 255, 255, 0.1)"
                tint="dark"
                blurIntensity={25}
              />
            </Pressable>

            <View className="space-between mr-2 shrink">
              <Text
                className="text-[#fff] text-[14px] font-LexendDecaSemiBold shrink"
                style={styles.text}
                numberOfLines={1}
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
                  {seller?.totalStoreReviews > 0 && (
                    <AntDesign name="star" size={12} color="#FFD700" />
                  )}
                  <Text
                    className="text-white text-[12px] font-LexendDecaMedium"
                    style={styles.text}
                  >
                    {seller?.totalStoreReviews > 0
                      ? seller?.storeRating?.toFixed(1)
                      : "No Reviews"}
                  </Text>
                </View>
              </View>
            </View>

            {!token ? null : following ? (
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
            style={
              {
                // backgroundColor: "rgba(0,0,0,0.8)",
              }
            }
          >
            <Ionicons
              name="eye-outline"
              size={16}
              color="#EFF0FA"
              style={styles.buttonShadow}
            />
            <Text
              className="font-LexendDeca text-[12px]"
              style={[{ color: "#EFF0FA" }, styles.text]}
            >
              {formatNumber(engagement?.views || 0)}
            </Text>
          </View>
        </View>
        <View className="p-[10px]">
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            locations={[0.3, 1]}
            style={styles.gradientOverlay}
          ></LinearGradient>
          <View className="gap-[16px] mb-[16px]">
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className=" rounded-[8px] w-[40px] items-center justify-center"
                onPress={handleLike}
              >
                {liked ? (
                  <Fontisto
                    name="heart"
                    size={22}
                    color="red"
                    style={styles.buttonShadow}
                  />
                ) : (
                  <Fontisto
                    name="heart-alt"
                    size={22}
                    color="white"
                    style={styles.buttonShadow}
                  />
                )}
              </TouchableOpacity>
              <Text
                className="text-white text-[13px] font-LexendDecaMedium"
                style={styles.text}
              >
                {formatNumber(likes)}
              </Text>
            </View>
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className=" rounded-[8px] w-[40px] items-center justify-center"
                onPress={() => setShowComments(true)}
              >
                <EvilIcons
                  name="comment"
                  size={36}
                  color="white"
                  style={styles.buttonShadow}
                />
              </TouchableOpacity>
              <Text
                className="text-white text-[13px] font-LexendDecaMedium"
                style={styles.text}
              >
                {formatNumber(comments)}
              </Text>
            </View>
            <View className="items-center gap-2 max-w-[60px] self-end">
              <TouchableOpacity
                className=" rounded-[8px] w-[40px] items-center justify-center"
                onPress={onShare}
              >
                <Ionicons
                  name="arrow-redo-sharp"
                  size={28}
                  color="white"
                  style={styles.buttonShadow}
                />
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
                className=" rounded-[8px] w-[40px] items-center justify-center"
                onPress={() => setShowShop(true)}
              >
                <SimpleLineIcons
                  name="bag"
                  size={24}
                  color="white"
                  style={styles.buttonShadow}
                />
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
              className=" py-[4px] mb-[16px] rounded-[5px] "
              style={
                {
                  // backgroundColor: "rgba(255,255,255,0.6)",
                }
              }
              onPress={() => {
                setShowProduct(true);
                handleBlipProductClickTrack();
              }}
            >
              <View className="flex-row items-center gap-[12px]">
                <GlassImage
                  source={{ uri: product?.image }}
                  resizeMode="cover"
                  imageStyle={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                  }}
                  containerStyle={{
                    borderRadius: 4,
                  }}
                  glassStyle={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                  }}
                  showActivityIndicator={false}
                  placeholderColor="rgba(255, 255, 255, 0.1)"
                  tint="dark"
                  blurIntensity={25}
                />
                <View className="shrink justify-between gap-[4px]">
                  <Text
                    className="text-[12px] text-[#f2f2f2] max-w-[200px] font-LexendDecaSemiBold shrink"
                    numberOfLines={1}
                    style={styles.text}
                  >
                    {product?.name}
                  </Text>
                  <View className="flex-row items-end gap-[8px] justify-between w-full shrink">
                    <View className="flex-row items-end gap-[8px] flex-wrap shrink">
                      <Text
                        className="text-[18px] text-[#fff] font-LexendDecaMedium"
                        style={styles.text}
                      >
                        ₦
                        {item?.discount?.isActive
                          ? item?.discount?.discountedPrice?.toLocaleString() ||
                            0
                          : item?.price?.toLocaleString()}
                      </Text>
                      <Text
                        className="text-[12px] text-[#000] font-LexendDecaMedium shrink"
                        style={styles.text}
                      >
                        {item?.discount?.isActive ? (
                          <Text className="text-[#16783A]">
                            ₦{item?.discount?.value?.toFixed(0)}
                            {item?.discount?.type == "percentage" && "%"} off
                          </Text>
                        ) : null}
                      </Text>
                      {item?.discount?.isActive ? (
                        <Text
                          className="text-[12px] text-[#FF0A0A] font-LexendDecaMedium line-through"
                          style={styles.text}
                        >
                          ₦{item?.price?.toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      className={`text-[14px] ${item?.stock < 10 ? "text-[#FF6652]" : "text-[#f2f2f2]"} font-LexendDecaMedium `}
                      style={styles.text}
                    >
                      {item?.stock < 1
                        ? "Out of Stock"
                        : formatNumber(item.stock) + "left"}
                    </Text>
                  </View>
                </View>
              </View>

              {offlineAuctionData && (
                <View className="p-[4px] flex-row items-center gap-[16px]">
                  <Text className="text-[#16783A] text-[14px] font-LexendDecaMedium">
                    {offlineAuctionData?.bidsCount} bids
                  </Text>
                  <Text className="font-LexendDecaBold !text-[#FF0A0A]  text-[14px]">
                    {bidTime || formatTimeFromNow(offlineAuctionData?.endDate)}
                  </Text>
                </View>
              )}
            </Pressable>
            <TouchableOpacity
              className="p-[12px] rounded-[20px] bg-[#16783A] items-center justify-center"
              onPress={handleActionBtn}
              style={[
                styles.buttonShadow,
                { opacity: item?.stock < 1 ? 0.5 : 1 },
              ]}
            >
              {item?.stock < 1 ? (
                <Text className="text-white text-[12px] font-[600]">
                  {"Out of Stock"}
                </Text>
              ) : (
                <Text className="text-white text-[12px] font-[600]">
                  {offlineAuctionData ? "Bid Now" : "Buy now"}
                </Text>
              )}
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
          handleIndicatorStyle={{
            backgroundColor: "white",
          }}
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          <CommentsSheet
            handleIncreaseCommentCount={handleIncreaseCommentCount}
            product={product}
            id={id}
            commentCount={comments}
            handleCantComment={handleCantComment}
            closeCommentsSheet={closeCommentsSheet}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showCheckout}
          snapPoints={["85%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowCheckout(false)}
          keyboardBehavior={"interactive"}
          enablePanDownToClose={true}
          enableDynamicSizing={false}
        >
          <CheckoutNow
            productId={product.id}
            closeSheet={handleCloseCheckout}
            sellerId={seller._id}
            channel="blips"
            blipId={id}
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
          handleIndicatorStyle={{
            backgroundColor: "white",
          }}
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

  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 500, // Adjust based on how much shadow you want
    justifyContent: "flex-end",
    padding: 16,
  },
});

export default memo(VideoItem);
