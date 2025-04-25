import { View, Text, Dimensions, SafeAreaView, Platform } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CustomButton from "@/components/global/button/CustomButton";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Home from "@/components/home";
import { usePushNotifications } from "@/hooks/useExpoPushToken";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "@/store";
import CreateAccountModal from "@/components/global/create-account-prompt";
import OrderPopup from "@/components/global/orders/order-popup";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

const { width, height } = Dimensions.get("window");

const Homepage = () => {
  const { expoPushToken } = usePushNotifications();
  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  // const token = useSelector((state: RootState) => state.authState.token);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const tries = useRef<number>(0);

  const requestTrackingPermission = async () => {
    const { status } = await requestTrackingPermissionsAsync();
    if (status === "granted") {
      console.log("Yay! I have user permission to track data");
    } else {
      console.log("Shucks! I dont have user permission to track data ", {
        status,
      });
    }
  };

  const closeModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    async function setIsFirstTime() {
      await AsyncStorage.setItem("isFirstTime", "false");
    }

    async function checkIfLoggedIn() {
      const token = await AsyncStorage.getItem("token");
      if (!token && tries?.current == 0) {
        setTimeout(() => setIsVisible(true), 3000);
        tries.current = 1;
      }
    }
    requestTrackingPermission();
    setIsFirstTime();
    checkIfLoggedIn();
  }, []);
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View
        className="flex-1 h-full bg-[#121212]"
        style={{ paddingTop: insets.top }}
      >
        <Home />
        <CreateAccountModal isVisible={isVisible} closeModal={closeModal} />
        {/* <OrderPopup isVisible={true} closeModal={closeModal} /> */}
      </View>
    </>
  );
};

export default Homepage;
