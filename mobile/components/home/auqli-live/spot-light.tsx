import { View, Text, FlatList } from "react-native";
import React from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";

const SpotLight = () => {
  return (
    <View className="mt-[9px] w-[100%] bg-[#3A3A3A]   pb-[15.5px]">
      <Text className="text-white text-[16px] font-LexendDecaBold px-[16px] pt-[12px]">
        In the spotlight
      </Text>
      <View
        style={{
          paddingHorizontal: 16,
        }}
      >
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={(item) => (
            <View className="w-1/2 py-2 shrink">
              <LiveCardTemp item={item} />
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
        />
      </View>
    </View>
  );
};

export default SpotLight;
