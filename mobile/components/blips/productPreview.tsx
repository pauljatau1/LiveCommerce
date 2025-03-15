import { View, Text, Pressable } from "react-native";
import React from "react";
import { useGetSingleProductQuery } from "@/services/products";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";

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
  } = useGetSingleProductQuery(product?.id || product._id);
  return (
    <View className="p-[8px] pb-[28px]">
      {isLoading ? (
        <ActivityIndicator size={"small"} color="#16783A" />
      ) : (
        <>
          <View className="w-full flex-row items-center justify-between">
            <Text></Text>
            <Pressable onPress={closeSheet} className="flex-end">
              <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
                <AntDesign name="closecircle" size={30} color="#F9C7B3" />
              </View>
            </Pressable>
          </View>
          <View
            className="px-[16px] py-[8px] rounded-[14px]"
            style={{ backgroundColor: "rgba(18, 18, 18, 0.50)" }}
          >
            <View className="px-[16px] py-[8px] pb-[28px] rounded-[14px] bg-white gap-[16px]">
              <Image
                source={{ uri: productDetails?.images?.[0].url }}
                style={{ width: "100%", height: 200, borderRadius: 16 }}
                contentFit="contain"
              />
              <View className="px-[16px] gap-[10px]">
                <View className="flex-row justify-between items-start ">
                  <Text className="text-[16px] font-LexendDecaSemiBold shrink">
                    {productDetails?.name?.length > 50
                      ? productDetails?.name?.split(0, 50) + "..."
                      : productDetails?.name}
                  </Text>
                  <View className="bg-[#0BB248] rounded-[100px] px-[10px] items-center justify-center h-[20px]">
                    <Text className="text-[12px] font-LexendDeca text-white">
                      ₦{productDetails?.price?.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[16px] font-LexendDeca text-[#425466]">
                    In Stock
                  </Text>
                  <View className="bg-[#EBF2FA] rounded-[100px] px-[10px] py-[2px]">
                    <Text className="text-[12px] font-LexendDeca text-[#A6B7D4]">
                      {productDetails?.stock}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    closeSheet();
                    router.push(`/product/${productDetails._id}`);
                  }}
                >
                  <Text className="text-[12px] font-LexendDecaSemiBold text-[#16783A] mt-[10px] self-center">
                    Full Product Details
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export default ProductPreview;
