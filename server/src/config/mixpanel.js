const Mixpanel = require('mixpanel');

// Initialize Mixpanel client
const mixpanelClient = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN, {
    verbose: true
});

module.exports = mixpanelClient; 