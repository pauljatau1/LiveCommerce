import {
  View,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
// import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Link, useLocalSearchParams } from "expo-router";
import { useVerifyEmailMutation } from "@/services/auth";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/core/toast";
import { router } from "expo-router";
import { icons } from "@/constants";
import { OtpInput } from "react-native-otp-entry";
import CustomButton from "@/components/global/button/CustomButton";
import LoadingModal from "@/components/global/loading-modal";

const VerifyCodeOtp = () => {
  const params = useLocalSearchParams();

  const email = params.email as string;

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const {
    formState: { isValid, errors },
    watch,
    control,
  } = methods;

  const data = watch();

  // const [resendEmailOTP, { isFetching }] = useLazyResendEmailOTPQuery();

  const [verify, { isLoading }] = useVerifyEmailMutation();

  const onSubmit = async () => {
    try {
      const { otp } = data;
      const result = await verify({
        email,
        otp,
      }).unwrap();
      toast.success("success");
      // router.push({
      //     pathname: '/(root)/(auth)/sign-in',
      // });
      router.replace("/(root)/(categories)/category");
    } catch (error: any) {
      console.log(error);
      toast.error(error.data.message);
    }
  };

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-black">
        <View className="container px-[30.6px] my-16">
          <View className="flex-row mb-[45px]">
            <Pressable
              onPress={() => {
                console.log("logging");
                router.back();
              }}
              className="absolute"
              style={{
                zIndex: 100,
              }}
            >
              <Image source={icons.circleBackArrow} className="w-7 h-7" />
            </Pressable>
            <View className="self-center justify-center w-full">
              <Text className="text-gray-200 pt-4 text-center font-LexendDecaBold text-[21.77px] pb-5 leading-5">
                Verify Code
              </Text>
              <Text className="text-gray-200 text-center font-LexendDecaMedium text-sm">
                We sent a code to you at {"\n"}
                {email}
              </Text>
              <Link
                href={"/(root)/(auth)/sign-up"}
                className="text-center text-[10px] font-LexendDecaMedium underline text-primary-100 mt-2"
              >
                Change email
              </Link>
            </View>
          </View>
          <Controller
            name="otp"
            control={control}
            render={({ field: { onChange, value } }: any) => (
              <OtpInput
                numberOfDigits={4}
                focusColor="#2F2E41"
                autoFocus={false}
                hideStick={true}
                placeholder="******"
                blurOnFilled={true}
                disabled={false}
                type="numeric"
                secureTextEntry={false}
                focusStickBlinkingDuration={500}
                onFocus={() => console.log("Focused")}
                onBlur={() => console.log("Blurred")}
                onTextChange={onChange}
                onFilled={(text) => console.log(`OTP is ${text}`)}
                textInputProps={{
                  accessibilityLabel: "One-Time Password",
                }}
                theme={{
                  pinCodeContainerStyle: {
                    width: 70.74,
                    height: 50.7,
                    backgroundColor: "#fff",
                    borderRadius: 3.63,
                  },
                }}
              />
            )}
          />

          <View className="flex-row justify-center py-8 items-center">
            <Text className="font-LexendDeca text-sm text-gray-200">
              Didn’t receive any OTP code?
            </Text>
            <TouchableOpacity>
              <Text className="underline text-gray-200 text-base font-LexendDecaBold pl-1">
                Resend code
              </Text>
            </TouchableOpacity>
          </View>
          <CustomButton
            title="Verify Code"
            onPress={onSubmit}
            className="mb-4 mt-[18px] !rounded-[40px] py-4 !text-white text-sm font-LexendDecaBold"
            disabled={data.otp.length !== 4 || isLoading}
          />
        </View>
        <LoadingModal isVisible={isLoading} />
      </SafeAreaView>
    </>
  );
};

export default VerifyCodeOtp;
