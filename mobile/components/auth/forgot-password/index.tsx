import BottomSheet from "@/components/global/bottom-sheet";
import CustomButton from "@/components/global/button/CustomButton";
import CheckBox from "@/components/global/check-box";
import Input from "@/components/global/textInput";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { icons } from "@/constants";
import { toast } from "@/core/toast";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/services/auth";
import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import OtpSheet from "./otpSheet";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
// import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const {
    formState: { isValid },
    watch,
  } = methods;

  const data = watch();

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isLoadingReset }] =
    useResetPasswordMutation();
  const [showOtpSheet, setshowOtpSheet] = useState<boolean>(false);

  const handleSubmit = async () => {
    console.log("in submit");

    try {
      const { email } = data;
      const result = await forgotPassword({
        email,
      }).unwrap();

      setshowOtpSheet(true);
      Keyboard.dismiss();
    } catch (error: any) {
      console.log(error);
      toast.error(error.data.message);
    }
  };

  const handleSubmitNewPassword = async (otp: any, newPassword: string) => {
    if (isLoadingReset) {
      return;
    }
    try {
      const { email } = data;
      const result = await resetPassword({
        email,
        otp,
        newPassword,
      }).unwrap();
      console.log("reset password status ", result);
      setshowOtpSheet(false);
      toast.success("Password reset successfully");
      setTimeout(() => router.push("/(root)/(auth)/sign-in"), 500);
    } catch (error: any) {
      console.log(error);
      toast.error(error.data.message);
    }
  };
  return (
    <SafeAreaView className={`flex-1 bg-[black]`}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View className="px-[16px] pt-[30px]">
        <TouchableOpacity
          className=""
          onPress={() => router.dismissTo("/sign-in")}
        >
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>
      </View>
      {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
      <View className="mt-[80px]">
        {/* <ScrollView> */}
        <View className=" w-full justify-between px-[21px]">
          <View className="mb-[40px] ">
            {/* <Image
              source={icons.lock}
              resizeMode="contain"
              className="mx-auto mb-[18px] h-[40px]"
            /> */}
            <Text className="mb-2.5 text-center font-LexendDecaMedium text-[24px] text-white tracking-[-0.22px]">
              Forgot Password
            </Text>
            <Text className="text-center font-LexendDecaLight text-[#425466] tracking-[-0.22px]">
              Enter your email and we will send you an OTP
            </Text>
          </View>
          <View className="w-full gap-y-[16px]">
            <FormProvider {...methods}>
              <Input
                name="email"
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                rules={["required", "email"]}
              />
              {/* <View className="mt-2 pr-4">
                <CheckBox
                  textStyle="!text-xs !text-[#425466]"
                  name="remember"
                  label="By creating an account means you agree to the Terms and Conditions, and our Privacy Policy"
                />
              </View> */}
              <CustomButton
                title="Reset Password"
                // isLoading={isLoading}
                disabled={!isValid || isLoading}
                onPress={() => handleSubmit()}
                className="mb-4 mt-[18px] !rounded-[10px] !text-white text-sm h-[50px]"
                textStyle="font-LexendDecaMedium tracking-[-0.22px]"
                loading={isLoading || isLoadingReset}
                style={{
                  zIndex: 100,
                }}
              />
            </FormProvider>
          </View>
        </View>
        {/* </ScrollView> */}
      </View>
      {/* </TouchableWithoutFeedback> */}

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showOtpSheet}
        titleColor="!text-white"
        snapPoints={["32%"]}
        enableDynamicSizing={false}
        onRequestClose={() => {
          setshowOtpSheet(false);
        }}
        keyboardBehavior="interactive"
      >
        <OtpSheet
          closeSheet={() => {
            setshowOtpSheet(false);
          }}
          handleSubmitNewPassword={handleSubmitNewPassword}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

export default ForgotPassword;
