const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const {
        modRequest: { platformProjectRoot },
      } = config;
      const podfilePath = path.join(platformProjectRoot, "Podfile");

      let podfileContents = await fs.promises.readFile(podfilePath, "utf-8");

      // Add modular headers for Firebase pods
      if (!podfileContents.includes("use_modular_headers!")) {
        podfileContents = podfileContents.replace(
          /platform :ios, .*\n/,
          `$&\nuse_modular_headers!\n`,
        );
      }

      // Ensure specific Firebase pods have modular headers
      const firebasePods = [
        "FirebaseCore",
        "FirebaseCoreInternal",
        "GoogleUtilities",
      ];

      firebasePods.forEach((pod) => {
        const regex = new RegExp(`pod '${pod}'`);
        if (
          podfileContents.includes(`pod '${pod}'`) &&
          !podfileContents.includes(`pod '${pod}', :modular_headers => true`)
        ) {
          podfileContents = podfileContents.replace(
            regex,
            `pod '${pod}', :modular_headers => true`,
          );
        }
      });

      await fs.promises.writeFile(podfilePath, podfileContents);
      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
