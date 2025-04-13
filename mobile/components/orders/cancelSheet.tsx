import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { memo, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native-paper";

interface Props {
  orderItem: any;
  conversations: any;
  closeSheet: any;
  token: string;
}

const cancellationReasons = [
  "I changed my mind",
  "Delivery time is too long",
  // "Found better price elsewhere",
  "Shipping cost too high",
  "Change Payment method",
  // "I want to change shipping info",
  "Seller request to cancel",
  "Duplicate Order",
];

const CancelSheet = ({
  closeSheet,
  token,
  orderItem,
  conversations,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<any[]>([]);

  const handleCancelOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL +
          "api/order/" +
          orderItem._id +
          "/cancel-shipment",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      closeSheet();
      router.push({
        pathname: `../../../(root)/orders/${orderItem._id}`,
        params: {
          token,
          conversationId:
            conversations?.find(
              (convo: any) => convo.participant.id == orderItem.seller,
            )?._id || "",
        },
      });
    } catch (e) {
      console.log("error cancelling order ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReason = (index: number) => {
    if (selectedReasons.includes(index)) {
      return setSelectedReasons(selectedReasons.filter((ind) => index !== ind));
    }

    setSelectedReasons([...selectedReasons, index]);
  };

  const renderReason = (item: any, index: any) => {
    return (
      <TouchableOpacity
        activeOpacity={0.5}
        key={index}
        className="py-[18px] flex-row items-center justify-between border-b-[#ccc]"
        style={{
          paddingHorizontal: 24,
          borderBottomWidth: 0.3,
          borderBottomColor: "rgba(204, 204, 204, 0.70)",
        }}
        onPress={() => handleSelectReason(index)}
      >
        <Text className="font-LexendDeca text-[16px] text-[#ccc]">{item}</Text>
        <View
          className="w-[18px] h-[18px] rounded-[4px] items-center justify-center border-[#ccc] border-[1px]"
          style={{
            width: 18,
            height: 18,
          }}
        >
          {selectedReasons.includes(index) && (
            <AntDesign name="check" size={12} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View className="pb-[20px]">
      <View className="flex-row justify-center items-center mb-[23px] w-full mt-[10px]">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold">
            Cancellation Reason
          </Text>
        </View>
        <Pressable
          onPress={closeSheet}
          className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%] absolute"
          style={{
            right: 8,
          }}
        >
          <AntDesign name="closecircle" size={30} color="#F9C7B3" />
        </Pressable>
      </View>
      <View>
        {cancellationReasons.map((reason, index) =>
          renderReason(reason, index),
        )}
      </View>
      <View className="px-[16px]">
        <Pressable
          style={{
            paddingVertical: 12,
            width: "100%",
            borderRadius: 8,
            backgroundColor: "#16783A",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 30,
          }}
          onPress={handleCancelOrder}
        >
          {loading ? (
            <ActivityIndicator size={"small"} color="#fff" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: "#fff",
                fontFamily: "LexendDeca",
              }}
            >
              Confirm
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default memo(CancelSheet);
