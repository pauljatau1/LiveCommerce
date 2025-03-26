import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, Platform, Pressable, Modal } from "react-native";
import { View, Text } from "react-native";
// import Modal from "react-native-modal";
import { ActivityIndicator } from "react-native-paper";

const CreateAccountModal = ({ isVisible = false, closeModal }: any) => {
  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight = Dimensions.get("window").height;

  return (
    <Modal
      //   animationIn="slideInUp"
      //   animationOut="slideOutDown"
      animationType="slide"
      //   isVisible={isVisible}
      visible={isVisible}
      //   coverScreen
      className="mx-0"
      transparent={true}
      style={{}}
      //   deviceWidth={deviceWidth}
      //   deviceHeight={deviceHeight}
    >
      <View
        style={{
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
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
          }}
        >
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Pressable onPress={closeModal}>
              <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
                <AntDesign name="closecircle" size={30} color="#F9C7B3" />
              </View>
            </Pressable>
          </View>
          <Image
            source={require("../../../assets/images/auth-illustration.png")}
            style={{ marginBottom: 10, width: 200, height: 200 }}
          />
          <Text className="text-[20px] text-[#313232] font-LexendDecaSemiBold text-center mb-[20px]">
            Happy to have you here
          </Text>
          <Text className="text-[16px] text-[#141B34] font-LexendDeca text-center">
            You can create your profile to make your Auqli experience a better
            one!
          </Text>
          <Pressable
            className="bg-[#16783A] rounded-[24px] items-center justify-center py-[12px] w-full "
            style={{
              marginTop: 30,
            }}
            onPress={() => {
              closeModal();
              router.push("/(root)/(auth)/sign-up");
            }}
          >
            <Text className="text-white text-[14px] font-LexendDecaMedium">
              Create Account ?
            </Text>
          </Pressable>
          {/* <ActivityIndicator size={24} color="#fff" /> */}
        </View>
      </View>
    </Modal>
  );
};

export default CreateAccountModal;
