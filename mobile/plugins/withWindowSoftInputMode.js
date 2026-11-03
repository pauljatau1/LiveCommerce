const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");

module.exports = function withWindowSoftInputMode(config) {
  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      config.modResults,
    );
    mainActivity.$["android:windowSoftInputMode"] = "adjustResize";
    return config;
  });
};
