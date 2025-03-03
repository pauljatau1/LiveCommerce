import { View, FlatList } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useEffect } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import { useLivestream } from "../../../contexts/livestreamContext";

const PopularCard = () => {
  const {
    isLoading,
    activeLivestream,
    isDataReady,
    fetchAllActiveLiveStreams,
  } = useLivestream();

  return (
    <View className="pt-[16px] mb-5 w-full">
      <SectionHeader title="Popular Now" btnText="View All" />
      <View className="pl-[16px]">
        {isLoading ? (
          <ActivityIndicator size="small" color="#16783A" />
        ) : (
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
        )}
      </View>
    </View>
  );
};

export default PopularCard;
