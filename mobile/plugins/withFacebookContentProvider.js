const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withFacebookContentProvider(config, { appId }) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure the manifest has an <application> element
    if (!androidManifest.manifest.application) {
      throw new Error("No <application> tag found in AndroidManifest.xml");
    }

    const application = androidManifest.manifest.application[0];

    // Add the provider if it doesn't exist
    if (!application.provider) {
      application.provider = [];
    }

    const facebookProvider = {
      $: {
        "android:name": "com.facebook.FacebookContentProvider",
        "android:authorities": `com.facebook.app.FacebookContentProvider${appId}`,
        "android:exported": "true",
      },
    };

    // Check if provider already exists
    const exists = application.provider.some(
      (p) => p.$["android:name"] === "com.facebook.FacebookContentProvider",
    );

    if (!exists) {
      application.provider.push(facebookProvider);
    }

    return config;
  });
};
