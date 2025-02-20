import { View, Text, SafeAreaView } from "react-native";
import React from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Home from "@/components/home";
import { router } from "expo-router";
import Marketplace from "@/components/marketplace";

const MarketplacePage = () => {
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <Marketplace />
      </SafeAreaView>
    </>
  );
};

export default MarketplacePage;
