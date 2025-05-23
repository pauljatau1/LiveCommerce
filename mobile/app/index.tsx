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
import analytics from '@react-native-firebase/analytics';
import { safeInitializeFacebook } from '@/utils/facebook';

// SplashScreen.preventAutoHideAsync();

/**
 * Check if this is a preview build through various indications
 */
const isPreviewBuild = () => {
  // Check for preview/staging environment indicators
  return (
    process.env.APP_VARIANT === 'preview' ||
    process.env.EAS_BUILD_PROFILE === 'preview' ||
    process.env.EXPO_PUBLIC_IS_PREVIEW === 'true'
  );
};

const Home = () => {
  const { expoPushToken } = usePushNotifications();
  // useInitializeAuthState();
  console.log("expoPushToken", expoPushToken);

  useEffect(() => {
    // Initialize analytics tools
    initializeCustomerIO();
    initializeMixpanel(false); // Initialize Mixpanel with automatic tracking disabled
    analytics().logEvent('app_opened', {
      purpose: 'User opened the app',
    });
    
    // For preview builds - use forceSafeMode: true to completely avoid Facebook SDK
    // For production builds - SDK will be initialized normally
    {/*safeInitializeFacebook({
      appName: 'Auqli',
      autoLogAppEvents: true,
      forceSafeMode: isPreviewBuild(),
    });*/}

    async function getToken() {
      const isFirstTime = await AsyncStorage.getItem("isFirstTime");
      console.log("isFirstTime", isFirstTime);

      // Track initial screen view
      trackScreen("App Start", { isFirstTime: !!isFirstTime });

      if (isFirstTime) {
        router.replace("../(root)/(tabs)/home");
      } else {
        router.replace("../(root)/(auth)/welcome");
      }
    }
    getToken();
    // SplashScreen.hideAsync();
  }, []);
  return <View className="h-full w-full bg-[#121212]" />;
};

export default Home;
