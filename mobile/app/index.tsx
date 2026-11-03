import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { usePushNotifications } from "../hooks/useExpoPushToken";
import useInitializeAuthState from "@/hooks/useInitializeAuthState";
import { View, Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { initializeCustomerIO } from "@/utils/customerio";
import { initializeMixpanel } from "@/utils/mixpanel";
import { trackScreen } from "@/utils/analytics";
import analytics from "@react-native-firebase/analytics";
import { useClarity } from "@/hooks/useClarity";
import { getUserAttributesForClarity } from "@/utils/clarityUtils";
import { safeInitializeFacebook } from "@/utils/facebook";

// SplashScreen.preventAutoHideAsync();

/**
 * Check if this is a preview build through various indications
 */
const isPreviewBuild = () => {
  // Check for preview/staging environment indicators
  return (
    process.env.APP_VARIANT === "preview" ||
    process.env.EAS_BUILD_PROFILE === "preview" ||
    process.env.EXPO_PUBLIC_IS_PREVIEW === "true"
  );
};

const Home = () => {
  const { expoPushToken } = usePushNotifications();
  const clarity = useClarity();
  // useInitializeAuthState();
  console.log("expoPushToken", expoPushToken);

  useEffect(() => {
    // Initialize analytics tools
    initializeCustomerIO();
    initializeMixpanel(false); // Initialize Mixpanel with automatic tracking disabled
    analytics().logEvent("app_opened", {
      purpose: "User opened the app",
    });

    // FIXED: Initialize user tracking for Clarity with improved timing
    const initializeClarityUser = async () => {
      try {
        console.log("🎯 Starting Clarity user identification process...");

        // Get user attributes
        const userAttributes = await getUserAttributesForClarity();
        if (userAttributes) {
          console.log(
            "🚀 User attributes found, calling clarity.identifyUser:",
            userAttributes,
          );
          clarity.identifyUser(userAttributes);
        } else {
          console.log(
            "⚠️ No user attributes available for Clarity tracking at app start",
          );

          // Set up a retry mechanism for when user logs in later
          setTimeout(async () => {
            try {
              console.log("🔄 Retrying Clarity user identification...");
              const retryUserAttributes = await getUserAttributesForClarity();
              if (retryUserAttributes) {
                console.log(
                  "✅ Retry successful, identifying user:",
                  retryUserAttributes,
                );
                clarity.identifyUser(retryUserAttributes);
              } else {
                console.log("⚠️ Retry failed - still no user attributes");
              }
            } catch (error) {
              console.error("❌ Error in retry Clarity user tracking:", error);
            }
          }, 5000); // Retry after 5 seconds
        }
      } catch (error) {
        console.error("❌ Error initializing Clarity user tracking:", error);
      }
    };

    // Start Clarity user identification with reduced delay since we improved the hook timing
    console.log("⏰ Scheduling Clarity user identification in 1 second...");
    setTimeout(initializeClarityUser, 1000); // Reduced from 3000ms to 1000ms

    // For preview builds - use forceSafeMode: true to completely avoid Facebook SDK
    // For production builds - SDK will be initialized normally
    safeInitializeFacebook({
      appName: "Auqli",
      autoLogAppEvents: true,
      forceSafeMode: isPreviewBuild(),
    });

    async function getToken() {
      const isFirstTime = await AsyncStorage.getItem("isFirstTime");
      console.log("isFirstTime", isFirstTime);

      // Track initial screen view
      trackScreen("App Start", { isFirstTime: !!isFirstTime });

      if (isFirstTime) {
        router.replace("/(root)/(tabs)/blips");
      } else {
        router.replace("/(root)/(auth)/welcome");
      }
    }
    getToken();
    // SplashScreen.hideAsync();
  }, []);

  return <View className="h-full w-full bg-[#121212]" />;
};

export default Home;
