/* eslint-disable max-lines-per-function */
import CustomButton from "@/components/global/button/CustomButton";
import CheckBox from "@/components/global/check-box";
import Input from "@/components/global/textInput";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { icons } from "@/constants";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  setToken,
  setUserEmail,
} from "@/store/features/auth/utils";
import { signIn, signInAsGuest } from "@/store/features/auth/authSlice";
import { API_URL } from "@env";
import { toast } from "@/core/toast";
import { usePushNotifications } from "@/hooks/useExpoPushToken";
import LoadingModal from "@/components/global/loading-modal";
//import { trackEvent } from "@/utils/customerio";
import { identifyUser, trackEvent } from "@/utils/analytics";
//import { trackEvent as trackMixpanelEvent } from "@/utils/mixpanel";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import {
//   GoogleSignin,
//   isErrorWithCode,
//   isSuccessResponse,
// } from "@react-native-google-signin/google-signin";

// GoogleSignin.configure({
//   webClientId:
//     "95041167196-22r5o9uv5dm7a2nmc0k0hdvsouu01vln.apps.googleusercontent.com",
//   scopes: ["https://www.googleapis.com/auth/user.phonenumbers.read"],
// });

const statusCodes = {
  PLAY_SERVICES_NOT_AVAILABLE: "404",
  IN_PROGRESS: "301",
};

const Login = () => {
  const { expoPushToken } = usePushNotifications();
  const [state, setState] = useState<any>({});
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
        expoPushToken: expoPushToken?.data!,
      }).unwrap();
      if (!result?.user?.emailVerified) {
        await AsyncStorage.setItem("registerPayload", JSON.stringify(result));
        return router.push({
          pathname: "/(root)/(auth)/verify-code",
          params: {
            email,
            fromLogin: "true",
          },
        });
      }
      dispatch(signIn(result));
      setPassword(password);
      setUserEmail(email);
      
      // Track login event with Customer.io and Mixpanel via analytics.ts
      try {
        if (result) {
          // Identify the user directly
          identifyUser(result?.user?._id, {
            "$email": email,
            "$name": result?.user?.firstName + " " + result?.user?.lastName,
            firstName: result?.user?.firstName,
            lastName: result?.user?.lastName,
            username: result?.user?.username,
          });
          
          trackEvent('buyer_login', {
            userId: result?.user?._id,
            "$email": email,
            "$name": result?.user?.firstName + " " + result?.user?.lastName,
            firstName: result?.user?.firstName,
            lastName: result?.user?.lastName,
            username: result?.user?.username,
            phoneNumber: result?.user?.phoneNumber,
            shippingAddress: result?.user?.shippingAddresses[0],
            country: result?.user?.country,
            emailVerified: result?.user?.emailVerified,
            walletBalance: `₦${result?.user?.wallet?.balance?.toLocaleString()}`,
            onHoldAmount: `₦${result?.user?.wallet?.onHoldAmount?.toLocaleString()}`,
            onHoldItems: result?.user?.wallet?.onHoldAmount ? result?.user?.wallet?.onHoldItems[0] : "none",
            userType: "buyer",
            timestamp: new Date().toISOString()
          });
        }
      } catch (trackError) {
        console.log("Analytics tracking error:", trackError);
        // Allow login flow to continue even if tracking fails
      }
      
      if (result?.user?.selectedCategories?.length! > 0) {
        router.replace("/(root)/(tabs)/home/home");
      } else router.replace("/(root)/(categories)/category");
    } catch (error: any) {
      console.log(error);

      toast.error(error.data.message);
    }
  };

  const handleGoogleAuth = async (googleResponse: any) => {
    try {
      const payload = {
        googleToken: googleResponse?.idToken,
        email: googleResponse?.user?.email,
        firstName:
          googleResponse?.user?.givenName ||
          googleResponse?.user?.name.split(" ")[0] ||
          googleResponse?.user?.name,
        lastName:
          googleResponse?.user?.familyName ||
          googleResponse?.user?.name.split(" ")[1] ||
          googleResponse?.user?.name,
        username: googleResponse?.user?.name,
        profileImage: googleResponse?.user?.photo,
        expoPushToken: expoPushToken?.data!,
      };
      // return await GoogleSignin.signOut();
      // return console.log(payload);

      const result = await login({
        googleToken: googleResponse?.idToken,
        email: googleResponse?.user?.email,
        firstName:
          googleResponse?.user?.givenName ||
          googleResponse?.user?.name.split(" ")[0] ||
          googleResponse?.user?.name,
        lastName:
          googleResponse?.user?.familyName ||
          googleResponse?.user?.name.split(" ")[1] ||
          googleResponse?.user?.name,
        username: googleResponse?.user?.name,
        profileImage: googleResponse?.user?.photo,
        expoPushToken: expoPushToken?.data!,
      }).unwrap();
      dispatch(signIn(result));
      setPassword(result?.user?.password!);
      setUserEmail(result?.user?.email!);
      if (result?.user?.selectedCategories?.length! > 0) {
        router.replace("/(root)/(tabs)/home/home");
      } else router.replace("/(root)/(categories)/category");

      // console.log("google sign in data", googleResponse);
    } catch (e) {
      toast.error("could not sign in with google");
      console.log(e);
    }
  };

  // const GoogleSignIn = async () => {
  //   try {
  //     await GoogleSignin.hasPlayServices();
  //     const response = await GoogleSignin.signIn();
  //     if (isSuccessResponse(response)) {
  //       setState({ userInfo: response.data });
  //       handleGoogleAuth(response.data);
  //     } else {
  //       console.log(response?.data || response);
  //     }
  //   } catch (error) {
  //     if (isErrorWithCode(error)) {
  //       console.log(error.cause);

  //       switch (error.code) {
  //         case statusCodes.IN_PROGRESS:
  //           // operation (eg. sign in) already in progress
  //           break;
  //         case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
  //           // Android only, play services not available or outdated
  //           break;
  //         default:
  //         // some other error happened
  //       }
  //     } else {
  //       // an error that's not related to google sign in occurred
  //     }
  //   }
  // };

  useEffect(() => {}, []);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="bg-black h-full">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="container h-full w-full justify-between px-[21px]">
              <View className="w-full">
                <View className="my-10 items-center  mx-auto">
                  <Image
                    source={icons.auqliLogo}
                    resizeMode="contain"
                    className="mb-[18px]"
                    style={{
                      width: 50,
                      height: 50,
                    }}
                  />
                  <Text className="mb-2.5 text-center text-xl font-LexendDecaBold text-white">
                    Welcome back!
                  </Text>
                  <Text className="text-center font-LexendDecaMedium text-base text-[#425466]">
                    Making live shopping a daily experience
                  </Text>
                </View>
                <View className="gap-y-4 rounded-[8px] border border-[#C6C6C640] p-8">
                  <FormProvider {...methods}>
                    <Input
                      name="email"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      className="!font-LexendDeca"
                      rules={["required", "email"]}
                    />
                    <Input
                      name="password"
                      label="Password"
                      placeholder="Enter your password"
                      className="!font-LexendDeca"
                      secureTextEntry
                      rules={["required"]}
                    />
                    <View className="mt-2 w-full flex-row items-center justify-end">
                      {/* <CheckBox name="remember" label="Remember me" /> */}
                      <Link href="/(root)/(auth)/forgot-password">
                        <Text
                          className="text-sm
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
                      // loading={isLoading}
                    >
                      Log in
                    </CustomButton>

                    {/* <View className="flex-row items-center">
                      <View className="h-px flex-1 bg-primary-100" />
                      <View>
                        <Text className="w-[50px] text-center text-sm text-white">
                          {" "}
                          Or{" "}
                        </Text>
                      </View>
                      <View className="h-px flex-1 bg-primary-100" />
                    </View> */}
                    {/* <CustomButton
                      textVariant="success"
                      title="Continue with Google"
                      className=" mt-[18px] !rounded border border-primary items-center justify-center !bg-white !text-black-100"
                      // onPress={GoogleSignIn}
                      IconLeft={() => (
                        <Image
                          source={icons.google}
                          resizeMode="contain"
                          className="w-5 h-5 mr-2"
                        />
                      )}
                    /> */}
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
                {/* <Text className="text-white font-LexendDeca text-[10px] text-center">
                  Or
                </Text> */}

                <Pressable
                  onPress={() => {
                    dispatch(signInAsGuest());
                    router.push("../../../(root)/(tabs)/home");
                  }}
                  className="self-center  mt-[12px]"
                >
                  <Text className="text-center text-[12px] font-LexendDecaMedium text-primary-100">
                    Continue as Guest
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <LoadingModal isVisible={isLoading} />
      </SafeAreaView>
    </>
  );
};

export default Login;
