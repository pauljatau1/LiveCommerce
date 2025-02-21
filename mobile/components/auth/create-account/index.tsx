/* eslint-disable max-lines-per-function */

// import 'react-phone-number-input/style.css';

import { format } from "date-fns";
import { Link, router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Input from "@/components/global/textInput";
import PhoneNumberInput from "@/components/global/custom-input";
import CustomButton from "@/components/global/button/CustomButton";
import CheckBox from "@/components/global/check-box";
// import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Select, { OptionComponent, Trigger } from "@/components/global/select";
import { useSignUpMutation } from "@/services/auth";
import { toast } from "@/core/toast";
import PhoneInput, { isValidNumber } from "react-native-phone-number-input";
import { signIn } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      country: country.label,
      username: userName,
      agree,
    };
    try {
      const result = await signUp(details).unwrap();
      await AsyncStorage.setItem("registerPayload", JSON.stringify(result));

      toast.success("Successfully created");
      router.push({
        pathname: "/(root)/(auth)/verify-code",
        params: {
          email,
        },
      });
    } catch (error: any) {
      console.log(error.data);
      toast.error(error.data.message);
    }
  };

  useEffect(() => {
    if (methods.formState.dirtyFields.phone) {
      methods.trigger("phone");
    }
  }, [phone]);

  return (
    <ScrollView
      style={{
        backgroundColor: "black",
      }}
      showsVerticalScrollIndicator={false}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full flex-1 bg-black">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="container h-full justify-between px-[21px] pb-3">
            <View>
              <View className="my-[48px] mb-10">
                <Text className="mb-[20px] text-center text-gray-200 font-LexendDecaBold text-[21px] ">
                  Create Account
                </Text>
                <Text className="mx-auto text-center font-LexendDeca  text-sm text-gray-200">
                  To get max benefits at Auqli, please take a few minutes to
                  create an account.
                </Text>
              </View>
              <View className="gap-y-4 rounded-[8px] border border-[#C6C6C640] p-8">
                <FormProvider {...methods}>
                  <View className="w-full flex-row gap-x-2">
                    <View className="flex-1">
                      <Input
                        name="firstName"
                        label="First Name*"
                        placeholder="First name"
                        rules={["required"]}
                        autoCapitalize="words"
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        name="lastName"
                        label="Last Name*"
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
                  <Select
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
                  />
                  <View>
                    <Text className="mb-[6px] font-LexendDecaMedium text-sm font-medium tracking-wider text-white">
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
                              paddingTop: 15,
                              minWidth: "200%",
                            }}
                            textInputStyle={{
                              color: "white",
                              paddingHorizontal: 2,
                            }}
                          />

                          {errors.phone && (
                            <Text className="mt-2 text-left font-LexendDeca text-xs tracking-wider text-red-500">
                              *{errors?.phone.message as string}
                              {value}
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
                    placeholder="Enter your password again"
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
                          label="I agree with the Terms & Conditions"
                          textStyle="Roboto-Bold" // Example font family
                        />
                      )}
                    />
                  </View>
                  <CustomButton
                    title="Sign up"
                    disabled={isLoading || !isValid || !agree}
                    onPress={handleSignUp}
                    className="mb-4 mt-[18px] !rounded !text-white"
                    loading={isLoading}
                  />
                </FormProvider>
              </View>
            </View>
            <View className="mx-auto py-12 ">
              <Text
                className="text-center text-lg font-normal text-[#CCCCCC]
                        font-LexendDecaMedium
                        "
              >
                Don't have an account?
              </Text>
              <Link
                href="/(root)/(auth)/sign-in"
                className="text-center text-lg font-LexendDecaMedium text-primary-100"
              >
                <Text className="text-center text-lg font-LexendDecaMedium text-primary-100">
                  Log in
                </Text>
              </Link>
            </View>

            <View>
              <Text className="text-[#ccc] font-LexendDeca text-[12px] text-center">
                By signing up you agree to our{" "}
                <Link
                  href="https://www.auqli.live/privacy-policy"
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScrollView>
  );
};

export default CreateAccount;
