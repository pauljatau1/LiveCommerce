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
  Alert,
  Linking,
} from "react-native";
import VideoItem from "@/components/blips/videoItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import axios from "axios";
import { toast } from "@/core/toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getToken } from "@/store/features/auth/utils";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PromotionModal from "@/components/modals/promotion";
import { Settings } from "react-native-fbsdk-next";
import { checkVersion } from "react-native-check-version";
import DeviceInfo from "react-native-device-info";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const { height } = Dimensions.get("screen");
const Blips = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const tabBarHeight = useBottomTabBarHeight();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isPromotionVisible, setIsPromotionVisible] = useState<boolean>(false);
  const [promotionAmount, setPromotionAmount] = useState<number>();

  const verifyAppVersion = async () => {
    const version = await checkVersion();
    console.log("Got version info:", version);

    if (version.needsUpdate) {
      Alert.alert(
        "New Update Available",
        "Update the app to get the latest features",
        [
          { text: "Cancel" },
          {
            text: "Update",
            onPress: () => Linking.openURL(version.url),
          },
        ],
      );
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

    if (
      isFirstTime &&
      verifyPayload &&
      verifyPayload.bonus?.amount &&
      token
    ) {
      setPromotionAmount(verifyPayload.bonus?.amount)
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

  const fetchMoreVideos = useCallback(async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips/personalized?page=${page}&limit=5`,
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
  }, []);

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
    ({ item, index }: { item: any; index: number }) => (
      <VideoItem
        id={item?.blipId}
        item={item}
        videoUrl={item?.blipUrl}
        isVisible={index === currentIndex}
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
      />
    ),
    [currentIndex],
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

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: "#121212",
      }}
      edges={Platform.OS == "ios" ? ["bottom"] : ["top", "bottom"]}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          height:
            Platform.OS == "ios"
              ? height - insets.bottom
              : height - insets.top - insets.bottom,
        }}
      >
        {videos?.length < 1 ? (
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
            ref={flatListRef}
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item, index) =>
              item?.blipId + index.toString() || index.toString()
            }
            pagingEnabled
            onEndReached={fetchMoreVideos}
            onEndReachedThreshold={1}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length:
                Platform.OS == "ios"
                  ? height - insets.bottom
                  : height - insets.top - insets.bottom,
              offset:
                (Platform.OS == "ios"
                  ? height - insets.bottom
                  : height - insets.top - insets.bottom) * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={refreshBlips}
            progressViewOffset={Platform.OS == "ios" ? 120 : 0}
            ListHeaderComponent={renderFooter}
            updateCellsBatchingPeriod={100}
            removeClippedSubviews={true}
          />
        )}
      </View>
      <PromotionModal isVisible={isPromotionVisible} closeModal={closeModal} promotionAmount={promotionAmount} />
    </SafeAreaView>
  );
};

export default Blips;
