import { Platform } from "react-native";
import { Settings, AccessToken } from "react-native-fbsdk-next";

interface FacebookSDKOptions {
  delay?: boolean;
  delayTime?: number;
  appName?: string;
  graphApiVersion?: string;
  autoLogAppEvents?: boolean;
  forceSafeMode?: boolean; // Force safe mode even in production
}

interface VerifyFacebookSDKResult {
  success: boolean;
  isLoggedIn?: boolean;
  error?: any;
}

/**
 * Development/Preview mode check
 * This helps us completely avoid Facebook SDK in development mode and preview builds
 * Safer approach based on common GitHub issues with the SDK
 */
const isDevelopmentMode = (): boolean => {
  // Check if this is a development build
  const isDev = __DEV__;

  // Also check if this is a preview build (through environment variables)
  // EAS builds with --profile preview will typically have different env variables
  // than production builds
  const isPreviewBuild =
    process.env.APP_VARIANT === "preview" ||
    process.env.EAS_BUILD_PROFILE === "preview";

  // Disable Facebook SDK in both development and preview builds
  return isDev || isPreviewBuild;
};

/**
 * Safely initializes Facebook SDK only in production mode
 * Completely avoids any SDK calls during development to prevent crashes
 *
 * @param options Configuration options
 * @returns boolean indicating if initialization was attempted
 */
export const safeInitializeFacebook = (
  options: FacebookSDKOptions = {},
): boolean => {
  const {
    appName = "Auqli",
    autoLogAppEvents = true,
    forceSafeMode = false, // Use this for preview builds to force safe mode
  } = options;

  // Skip all Facebook SDK initialization in development mode or when forceSafeMode is true
  //   if (isDevelopmentMode() || forceSafeMode) {
  //     console.log(
  //       "🔒 Facebook SDK initialization SKIPPED in development/preview mode or safe mode",
  //     );
  //     return false;
  //   }

  try {
    // Use the hardcoded app ID that matches what's in strings.xml/Info.plist
    const FB_APP_ID = "641273631998457";

    // Only set the app ID without any SDK initialization
    console.log("Setting Facebook App ID:", FB_APP_ID);
    Settings.setAppID(FB_APP_ID!);
    Settings.setAppName(appName);
    Settings.setAutoLogAppEventsEnabled(autoLogAppEvents);

    console.log("Facebook app ID and settings applied successfully");
    Settings.initializeSDK();
    console.log("Facebook inialization complete");

    return true;
  } catch (error) {
    console.error("Error applying Facebook settings:", error);
    return false;
  }
};

/**
 * Mock implementation of Facebook functionality for development
 * This lets you continue development without Facebook SDK causing crashes
 */
export const mockFacebookLogin = async (): Promise<{
  success: boolean;
  token?: string;
}> => {
  console.log("MOCK Facebook login - development mode");
  return { success: true, token: "mock-facebook-token-for-development" };
};

/**
 * Safe wrapper for Facebook login
 * Uses mock in development, real implementation in production
 * @param permissions Facebook permissions to request
 * @param forceSafeMode Force mock implementation even in production
 */
export const safeFacebookLogin = async (
  permissions: string[] = ["public_profile", "email"],
  forceSafeMode: boolean = false,
): Promise<any> => {
  if (isDevelopmentMode() || forceSafeMode) {
    return mockFacebookLogin();
  }

  try {
    // This will only run in production
    const { LoginManager, AccessToken } = require("react-native-fbsdk-next");
    const result = await LoginManager.logInWithPermissions(permissions);

    if (result.isCancelled) {
      return { success: false, isCancelled: true };
    }

    const data = await AccessToken.getCurrentAccessToken();
    return { success: true, ...data };
  } catch (error) {
    console.error("Facebook login error:", error);
    return { success: false, error };
  }
};

/**
 * Verifies if the Facebook SDK is properly initialized
 * Only works in production mode
 * @param forceSafeMode Force mock verification even in production
 */
export const verifyFacebookSDK = async (
  forceSafeMode: boolean = false,
): Promise<VerifyFacebookSDKResult> => {
  if (isDevelopmentMode() || forceSafeMode) {
    console.log(
      "Facebook SDK verification skipped in development mode or safe mode",
    );
    return { success: true, isLoggedIn: false };
  }

  try {
    // Try to get the current access token (will return null if not logged in,
    // but should not crash if SDK is initialized properly)
    const result = await AccessToken.getCurrentAccessToken();
    console.log("Facebook SDK verification - AccessToken result:", result);
    return { success: true, isLoggedIn: result !== null };
  } catch (error) {
    console.error("Facebook SDK verification failed:", error);
    return { success: false, error };
  }
};
