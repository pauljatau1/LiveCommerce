import {
  View,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
// import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Link, useLocalSearchParams } from "expo-router";
import {
  useResendEmailOTPMutation,
  useVerifyEmailMutation,
} from "@/services/auth";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/core/toast";
import { router } from "expo-router";
import { icons } from "@/constants";
import { OtpInput } from "react-native-otp-entry";
import CustomButton from "@/components/global/button/CustomButton";
import LoadingModal from "@/components/global/loading-modal";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import Entypo from "@expo/vector-icons/Entypo";
import { cn } from "@/core";

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

  const [resetTimer, setResetTimer] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(59);

  const [verify, { isLoading }] = useVerifyEmailMutation();

  const resendOtp = async (actioned: boolean) => {
    if (!actioned && !params?.fromLogin) {
      return;
    }
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/auth/resend-otp`,
        {
          email,
        },
      );
      if (actioned) {
        if (response.data?.success) {
          toast.success("OTP has been Resent");
        } else {
          toast.error(response.data?.data?.message);
        }
      }
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.data?.errors?.[0]?.message ||
          error?.data?.message ||
          "Could not Resend OTP",
      );
    } finally {
      return setResetTimer(true);
    }
  };

  const onSubmit = async () => {
    try {
      const { otp } = data;
      const result = await verify({
        email,
        otp,
      }).unwrap();
      if (result?.success) {
        toast.success("success");
        await AsyncStorage.setItem("fromVerify", JSON.stringify(result?.data));
        router.replace("/(root)/(categories)/category");
      } else {
        toast.error(result?.message);
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.data.message);
    }
  };

  useEffect(() => {
    resendOtp(false);
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(
      () =>
        setTimer((prev) => {
          if (prev > 0) {
            return prev - 1;
          }
          setResetTimer(false);
          return 0;
        }),
      1000,
    );
    if (!resetTimer) {
      clearInterval(timerInterval);
      setTimer(59);
    }

    return () => clearInterval(timerInterval);
  }, [resetTimer]);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-black">
        <View className="container px-[20px] my-[20px]">
          <View className="mb-[20px]">
            <Pressable
              onPress={() => {
                console.log("logging");
                router.dismissTo("/sign-up");
              }}
            >
              <Entypo name="chevron-left" size={24} color="white" />
            </Pressable>
          </View>
          <View className="self-center justify-center w-full mb-[24px]">
            <Text className="text-white mb-[10px] text-center font-LexendDecaMedium text-[24px] tracking-[-0.22px]">
              Verify Code
            </Text>
            <Text className="text-gray-200 text-center font-LexendDecaLight text-sm tracking-[-0.22px]">
              We sent a code to you at {"\n"}
              {email}
            </Text>
            {/* <Link
                href={"/(root)/(auth)/sign-up"}
                className="text-center text-[10px] font-LexendDecaMedium underline text-primary-100 mt-2"
              >
                Change email
              </Link> */}
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
                placeholder="----"
                theme={{
                  containerStyle: {
                    paddingHorizontal: 40,
                  },
                  pinCodeContainerStyle: {
                    borderRadius: 10,
                    borderCurve: "continuous",
                    width: 50,
                    height: 50,
                    backgroundColor: "#FFFFFF05",
                    borderWidth: 1,
                    borderColor: "#FFFFFF33",
                  },
                  focusedPinCodeContainerStyle: {
                    borderWidth: 1,
                    borderColor: "#16783A",
                  },
                  pinCodeTextStyle: {
                    color: "white",
                    fontSize: 20,
                    fontFamily: "LexendDeca-Medium",
                  },
                  placeholderTextStyle: {
                    color: "#FFFFFF99",
                  },
                  focusStickStyle: {
                    borderWidth: 1,
                    borderColor: "#16783A",
                    height: 20,
                  },
                }}
              />
            )}
          />

          <View className="flex-row justify-center py-8 items-center gap-[6px]">
            <TouchableOpacity
              onPress={() => {
                if (!resetTimer) resendOtp(true);
              }}
            >
              <Text
                className={cn("text-white opacity-50 font-LexendDecaLight", {
                  "text-white opacity-100": !resetTimer,
                })}
              >
                Resend code
              </Text>
            </TouchableOpacity>
            <Text className="font-LexendDeca text-gray-400">
              {resetTimer && `${timer}s`}
            </Text>
          </View>
          <CustomButton
            title="Verify Code"
            onPress={onSubmit}
            // onPress={() => router.replace("/category")}
            className="mb-4 mt-[18px] !rounded-[40px] py-4 !text-white text-sm font-LexendDecaBold"
            textStyle="font-LexendDecaMedium tracking-[-0.22px]"
            disabled={data.otp.length !== 4 || isLoading}
          />
        </View>
        <LoadingModal isVisible={isLoading} />
      </SafeAreaView>
    </>
  );
};

export default VerifyCodeOtp;
