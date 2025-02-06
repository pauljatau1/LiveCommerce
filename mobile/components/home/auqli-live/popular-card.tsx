import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCard from "@/components/global/live-product-card";

const PopularCard = () => {
  return (
    <View className="pt-[30px] w-[100%]">
      <SectionHeader title="Popular Now" btnText="View All" />
      <View
        style={{
          paddingLeft: 23,
        }}
      >
        <FlatList
          data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          renderItem={(item) => (
            <LiveProductCard {...item} showLive={true} showBtn={true} />
          )}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
        />
      </View>
    </View>
  );
};

export default PopularCard;
