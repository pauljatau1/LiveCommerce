import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { icons } from "@/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { getToken, getUser } from "@/store/features/auth/utils";
import BottomSheet from "@/components/global/bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";
import axios from "axios";

const HomeHeader = () => {
  const isFocused = useIsFocused();
  const [cartNumber, setCartNumber] = useState<number>(0);
  const [token, setToken] = useState<string>("");
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const getAuthUser = async () => {
    const authToken = await getToken();

    setToken(authToken);
  };

  useEffect(() => {
    getAuthUser();
  }, []);

  useEffect(() => {
    if (isFocused) handleGetNotifications();
  }, [isFocused]);

  const { top } = useSafeAreaInsets();

  const getCardNumber = useMemo(async () => {
    if (isFocused) {
      const cart = await AsyncStorage.getItem("cart");
      if (cart) {
        const cartItems = JSON.parse(cart);
        return setCartNumber(cartItems.length);
      }
      return setCartNumber(0);
    }
  }, [isFocused]);

  const handleGetNotifications = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/notifications/unread`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setUnreadNotifications(response.data?.unreadCount);
    } catch (error) {
      console.error("Error fetching more notifications:", error);
    }
  };

  return (
    <View
      className="flex-row items-center justify-between w-full gap-[18px]"
      style={{
        paddingHorizontal: 16,
      }}
    >
      <Pressable
        className="flex-row w-full  px-[12px] items-center gap-[5px] shrink"
        style={{
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#c6c6c6",
          // maxWidth: 250,
          paddingVertical: 12,
        }}
        onPress={() => router.push("/(root)/(modals)/search")}
      >
        <EvilIcons
          name="search"
          size={24}
          color="#888787"
          className={Platform.OS === "android" ? "mt-[-4px]" : ""}
        />
        <Text className="text-[14px] text-[#888787] font-LexendDecaLight">
          Search
        </Text>
        {/* <TextInput
          placeholder="Search"
          placeholderTextColor={"#888787"}
          className="text-[#c6c6c6] text-[10px] not-italic font-normal  w-[100%] shrink"
          style={{
            marginLeft: 10,
            fontSize: 14,
            padding: 0,
          }}
        /> */}
      </Pressable>
      <View className="flex-row items-center gap-[18px]">
        <TouchableOpacity
          className=" flex justify-center items-center gap-[6px]"
          onPress={() => {
            if (token) {
              return router.push("/cart/cart");
            }
            return setShowAuthSheet(true);
          }}
        >
          <Image
            source={require("../../../assets/icons/cart.png")}
            resizeMode="cover"
            style={{
              width: 25,
              height: 25,
            }}
          />
          {/* <AntDesign
          name="shoppingcart"
          size={22}
          color="#ccc"
          style={{ opacity: 0.8 }}
        /> */}

          {cartNumber > 0 && (
            <View
              className="absolute top-[-15px]"
              style={{
                width: 16,
                height: 16,
                borderRadius: 16,
                backgroundColor: "#16783A",
                justifyContent: "center",
                alignItems: "center",
                right: -12,
              }}
            >
              <Text className="text-[#fff] text-[10px] font-[400] font-LexendDecaLight">
                {cartNumber}
              </Text>
            </View>
          )}
          {/* <Text className="text-gray-200 text-[7.554px] font-LexendDeca font-[600]">
            Cart
          </Text> */}
        </TouchableOpacity>
        <Pressable
          className="flex-column items-center justify-center relative gap-[6px]"
          onPress={() => {
            if (token) {
              return router.push("/notifications");
            }
            return setShowAuthSheet(true);
          }}
        >
          <Image
            source={require("../../../assets/icons/notification.png")}
            resizeMode="cover"
            style={{
              width: 25,
              height: 25,
            }}
          />
          {unreadNotifications > 0 && (
            <View
              className="absolute top-[-12px]"
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
                right: -4,
              }}
            >
              <View className="bg-[#16783A] w-[10px] h-[10px] rounded-[5px]"></View>
            </View>
          )}
          {/* <Text className="text-gray-200 text-[7.554px] font-LexendDeca font-[600] ">
            Notifications
          </Text> */}
        </Pressable>
      </View>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowAuthSheet(false)}
        keyboardBehavior="interactive"
      >
        <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
      </BottomSheet>
    </View>
  );
};

export default HomeHeader;
