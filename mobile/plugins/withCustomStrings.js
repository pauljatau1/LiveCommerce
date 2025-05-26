const { withStringsXml } = require("@expo/config-plugins");

function withCustomStrings(config, strings) {
  return withStringsXml(config, (config) => {
    const existingStrings = config.modResults.resources.string ?? [];

    // Build a map to prevent duplicate keys
    const newStringsMap = new Map(
      existingStrings.map((entry) => [entry.$.name, entry]),
    );

    // Add or overwrite with new entries
    for (const [name, value] of Object.entries(strings)) {
      newStringsMap.set(name, {
        $: { name },
        _: value,
      });
    }

    config.modResults.resources.string = Array.from(newStringsMap.values());

    return config;
  });
}

module.exports = withCustomStrings;
