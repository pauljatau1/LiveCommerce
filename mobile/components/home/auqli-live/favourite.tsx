import { View, Text, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import { getToken } from "@/store/features/auth/utils";

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
        console.log("favorite sellers streams", response.data?.streams?.length);
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
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Favorite Streams
        </Text>
      </View>
    );
  }, [favoriteSellersStream]);

  useEffect(() => {
    fetchFavoriteSellersStreams();
  }, []);

  return (
    <View className="w-[100%] pt-[30px]">
      <SectionHeader title="Your Favourite sellers" />
      <View
        style={{
          width: "100%",
        }}
      >
        {favoriteSellersStream?.length > 0 ? (
          <FlatList
            data={favoriteSellersStream}
            renderItem={({ item }) => (
              <View className="space-x-4 space-y-4 mb-[5.54px]">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => `group-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
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
