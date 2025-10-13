import {
  View,
  FlatList,
  Text,
  Dimensions,
  Image,
  Pressable,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { memo, useCallback, useEffect, useState } from "react";
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
import { Entypo } from "@expo/vector-icons";
import { getToken } from "@/store/features/auth/utils";

const { width } = Dimensions.get("window");

const SuggestedBlips = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [blips, setBlips] = useState<any[]>([]);
  const fetchSpotlightLiveStreams = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/blips/suggested?limit=10`,
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
  }, []);

  useEffect(() => {
    fetchSpotlightLiveStreams();
  }, []);

  const renderBlips = useCallback(
    ({ item }: any) => (
      <View className="w-1/2 py-2 shrink">
        <BlipCard item={item} />
      </View>
    ),
    [],
  );

  const renderEmptyStreams = useCallback(() => {
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
          No Suggested Blips
        </Text>
      </View>
    );
  }, [blips]);

  const redirectToBlips = useCallback(() => {
    router.canDismiss()
      ? router.dismissTo("/(root)/(tabs)/blips")
      : router.push("/(root)/(tabs)/blips");
  }, [router]);

  return (
    <View className="pt-[16px] mb-5 w-full">
      <SectionHeader
        title="Suggested Blips"
        btnText="More Blips"
        action={redirectToBlips}
      />
      {loading ? (
        <SuggestedBlipsSkeleton numOfLoaders={2} height={250} padding={16} />
      ) : blips?.length > 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <FlatList
            data={blips}
            renderItem={renderBlips}
            keyExtractor={(item, index) => item._id || index?.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
            showsVerticalScrollIndicator={false}
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

export default memo(SuggestedBlips);
