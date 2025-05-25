// import { Platform } from 'react-native';

// /**
//  * Utility to check if Facebook SDK is properly set up without attempting to initialize it
//  * This is useful for diagnosing setup issues without causing crashes
//  */
// export const checkFacebookSDKSetup = (): boolean => {
//   try {
//     console.log('Checking Facebook SDK setup...');

//     // Check if we're on a supported platform
//     console.log('Platform:', Platform.OS);

//     // Try to dynamically import the Facebook SDK
//     const fbSDK = require('react-native-fbsdk-next');

//     // Check if main components exist
//     const hasSettings = !!fbSDK.Settings;
//     const hasLoginManager = !!fbSDK.LoginManager;
//     const hasAccessToken = !!fbSDK.AccessToken;

//     console.log('Facebook SDK components found:', {
//       Settings: hasSettings,
//       LoginManager: hasLoginManager,
//       AccessToken: hasAccessToken
//     });

//     // Check if Android manifest and strings.xml are properly configured
//     // This is just a basic check based on the app ID
//     if (Platform.OS === 'android') {
//       // Check if the app ID is properly defined in the Android resources
//       try {
//         const { NativeModules } = require('react-native');
//         const fbModule = NativeModules.FBSDKSettings || NativeModules.FBSettings;

//         if (fbModule) {
//           console.log('Facebook native module is available');
//         } else {
//           console.warn('Facebook native module not found - check AndroidManifest.xml setup');
//         }
//       } catch (err) {
//         console.error('Error checking native modules:', err);
//       }
//     }

//     // More comprehensive checks could be added here

//     console.log('Facebook SDK setup check complete');
//     return hasSettings && hasLoginManager && hasAccessToken;
//   } catch (error) {
//     console.error('Error checking Facebook SDK setup:', error);
//     return false;
//   }
// };
