import { View, Text, SafeAreaView, Dimensions } from "react-native";
import React from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";

const { height } = Dimensions.get("window");

const profile = () => {
  return (
    <SafeAreaView
      className="h-full flex-1 bg-[#121212] "
      style={{ minHeight: height }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View>
        <Text className="text-white self-center my-[50px] font-LexendDeca">
          Profile coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default profile;
