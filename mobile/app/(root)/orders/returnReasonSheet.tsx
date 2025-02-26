import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native-paper";

interface Props {
  closeSheet: any;
  setRefundReason: any;
}

const refundReasons = [
  "Item is damaged on arrival",
  "Item size is not as advertised",
  "Item is incomplete",
  "Counterfeit/Fake items",
  "Item is defective or not working",
  "Recieved wrong item",
  "Seller request to cancel",
  "Duplicate Order",
];

const ReturnReasonSheet = ({ closeSheet, setRefundReason }: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<any[]>([]);

  const handleSelectReason = (index: number) => {
    if (selectedReasons.includes(index)) {
      return setSelectedReasons(selectedReasons.filter((ind) => index !== ind));
    }

    setSelectedReasons([index]);
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
          className="w-[18px] h-[18px] rounded-[18px] items-center justify-center border-[#ccc] border-[1px]"
          style={{
            width: 18,
            height: 18,
          }}
        >
          {selectedReasons.includes(index) && (
            <View
              className="w-[16px] h-[16px] rounded-[15px] items-center bg-[#ccc]"
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
              }}
            ></View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View>
      <View className="flex-row justify-center items-center mb-[23px] w-full mt-[10px]">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold">
            Refund Reason
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
        {refundReasons.map((reason, index) => renderReason(reason, index))}
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
          onPress={() => {
            setRefundReason(refundReasons[selectedReasons[0]]);
            closeSheet();
          }}
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

export default ReturnReasonSheet;
