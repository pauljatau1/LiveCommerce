import { View, Text, Dimensions } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const { width } = Dimensions.get("window");

const SuggestedBlipsSkeleton = ({
  numOfLoaders,
  height = 173,
  padding = 16,
}: {
  numOfLoaders: number;
  height: number;
  padding: number;
}) => {
  return (
    <View
      className="flex-row gap-[12px] justify-between items-center flex-wrap"
      style={{ padding }}
    >
      {Array(numOfLoaders)
        .fill(0)
        .map((_, index) => (
          <View key={index} className="gap-[8px]">
            <Skeleton
              style={{
                backgroundColor: "#2e2e2e",
                borderRadius: 8,
              }}
              skeletonStyle={{
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: 5,
              }}
              animation="wave"
              width={(width - padding * 2 - 12) / 2}
              height={height}
            />
          </View>
        ))}
    </View>
  );
};

export default SuggestedBlipsSkeleton;
