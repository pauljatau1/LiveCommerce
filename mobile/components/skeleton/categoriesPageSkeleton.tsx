import { View, Text, Dimensions } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const { width } = Dimensions.get("window");

const CategoriesPageSkeleton = ({
  numOfLoaders = 5,
  height = 50,
  padding = 16,
}: {
  numOfLoaders?: number;
  height?: number;
  padding?: number;
}) => {
  return (
    <View>
      <View className="gap-[7px] mb-[21px] justify-center">
        <Skeleton
          style={{
            backgroundColor: "#2e2e2e",
            borderRadius: 8,
          }}
          skeletonStyle={{
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 8,
          }}
          animation="wave"
          width={width - padding * 2}
          height={70}
        />
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
          width={width - padding * 2}
          height={50}
        />
      </View>
      <View
        className="gap-[16px] justify-between items-center"
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
                width={width - padding * 2}
                height={height}
              />
            </View>
          ))}
      </View>
    </View>
  );
};

export default CategoriesPageSkeleton;
