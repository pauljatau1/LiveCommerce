import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { formatNumber } from "@/helpers/helpers";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { router } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Entypo } from "@expo/vector-icons";

const Blips = ({
  sellerId,
  scrollY,
  headerHeight,
  index,
}: {
  sellerId: string;
  scrollY: any;
  headerHeight: any;
  index: any;
}) => {
  const [page, setPage] = useState<number>(1);
  const [videos, setVideos] = useState<any[]>([]);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  const renderBlips = (item: any) => {
    return (
      <View
        className="w-[100%] basis-[48%] h-[200px]"
        style={{
          flexBasis: "48%",
          height: 250,
        }}
      >
        <VideoCard item={item} />
      </View>
    );
  };

  const fetchMoreVideos = async () => {
    if (hasReachedEnd) {
      return;
    }
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/seller/${sellerId}/blips?page=${page}&limit=3&processed=true`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newVideos = response.data.blips;

      if (newVideos.length > 0) {
        // generateThumbnail(newVideos);
        setPage((prevPage) => prevPage + 1);
        setVideos((prevVideos) => {
          return [...prevVideos, ...newVideos];
        });
      }

      if (response.data.currentPage == response.data.totalPages) {
        setHasReachedEnd(true);
      }

      if (page == 1) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching more blips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmptyBlips = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Entypo name="video" size={35} color="#ccc" style={{ opacity: 0.5 }} />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          This seller hasn't uploaded any Blips
        </Text>
      </View>
    );
  }, [videos, hasReachedEnd, isLoading]);

  useEffect(() => {
    fetchMoreVideos();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [index]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {isLoading ? (
        <View className="pt-[16px]">
          <ActivityIndicator size={"small"} color="#16783A" />
        </View>
      ) : (
        <View>
          <Animated.FlatList
            ref={flatListRef}
            data={videos}
            renderItem={({ item, index }) => renderBlips(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            onEndReached={fetchMoreVideos}
            onEndReachedThreshold={0.5}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 16,
            }}
            contentContainerStyle={{
              paddingTop: headerHeight + 12,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            ListEmptyComponent={renderEmptyBlips}
          />
        </View>
      )}
    </View>
  );
};

const VideoCard = memo(({ item }: { item: any }) => {
  return (
    <Pressable
      className=" bg-black rounded-[8px] w-[100%] h-[250px]"
      onPress={() =>
        router.push({
          pathname: "/singleBlip",
          params: { id: item?._id, blipId: item?.blipId },
        })
      }
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
        }}
        contentFit="cover"
      />
      <View style={styles.viewsContainer}>
        <View style={styles.buttonShadow}>
          <Ionicons name="play-outline" size={20} color="#f2f2f2" />
        </View>
        <Text style={styles.text}>
          {formatNumber(item?.blipEngagement?.viewCount)}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  viewsContainer: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  text: {
    color: "#f2f2f2",
    fontFamily: "LexendDeca",
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

export default memo(Blips);
