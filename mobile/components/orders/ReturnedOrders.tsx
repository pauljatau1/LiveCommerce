import { View, Text, Pressable } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/helpers/helpers";
import { Image } from "expo-image";
import CustomButton from "../global/button/CustomButton";
import { router } from "expo-router";
import OrderItem from "./orderItem";
import RefundItem from "./refundItem";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { toast } from "@/core/toast";

const ReturnedOrders = ({
  order,
  userToken,
  conversationId,
}: {
  order: any;
  userToken: any;
  conversationId: any;
}) => {
  const insets = useSafeAreaInsets();

  const copyTrackingNumber = () => {
    Clipboard.setStringAsync(order?.shipping?.tracking.number);
    toast.info("Copied to Clipboard");
  };
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
          source={require("../../assets/icons/refund.png")}
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
          Return & Replace Request sent
        </Text>
        <Text
          style={{
            fontSize: 10,
            marginBottom: 8,
            color: "#16783A",
            fontFamily: "LexendDeca",
          }}
        >
          Auqli support will review your request, and handle the shipment fee.
          You can track the progress in your returns tab. 
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
              {order?.order?.returnDetails?.preferredResolution}
            </Text>
          </View>
          <Text
            style={{
              color: "#3A3A3A",
              fontSize: 12,
              fontFamily: "LexendDeca-Medium",
            }}
          >
            {formatDate(
              order?.order?.returnDetails?.requestDate,
              "MMMM DD, YYYY",
            )}
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
          Refund ID: {order?.order?.returnDetails?._id}
        </Text>
      </View>

      <View>
        {order?.items?.map((orderItem: any, index: number) => (
          <RefundItem
            key={orderItem?.product?._id}
            orderItem={orderItem}
            orderStatus={order?.order?.returnDetails?.status}
            seller={order?.seller?._id}
            buyer={order?.buyer?._id}
            token={userToken.toString()}
            conversationId={conversationId.toString()}
          />
        ))}
      </View>

      <View className="flex-row items-center" style={{ marginBottom: 36 }}>
        <Text className="font-LexendDeca text-[12px] text-[#ccc]">
          Tracking Number -{" "}
        </Text>
        <Pressable onPress={copyTrackingNumber}>
          <Text className="text-[12px] text-[#027CEC] font-LexendDeca">
            {order?.shipping?.tracking.number || ""}
          </Text>
        </Pressable>

        {order?.shipping?.tracking?.number && (
          <Feather
            name="copy"
            size={12}
            color="#027CEC"
            style={{ marginLeft: 2 }}
          />
        )}
      </View>

      <View
        style={{
          justifyContent: "center",
          gap: 14,
          paddingHorizontal: 30,
        }}
      >
        {order?.order?.returnDetails?.timeline?.map(
          (timeline: any, index: number) => {
            return <Timeline timeline={timeline} key={index} />;
          },
        )}
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

const Timeline = ({ timeline }: { timeline: any }) => {
  return (
    <View className="flex-row">
      <View
        style={{
          gap: 8,
          marginRight: 21,
          width: 60,
        }}
      >
        <Text className={`text-[16px] text-[#ccc] font-LexendDecaSemiBold`}>
          {formatDate(timeline?.date, "MMM DD")}
        </Text>
        <Text className={`text-[12px] text-[#ccc] font-LexendDecaLight`}>
          {formatDate(timeline?.date, "HH:mm")}
        </Text>
      </View>
      <View
        style={{
          gap: 5,
          flexShrink: 1,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 11 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 10,
              backgroundColor: "#16783A",
            }}
          ></View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "LexendDeca-SemiBold",
              color: "#16783A",
            }}
          >
            {timeline?.status}
          </Text>
        </View>
        <View
          style={{
            borderLeftColor: "#16783A",
            borderLeftWidth: 1,
            paddingLeft: 16,
            paddingVertical: 10,
            marginLeft: 4.5,
          }}
        >
          <Text
            className={`text-[12px] text-[#ccc] font-LexendDecaSemiBold shrink}`}
          >
            Your request is in {timeline?.status} state
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ReturnedOrders;
