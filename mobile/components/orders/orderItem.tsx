import { View, Text, Image, Pressable } from "react-native";
import React, { useMemo, useState } from "react";
import { findVariantType } from "@/helpers/helpers";
import { router } from "expo-router";

const statusColor = {
  pending: { name: "Processing", color: "#FFF8DE" },
  pickup_arranged: { name: "In Transit", color: "rgb(219 234 254)" },
  delivered: { name: "Delivered", color: "#DEFFEE" },
  cancelled: { name: "cancelled", color: "rgba(238, 87, 28, 0.85)" },
} as any;

const OrderItem = ({
  orderItem,
  orderStatus,
  seller,
  buyer,
  token,
  conversationId,
}: {
  orderItem: any;
  orderStatus: string;
  seller: string;
  buyer: string;
  token: string;
  conversationId: string;
}) => {
  const [variant, setVariant] = useState<any>(null);
  const imageUrl = useMemo(() => {
    const type = findVariantType(orderItem?.specifications);
    if (type) {
      const variant = orderItem?.product?.variants?.find(
        (vr: any) => vr.name == type,
      );
      if (variant) {
        setVariant({
          name: variant.name,
          value: variant.value,
        });
        return variant.images[0]?.data;
      }
      return orderItem?.product?.images[0].url;
    } else {
      return orderItem?.product?.images[0].url;
    }
  }, [orderItem]);
  return (
    <View
      className="border-b-[1px] p-[14px] pb-[25px] flex-row justify-center"
      style={{
        borderColor: "rgba(242, 242, 242, 0.50)",
        marginBottom: 15,
      }}
    >
      <View className="w-[100%] gap-[16px] shrink relative">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {orderItem?.seller?.storeName ||
              orderItem?.seller?.businessName ||
              "Kicks Store"}
          </Text>
          <View
            className="rounded-[3px] px-[6px] py-[4px] w-[60px] justify-center items-center"
            style={{
              backgroundColor: statusColor[orderStatus]?.color,
            }}
          >
            <Text className=" text-[8px] font-LexendDecaMedium">
              {statusColor[orderStatus]?.name}
            </Text>
          </View>
        </View>
        <View className="gap-[16px]">
          <View>
            <Image
              source={{ uri: imageUrl }}
              resizeMode="cover"
              style={{
                width: 115,
                height: 103,
                borderRadius: 14,
              }}
            />
          </View>
          <View className="gap-[8px] relative shrink">
            <View className="flex-row items-center justify-between gap-[11px]">
              <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold shrink">
                {orderItem?.productName?.length > 50
                  ? orderItem?.productName?.slice(0, 50) + "..."
                  : orderItem?.productName}
              </Text>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: "#E5FDFF",
                }}
              >
                <Text className="text-[12px] text-[#16783A] font-LexendDecaSemiBold">
                  N{orderItem?.price.toLocaleString()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-[11px]">
              <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight shrink">
                Item ID: {orderItem._id}
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Quantity: {orderItem?.quantity}
              </Text>
            </View>
            {variant && (
              <View>
                <Text className="text-white text-[11px] font-LexendDecaMedium">
                  {variant?.name}: {variant?.value}
                </Text>
              </View>
            )}
          </View>
        </View>
        {orderStatus == "delivered" && (
          <View className="flex-row justify-end items-center flex-wrap relative">
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px]"
              style={{ width: "30%" }}
            >
              <Text className="text-white text-[10px] font-LexendDecaMedium">
                Return/Refund
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrderItem;
