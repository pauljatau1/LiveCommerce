import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  FlatList,
} from "react-native";
import React, { useCallback, useState } from "react";
import { Link, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomSheet from "../global/bottom-sheet";
import CancelSheet from "./cancelSheet";
import { ScrollView } from "react-native-gesture-handler";

const statusColor = {
  pending: { name: "Processing", color: "#FFF8DE" },
  processing: { name: "Processing", color: "#FFF8DE" },
  confirmed: { name: "Confirmed", color: "#FFF8DE" },
  pending_pickup: { name: "Pending Pick-Up", color: "rgb(219 234 254)" },
  picked_up: { name: "Picked Up", color: "rgb(219 234 254)" },
  in_transit: { name: "Dispatched", color: "rgb(219 234 254)" },
  "in-transit": { name: "Dispatched", color: "rgb(219 234 254)" },
  shipped: { name: "Dispatched", color: "rgb(219 234 254)" },
  delivered: { name: "Delivered", color: "#DEFFEE" },
  cancelled: { name: "cancelled", color: "rgba(238, 87, 28, 0.85)" },
  returned: { name: "refund request", color: "rgba(238, 87, 28, 0.85)" },
} as any;

const OrderItem = ({
  orderItem,
  conversations,
  token,
}: {
  orderItem: any;
  conversations: any;
  token: string;
}) => {
  const [showCancelSheet, setShowCancelSheet] = useState<boolean>(false);

  const renderImages = useCallback(({ item }: any) => {
    return (
      <Image
        source={{ uri: item?.product?.images[0].url }}
        resizeMode="cover"
        style={{
          width: 115,
          height: 103,
          borderRadius: 14,
          // backgroundColor: "#2a2a2a",
        }}
      />
    );
  }, []);
  return (
    <Pressable
      // activeOpacity={0.5}

      className="border-b-[1px] p-[16px] pb-[25px] flex-row justify-center"
      style={{
        borderColor: "rgba(242, 242, 242, 0.50)",
      }}
      onPress={() => {
        if (
          !orderItem.paid &&
          orderItem?.paymentInfo?.method == "paystack" &&
          orderItem.shipping.tracking.status !== "cancelled"
        )
          return;
        router.push({
          pathname: `../../(root)/orders/${orderItem._id}`,
          params: {
            token,
            conversationId:
              conversations?.find(
                (convo: any) => convo.participant.id == orderItem.seller,
              )?._id || "",
          },
        });
      }}
    >
      <View className="w-[100%] gap-[16px] shrink relative">
        <View className=" flex-row items-center justify-between">
          <View className=" flex-row items-center gap-[8px]">
            <Image
              source={require("../../assets/icons/store.png")}
              resizeMode="contain"
              style={{
                width: 14,
                height: 14,
              }}
            />
            <Text className="text-[16px] text-white font-LexendDecaSemiBold">
              {orderItem?.items[0]?.seller?.storeName ||
                orderItem?.items[0]?.seller?.businessName}
            </Text>
          </View>

          <View
            className="rounded-[3px] px-[6px] py-[4px] justify-center items-center"
            style={{
              backgroundColor: orderItem.paid
                ? statusColor[
                    orderItem?.shipping?.tracking?.status?.toLowerCase()
                  ]?.color
                : orderItem?.paymentInfo?.isCashOnDelivery
                  ? "blue"
                  : "red",
            }}
          >
            <Text
              className={`text-[8px] font-LexendDeca ${orderItem.paid ? null : "text-white"}`}
            >
              {(orderItem.paid && !orderItem?.orderStatus?.hasReturn) ||
              orderItem.shipping.tracking.status == "cancelled"
                ? statusColor[orderItem.shipping.tracking.status?.toLowerCase()]
                    ?.name
                : orderItem?.orderStatus?.hasReturn
                  ? statusColor["returned"]?.name
                  : orderItem?.paymentInfo?.isCashOnDelivery
                    ? "Cash on Delivery"
                    : "Pending Payment"}
            </Text>
          </View>
        </View>
        <View className="gap-[16px] w-full">
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 12,
            }}
          >
            {orderItem?.items?.map((item: any, index: number) => (
              <View key={item?._id || index}>{renderImages({ item })}</View>
            ))}
          </ScrollView>
          {/* <FlatList
            data={orderItem?.items}
            renderItem={renderImages}
            nestedScrollEnabled={true}
            keyExtractor={(item, index) =>
              item?._id || item?.id || index.toString()
            }
            horizontal
            contentContainerStyle={{
              gap: 12,
            }}
            showsHorizontalScrollIndicator={false}
          /> */}
          <View className="gap-[8px] relative shrink">
            <View className="flex-row items-center justify-between gap-[11px]">
              {/* <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold shrink">
                {orderItem?.items[0]?.productName?.length > 50
                  ? orderItem?.items[0]?.productName?.slice(0, 50) + "..."
                  : orderItem?.items[0]?.productName}
              </Text> */}
              <Text
                className="text-[14px] text-[#fff] font-LexendDecaMedium shrink"
                numberOfLines={1}
              >
                {orderItem?.items?.length > 1
                  ? orderItem?.items?.length + " Items"
                  : orderItem?.items[0]?.productName}
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
                  N{orderItem?.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-[11px] flex-wrap">
              <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
                Order ID: {orderItem?.order_id}
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Quantity: {orderItem?.items[0].quantity}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between items-center relative gap-[6px]">
          <Pressable
            className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px] shrink"
            style={{ width: "100%" }}
            onPress={() =>
              router.push({
                pathname: `../../(root)/messageRoom/${orderItem.seller}`,
                params: {
                  name:
                    orderItem.items?.[0]?.product?.seller?.storeName ||
                    orderItem.items?.[0]?.product?.seller?.firstName +
                      " " +
                      orderItem.items?.[0]?.product?.seller?.lastName ||
                    "Default",
                  avatar:
                    orderItem.items?.[0]?.product?.seller?.storeAvatar?.url,
                  conversationId:
                    conversations?.find(
                      (convo: any) => convo.participant.id == orderItem.seller,
                    )?._id || "",
                  userId: orderItem?.buyer,
                  token: token,
                  model: "Seller",
                  orderId: orderItem?.id || orderItem?._id,
                },
              })
            }
          >
            <Text className="text-white text-[10px]">Chat Seller</Text>
          </Pressable>
          {["pending", "processing", "confirmed"]?.includes(
            orderItem.shipping.tracking.status,
          ) ? (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A] shrink"
              style={{ width: "100%" }}
              onPress={() => setShowCancelSheet(true)}
            >
              <Text className="text-white text-[10px]">Cancel Order</Text>
            </Pressable>
          ) : null}
          {/* {orderItem.shipping.tracking.status == "delivered" && (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px]"
              style={{ width: "30%" }}
            >
              <Text className="text-white text-[10px]">Return/Refund</Text>
            </Pressable>
          )} */}

          {["pickup_arranged"].includes(orderItem.shipping.tracking.status) && (
            <Link
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A]"
              style={{ width: "30%" }}
              href={orderItem?.shipping?.tracking?.url}
            >
              <Text className="text-white text-[10px] self-center text-center font-LexendDecaMedium">
                Track Order
              </Text>
            </Link>
          )}

          {/* {!orderItem.paid &&
          orderItem.shipping.tracking.status !== "cancelled" &&
          orderItem?.paymentInfo?.method == "paystack" ? (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A] shrink"
              style={{ width: "100%" }}
              onPress={async () => {
                console.log(orderItem._id);
                await AsyncStorage.setItem(
                  "orders",
                  JSON.stringify([{ ...orderItem, orderId: orderItem._id }]),
                );
                router.push(`/checkout/${orderItem._id}`);
              }}
            >
              <Text className="text-white text-[10px]">Pay</Text>
            </Pressable>
          ) : null} */}
        </View>
      </View>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[0px]"
        showCloseIcon={false}
        show={showCancelSheet}
        snapPoints={["80%"]}
        enableDynamicSizing={true}
        onRequestClose={() => setShowCancelSheet(false)}
        keyboardBehavior="interactive"
      >
        <CancelSheet
          orderItem={orderItem}
          conversations={conversations}
          closeSheet={() => setShowCancelSheet(false)}
          token={token}
        />
      </BottomSheet>
    </Pressable>
  );
};

export default OrderItem;
