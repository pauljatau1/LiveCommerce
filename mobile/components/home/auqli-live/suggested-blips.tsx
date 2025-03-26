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
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import BlipCard from "@/components/blips/blipCard";
import SuggestedBlipsSkeleton from "@/components/skeleton/suggestedBlipsSkeleton";

const { width } = Dimensions.get("window");

const SuggestedBlips = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [loading, setLoading] = useState<boolean>(true);
  const [blips, setBlips] = useState<any[]>([]);
  const fetchSpotlightLiveStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/blips/suggested?limit=10`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      setBlips(response.data?.blips);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, []);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Suggested Blips!
        </Text>
      </View>
    );
  }, [blips]);

  return (
    <View className="pt-[16px] mb-5 w-full">
      <SectionHeader title="Suggested Blips" btnText="" />
      {loading ? (
        <SuggestedBlipsSkeleton numOfLoaders={2} height={250} padding={16} />
      ) : blips?.length > 0 ? (
        <View style={{}}>
          <FlatList
            data={blips}
            renderItem={({ item }) => (
              <View
                style={{
                  width: (width - 32) / 2 - 6,
                }}
              >
                <BlipCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item._id || index?.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,

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

export default SuggestedBlips;
