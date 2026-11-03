import {
  View,
  FlatList,
  Text,
  Dimensions,
  Image,
  Pressable,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import { useLivestream } from "../../../contexts/livestreamContext";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import { icons } from "@/constants";
import { router } from "expo-router";
import axios from "axios";

const { width } = Dimensions.get("window");

const PopularCard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [popular, setPopular] = useState<any[]>([]);
  const fetchPopularLiveStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/popular?status=live`,
      );
      if (response.status === 200) {
        setPopular(response.data?.streams);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularLiveStreams();
  }, []);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          paddingHorizontal: 16,
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
  }, [popular]);

  return (
    <View className="pt-[16px] mb-5 w-full">
      <SectionHeader title="Popular Now" btnText="" />
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : popular?.length > 0 ? (
        <View
          style={{
            paddingLeft: 16,
          }}
        >
          <FlatList
            data={popular}
            renderItem={({ item }) => (
              <View
                style={{
                  width: (width - 32) / 2 - 6,
                }}
              >
                <LiveProductCard item={item} showLive={true} showBtn={true} />
              </View>
            )}
            keyExtractor={(item, index) => item._id || index?.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 14,
              gap: 12,
            }}
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
    </View>
  );
};

export default PopularCard;
