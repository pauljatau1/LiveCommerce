import { View, Text, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import SectionHeader from "@/components/global/section-header";

const SpotLight = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [spotLight, setSpotLight] = useState<any[]>([]);
  const fetchSpotlightLiveStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/spotlight?status=live`,
      );
      if (response.status === 200) {
        console.log("spotlight streams", response.data?.streams?.length);
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
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Spotlight Streams
        </Text>
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
