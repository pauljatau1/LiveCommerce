const { withPlugins } = require("@expo/config-plugins");
const path = require("path");
module.exports = ({ config }) => {
  // Safely access expo object with fallbacks
  const expoConfig = config.expo || {};
  const existingPlugins = expoConfig.plugins || [];

  const IS_STAGING =
    process.env.EXPO_PUBLIC_API_URL === "https://api.staging.auqli.live/";

  return {
    expo: {
      name: "auqli",
      slug: "auqli-app",
      // slug: "auqli-mobile",
      version: "1.2.4",
      orientation: "portrait",
      icon: "./assets/images/appstore.png",
      scheme: IS_STAGING ? "auqlistaging" : "auqli",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      splash: {
        image: "./assets/icons/auqli-logo.png",
        resizeMode: "contain",
        backgroundColor: "#111111",
      },
      jsEngine: "hermes",
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.auqli.auqliapp",
        googleServicesFile:
          process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          NSPhotoLibraryUsageDescription:
            "Allow access to your photos to upload images for your profile, reviews, and messages.",
        },
        entitlements: {
          "aps-environment": "production",
        },
        associatedDomains: [
          "applinks:app.auqli.live",
          "applinks:app.staging.auqli.live",
        ],
      },
      android: {
        // edgeToEdgeEnabled: false,
        // softwareKeyboardLayoutMode: "pan",
        package: "com.auqli.auqliapp",
        runtimeVersion: "1.0.0",
        versionCode: 2,
        adaptiveIcon: {
          foregroundImage: "./assets/images/appstore.png",
          backgroundColor: "#ffffff",
        },
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "https",
                host: "app.auqli.live",
                pathPrefix: "/",
              },
              IS_STAGING && {
                scheme: "https",
                host: "app.staging.auqli.live",
                pathPrefix: "/",
              },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
        googleServicesFile:
          process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
        permissions: ["INTERNET", "RECORD_AUDIO"],
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png",
      },
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            image: "./assets/icons/auqli-logo.png",
            imageWidth: 200,
            resizeMode: "contain",
            backgroundColor: "#111111",
          },
        ],
        [
          "expo-tracking-transparency",
          {
            userTrackingPermission:
              "Your data will be used to deliver personalized ads to you.",
          },
        ],
        "expo-dev-client",
        "@react-native-google-signin/google-signin",
        "expo-video",
        // "./plugins/withWindowSoftInputMode",
        "./plugins/withExpoPluginNinjaFix",
        [
          "customerio-expo-plugin",
          {
            android: {
              googleServicesFile:
                process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
            },
            // ios: {
            //   pushNotification: {
            //     useRichPush: false,
            //     env: {
            //       cdpApiKey: process.env.EXPO_PUBLIC_CDP_API_KEY,
            //       region: "us",
            //     },
            //   },
            // },
          },
        ],
        // [
        //   "./plugins/withCustomStrings",
        //   {
        //     facebook_app_id: process.env.FACEBOOK_APP_ID,
        //     facebook_client_token: process.env.FACEBOOK_CLIENT_SECRET,
        //   },
        // ],
        // [
        //   "./plugins/withAndroidManifestMetaData",
        //   {
        //     "com.facebook.sdk.ApplicationId": "@string/facebook_app_id",
        //     "com.facebook.sdk.ClientToken": "@string/facebook_client_token",
        //   },
        // ],
        // [
        //   "./plugins/withFacebookContentProvider",
        //   {
        //     appId: process.env.FACEBOOK_APP_ID,
        //   },
        // ],
        // [
        //   "./plugins/withFacebookSDK",
        //   {
        //     appId: process.env.FACEBOOK_APP_ID,
        //   },
        // ],
        // "./plugins/withFirebaseModularHeaders",
        // "./plugins/withFacebookSDKDependencies",
        "@react-native-firebase/app",
        [
          "react-native-fbsdk-next",
          {
            appID: `${process.env.FACEBOOK_APP_ID}`,
            clientToken: `${process.env.FACEBOOK_CLIENT_SECRET}`,
            displayName: "Auqli Nigeria",
            scheme: "fb" + process.env.FACEBOOK_APP_ID,
            advertiserIDCollectionEnabled: true,
            autoLogAppEventsEnabled: true,
            isAutoInitEnabled: true,
            iosUserTrackingPermission:
              "This identifier will be used to deliver personalized ads to you.",
          },
        ],
        [
          "expo-build-properties",
          {
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              buildToolsVersion: "35.0.0",
            },
            ios: {
              deploymentTarget: "15.1",
              useFrameworks: "static",
            },
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
      },
      extra: {
        eas: {
          // projectId: "b4e72cb0-2e30-4412-8b16-5bea3fd4a5eb",
          projectId: "847d35fd-12b4-42e3-a854-3065fe2e14cb",
        },
        router: {
          origin: false,
        },
      },
      owner: "auqli_limited",
      // owner: "todimu",
      runtimeVersion: {
        policy: "appVersion",
      },
      updates: {
        url: "https://u.expo.dev/847d35fd-12b4-42e3-a854-3065fe2e14cb",
      },
    },
  };
};
