// ./plugins/withFacebookSDK.js
const { withInfoPlist, withAppDelegate } = require("@expo/config-plugins");

const withFacebookSDK = (config, { appID, displayName, clientToken }) => {
  // Modify AppDelegate.m
  config = withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    // Add imports if not already present
    if (!appDelegate.includes("#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>")) {
      config.modResults.contents = appDelegate.replace(
        /#import "AppDelegate.h"/g,
        `#import "AppDelegate.h"
#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>`,
      );
    }

    // Add didFinishLaunchingWithOptions setup
    if (!appDelegate.includes("[FBSDKApplicationDelegate sharedInstance]")) {
      config.modResults.contents = appDelegate.replace(
        /didFinishLaunchingWithOptions:(NSDictionary \*)launchOptions\n\s*{/g,
        `didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [[FBSDKApplicationDelegate sharedInstance] application:application
                           didFinishLaunchingWithOptions:launchOptions];`,
      );
    }

    // Add openURL handler
    if (!appDelegate.includes("openURL options")) {
      config.modResults.contents += `

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[FBSDKApplicationDelegate sharedInstance] application:app
                                                      openURL:url
                                                      options:options];
}`;
    }

    return config;
  });

  return config;
};

module.exports = withFacebookSDK;
