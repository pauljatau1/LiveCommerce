import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";

const AddedToCart = ({
  cartData,
  closeSheet,
}: {
  cartData: any;
  closeSheet: () => void;
}) => {
  return (
    <View className="p-[16px] pb-[20px]">
      <Text className="text-white text-[16px] mb-[20px] text-center font-LexendDecaMedium ">
        Item Added To Cart
      </Text>
      <View className="flex-row gap-[16px] bg-white p-[8px] rounded-[8px] mb-[20px] items-center ">
        <Image
          source={{ uri: cartData?.images[0]?.url }}
          resizeMode="cover"
          style={{ width: 73, height: 73, borderRadius: 4 }}
        />
        <View className="justify-between py-2 gap-[20px] shrink">
          <Text
            className="text-[12px] font-LexendDecaMedium leading-[18px]"
            numberOfLines={2}
          >
            {cartData?.name}
          </Text>
          <View className="flex-row items-center gap-[8px]">
            <Text className="text-[16px] font-LexendDecaMedium leading-[18px]">
              ₦
              {cartData?.discount?.isActive
                ? cartData?.discount?.discountedPrice?.toLocaleString() || 0
                : cartData?.price?.toLocaleString()}
            </Text>
            {cartData?.discount?.isActive && (
              <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                -{cartData?.discount?.value}
                {cartData?.discount?.type == "percentage" && "%"} off
              </Text>
            )}
          </View>
        </View>

        <View className="absolute right-[-10px]">
          <Image source={require("../../assets/icons/elements.png")} />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          className="w-full py-[12px] bg-white rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
          onPress={closeSheet}
        >
          <Text className="text-[#16783A] font-LexendDecaBold text-[12px]">
            Continue Shopping
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-full py-[12px] bg-[#16783A] rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
          onPress={() => {
            closeSheet();
            router.push("/checkout/checkout");
          }}
        >
          <Text className="text-white font-LexendDecaBold text-[12px]">
            Checkout Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddedToCart;
