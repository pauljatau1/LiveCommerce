import { View, Text, Pressable } from "react-native";
import React, { memo, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { toast } from "@/core/toast";

const OtpSheet = memo(
  ({
    closeSheet,
    handleSubmitNewPassword,
  }: {
    closeSheet: any;
    handleSubmitNewPassword: any;
  }) => {
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState<string>("");

    const handleSubmit = () => {
      if (!otp || !password) {
        return toast.info("Enter otp and password");
      }
      handleSubmitNewPassword(otp, password);
    };
    return (
      <View className="py-[16px]">
        <Text className="font-LexendDeca text-[14px] text-[#ccc] text-center mb-[20px]">
          Enter OTP and new Password
        </Text>
        <View className="w-[100%] rounded-[8px] py-[12px] px-[12px] bg-[#2e2e2e] mb-[20px]">
          <BottomSheetTextInput
            placeholder="Enter Otp"
            placeholderTextColor={"#ccc"}
            style={{
              fontSize: 15,
              color: "#fff",
              padding: 0,
            }}
            value={otp}
            keyboardType="numeric"
            onChangeText={(text) => setOtp(text)}
            autoFocus
          />
        </View>
        <View className="w-[100%] rounded-[8px] py-[12px] px-[12px] bg-[#2e2e2e]">
          <BottomSheetTextInput
            placeholder="Enter Password"
            placeholderTextColor={"#ccc"}
            style={{
              fontSize: 15,
              color: "#fff",
              padding: 0,
            }}
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </View>
        <Pressable
          style={{
            paddingVertical: 12,
            width: "100%",
            borderRadius: 8,
            backgroundColor: "#16783A",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
          }}
          onPress={handleSubmit}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#fff",
              fontFamily: "LexendDeca",
            }}
          >
            Confirm
          </Text>
        </Pressable>
      </View>
    );
  },
);

export default OtpSheet;
