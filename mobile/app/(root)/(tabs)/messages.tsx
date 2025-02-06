import { View, Text } from "react-native";
import React from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const Message = () => {
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-black">
        <Text className="text-black">Message</Text>
      </SafeAreaView>
    </>
  );
};

export default Message;
