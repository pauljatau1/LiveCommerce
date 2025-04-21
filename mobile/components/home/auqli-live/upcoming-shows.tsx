import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import SectionHeader from "@/components/global/section-header";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import LiveProductCard from "@/components/global/live-product-card";
import LottieView from "lottie-react-native";
import { icons } from "@/constants";

const { width } = Dimensions.get("window");

const UpComing = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [upcoming, setupcoming] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const fetchupcomingLiveStreams = async () => {
    if (page > 1) {
      setFetching(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams?status=scheduled&page=${page}&limit=10`,
      );
      if (response.status === 200) {
        console.log("upcoming streams", response.data?.streams?.length);
        if (response.data?.streams) {
          if (page == 1) {
            setupcoming(response.data?.streams);
          } else {
            setupcoming([...upcoming, ...response.data?.streams]);
          }
          setPage((prevPage) => prevPage + 1);
        }
        if (!response.data?.pagination?.hasMore) {
          setHasReachedEnd(true);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchupcomingLiveStreams();
  }, []);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          // paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 48,
            alignItems: "center",
            backgroundColor: "#000",
            borderRadius: 8,
            flexShrink: 1,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 102,
              height: 102,
              borderRadius: "50%",
              backgroundColor: "#DDF9E7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <Image
              source={icons.sadEmoji}
              resizeMode="contain"
              className="w-[40px] h-[40px]"
            />
          </View>

          <Text
            className="mb-[10px] text-center text-[16px] font-LexendDecaSemiBold text-white"
            style={{
              lineHeight: 22,
            }}
          >
            No Live Shopping events right now!
          </Text>
          <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            Follow your favourite sellers to get notified when they go live.
          </Text>
        </View>
      </View>
    );
  }, [upcoming]);

  return (
    <View className="mt-[16px] w-[100%] pb-[18px] flex-1">
      <SectionHeader title="Upcoming Streams" btnText="" />
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={upcoming}
            renderItem={({ item }) => (
              <View
                style={{
                  width: (width - 32) / 2 - 6,
                }}
              >
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            horizontal={upcoming?.length > 0}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 14,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyStreams}
          />
        </View>
      )}
    </View>
  );
};

export default UpComing;
