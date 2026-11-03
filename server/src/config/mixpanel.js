const Mixpanel = require('mixpanel');

// Initialize Mixpanel client only if token is available
let mixpanelClient;
if (process.env.MIXPANEL_PROJECT_TOKEN) {
  mixpanelClient = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN, {
    verbose: true
  });
} else {
  // Create a mock client for testing/development
  mixpanelClient = {
    track: () => {} // No-op function
  };
}

module.exports = mixpanelClient; 