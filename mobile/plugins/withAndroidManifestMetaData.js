const { withAndroidManifest } = require("@expo/config-plugins");

function addMetaData(androidManifest, metaData) {
  const { manifest } = androidManifest;

  if (!manifest["application"]) {
    console.warn("No <application> tag found in AndroidManifest.xml");
    return androidManifest;
  }

  const application = manifest["application"][0];
  if (!application["meta-data"]) {
    application["meta-data"] = [];
  }

  Object.entries(metaData).forEach(([name, value]) => {
    application["meta-data"].push({
      $: {
        "android:name": name,
        "android:value": value,
      },
    });
  });

  return androidManifest;
}

module.exports = function withAndroidManifestMetaData(config, metaData) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addMetaData(config.modResults, metaData);
    return config;
  });
};
