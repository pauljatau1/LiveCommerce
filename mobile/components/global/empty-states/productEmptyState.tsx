import { View, Text, Image } from "react-native";
import React from "react";
import { icons } from "@/constants";

const ProductEmptyState = () => {
  return (
    <View
      style={{
        // paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      <View
        style={{
          marginVertical: 24,
          padding: 24,
          paddingHorizontal: 48,
          alignItems: "center",
          //   backgroundColor: "#000",
          borderRadius: 8,
          flexShrink: 1,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            width: 102,
            height: 102,
            borderRadius: "50%",
            backgroundColor: "#DDF9E7",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <Image
            source={icons.sadEmoji}
            resizeMode="contain"
            className="w-[40px] h-[40px]"
          />
        </View>

        <Text
          className="mb-[10px] text-center text-[16px] font-LexendDecaSemiBold text-white"
          style={{
            lineHeight: 22,
          }}
        >
          No Products right now!
        </Text>
        <Text
          className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
          style={{
            lineHeight: 22,
          }}
        >
          When sellers upload products they will show up here.
        </Text>
      </View>
    </View>
  );
};

export default ProductEmptyState;
