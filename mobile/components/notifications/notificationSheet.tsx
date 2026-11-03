import { View, Text } from "react-native";
import React from "react";

const NotificationSheet = ({ data }: any) => {
  return (
    <View className="my-[10px] mb-[20px]">
      <Text className="text-[#ccc] text-[20px] font-LexendDecaSemiBold mb-[30px] text-center">
        {data?.title}
      </Text>

      <Text className="text-[#8F9099] text-[14px] font-LexendDeca text-center leading-[20px]">
        {data?.message || data?.content}
      </Text>
    </View>
  );
};

export default NotificationSheet;
