// ./plugins/withFacebookSDKDependencies.js
const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withFacebookSDKDependencies(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      // Add the Facebook SDK dependencies if they don't exist
      if (
        !config.modResults.contents.includes(
          "com.facebook.android:facebook-android-sdk",
        )
      ) {
        config.modResults.contents = config.modResults.contents.replace(
          /dependencies\s*{/,
          `dependencies {
    implementation 'com.facebook.android:facebook-android-sdk:[4,5)'
    implementation 'com.facebook.android:facebook-core:[4,5)'
    implementation 'com.facebook.android:facebook-marketing:[4,5)'`,
        );
      }
    } else {
      throw new Error(
        "Cannot add Facebook SDK dependencies to non-groovy build.gradle",
      );
    }

    return config;
  });
};
