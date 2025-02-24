import { View, Text } from "react-native";
import React from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";

const Auctions = () => {
  const dispatch = useDispatch();
  return (
    <View className="p-[30px]">
      <Text className="text-white mx-auto">Auctions</Text>
      {/* <CustomButton
        title="Logout"
        onPress={() => {
          dispatch(signOut());
        }}
      /> */}
    </View>
  );
};

export default Auctions;
