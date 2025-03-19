import { View, Text, Dimensions } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const { width } = Dimensions.get("window");

const BannerSkeleton = () => {
  return (
    <View className="items-center">
      <Skeleton
        style={{
          backgroundColor: "#2e2e2e",
          borderRadius: 10,
        }}
        skeletonStyle={{
          backgroundColor: "rgba(0,0,0,0.05)",
          borderRadius: 10,
        }}
        animation="wave"
        width={width - 16 * 2}
        height={200}
      />
    </View>
  );
};

export default BannerSkeleton;
