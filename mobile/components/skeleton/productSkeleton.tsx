import { View, Text, Dimensions } from "react-native";
import React from "react";
import { Skeleton } from "@rneui/themed";

const { width } = Dimensions.get("window");

const ProductSkeleton = ({
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
      style={{ paddingHorizontal: padding }}
    >
      {Array(numOfLoaders)
        .fill(0)
        .map((_, index) => (
          <View
            key={index}
            className=" bg-[#1e1e1e] rounded-lg p-[10px] h-[299px] gap-[10px] shrink"
            style={{
              backgroundColor: "#1a1a1a",
            }}
          >
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
              width={(width - padding * 2 - 12 - 40) / 2}
              height={height}
            />

            <View className="gap-[8px] ">
              <Skeleton
                style={{
                  backgroundColor: "#2e2e2e",
                  borderRadius: 4,
                }}
                skeletonStyle={{
                  backgroundColor: "rgba(0,0,0,0.05)",
                  borderRadius: 5,
                }}
                animation="wave"
                width={(width - padding * 2 - 12 - 100) / 2}
                height={12}
              />
              <Skeleton
                style={{
                  backgroundColor: "#2e2e2e",
                  borderRadius: 4,
                }}
                skeletonStyle={{
                  backgroundColor: "rgba(0,0,0,0.05)",
                  borderRadius: 5,
                }}
                animation="wave"
                width={(width - padding * 2 - 12 - 150) / 2}
                height={12}
              />
              <View className="flex-row gap-[6px] items-center">
                <Skeleton
                  style={{
                    backgroundColor: "#2e2e2e",
                    borderRadius: 12.5,
                  }}
                  skeletonStyle={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    borderRadius: 5,
                  }}
                  animation="wave"
                  width={25}
                  height={25}
                />
                <Skeleton
                  style={{
                    backgroundColor: "#2e2e2e",
                    borderRadius: 4,
                  }}
                  skeletonStyle={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    borderRadius: 5,
                  }}
                  animation="wave"
                  width={50}
                  height={12}
                />
              </View>
            </View>

            <View
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
              }}
            >
              <Skeleton
                style={{
                  backgroundColor: "#2e2e2e",
                  borderRadius: 4,
                }}
                skeletonStyle={{
                  backgroundColor: "rgba(0,0,0,0.05)",
                  borderRadius: 5,
                }}
                animation="wave"
                width={(width - padding * 2 - 12 - 40) / 2}
                height={20}
              />
            </View>
          </View>
        ))}
    </View>
  );
};

export default ProductSkeleton;
