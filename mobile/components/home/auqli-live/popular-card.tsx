import { View, FlatList, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";
import { useLivestream } from "../../../contexts/livestreamContext";



const PopularCard = () => {
  const { isLoading, activeLivestream, fetchAllActiveLiveStreams } = useLivestream();

  useEffect(() => {
    fetchAllActiveLiveStreams();
  }, []);


  return (
    <View className="pt-[30px] mb-5 w-full">
      <SectionHeader title="Popular Now" btnText="View All" />
      <View className="pl-6">
        {
          isLoading ? (
            <ActivityIndicator size="large" color="#16783A" />
          ) : (
            <FlatList
              data={activeLivestream}
              renderItem={({ item }) => (
                <LiveProductCard
                  item={item}
                  showLive={true}
                  showBtn={true}
                />
              )}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 14,
                gap: 12
              }}
            />
          )
        }
      </View>
    </View>
  );
};

export default PopularCard;
