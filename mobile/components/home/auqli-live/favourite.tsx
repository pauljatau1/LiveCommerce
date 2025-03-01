import { View, Text, FlatList } from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";

const Favourite = () => {
  const numColumns = 2;
  const sellers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const groupedSellers = sellers.reduce((rows, seller, index) => {
    if (index % numColumns === 0) rows.push([]);
    rows[rows?.length - 1].push(seller);
    return rows;
  }, [] as any[][]);

  const lastSeller = sellers[sellers?.length - 1];

  return (
    <View className="w-[100%] pt-[30px]">
      <SectionHeader title="Your Favourite sellers" />
      <View style={{}}>
        <FlatList
          data={groupedSellers}
          renderItem={({ item: row }) => (
            <View className="space-x-4 space-y-4 mb-[5.54px]">
              {row.map((seller) => (
                <LiveProductCardTemplate
                  key={seller}
                  {...seller}
                  showLive={true}
                  lastSeller={lastSeller}
                  showBtn={true}
                />
              ))}
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
      </View>
    </View>
  );
};

export default Favourite;
