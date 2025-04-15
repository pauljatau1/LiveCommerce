import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Import Intercom with a safety check
let Intercom: any;
let isIntercomAvailable = false;

try {
  Intercom = require('@intercom/intercom-react-native');
  isIntercomAvailable = !!Intercom && typeof Intercom === 'object';
  console.log('[IntercomService] SDK is available:', isIntercomAvailable);
} catch (error) {
  console.log('[IntercomService] Failed to import the SDK:', error);
  Intercom = null;
  isIntercomAvailable = false;
}

// Get Intercom config from environment variables
const INTERCOM_APP_ID = process.env.EXPO_PUBLIC_INTERCOM_APP_ID || '';
const INTERCOM_ANDROID_API_KEY = process.env.EXPO_PUBLIC_INTERCOM_ANDROID_API_KEY || '';
const INTERCOM_IOS_API_KEY = process.env.EXPO_PUBLIC_INTERCOM_IOS_API_KEY || '';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Initialize Intercom on application startup.
 * This should be called from the application's initialization code.
 * Must be called after native code is ready (not in Expo Go).
 */
export const initializeIntercom = async () => {
  // Check if we can use Intercom
  if (!isIntercomAvailable) {
    console.log('[IntercomService] Intercom SDK is not available');
    return false;
  }

  // Skip initialization in Expo Go
  if (isExpoGo) {
    console.log('[IntercomService] Skipping Intercom initialization in Expo Go');
    return false;
  }

  // Check if Intercom API keys are configured
  if (!INTERCOM_APP_ID || !INTERCOM_ANDROID_API_KEY || !INTERCOM_IOS_API_KEY) {
    console.error('[IntercomService] API keys not configured in environment variables');
    return false;
  }

  try {
    // Output the available API
    console.log('[IntercomService] Available Intercom API functions:', 
      Object.keys(Intercom).filter(key => typeof Intercom[key] === 'function'));

    // Check if we have the needed initialization methods
    if (Platform.OS === 'android') {
      console.log('[IntercomService] Intercom configured for Android via Expo plugin');
    } else if (Platform.OS === 'ios') {
      console.log('[IntercomService] Intercom configured for iOS via Expo plugin');
    }

    // Try direct initialization methods if available (these are already done by the plugin)
    if (typeof Intercom.initialize === 'function') {
      console.log('[IntercomService] Attempting manual initialization (may not be needed with plugin)');
      try {
        await Intercom.initialize(INTERCOM_APP_ID, Platform.OS === 'android' ? INTERCOM_ANDROID_API_KEY : INTERCOM_IOS_API_KEY);
        console.log('[IntercomService] Manual initialization successful');
      } catch (initError) {
        console.log('[IntercomService] Manual initialization failed (may be expected):', initError);
      }
    }

    return true;
  } catch (error) {
    console.error('[IntercomService] Failed to initialize Intercom:', error);
    return false;
  }
};

/**
 * Check if Intercom is available for use
 */
export const isIntercomReady = () => {
  return isIntercomAvailable && !isExpoGo;
};

/**
 * Configure Intercom for Expo application
 * This configuration is defined in app.json:
 * 
 * "plugins": [
 *   [
 *     "@intercom/intercom-react-native",
 *     {
 *       "appId": "s2xos2me",
 *       "androidApiKey": "android_sdk-5c2fa08e0ec79ec3f956b6db7425c82d16a5a6aa",
 *       "iosApiKey": "ios_sdk-e55985a44a03eb25ff72dd31c4ed3b5538167489"
 *     }
 *   ]
 * ]
 */ 