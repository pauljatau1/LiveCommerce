/* eslint-disable max-lines-per-function */
import CustomButton from "@/components/global/button/CustomButton";
import CheckBox from "@/components/global/check-box";
import Input from "@/components/global/textInput";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { icons } from "@/constants";
import { Link, router } from "expo-router";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/services/auth";
import {
  getToken,
  setPassword,
  setUserEmail,
} from "@/store/features/auth/utils";
import { signIn } from "@/store/features/auth/authSlice";
import { API_URL } from "@env";
import { toast } from "@/core/toast";

const Login = () => {
  const dispatch = useDispatch();

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    formState: { isValid },
    watch,
  } = methods;

  const data = watch();

  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async () => {
    try {
      const { email, password } = data;
      const result = await login({
        email,
        password,
      }).unwrap();
      dispatch(signIn(result));
      setPassword(password);
      setUserEmail(email);
      if (result?.user?.selectedCategories?.length! > 0) {
        router.replace("/(root)/(tabs)/home");
      } else router.replace("/(root)/(categories)/category");
    } catch (error: any) {
      console.log(error);

      toast.error(error.data.message);
    }
  };

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="bg-black h-full">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="container h-full w-full justify-between px-[21px]">
              <View className="w-full">
                <View className="my-10 items-center  mx-auto">
                  <Image
                    source={icons.waving}
                    resizeMode="contain"
                    className="mb-[18px]"
                  />
                  <Text className="mb-2.5 text-center font-SfPro text-xl font-semibold text-white">
                    Welcome back!
                  </Text>
                  <Text className="text-center font-SfPro text-base text-[#425466]">
                    Let’s build something great
                  </Text>
                </View>
                <View className="gap-y-4 rounded-[8px] border border-[#C6C6C640] p-8">
                  <FormProvider {...methods}>
                    <Input
                      name="email"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      rules={["required", "email"]}
                    />
                    <Input
                      name="password"
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry
                      rules={["required"]}
                    />
                    <View className="mt-2 w-full flex-row items-center justify-between">
                      <CheckBox name="remember" label="Remember me" />
                      <Link href="/(root)/(auth)/forgot-password">
                        <Text
                          className="text-sm font-bold
                                    font-LexendDecaBold
                                    text-primary-100"
                        >
                          Forgot password?
                        </Text>
                      </Link>
                    </View>
                    <CustomButton
                      title="Log in"
                      onPress={onSubmit}
                      className="mb-4 mt-[18px] !rounded !text-white text-sm font-LexendDecaBold"
                      disabled={isLoading || !isValid}
                      loading={isLoading}
                    >
                      Log in
                    </CustomButton>

                    <View className="flex-row items-center">
                      <View className="h-px flex-1 bg-primary-100" />
                      <View>
                        <Text className="w-[50px] text-center text-sm text-white">
                          {" "}
                          Or{" "}
                        </Text>
                      </View>
                      <View className="h-px flex-1 bg-primary-100" />
                    </View>
                    <CustomButton
                      textVariant="success"
                      title="Continue with Google"
                      className=" mt-[18px] !rounded border border-primary items-center justify-center !bg-white !text-black-100"
                      IconLeft={() => (
                        <Image
                          source={icons.google}
                          resizeMode="contain"
                          className="w-5 h-5 mr-2"
                        />
                      )}
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
                  href="/(root)/(auth)/sign-up"
                  className="text-center text-lg font-LexendDecaMedium text-primary-100"
                >
                  Sign up
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default Login;
