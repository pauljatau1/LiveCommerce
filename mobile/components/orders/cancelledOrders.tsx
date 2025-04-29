import { View, Text } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/helpers/helpers";
import { Image } from "expo-image";
import CustomButton from "../global/button/CustomButton";
import { router } from "expo-router";
import OrderItem from "./orderItem";

const CancelledOrders = ({
  order,
  userToken,
  conversationId,
}: {
  order: any;
  userToken: any;
  conversationId: any;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View
        className="bg-white rounded-[16px]"
        style={{
          paddingHorizontal: 24,
          paddingVertical: 8,
          marginBottom: 30,
        }}
      >
        <Image
          source={require("../../assets/icons/box.png")}
          contentFit="cover"
          style={{
            width: 100,
            height: 100,
          }}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Successfully Cancelled
        </Text>
        <Text
          style={{
            fontSize: 10,
            marginBottom: 8,
            color: "#16783A",
            fontFamily: "LexendDeca",
          }}
        >
          Your order has been successfully cancelled. Sorry the product does not
          work for you.
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              paddingVertical: 8,
              paddingHorizontal: 4,
              backgroundColor: "#EBF2FA",
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              justifyContent: "center",
              // maxWidth: 110,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: "#A6B7D4",
                fontFamily: "LexendDeca-Medium",
              }}
            >
              Shipped by {order?.shipping?.carrier?.name}
            </Text>
          </View>
          <Text
            style={{
              color: "#3A3A3A",
              fontSize: 12,
              fontFamily: "LexendDeca-Medium",
            }}
          >
            {formatDate(order?.shipping?.tracking?.lastUpdate, "MMMM DD, YYYY")}
          </Text>
        </View>

        <Text
          style={{
            position: "absolute",
            top: 16,
            right: 24,
            fontSize: 8,
            fontWeight: 900,
          }}
        >
          Cancelled
        </Text>
      </View>

      {order?.order?.paid && (
        <View
          className="rounded-[16px]"
          style={{
            paddingHorizontal: 24,
            paddingVertical: 8,
            marginBottom: 30,
            gap: 8,
            backgroundColor: "rgba(41, 41, 41, 0.81)",
          }}
        >
          <Text className="font-LexendDecaMedium text-[#fff] text-[16px]">
            Refund Details
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-LexendDeca text-[12px] text-[#ccc]">
              Total Refund
            </Text>
            <Text className="font-LexendDecaBold text-[12px] text-[#ccc]">
              ₦{order?.order?.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-[50px]">
            <Text className="font-LexendDeca text-[12px] text-[#ccc]">
              Note
            </Text>
            <Text className="font-LexendDecaBold text-[12px] text-[#ccc] shrink">
              Your refund is being processed and you will be refunded shortly
            </Text>
          </View>
        </View>
      )}

      <View>
        {order?.items?.map((orderItem: any, index: number) => (
          <OrderItem
            key={orderItem?.product?._id}
            orderItem={orderItem}
            orderStatus={order?.shipping?.tracking?.status}
            seller={order?.seller?._id}
            buyer={order?.buyer?._id}
            token={userToken?.toString()}
            conversationId={conversationId?.toString()}
          />
        ))}
      </View>

      <BottomOptions />
    </View>
  );
};

const BottomOptions = () => {
  return (
    <View>
      <View className="w-full relative px-[16px] pb-[50px]">
        <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
          Still Searching
        </Text>
        <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
          <CustomButton
            title="Explore Categories"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="border !w-[47%]  rounded-md border-[#EDF2F7] bg-transparent"
            onPress={() => {
              router.push("/(root)/(tabs)/explore/explore");
            }}
          />
          <CustomButton
            title="Visit Community"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="!w-[47%] !bg-primary-200  rounded-md  "
            onPress={() => {
              router.push("/(root)/(tabs)/connect");
            }}
          />
        </View>
      </View>
      <View className="pb-[50px] flex-row justify-around w-[260px] mx-auto">
        <CustomButton
          title="Live Show"
          textStyle="!text-[#141B34]"
          className="!w-[130px] !bg-[#F2F2F2]  rounded-tr-none rounded-br-none"
          onPress={() => {
            router.push("/(root)/(tabs)/home/home");
          }}
        />
        <CustomButton
          title="Markets"
          className="!w-[130px] rounded-tl-none rounded-bl-none rounded-[40px] !bg-primary-200 "
          onPress={() => {
            router.push("/(root)/(tabs)/home/marketplace");
          }}
        />
      </View>
    </View>
  );
};

export default CancelledOrders;
