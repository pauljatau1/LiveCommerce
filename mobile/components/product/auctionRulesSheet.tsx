import { View, Text } from "react-native";
import React, { useEffect } from "react";

const AuctionRulesSheet = ({ closeSheet, auction, shipping }: any) => {
  useEffect(() => {
    setTimeout(() => closeSheet(), 1000000);
  }, []);
  return (
    <View className="h-full items-center pb-[20px] mt-[10px]">
      <Text className="text-[#ccc] text-[20px] font-LexendDecaSemiBold mb-[30px]">
        Rules
      </Text>
      <Text className="text-[#8F9099] text-[14px] font-LexendDeca mb-[20px]">
        * You can only place bids on this auction if your wallet is funded and
        your available balance is greater than your{" "}
        <Text className="text-[#16783A]">bid amount + shipping fee</Text>
      </Text>
      <Text className="text-[#8F9099] text-[14px] font-LexendDeca">
        Estimated Shipping fee: {shipping?.toLocaleString()}
      </Text>
    </View>
  );
};

export default AuctionRulesSheet;
