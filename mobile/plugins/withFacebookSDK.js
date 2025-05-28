const { withAppDelegate } = require("@expo/config-plugins");

const withFacebookSDK = (config, { appId }) => {
  return withAppDelegate(config, (config) => {
    const { contents } = config.modResults;
    let modifiedContents = contents;

    // 1. Add all required imports
    const requiredImports = [
      "#import <SafariServices/SafariServices.h>",
      "#import <AuthenticationServices/AuthenticationServices.h>",
      "#import <FBSDKCoreKit/FBSDKCoreKit.h>",
      "#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>",
    ];

    if (
      !modifiedContents.includes("#import <SafariServices/SafariServices.h>")
    ) {
      modifiedContents = modifiedContents.replace(
        /#import "AppDelegate.h"/,
        `#import "AppDelegate.h"
${requiredImports.join("\n")}`,
      );
    }

    // 2. Add FB initialization if missing
    if (
      !modifiedContents.includes("[FBSDKApplicationDelegate sharedInstance]")
    ) {
      modifiedContents = modifiedContents.replace(
        /(didFinishLaunchingWithOptions\s*:\s*\(NSDictionary\s*\*\s*\)launchOptions\s*\{)/,
        `$1\n  [FBSDKApplicationDelegate.sharedInstance application:application didFinishLaunchingWithOptions:launchOptions];`,
      );
    }

    // 3. Modify existing openURL handler to include Facebook
    const existingOpenURLRegex =
      /-\s*\(BOOL\)\s*application\s*:\s*\(UIApplication\s*\*\s*\)\s*application\s+openURL\s*:\s*\(NSURL\s*\*\s*\)\s*url\s+options\s*:\s*\(NSDictionary\s*<\s*UIApplicationOpenURLOptionsKey\s*,\s*id\s*>\s*\*\s*\)\s*options\s*\{([^}]*)\}/;

    if (existingOpenURLRegex.test(modifiedContents)) {
      modifiedContents = modifiedContents.replace(
        existingOpenURLRegex,
        `- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options]) {
    return YES;
  }
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}`,
      );
    } else {
      // Fallback: Add new method if none exists
      const implementationBlockRegex =
        /@implementation AppDelegate([\s\S]*?)@end/;
      modifiedContents = modifiedContents.replace(
        implementationBlockRegex,
        (match) => `${match}
#pragma mark - Facebook SDK URL Handling
- (BOOL)application:(UIApplication *)app 
            openURL:(NSURL *)url 
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[FBSDKApplicationDelegate sharedInstance] application:app 
                                                     openURL:url 
                                                     options:options];
}
`,
      );
    }

    config.modResults.contents = modifiedContents;
    return config;
  });
};

module.exports = withFacebookSDK;
