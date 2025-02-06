import { View, Text, SafeAreaView } from "react-native";
import React from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";

const MoreProducts = () => {
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-black">
        <Text className="text-black">More Products</Text>
      </SafeAreaView>
    </>
  );
};

export default MoreProducts;
