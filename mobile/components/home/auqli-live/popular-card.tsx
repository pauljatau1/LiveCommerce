import { View, FlatList, Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useCallback, useEffect } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import { useLivestream } from "../../../contexts/livestreamContext";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";

const PopularCard = () => {
  const {
    isLoading,
    activeLivestream,
    isDataReady,
    fetchAllActiveLiveStreams,
  } = useLivestream();

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Active Streams
        </Text>
      </View>
    );
  }, [activeLivestream]);

  return (
    <View className="pt-[16px] mb-5 w-full">
      <SectionHeader title="Popular Now" btnText="View All" />
      <View className="w-full">
        {isLoading ? (
          <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
        ) : activeLivestream?.length > 0 ? (
          <FlatList
            data={activeLivestream}
            renderItem={({ item }) => (
              <LiveProductCard item={item} showLive={true} showBtn={true} />
            )}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 14,
              gap: 12,
            }}
          />
        ) : (
          renderEmptyStreams()
        )}
      </View>
    </View>
  );
};

export default PopularCard;
