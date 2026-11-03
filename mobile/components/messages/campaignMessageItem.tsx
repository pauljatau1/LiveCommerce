import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { formatDate } from "@/helpers/helpers";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { toast } from "@/core/toast";
import { ScrollView } from "react-native-gesture-handler";

const CampaignMessageItem = ({ item }: any) => {
  return (
    <View className="pt-[16px] px-[12px]">
      <Text className="text-[18px] font-LexendDecaSemiBold text-center mb-[10px]">
        {item?.title}
      </Text>
      <View className="bg-[#DEFFEE] rounded-[12px] p-[4px] self-center mb-[20px]">
        <Text className="text-[#16783A] text-[10px] font-LexendDecaMedium">
          Campaign
        </Text>
      </View>
      <Text className="font-LexendDeca text-[12px] mb-[20px]">
        {item?.message}
      </Text>

      {item?.products?.length > 0 && (
        <Text className="font-LexendDecaMedium text-[14px]">Products:</Text>
      )}

      <ScrollView
        nestedScrollEnabled={true}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 20,
          paddingVertical: 12,
        }}
      >
        {item?.products?.map((product: any, index: number) => (
          <Pressable
            className=" flex-row gap-[20px]"
            key={product?.id || index}
            onPress={() => router.push(`/product/${product.id}`)}
          >
            <Image
              source={{ uri: product?.image }}
              style={{
                width: 70,
                height: 70,
                borderRadius: 12,
              }}
            />
            <View>
              <Text className="text-[14px] font-LexendDeca" numberOfLines={1}>
                {product?.name}
              </Text>
              <Text className="text-[18px] font-LexendDeca">
                ₦{product?.price?.toLocaleString()}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(CampaignMessageItem);
