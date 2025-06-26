import { View, Text, FlatList, Pressable, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import SectionHeader from "@/components/global/section-header";
import { router } from "expo-router";
import { icons } from "@/constants";

const SpotLight = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const fetchSpotlightLiveStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/spotlight?status=live_upcoming`,
      );
      if (response.status === 200) {
        setSpotLight(response.data?.streams);
      }
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
  }, [spotLight]);

  return (
    <View className="mt-[9px] w-[100%] pb-[15.5px]">
      <SectionHeader title="In The Spotlight" btnText="" />
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : spotLight?.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={spotLight}
            renderItem={({ item }) => (
              <View className="w-1/2 py-2 shrink">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
    </View>
  );
};

export default SpotLight;
