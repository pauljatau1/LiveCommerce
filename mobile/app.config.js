const { withPlugins } = require("@expo/config-plugins");
const path = require("path");
module.exports = ({ config }) => {
  // Safely access expo object with fallbacks
  const expoConfig = config.expo || {};
  const existingPlugins = expoConfig.plugins || [];

  return {
    expo: {
      name: "auqli",
      slug: "auqli-app",
      version: "1.1.7",
      orientation: "portrait",
      icon: "./assets/images/appstore.png",
      scheme: "myapp",
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
        googleServicesFile: "./GoogleService-Info.plist",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          NSPhotoLibraryUsageDescription:
            "Allow access to your photos to upload images for your profile, reviews, and messages.",
        },
        entitlements: {
          "aps-environment": "production",
        },
        associatedDomains: ["applinks:app.auqli.live"],
      },
      android: {
        softwareKeyboardLayoutMode: "pan",
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
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
        googleServicesFile: "./google-services.json",
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
        "./plugins/withWindowSoftInputMode",
        [
          "customerio-expo-plugin",
          {
            android: {
              googleServicesFile: "./google-services.json",
            },
            ios: {
              pushNotification: {
                useRichPush: false,
                env: {
                  cdpApiKey: "dc26bc9d13796901d562",
                  region: "us",
                },
              },
            },
          },
        ],
        [
          "./plugins/withCustomStrings",
          {
            facebook_app_id: process.env.FACEBOOK_APP_ID,
            facebook_client_token: process.env.FACEBOOK_CLIENT_SECRET,
          },
        ],
        [
          "./plugins/withAndroidManifestMetaData",
          {
            "com.facebook.sdk.ApplicationId": "@string/facebook_app_id",
            "com.facebook.sdk.ClientToken": "@string/facebook_client_token",
          },
        ],
        [
          "./plugins/withFacebookContentProvider",
          {
            appId: process.env.FACEBOOK_APP_ID,
          },
        ],
        [
          "./plugins/withFacebookSDK",
          {
            appId: process.env.FACEBOOK_APP_ID,
          },
        ],
        // "./plugins/withFirebaseModularHeaders",
        "./plugins/withFacebookSDKDependencies",
        "@react-native-firebase/app",
        [
          "expo-build-properties",
          {
            ios: {
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
