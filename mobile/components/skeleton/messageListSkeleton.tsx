import { View, Text, Dimensions } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const { width } = Dimensions.get("window");

const MessageListSkeleton = ({
  numOfLoaders,
  height = 173,
  padding = 16,
}: {
  numOfLoaders: number;
  height: number;
  padding: number;
}) => {
  return (
    <View>
      <View
        className="gap-[8px] flex-row items-center mb-[16px]"
        style={{
          paddingLeft: padding,
        }}
      >
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
          width={80}
          height={30}
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
          width={80}
          height={30}
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

export default MessageListSkeleton;
