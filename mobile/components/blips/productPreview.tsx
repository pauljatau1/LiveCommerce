import { View, Text, Pressable } from "react-native";
import React, { memo, useCallback } from "react";
import { useGetSingleProductQuery } from "@/services/products";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { formatNumber, getResizedImage } from "@/helpers/helpers";
import AnimatedButton from "../Primitives/Buttons/animatedButton";

const ProductPreview = ({
  product,
  closeSheet,
}: {
  product: any;
  closeSheet: any;
}) => {
  const {
    data: productDetails,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetSingleProductQuery(product?.id || product?.productId);

  const handleViewProduct = useCallback(() => {
    closeSheet();
    router.push(`/product/${productDetails._id}`);
  }, [closeSheet, productDetails]);
  return (
    <View className="px-[10px] pb-[20px]">
      <View className=" rounded-[14px] bg-white gap-[16px]">
        <Image
          source={{ uri: getResizedImage(productDetails?.images?.[0], 320) }}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 16,
            backgroundColor: "#f0f0f0",
          }}
          contentFit="contain"
        />
        <View className=" gap-[10px]">
          <View className="flex-row justify-between items-start gap-[8px]">
            <Text
              className="text-[16px] font-LexendDecaMedium shrink tracking-[-0.22px]"
              numberOfLines={1}
            >
              {productDetails?.name}
            </Text>
            <View className="bg-[#0BB248] rounded-[100px] px-[10px] items-center justify-center h-[20px]">
              <Text className="text-[12px] font-LexendDeca text-white tracking-[-0.22px]">
                ₦{productDetails?.price?.toLocaleString()}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center gap-[8px]">
            <Text className="text-[14px] font-LexendDeca text-[#425466] tracking-[-0.22px]">
              {productDetails?.stock < 1 ? "Out of Stock" : "In Stock"}
            </Text>
            <View className="bg-[#EBF2FA] rounded-[100px] px-[10px] py-[2px]">
              <Text className="text-[12px] font-LexendDeca text-[#A6B7D4]">
                {formatNumber(productDetails?.stock)}
              </Text>
            </View>
          </View>
          <AnimatedButton
            btnClassname={
              "px-[16px] h-[50px] rounded-[10px] bg-[#16783A] items-center justify-center"
            }
            onPress={handleViewProduct}
          >
            <Text className="text-[14px] font-LexendDecaMedium text-[#ffffff] tracking-[-0.22px]">
              View Product
            </Text>
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
};

export default memo(ProductPreview);
