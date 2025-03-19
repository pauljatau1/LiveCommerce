import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  Modal,
  Alert,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useGetSellerProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import CatalogCard from "../catalog/catalogCard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BottomSheet from "../global/bottom-sheet";
import { catalogSort, formatNumber } from "@/helpers/helpers";
import VideoItem from "../blips/videoItem";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { router } from "expo-router";
import { Video } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import BlipItem from "./blipItem";

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
          `api/products/seller/${sellerId}/blips?page=${page}&limit=3`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const newVideos = response.data.blips;

      if (newVideos.length > 0) {
        console.log("generating");

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
    }
  };

  // const generateThumbnail = async (newVideos: any[]) => {
  //   try {
  //     const newImages = [] as any;
  //     console.log("generating thumbnail");

  //     for (const video of newVideos) {
  //       const { uri } = await VideoThumbnails.getThumbnailAsync(
  //         video?.blipUrl,
  //         {
  //           time: 1000,
  //         },
  //       );
  //       newImages.push({
  //         uri,
  //         views: video.blipEngagement.viewCount || 0,
  //         ...video,
  //       });
  //       console.log("new images uri", uri);
  //     }
  //     setImages((prevImages) => {
  //       return [...prevImages, ...newImages];
  //     });
  //   } catch (e) {
  //     console.warn(e);
  //   }
  // };

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
          {videos?.length > 0 && (
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
            />
          )}
        </View>
      )}
    </View>
  );
};

const VideoCard = memo(({ item }: { item: any }) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  console.log(item);

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
        source={{ uri: item.images }}
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

      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
        presentationStyle="fullScreen"
      >
        <BlipItem
          id={item.blipId}
          videoUrl={item.blipUrl}
          isVisible={true}
          seller={item.seller}
          engagement={{
            likes: item?.blipEngagement?.likesCount,
            comments: item?.blipEngagement?.commentsCount,
          }}
          product={{
            id: item._id,
            name: item.productName,
            price: item.price,
            image: item.images,
          }}
          closeModal={() => setModalVisible(false)}
        />
      </Modal>
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
