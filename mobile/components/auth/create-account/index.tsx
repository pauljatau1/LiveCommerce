/* eslint-disable max-lines-per-function */

// import 'react-phone-number-input/style.css';

import { format } from "date-fns";
import { Link, router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Input from "@/components/global/textInput";
import PhoneNumberInput from "@/components/global/custom-input";
import CustomButton from "@/components/global/button/CustomButton";
import CheckBox from "@/components/global/check-box";
// import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
// import Select, { OptionComponent, Trigger } from "@/components/global/select";
import { useSignUpMutation } from "@/services/auth";
import { toast } from "@/core/toast";
import PhoneInput, { isValidNumber } from "react-native-phone-number-input";
import { signIn } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { usePushNotifications } from "@/hooks/useExpoPushToken";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingModal from "@/components/global/loading-modal";
import { identifyUser, trackEvent } from "@/utils/analytics";
import { trackEvent as trackMixpanelEvent } from "@/utils/mixpanel";
import { trackFacebookEvent } from "@/utils/facebook-analytics";
import { trackEvent as trackCustomerioEvent } from "@/utils/customerio";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";

const service = [
  {
    label: "NG",
    value: "nigeria",
  },
  {
    label: "Ghana",
    value: "ghana",
  },
  {
    label: "Germany",
    value: "germany",
  },
  {
    label: "Berlin",
    value: "berlin",
  },
];
const CreateAccount = () => {
  // const router = useRouter();
  const dispatch = useDispatch();
  const { expoPushToken } = usePushNotifications();
  const phoneInput = useRef<PhoneInput>(null);

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      userName: "",
      email: "",
      phone: "",
      country: {
        label: "",
        value: "",
      },
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  const {
    formState: { isValid, errors },
    watch,
    control,
  } = methods;

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    userName,
    country,
    agree,
  } = watch();

  const [signUp, { isLoading }] = useSignUpMutation();

  const handleSignUp = async () => {
    const details = {
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phone.replace(/^0+/, ""),
      country: "NG",
      //  || country.label,
      username: userName,
      agree,
      expoPushToken: expoPushToken?.data || "",
    };
    try {
      const result = await signUp(details).unwrap();
      await AsyncStorage.setItem(
        "registerPayload",
        JSON.stringify(result?.data),
      );

      try {
        if (result) {
          // Identify the user directly after signup
          identifyUser(result?.data?.user?._id, {
            $email: email,
            $name: `${result?.data?.user?.firstName} ${result?.data?.user?.lastName}`,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            "User Type": "Buyer",
            osType: Platform.OS,
            timestamp: new Date().toISOString(),
          });

          // Track event for buyer signup
          trackMixpanelEvent("buyer_account_created", {
            userId: result?.data?.user?._id,
            $email: email,
            $name: `${result?.data?.user?.firstName} ${result?.data?.user?.lastName}`,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            "User Type": "Buyer",
            osType: Platform.OS,
            timestamp: new Date().toISOString(),
          });
          // Track event for buyer signup
          trackCustomerioEvent("buyer_account_created", {
            userId: result?.data?.user?._id,
            email: email,
            firstName: result?.data?.user?.firstName,
            lastName: result?.data?.user?.lastName,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            "User Type": "Buyer",
            osType: Platform.OS,
            timestamp: new Date().toISOString(),
          });

          trackFacebookEvent("CompleteRegistration", {
            email: email,
            firstName: result?.data?.user?.firstName,
            lastName: result?.data?.user?.lastName,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            "User Type": "Buyer",
            osType: Platform.OS,
            timestamp: new Date().toISOString(),
          });

          trackMixpanelEvent("signup_method", {
            signup_method: email ? "email" : "not email",
            userId: result?.data?.user?._id,
            email: email,
            firstName: result?.data?.user?.firstName,
            lastName: result?.data?.user?.lastName,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            "User Type": "Buyer",
            osType: Platform.OS,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (trackError) {
        console.log("Customer.io signup tracking error:", trackError);
      }

      toast.success("Successfully created");
      router.replace("/category");
      // router.replace({
      //   pathname: "/(root)/(auth)/verify-code",
      //   params: {
      //     email,
      //   },
      // });
    } catch (error: any) {
      console.log(error.data);
      toast.error(
        error.data?.errors[0]?.message ||
          error?.data?.message ||
          "Sorry, your account could not be created at this time. Please try again!",
      );
    }
  };

  useEffect(() => {
    if (methods.formState.dirtyFields.phone) {
      methods.trigger("phone");
    }
  }, [phone]);

  return (
    <SafeAreaView className="h-full flex-1 bg-black">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />

      <KeyboardAwareScrollView
        style={{
          backgroundColor: "black",
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View className=" justify-between px-[21px] pb-3">
          <View>
            <View className="my-[48px] mb-10">
              <Text className="mb-2 text-center text-[24px] font-LexendDecaMedium text-white tracking-[-0.22px]">
                Signup
              </Text>
              <Text className="text-center font-LexendDecaLight text-[#425466] tracking-[-0.22px]">
                To get max benefits at Auqli, please take a few minutes to
                create an account.
              </Text>
            </View>
            <View className="gap-y-[16px]">
              <FormProvider {...methods}>
                <View className="w-full flex-row gap-x-2">
                  <View className="flex-1">
                    <Input
                      name="firstName"
                      label="First Name"
                      placeholder="First name"
                      rules={["required"]}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      name="lastName"
                      label="Last Name"
                      placeholder="Last name"
                      rules={["required"]}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <Input
                  name="userName"
                  label="Username"
                  placeholder="Enter username"
                  rules={["required"]}
                  autoCapitalize="words"
                />
                <Input
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  rules={["required", "email"]}
                />
                {/* <Input
                  name="Country"
                  label="Country"
                  placeholder="Nigeria"
                  readOnly
                /> */}
                {/* <Select
                    name="country"
                    required
                    label="Country"
                    enableDynamicSizing={false}
                    options={service}
                    trigger={(selected) => Trigger(selected, "Select Country")}
                    // eslint-disable-next-line max-params
                    optionComponent={(option, selected, length, index) =>
                      OptionComponent(option, selected, length, index)
                    }
                    estimatedItemSize={4}
                  /> */}
                <View>
                  <Text className="mb-[12px] font-LexendDecaLight text-[14px] tracking-[-0.22px] text-white">
                    Mobile Number
                  </Text>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      validate: () => {
                        if (!phoneInput.current) {
                          return "Phone number is required";
                        }

                        const phoneNumberDetails =
                          phoneInput.current.getNumberAfterPossiblyEliminatingZero();
                        const isValid = phoneInput.current.isValidNumber(
                          phoneNumberDetails.number,
                        );

                        return isValid
                          ? isValid
                          : "The mobile number field has to be valid number";
                      },
                    }}
                    render={({ field: { onChange, value, ref } }) => (
                      <View className="pr-8">
                        <PhoneInput
                          placeholder="Phone number"
                          ref={phoneInput}
                          defaultValue={value}
                          value={value}
                          defaultCode="NG" // Default country code
                          layout="second"
                          onChangeText={(text) => {
                            onChange(text); // Update form value
                          }}
                          onChangeFormattedText={(formattedText) => {
                            onChange(formattedText); // Update form value
                          }}
                          withDarkTheme
                          containerStyle={[
                            {
                              borderWidth: 1.3,
                              borderColor: errors.phone ? "red" : "#5E5D6F",
                              borderRadius: 8,
                              paddingRight: 12,
                              width: "110%",
                              height: 50,
                              overflow: "hidden",
                            },
                          ]}
                          textContainerStyle={{
                            backgroundColor: "#000",
                            paddingRight: 10,
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                            // paddingTop: 15,
                            minWidth: "200%",
                          }}
                          textInputStyle={{
                            color: "white",
                            paddingHorizontal: 2,
                            fontFamily: "LexendDeca-Light",
                          }}
                          textInputProps={{
                            placeholderTextColor: "#5E5D6F",
                            cursorColor: "white",
                          }}
                        />

                        {errors.phone && (
                          <Text className="mt-2 text-left font-LexendDeca text-[12px] tracking-[-0.24px] text-red-500">
                            *{errors?.phone.message as string}
                            {/* {value} */}
                          </Text>
                        )}
                      </View>
                    )}
                  />
                </View>

                <Input
                  name="password"
                  label="Create Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  rules={["required", "password"]}
                />
                <Input
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  secureTextEntry
                  rules={["required", "confirmPassword"]}
                />

                <View className="mt-2 w-full flex-row items-center justify-between">
                  <Controller
                    name="agree"
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                      <CheckBox
                        name="agree"
                        // checked={value}
                        // onChange={onChange}
                        label="I accept the terms and privacy policy"
                        textStyle="LexendDeca-Light" // Example font family
                      />
                    )}
                  />
                </View>
                <CustomButton
                  title="Sign up"
                  disabled={isLoading || !isValid || !agree}
                  onPress={handleSignUp}
                  className="mb-4 mt-[18px] !rounded-[10px] !text-white text-sm h-[50px]"
                  textStyle="font-LexendDecaMedium tracking-[-0.22px]"
                  loading={isLoading}
                />
              </FormProvider>
            </View>
          </View>
          <View className=" py-12 flex-row items-center justify-center gap-[4px] shrink flex-wrap">
            <Text
              className="text-center text-lg font-normal text-[#CCCCCC]
                        font-LexendDeca tracking-[-0.22px]
                        "
            >
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.dismissTo("/sign-in")}>
              <Text className="text-center text-lg font-LexendDecaMedium text-primary-100 tracking-[-0.22px]">
                Log in
              </Text>
            </Pressable>
          </View>

          <View>
            <Text className="text-[#ccc] font-LexendDeca text-[12px] text-center tracking-[-0.22px]">
              By signing up you agree to our{" "}
              <Link
                href="https://www.auqli.live/terms"
                className="underline font-LexendDecaMedium text-[#16783A]"
              >
                Terms and conditions
              </Link>{" "}
              and{" "}
              <Link
                href="https://www.auqli.live/privacy-policy"
                className="underline font-LexendDecaMedium text-[#16783A]"
              >
                Privacy Policy
              </Link>
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <LoadingModal isVisible={isLoading} />
    </SafeAreaView>
  );
};

export default CreateAccount;
