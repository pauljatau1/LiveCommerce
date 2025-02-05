import { View, Text } from "react-native";
import React from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Home from "@/components/home";
import { router } from "expo-router";

const Homepage = () => {
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <Home />
      </SafeAreaView>
    </>
  );
};

export default Homepage;
