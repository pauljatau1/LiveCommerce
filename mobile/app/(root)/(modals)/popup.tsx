import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";

const Popup = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        entering={FadeIn.duration(200)
          .easing(Easing.inOut(Easing.quad))
          .delay(300)}
        exiting={FadeOut.duration(200).easing(Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          left: 0,
          width: "100%",
          height: "100%",
          // opacity: 0.2,
          backgroundColor: "#11111199",
        }}
      ></Animated.View>
      <View
        className="rounded-[18px]"
        style={{
          width: "80%",
          //   height: 400,
          backgroundColor: "#F7F8F7",
          flexShrink: 1,
          alignSelf: "center",
          alignItems: "center",
          padding: 23,
          paddingTop: 40,
        }}
      >
        <View className="mb-[30px]">
          <Image
            source={require("../../../assets/icons/confetti.png")}
            style={{
              width: 100,
              height: 100,
            }}
            resizeMode="contain"
          />
        </View>

        <Text className="font-LexendDecaBold text-[20px] text-[#111] mb-[4px] text-center">
          Welcome to Auqli!
        </Text>
        <Text className="font-LexendDecaBold text-[20px] text-[#111] mb-[20px] text-center">
          ₦2000 FREE GIFT!
        </Text>
        <Text className="font-LexendDeca text-[14px] text-[#111] mb-[30px] text-center leading-[18px]">
          You’ve just received a ₦2,000 Wallet Credit as a welcome gift 🎁
          {"\n\n"}
          Use it on your first livestream purchase or auction bid!
        </Text>
        <View className="items-center justify-between gap-[8px] w-full">
          <Pressable
            className="py-[12px] rounded-[45px] bg-[#16783A] items-center justify-center w-[100%] px-[20px]"
            onPress={() => router.push("/wallet")}
          >
            <Text className="font-LexendDecaMedium text-[14px] text-[#fff] text-center">
              Go to My Wallet
            </Text>
          </Pressable>

          <Pressable
            className=" py-[8px] rounded-[6px]  items-center justify-center w-full"
            onPress={() => {
              router.back();
            }}
          >
            <Text className="font-LexendDecaSemiBold text-[14px] text-[#16783A] text-center">
              Homepage
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
export default Popup;
