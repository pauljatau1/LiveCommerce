import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  Platform,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { icons } from "@/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import EvilIcons from "@expo/vector-icons/EvilIcons";

const HomeHeader = () => {
  const isFocused = useIsFocused();
  const [cartNumber, setCartNumber] = useState<number>(0);

  const { top } = useSafeAreaInsets();

  const getCardNumber = useMemo(async () => {
    const cart = await AsyncStorage.getItem("cart");
    if (cart) {
      const cartItems = JSON.parse(cart);
      return setCartNumber(cartItems.length);
    }
    return setCartNumber(0);
  }, [isFocused]);

  return (
    <View
      className="flex-row items-center justify-between w-full px-[23px] gap-[10px]"
      // style={{
      //     paddingTop: top + 16,
      // }}
    >
      <View
        className="flex-row w-full max-w-[220px] px-[12px] items-center gap-[2px] shrink"
        style={{
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "#c6c6c6",
          maxWidth: 220,
          paddingVertical: 12,
        }}
      >
        <EvilIcons
          name="search"
          size={24}
          color="#888787"
          className={Platform.OS === "android" ? "mt-[-4px]" : ""}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor={"#888787"}
          className="text-[#c6c6c6] text-[10px] not-italic font-normal  w-[100%] shrink"
          style={{
            marginLeft: 10,
            fontSize: 14,
            padding: 0,
          }}
        />
      </View>
      <View className="flex-row items-center gap-[30px]">
        <TouchableOpacity
          className=" flex justify-center items-center gap-[6px]"
          onPress={() => router.push("/cart/cart")}
        >
          <Image
            source={require("../../../assets/icons/cart.png")}
            resizeMode="cover"
            style={{
              width: 22,
              height: 22,
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
          <Text className="text-gray-200 text-[7.554px] font-LexendDeca font-[600]">
            Cart.
          </Text>
        </TouchableOpacity>
        <Pressable
          className="flex-column items-center justify-center relative gap-[6px]"
          onPress={() => router.push("/orders/orders")}
        >
          <Image
            source={require("../../../assets/icons/notification.png")}
            resizeMode="cover"
            style={{
              width: 22,
              height: 22,
            }}
          />
          <Text className="text-gray-200 text-[7.554px] font-LexendDeca font-[600] ">
            Notifications.
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default HomeHeader;
