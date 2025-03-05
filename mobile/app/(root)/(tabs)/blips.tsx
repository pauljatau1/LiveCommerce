import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
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

const { height } = Dimensions.get("window");
const Blips = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const tabBarHeight = insets.bottom;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const refreshBlips = useCallback(async () => {
    setRefreshing(true);
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips?page=${1}&limit=5`,
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

  const fetchMoreVideos = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips?page=${page}&limit=5`,
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
  };

  useEffect(() => {
    fetchMoreVideos();
  }, []);

  const renderVideo = ({ item, index }: { item: any; index: number }) => (
    <VideoItem
      id={item.blipId}
      item={item}
      videoUrl={item.blipUrl}
      isVisible={index === currentIndex}
      seller={item.seller}
      engagement={{
        likes: item?.blipEngagement?.likesCount,
        comments: item?.blipEngagement?.commentsCount,
        views: item?.blipEngagement?.viewCount,
      }}
      product={{
        id: item._id,
        name: item.productName,
        price: item.price,
        image: item.images,
      }}
    />
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
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="w-full relative bg-[#000]"
        style={{
          height: height,
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
            keyExtractor={(item, index) => index.toString()}
            pagingEnabled
            onEndReached={fetchMoreVideos}
            onEndReachedThreshold={1.5}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={refreshBlips}
            progressViewOffset={Platform.OS == "ios" ? 120 : 0}
            ListHeaderComponent={renderFooter}
          />
        )}
      </View>
    </>
  );
};

export default Blips;
