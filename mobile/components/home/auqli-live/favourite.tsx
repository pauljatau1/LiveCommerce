import { View, Text, FlatList, Dimensions, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import { getToken } from "@/store/features/auth/utils";
import { icons } from "@/constants";

const { width } = Dimensions.get("window");

const Favourite = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [favoriteSellersStream, setFavoriteSellersStream] = useState<any[]>([]);
  const fetchFavoriteSellersStreams = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/favorite-sellers?status=live`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 200) {
        if (!response.data?.streams) {
          return;
        }
        setFavoriteSellersStream(response.data?.streams);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [favoriteSellersStream]);

  useEffect(() => {
    fetchFavoriteSellersStreams();
  }, []);

  return (
    <View className="w-[100%] pt-[30px]">
      <SectionHeader title="Your Favourite Sellers" />
      <View
        style={{
          width: "100%",
        }}
      >
        {favoriteSellersStream?.length > 0 ? (
          <FlatList
            data={favoriteSellersStream}
            renderItem={({ item }) => (
              <View
                style={{
                  width: (width - 32) / 2 - 6,
                }}
              >
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => `group-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 12,
            }}
            className="pt-[5px]"
          />
        ) : (
          renderEmptyStreams()
        )}
      </View>
    </View>
  );
};

export default Favourite;
