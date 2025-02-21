import { View, Text, Pressable } from "react-native";
import React, { memo, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

const DeleteSheet = memo(
  ({ closeSheet, handleDelete }: { closeSheet: any; handleDelete: any }) => {
    const [password, setPassword] = useState<string>("");
    return (
      <View>
        <Text className="font-LexendDeca text-[14px] text-[#ccc] text-center mb-[20px]">
          Delete Account
        </Text>
        <View className="w-[100%] rounded-[8px] py-[12px] px-[12px] bg-[#2e2e2e]">
          <BottomSheetTextInput
            placeholder="Enter Password"
            placeholderTextColor={"#ccc"}
            style={{
              fontSize: 15,
              color: "#fff",
              padding: 0,
            }}
            returnKeyType="send"
            value={password}
            onChangeText={(text) => setPassword(text)}
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
          <Text
            style={{
              fontSize: 14,
              color: "#fff",
              fontFamily: "LexendDeca",
            }}
          >
            Delete
          </Text>
        </Pressable>
      </View>
    );
  },
);

export default DeleteSheet;
