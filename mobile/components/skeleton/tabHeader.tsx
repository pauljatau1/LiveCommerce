import { View, Text, ScrollView } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const TabHeaderSkeleton = () => {
  return (
    <View
      className="mt-[17px] border-b-[1px] flex-row items-center gap-[16px]"
      style={{
        borderBottomColor: "rgba(255, 255, 255, 0.38)",
        paddingBottom: 11,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 16,
        }}
      >
        {Array(5)
          ?.fill(0)
          ?.map((num: number, index: number) => (
            <Skeleton
              key={index}
              style={{
                backgroundColor: "#2e2e2e",
                borderRadius: 8,
              }}
              skeletonStyle={{
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: 8,
              }}
              animation="wave"
              width={65}
              height={35}
            />
          ))}
      </ScrollView>
    </View>
  );
};

export default TabHeaderSkeleton;
