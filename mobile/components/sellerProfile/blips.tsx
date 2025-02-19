import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useGetSellerProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import CatalogCard from "../catalog/catalogCard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BottomSheet from "../global/bottom-sheet";
import { catalogSort } from "@/helpers/helpers";
import VideoItem from "../blips/videoItem";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { router } from "expo-router";
import { Video } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Image } from "expo-image";

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
  const [filter, setFilter] = useState<string>("None");
  const [videos, setVideos] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  const renderBlips = (item: any) => {
    return (
      <View className="w-[100%] basis-[49%] h-[299px]">
        <VideoCard url={item.uri} />
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
          `api/products/seller/${sellerId}/blips?page=${page}&limit=5`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newVideos = response.data.blips;

      if (newVideos.length > 0) {
        console.log("generating");

        generateThumbnail(newVideos);
        // setVideos((prevVideos) => {
        //   return [...prevVideos, ...newVideos];
        // });
      }

      if (response.data.currentPage == response.data.totalPages) {
        setHasReachedEnd(true);
      }

      if (page == 1) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching more blips:", error);
    }
  };

  const generateThumbnail = async (newVideos: any[]) => {
    try {
      const newImages = [] as any;
      console.log("generating thumbnail");

      newVideos.forEach(async (video: any) => {
        const { uri } = await VideoThumbnails.getThumbnailAsync(
          video?.blipUrl,
          {
            time: 15000,
          },
        );
        newImages.push({ uri });
        console.log("new iamges uri", uri);
        setImages((prevImages) => {
          return [...prevImages, { uri }];
        });
      });
      //   setImages((prevImages) => {
      //     return [...prevImages, ...newImages];
      //   });
      setPage((prevPage) => prevPage + 1);
    } catch (e) {
      console.warn(e);
    }
  };

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
        <View>
          <ActivityIndicator size={"small"} color="#16783A" />
        </View>
      ) : (
        <View>
          <Animated.FlatList
            ref={flatListRef}
            data={images}
            renderItem={({ item, index }) => renderBlips(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            onEndReached={fetchMoreVideos}
            onEndReachedThreshold={0.5}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 8,
            }}
            contentContainerStyle={{
              paddingTop: headerHeight + 12,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
          />
        </View>
      )}
    </View>
  );
};

const VideoCard = memo(({ url }: { url: string }) => {
  console.log("blips", url);

  return (
    <Pressable
      className=" bg-black rounded-lg p-[11.85px]  w-[100%] h-[299px]"
      //   onPress={() => router.push(`/product/${id}`)}
    >
      <Image
        source={{ uri: url }}
        style={{
          width: "100%",
          height: "100%",
        }}
        contentFit="cover"
      />
    </Pressable>
  );
});

export default memo(Blips);
