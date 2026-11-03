import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { getUser } from "@/store/features/auth/utils";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
//import useClarity from "@/hooks/useClarity";
import Constants from "expo-constants";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

// Get Intercom config from environment variables
const INTERCOM_APP_ID = process.env.EXPO_PUBLIC_INTERCOM_APP_ID || "";

const SupportChat = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(1);
  const webViewRef = useRef<WebView>(null);
  //const clarityHook = useClarity();

  // Track if Intercom has been opened
  const [intercomOpened, setIntercomOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track support chat in analytics
  {
    /*const trackSupportChat = (action: string, details?: Record<string, any>) => {
    try {
      // Track in Clarity
      if (clarityHook.isInitialized) {
        clarityHook.sendCustomEvent(`SupportChat_${action}`, {
          timestamp: new Date().toISOString(),
          userId: user?.id || user?._id || 'anonymous',
          ...details
        });
        
        // Add Clarity tag
        clarityHook.setCustomTag('last_support_chat', new Date().toISOString());
      }
      console.log(`Support chat ${action} tracked in analytics`);
    } catch (error) {
      console.error('Failed to track support chat in analytics:', error);
    }
  };*/
  }

  useEffect(() => {
    // Validate Intercom app ID
    if (!INTERCOM_APP_ID) {
      console.error(
        "Intercom App ID is missing. Check your environment variables.",
      );
      setError("Intercom configuration is missing. Please contact support.");
      setLoading(false);
      return;
    }

    console.log(
      `Intercom chat being initialized with app ID: ${INTERCOM_APP_ID.substring(0, 3)}...${INTERCOM_APP_ID.substring(INTERCOM_APP_ID.length - 3)}`,
    );

    // Get user data if available
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          console.log("User data loaded for Intercom", {
            userId: userData.id || userData._id,
            hasEmail: !!userData.email,
          });
          console.log(
            "User data loaded for Intercom",
            JSON.stringify(userData),
          );
          setUser(userData);
        } else {
          console.log("No user data available, will use anonymous mode");
        }
      } catch (error) {
        console.error("Failed to get user data:", error);
        // Continue with anonymous mode
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Inject JavaScript to control Intercom with reliable execution
  const openIntercomJS = `
    (function() {
      if (window.Intercom) {
        // First make sure we're booted
        window.Intercom('update');
        
        // Then show the messenger
        window.Intercom('show');
        
        // After a moment, show the new message UI
        setTimeout(function() {
          window.Intercom('showNewMessage', 'I need help with...');
        }, 500);
        
        true;
      } else {
        console.error('Intercom not found when trying to open');
        false;
      }
    })();
  `;

  // Function to manually force open Intercom
  const openIntercom = () => {
    if (webViewRef.current) {
      console.log("Manually triggering Intercom open");
      webViewRef.current.injectJavaScript(openIntercomJS);
      setIntercomOpened(true);
      //trackSupportChat('opened', { method: 'manual' });
    }
  };

  // Execute in WebView when component mounts
  const autoOpenScript = `
    (function() {
      if (!window.intercomOpened) {
        window.intercomOpened = true;
        
        var intervalId = setInterval(function() {
          if (window.Intercom) {
            clearInterval(intervalId);
            window.Intercom('show');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'autoOpenAttempted'
            }));
          }
        }, 200);
      }
      true;
    })();
  `;

  // Handle when WebView is loaded
  const handleWebViewLoad = () => {
    console.log("Intercom WebView loaded successfully");
    //trackSupportChat('webview_loaded');

    // Auto-open attempt when WebView is fully loaded
    if (webViewRef.current) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(autoOpenScript);
      }, 1000);
    }
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", data);

      // Handle log messages
      if (data.type === "log") {
        console.log("WebView Log:", data.message);
        return;
      }

      // Handle error messages
      if (data.type === "error") {
        console.error("WebView Error:", data.message);

        // Special handling for cookie errors
        if (data.message && data.message.includes("cookie")) {
          console.warn("Cookie error detected, will use alternative approach");
          // We'll rely on the cookie workaround in the HTML
          //trackSupportChat('cookie_error', { message: data.message });
          return;
        }

        setError(data.message || "Unknown error in Intercom");
        //trackSupportChat('error', { errorMessage: data.message });
        return;
      }

      switch (data.type) {
        case "intercomReady":
          setIntercomOpened(true);
          //trackSupportChat('ready');
          break;

        case "intercomHidden":
          // When Intercom is hidden/closed, go back to previous screen
          console.log("Intercom messenger closed, navigating back");
          //trackSupportChat('closed');
          // Short delay to ensure smooth transition
          router.back();
          break;

        case "autoOpenAttempted":
          console.log("Auto-open was attempted");
          setIntercomOpened(true);
          //trackSupportChat('auto_opened');
          break;

        case "intercomEvent":
          // Track Intercom-specific events
          console.log("Intercom event:", data.eventName);
          //trackSupportChat(`intercom_${data.eventName}`, data.details || {});
          break;

        default:
          console.log("Unknown message type from WebView:", data.type);
      }
    } catch (error) {
      console.log("Error parsing WebView message:", error);
    }
  };

  // JavaScript to listen for Intercom events and send them to React Native
  const intercomListenerJS = `
    window.addEventListener('load', function() {
      // Set up a listener for Intercom initialization
      var checkIntercom = setInterval(function() {
        if (window.Intercom) {
          clearInterval(checkIntercom);
          logDebug('Intercom found, opening messenger...');
          
          // Tell React Native that Intercom is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'intercomReady'
          }));
          
          // First open the messenger immediately
          window.Intercom('show');
          
          // Then after a short delay, show the new message screen for better UX
          setTimeout(function() {
            window.Intercom('showNewMessage', 'Hello! How can we help you today?');
          }, 1000);
          
          // Set up listeners for Intercom events
          window.Intercom('onShow', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'intercomEvent',
              eventName: 'onShow',
              details: { timestamp: new Date().toISOString() }
            }));
          });
          
          window.Intercom('onHide', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'intercomEvent',
              eventName: 'onHide',
              details: { timestamp: new Date().toISOString() }
            }));
          });
          
          window.Intercom('onUnreadCountChange', function(unreadCount) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'intercomEvent',
              eventName: 'unreadCountChange',
              details: { 
                unreadCount: unreadCount,
                timestamp: new Date().toISOString() 
              }
            }));
          });
        }
      }, 300);
    });
  `;

  // Generate HTML content for Intercom with debugging
  const generateIntercomHtml = () => {
    console.log("Generating Intercom HTML with App ID:", INTERCOM_APP_ID);

    // Create a simpler HTML template focused on reliable Intercom loading
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta http-equiv="Content-Security-Policy" content="default-src * 'self' data: gap: https://widget.intercom.io https://api-iam.intercom.io; style-src * 'self' 'unsafe-inline'; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * 'self' https://widget.intercom.io https://api-iam.intercom.io;">
        <title>Support Chat</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #121212;
            height: 100vh;
            width: 100%;
            overflow: hidden;
          }
          #loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #121212;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          .loading-text {
            margin-top: 20px;
            font-size: 16px;
            color: #FFFFFF;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #16783A;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="loader">
          <div class="spinner"></div>
          <p class="loading-text">Loading chat support...</p>
        </div>

        <script>
          // Simple logging
          function log(msg) {
            console.log(msg);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: msg
              }));
            }
          }
          
          // Report errors
          function reportError(msg) {
            console.error(msg);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: msg
              }));
            }
          }
          
          // Cookie workaround
          try {
            // Override the cookie property to avoid access denied errors
            if (!document.__defineGetter__) {
              Object.defineProperty(document, 'cookie', {
                get: function() { return ''; },
                set: function() { return true; },
                configurable: true
              });
            } else {
              document.__defineGetter__('cookie', function() { return ''; });
              document.__defineSetter__('cookie', function() { return true; });
            }
            log("Cookie workaround applied");
          } catch(e) {
            reportError("Cookie workaround failed: " + e.message);
          }
          
          // Create Intercom settings
          var intercomSettings = {
            api_base: "https://api-iam.intercom.io",
            app_id: "${INTERCOM_APP_ID}",
            hide_default_launcher: true,
    `;

    // Add user attributes if the user is logged in
    if (user) {
      html += `
            user_id: "${user.id || user._id}",
            name: "${user.firstName || ""} ${user.lastName || ""}".trim(),
            email: "${user.email || ""}",
            phone: "${user.phoneNumber || ""}",
            created_at: ${user.createdAt ? Math.floor(new Date(user.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000)},
      `;

      // Add any other user attributes that might be helpful
      if (user.profilePicture) {
        html += `
            avatar: {
              type: 'avatar',
              image_url: "${user.profileImage?.url}"
            },
        `;
      }
    }

    // Close the settings object
    html += `
            // Custom attributes
            app_name: "Auqli Mobile App",
            platform: "${Platform.OS}",
            version: "${Platform.Version}",
            phone: "${user.phoneNumber || ""}",
            
            // Customer support attributes
            last_active: "${new Date().toISOString()}",
            device_model: "${Platform.OS === "ios" ? "iOS" : "Android"} Device",
            app_version: "${Constants?.expoConfig?.version || "1.0.0"}",
            
            // User status attributes
            ${user?.isVerified ? "is_verified: true," : ""}
            ${user?.lastLogin ? `last_login: "${user.lastLogin}",` : ""}
            ${user?.accountType ? `account_type: "${user.accountType}",` : ""}
            ${user?.createdAt ? `days_since_signup: ${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))},` : ""}
            
            // Business metrics (if available)
            ${user?.totalOrders ? `total_orders: ${user.totalOrders},` : ""}
            ${user?.totalSpent ? `total_spent: ${user.totalSpent},` : ""}
            ${user?.preferredCategories?.length ? `preferred_categories: "${user.preferredCategories.join(", ")}"` : ""}
          };
          
          window.intercomSettings = intercomSettings;
          log("Intercom settings prepared");
        </script>

        <!-- Load Intercom script with error handling -->
        <script>
          try {
            // Direct script loading approach
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'https://widget.intercom.io/widget/${INTERCOM_APP_ID}';
            
            s.onload = function() {
              log("Intercom script loaded successfully");
              // Boot immediately after script loads
              setTimeout(function() {
                try {
                  if (window.Intercom) {
                    window.Intercom('boot', window.intercomSettings);
                    log("Intercom booted successfully");
                    
                    // Register for the onHide event
                    window.Intercom('onHide', function() {
                      log("Intercom messenger was hidden");
                      // Notify React Native to navigate back
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'intercomHidden',
                          timestamp: new Date().toISOString()
                        }));
                      }
                    });
                    
                    // Register for the onShow event
                    window.Intercom('onShow', function() {
                      log("Intercom messenger was shown");
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'intercomEvent',
                          eventName: 'shown',
                          details: { timestamp: new Date().toISOString() }
                        }));
                      }
                    });
                    
                    // Track when user creates a new conversation
                    window.Intercom('onUserEmailSupplied', function(data) {
                      log("User email supplied to Intercom: " + JSON.stringify(data));
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'intercomEvent',
                          eventName: 'emailSupplied',
                          details: { 
                            email: data ? data.email : 'unknown',
                            timestamp: new Date().toISOString() 
                          }
                        }));
                      }
                    });
                    
                    setTimeout(function() {
                      window.Intercom('show');
                      log("Intercom show called");
                      
                      // Hide the loader now that Intercom is displayed
                      var loader = document.getElementById('loader');
                      if (loader) loader.style.display = 'none';
                      
                      // Notify the React Native app
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'intercomReady',
                          timestamp: new Date().toISOString()
                        }));
                      }
                    }, 500);
                  } else {
                    reportError("Intercom object not available after script load");
                  }
                } catch (bootError) {
                  reportError("Error booting Intercom: " + bootError.message);
                }
              }, 100);
            };
            
            s.onerror = function() {
              reportError("Failed to load Intercom script");
            };
            
            // Add to document
            document.body.appendChild(s);
            log("Added Intercom script to body");
            
          } catch (e) {
            reportError("Error in script loading setup: " + e.message);
          }
        </script>

        <!-- Fallback for loader hiding -->
        <script>
          // Hide loader after timeout in case Intercom fails to load
          setTimeout(function() {
            var loader = document.getElementById('loader');
            if (loader && loader.style.display !== 'none') {
              loader.style.display = 'none';
              reportError("Used fallback to hide loader after timeout");
            }
          }, 10000);
        </script>
      </body>
      </html>
    `;

    return html;
  };

  // Handle WebView errors
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
    setError(
      `Error loading chat: ${nativeEvent.description || "Unknown error"}`,
    );
    //trackSupportChat('webview_error', { error: nativeEvent.description });
  };

  // Retry loading the WebView
  const retryLoading = () => {
    setError(null);
    setLoading(true);
    setWebViewKey((prev) => prev + 1);

    // Delay to give time for state updates
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Floating Back Button */}
      {/*<TouchableOpacity
        style={{
          position: 'absolute',
          top: 48,
          left: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          padding: 8,
        }}
        onPress={() => {
          trackSupportChat('manual_back');
          router.back();
        }}
      >
        <Entypo name="chevron-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>*/}

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#CCCCCC" />
          <Text style={{ color: "#CCCCCC", marginTop: 10 }}>
            Loading chat support...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{ color: "#FF6B6B", textAlign: "center", marginBottom: 20 }}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#16783A",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
            onPress={retryLoading}
          >
            <Text style={{ color: "white", fontFamily: "LexendDeca" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          key={webViewKey}
          source={{
            html: generateIntercomHtml(),
            headers: {
              Cookie: "allow_cookies=true",
            },
            baseUrl: Platform.OS === "android" ? "https://auqli.com/" : "",
          }}
          style={{ flex: 1, backgroundColor: "#121212" }}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onMessage={handleWebViewMessage}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          cacheEnabled={true}
          incognito={false}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mediaPlaybackRequiresUserAction={false}
          onHttpError={(e) => {
            console.error("WebView HTTP error:", e.nativeEvent);
            //trackSupportChat('http_error', { statusCode: e.nativeEvent.statusCode });
          }}
          renderLoading={() => (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f2f7f6",
              }}
            >
              <ActivityIndicator size="large" color="#16783A" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default SupportChat;
