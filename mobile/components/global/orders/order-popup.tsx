import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Dimensions, Platform, Pressable } from "react-native";
import { View, Text } from "react-native";
import Modal from "react-native-modal";
import { ActivityIndicator } from "react-native-paper";

const OrderPopup = ({ isVisible, closePopup }: any) => {
  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    // Platform.OS === 'ios'
    // ?
    Dimensions.get("window").height;
  // : require('react-native-extra-dimensions-android').get(
  //     'REAL_WINDOW_HEIGHT'
  // );

  return (
    <Modal
      animationIn="slideInUp"
      animationOut="slideOutDown"
      isVisible={isVisible}
      coverScreen
      className="mx-0"
      deviceWidth={deviceWidth}
      deviceHeight={deviceHeight}
    >
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
          <AntDesign name="checkcircleo" size={50} color="#16783A" />
        </View>

        <Text className="font-LexendDecaSemiBold text-[18px] text-[#111] mb-[10px] text-center">
          Order Placed Successfully!
        </Text>
        <Text className="font-LexendDeca text-[12px] text-[#111] mb-[40px] text-center">
          Thank you for placing your order! We are pleased to confirm has been
          recieved and is being processed
        </Text>
        <View className="flex-row shrink items-center justify-between gap-[8px]">
          <Pressable
            className="basis-[47%] py-[8px] rounded-[6px] border-[1.5px] border-[#16783A] items-center justify-center"
            onPress={() => closePopup("home")}
          >
            <Text className="font-LexendDecaMedium text-[10px] text-[#16783A] text-center">
              Continue Shopping
            </Text>
          </Pressable>

          <Pressable
            className="basis-[47%] shrink py-[8px] rounded-[6px] bg-[#16783A] border-[1.5px] border-[#16783A] items-center justify-center"
            onPress={() => {
              closePopup("order");
            }}
          >
            <Text className="font-LexendDecaMedium text-[10px] text-[#fff] text-center">
              View Orders
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default OrderPopup;
