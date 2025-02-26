import { View, Text, Pressable } from "react-native";
import React, { memo, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  useConfirmDeleteMutation,
  useRequestDeleteMutation,
} from "@/services/auth";
import { toast } from "@/core/toast";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/features/auth/authSlice";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native-paper";

const DeleteSheet = memo(({ closeSheet }: { closeSheet: any }) => {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState<string>("");

  const [deleteConfirm, { isLoading }] = useConfirmDeleteMutation();

  const handleDelete = async () => {
    if (isLoading) {
      return;
    }
    try {
      const result = await deleteConfirm({
        otp,
      });
      if (result.error) {
        console.log(result.error);

        return toast.error("Could not delete account");
      }
      closeSheet();
      dispatch(signOut());
      router.push("/(root)/(auth)/sign-in");
    } catch (e: any) {
      console.log("error deleteing account ", e?.response);
      toast.error("Could not delete account");
    }
  };
  return (
    <View>
      <Text className="font-LexendDeca text-[14px] text-[#ccc] text-center mb-[10px]">
        Delete Account
      </Text>
      <Text className="font-LexendDeca text-[12px] text-[#ccc] text-center mb-[20px]">
        An OTP has been sent to your email*
      </Text>
      <View className="w-[100%] rounded-[8px] py-[12px] px-[12px] bg-[#2e2e2e]">
        <BottomSheetTextInput
          placeholder="Enter OTP"
          placeholderTextColor={"#ccc"}
          style={{
            fontSize: 15,
            color: "#fff",
            padding: 0,
          }}
          value={otp}
          keyboardType="numeric"
          onChangeText={(text) => setOtp(text)}
          maxLength={4}
        />
      </View>
      <Pressable
        style={{
          paddingVertical: 12,
          width: "100%",
          borderRadius: 8,
          backgroundColor: "#F16063",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
        }}
        onPress={handleDelete}
      >
        {isLoading ? (
          <ActivityIndicator size={"small"} color="white" />
        ) : (
          <Text
            style={{
              fontSize: 14,
              color: "#fff",
              fontFamily: "LexendDeca",
            }}
          >
            Delete Account
          </Text>
        )}
      </Pressable>
    </View>
  );
});

export default DeleteSheet;
