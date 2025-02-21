import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

interface Props {
  closeSheet: any;
}
const AuthSheet = ({ closeSheet }: Props) => {
  const navigateToAuth = () => {
    closeSheet();
    router.push("/(root)/(auth)/sign-in");
  };
  return (
    <View className="items-center gap-[20px]">
      <Text className="text-center text-[14px] text-[#f2f2f2] font-LexendDeca">
        Login to access all auqli featuers
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center w-full mb-[20px]"
        onPress={navigateToAuth}
        style={{
          marginBottom: 20,
        }}
      >
        <Text className="text-white text-[14px] font-LexendDecaMedium">
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthSheet;
