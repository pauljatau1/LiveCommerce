import { View, Text, Image } from "react-native";
import React, { useMemo, useState } from "react";

const CartItem = ({
  cartItem,
  index,
  isLastItem,
}: {
  cartItem: any;
  index: number;
  isLastItem: boolean;
}) => {
  const [quantity, setQuantity] = useState<number>(cartItem?.quantity);

  const totalPrice = useMemo(() => {
    const price = cartItem.discount?.isActive
      ? cartItem.discount?.discountedPrice
      : cartItem.price;
    return price * cartItem.quantity;
  }, [quantity]);

  return (
    <View
      className=" py-[30px] px-[8px]"
      style={{
        paddingTop: index == 0 ? 10 : 20,
        borderBottomColor: "#ffffff33",
        borderBottomWidth: isLastItem ? 0 : 1,
      }}
    >
      <View className="gap-[16px] shrink">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {cartItem?.seller?.businessName ||
              cartItem?.seller?.storeInfo?.storeName ||
              cartItem?.seller?.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px]">
          <View>
            <Image
              source={{ uri: cartItem?.images[0].url }}
              resizeMode="cover"
              resizeMethod="resize"
              className="w-[100px] h-[100px] rounded-[12px]"
            />
          </View>
          <View className="gap-[6px] relative shrink">
            <Text
              className="text-[14px] text-[#ffffff] opacity-80 font-LexendDeca leading-[20px]"
              numberOfLines={2}
            >
              {cartItem?.name}
            </Text>
            <Text className="text-white opacity-80 font-LexendDecaMedium tracking-wide  text-[16px]">
              ₦
              {cartItem?.discount?.isActive
                ? cartItem?.discount?.discountedPrice?.toLocaleString() || 0
                : cartItem?.price?.toLocaleString()}
              {"  "}
              {cartItem?.discount?.isActive && (
                <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                  {cartItem?.discount?.value}
                  {cartItem?.discount?.type == "percentage" && "%"} off
                </Text>
              )}
            </Text>
            {/* <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
              Item ID: {cartItem._id}
            </Text> */}
            {(cartItem?.seller?.offersStorePickup ||
              cartItem?.seller?.shippingInfo?.offersStorePickup) && (
              <View className=" p-[4px] px-[8px] bg-[#1683da33] items-center justify-center self-start rounded-[10px]">
                <Text className="text-[8px] text-[#1683da] font-LexendDeca">
                  Store Pickup Available
                </Text>
              </View>
            )}
            <View
              className="flex-row w-full items-center justify-between gap-[8px] flex-wrap"
              style={{
                marginTop: "auto",
              }}
            >
              <Text className="text-white text-[12px] font-LexendDecaMedium">
                Total:{" "}
                <Text className="text-[16px] text-[#fff] font-LexendDecaSemiBold">
                  ₦{totalPrice.toLocaleString()}
                </Text>
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Qty: {quantity}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItem;
