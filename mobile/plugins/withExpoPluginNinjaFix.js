const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withNinjaFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      // First ensure the import exists at the top of the file
      if (!config.modResults.contents.includes("import org.apache.tools.ant")) {
        config.modResults.contents =
          "import org.apache.tools.ant.taskdefs.condition.Os\n" +
          config.modResults.contents;
      }

      // Then inject the CMake configuration
      const ninjaFixSnippet = `
externalNativeBuild {
    cmake {
        def cmakeDir = "\${android.sdkDirectory}/cmake/3.22.1/bin"
        def ninjaExecutable = Os.isFamily(Os.FAMILY_WINDOWS) ? "ninja.exe" : "ninja"
        def ninjaPath = "\${cmakeDir}/\${ninjaExecutable}".replace("\\\\", "/")
        arguments "-DCMAKE_MAKE_PROGRAM=\${ninjaPath}",
                 "-DCMAKE_OBJECT_PATH_MAX=1024"
    }
}`;

      if (!config.modResults.contents.includes("DCMAKE_MAKE_PROGRAM")) {
        config.modResults.contents = config.modResults.contents.replace(
          /defaultConfig\s*{([^}]*)}/,
          `defaultConfig {
$1
${ninjaFixSnippet}
}`,
        );
      }
    }
    return config;
  });
};
