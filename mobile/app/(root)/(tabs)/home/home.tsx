import { View, Text, Dimensions, SafeAreaView, Platform } from "react-native";
import React, { useEffect } from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Home from "@/components/home";
import { usePushNotifications } from "@/hooks/useExpoPushToken";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const Homepage = () => {
  const { expoPushToken } = usePushNotifications();
  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  // const dispatch = useDispatch();

  // useEffect(() => {
  //   dispatch({ type: "socket/connect", payload: {} });
  //   return () => {
  //     dispatch({ type: "socket/leaveAuction", payload: {} });

  //     dispatch({ type: "socket/disconnect", payload: {} });
  //   };
  // });
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View
        className="flex-1 h-full bg-[#121212]"
        style={{ paddingTop: insets.top }}
      >
        <Home />
      </View>
    </>
  );
};

export default Homepage;
