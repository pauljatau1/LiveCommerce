import { View, Text, SafeAreaView, Platform } from "react-native";
import React from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Home from "@/components/home";
import { router } from "expo-router";
import Marketplace from "@/components/marketplace";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MarketplacePage = () => {
  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View
        className="flex-1 h-full bg-[#121212]"
        style={{ paddingTop: insets.top }}
      >
        <Marketplace />
      </View>
    </>
  );
};

export default MarketplacePage;
