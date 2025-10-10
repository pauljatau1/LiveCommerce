/* eslint-disable max-lines-per-function */
import CustomButton from "@/components/global/button/CustomButton";
import Input from "@/components/global/textInput";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Link, router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/services/auth";
import { setPassword, setUserEmail } from "@/store/features/auth/utils";
import { signIn, signInAsGuest } from "@/store/features/auth/authSlice";
import { toast } from "@/core/toast";
import { usePushNotifications } from "@/hooks/useExpoPushToken";
import LoadingModal from "@/components/global/loading-modal";
import { identifyUser, trackEvent } from "@/utils/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
// For development debugging
import { debugAnalytics } from "@/utils/analytics";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AuqliSecondary from "@/components/global/svgIcons/auqliSecondary";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "95041167196-22r5o9uv5dm7a2nmc0k0hdvsouu01vln.apps.googleusercontent.com",
  scopes: ["https://www.googleapis.com/auth/user.phonenumbers.read"],
});

const statusCodes = {
  PLAY_SERVICES_NOT_AVAILABLE: "404",
  IN_PROGRESS: "301",
};

const Login = () => {
  const { prevRoute, prevRouteParams } = useLocalSearchParams();
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

  const [prevRouteLocal, setPrevRouteLocal] = useState<any>();

  const handleAuthReferrer = useCallback(async () => {
    if (
      prevRoute &&
      prevRoute !== "undefined" &&
      prevRoute !== "/undefined" &&
      prevRoute !== null
    ) {
      await AsyncStorage.setItem(
        "authReferrer",
        JSON.stringify({
          pathname: prevRoute,
          params: JSON.parse(prevRouteParams?.toString()),
        }),
      );
      setPrevRouteLocal({
        pathname: prevRoute as any,
        params: JSON.parse(prevRouteParams?.toString()),
      });
    }
    let local = await AsyncStorage.getItem("authReferrer");
    if (local) {
      setPrevRouteLocal(JSON.parse(local));
    }
  }, [prevRoute]);

  useEffect(() => {
    handleAuthReferrer();
  }, [prevRoute]);

  const onSubmit = async () => {
    try {
      const { email, password } = data;
      const result = await login({
        email,
        password,
        expoPushToken: expoPushToken?.data!,
      }).unwrap();
      // if (!result?.data?.user?.emailVerified) {
      //   await AsyncStorage.setItem(
      //     "registerPayload",
      //     JSON.stringify(result?.data),
      //   );
      //   return router.push({
      //     pathname: "/(root)/(auth)/verify-code",
      //     params: {
      //       email,
      //       fromLogin: "true",
      //     },
      //   });
      // }
      dispatch(signIn(result?.data));
      setPassword(password);
      setUserEmail(email);

      // Track login event with Customer.io, Mixpanel, and Facebook via analytics.ts
      try {
        if (result) {
          // Identify the user directly
          identifyUser(result?.data?.user?._id, {
            $email: email,
            $name:
              result?.data?.user?.firstName +
              " " +
              result?.data?.user?.lastName,
            firstName: result?.data?.user?.firstName,
            lastName: result?.data?.user?.lastName,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            shippingAddress: result?.data?.user?.shippingAddresses[0],
            country: result?.data?.user?.country,
            emailVerified: result?.data?.user?.emailVerified,
            walletBalance: result?.data?.user?.wallet?.balance,
            onHoldAmount: result?.data?.user?.wallet?.onHoldAmount,
            onHoldItems: result?.data?.user?.wallet?.onHoldAmount
              ? result?.data?.user?.wallet?.onHoldItems[0]
              : "none",
            "User Type": "Buyer",
            timestamp: new Date().toISOString(),
          });

          trackEvent("buyer_login", {
            userId: result?.data?.user?._id,
            $email: email,
            $name:
              result?.data?.user?.firstName +
              " " +
              result?.data?.user?.lastName,
            firstName: result?.data?.user?.firstName,
            lastName: result?.data?.user?.lastName,
            username: result?.data?.user?.username,
            phoneNumber: result?.data?.user?.phoneNumber,
            shippingAddress: result?.data?.user?.shippingAddresses[0],
            country: result?.data?.user?.country,
            emailVerified: result?.data?.user?.emailVerified,
            walletBalance: result?.data?.user?.wallet?.balance,
            onHoldAmount: result?.data?.user?.wallet?.onHoldAmount,
            onHoldItems: result?.data?.user?.wallet?.onHoldAmount
              ? result?.data?.user?.wallet?.onHoldItems[0]
              : "none",
            "User Type": "Buyer",
            timestamp: new Date().toISOString(),
          });
        }
      } catch (trackError) {
        console.log("Analytics tracking error:", trackError);
        // Allow login flow to continue even if tracking fails
      }

      if (result?.data?.user?.selectedCategories?.length! > 0) {
        if (prevRouteLocal) {
          // return console.log("referrer object", prevRouteLocal);

          router.canDismiss()
            ? router.dismissTo(prevRouteLocal)
            : router.replace(prevRouteLocal);
          await AsyncStorage.removeItem("authReferrer");
          return;
        }
        router.back();
      } else {
        await AsyncStorage.setItem(
          "registerPayload",
          JSON.stringify(result?.data),
        );
        router.replace("/(root)/(categories)/category");
      }
    } catch (error: any) {
      console.log(error?.data?.message);
      toast.error(
        error.data?.errors?.[0]?.message ||
          error?.data?.message ||
          "Error Logging in. Please try Again!",
      );
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
        password: googleResponse?.idToken,
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
      dispatch(signIn(result?.data));
      setPassword(result?.data?.user?.password!);
      setUserEmail(result?.data?.user?.email!);
      if (result?.data?.user?.selectedCategories?.length! > 0) {
        router.replace("/(root)/(tabs)/home/home");
      } else router.replace("/(root)/(categories)/category");

      // console.log("google sign in data", googleResponse);
    } catch (e) {
      toast.error("could not sign in with google");
      console.log(e);
    }
  };

  const GoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        setState({ userInfo: response.data });
        handleGoogleAuth(response.data);
      } else {
        console.log(response?.data || response);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        console.log(error.cause);

        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            break;
          default:
          // some other error happened
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
  };

  useEffect(() => {}, []);

  return (
    <SafeAreaView className="bg-black h-full">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="py-[20px]"
        >
          <View className="container h-full w-full justify-between px-[21px]">
            <Pressable
              onPress={() => {
                dispatch(signInAsGuest());
                return router.back();
                // router.push("/(root)/(tabs)/blips");
              }}
              style={{
                alignItems: "flex-end",
              }}
            >
              <Text
                style={{
                  color: "#ccc",
                  fontSize: 14,
                  fontFamily: "LexendDeca",
                  fontWeight: "300",
                  letterSpacing: -0.22,
                }}
              >
                Skip
              </Text>
            </Pressable>
            <View className="w-full">
              <View className="my-10 items-center  mx-auto">
                <View className="w-[70px] h-[70px] items-center justify-center bg-[#F1F7F3] mb-[18px] rounded-full">
                  <AuqliSecondary width={"70%"} height={"70%"} />
                </View>

                <Text className="mb-2 text-center text-[24px] font-LexendDecaMedium text-white tracking-[-0.22px]">
                  Welcome back
                </Text>
                <Text className="text-center font-LexendDecaLight text-[#425466] tracking-[-0.22px]">
                  Making live shopping a daily experience
                </Text>
              </View>
              <View className="gap-y-[16px] w-full">
                <FormProvider {...methods}>
                  <Input
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    className="!font-LexendDecaLight"
                    rules={["required", "email"]}
                  />
                  <Input
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    className="!font-LexendDecaLight"
                    secureTextEntry
                    rules={["required"]}
                  />
                  <View className="mt-2 w-full flex-row items-center justify-center">
                    <Pressable
                      onPress={() => {
                        router.replace("/forgot-password");
                      }}
                    >
                      <Text
                        className="text-[14px]
                                    font-LexendDeca
                                    text-primary-100 tracking-[-0.22px]"
                      >
                        Forgot password?
                      </Text>
                    </Pressable>
                  </View>
                  <CustomButton
                    title="Log in"
                    onPress={onSubmit}
                    className="mb-4 mt-[18px] !rounded-[10px] !text-white text-sm h-[50px]"
                    textStyle="font-LexendDecaMedium tracking-[-0.22px]"
                    disabled={isLoading || !isValid}
                    // loading={isLoading}
                  >
                    Log in
                  </CustomButton>

                  {/* Debug button for Facebook analytics testing - Development only */}
                  {/* {__DEV__ && (
                    <CustomButton
                      title="🔍 Debug Facebook Analytics"
                      onPress={async () => {
                        console.log("🧪 Starting Facebook Analytics Debug...");
                        await debugAnalytics();
                      }}
                      className="mb-4 !rounded border border-yellow-500 !bg-yellow-600 !text-white text-xs font-LexendDecaMedium"
                    >
                      🔍 Debug Facebook Analytics
                    </CustomButton>
                  )} */}
                </FormProvider>
              </View>
            </View>
            <View className=" py-12 flex-row items-center justify-center gap-[4px] shrink flex-wrap">
              <Text
                className="text-center text-m font-normal text-[#CCCCCC]
                        font-LexendDeca tracking-[-0.22px]
                        "
              >
                Don't have an account?
              </Text>
              <Link
                href="/(root)/(auth)/sign-up"
                className="text-center text-md font-LexendDecaMedium text-primary-100 tracking-[-0.22px]"
              >
                Sign up
              </Link>
            </View>
            {/* <Pressable
              onPress={() => {
                GoogleSignIn();
              }}
              className="self-center  mt-[12px]"
            >
              <Text className="text-center text-[12px] font-LexendDecaMedium text-primary-100">
                Google Sign In
              </Text>
            </Pressable> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingModal isVisible={isLoading} />
    </SafeAreaView>
  );
};

export default Login;
