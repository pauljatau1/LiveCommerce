import { useEffect, useState, useRef } from "react";
import * as Clarity from "@microsoft/react-native-clarity";
import { LogLevel } from "@microsoft/react-native-clarity";
import { useNavigation } from "@react-navigation/native";

// Get the project ID from environment variables
const CLARITY_PROJECT_ID = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID || "";

// Add debug function
const debugClaritySetup = () => {
  if (__DEV__) {
    console.log("=====================================");
    console.log("CLARITY SETUP DEBUGGING");
    console.log("Project ID:", CLARITY_PROJECT_ID || "NOT FOUND");
    console.log("Project ID length:", CLARITY_PROJECT_ID?.length || 0);
    console.log(
      "Is Empty:",
      !CLARITY_PROJECT_ID || CLARITY_PROJECT_ID.trim() === "",
    );
    console.log("Environment:", process.env.NODE_ENV);
    console.log("=====================================");
  }
};

// Call the debug function immediately
debugClaritySetup();

// Define user attributes interface
export interface UserAttributes {
  fullName?: string;
  userId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  accountAge?: string;
  createdDate?: string;
  isVerified?: string;
  [key: string]: any; // Allow for additional custom attributes
}

export function useClarity() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isUserIdentified, setIsUserIdentified] = useState(false);
  
  // Use refs to track initialization and pending user data
  const isReadyRef = useRef(false);
  const pendingUserDataRef = useRef<UserAttributes | null>(null);

  useEffect(() => {
    const initializeClarity = async () => {
      try {
        if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID.trim() === "") {
          console.error("Clarity project ID is empty or invalid");
          return;
        }

        // Log for debugging
        if (__DEV__) {
          console.log(
            "Initializing Clarity with project ID:",
            CLARITY_PROJECT_ID,
          );
        }

        // Standard initialization
        Clarity.initialize(CLARITY_PROJECT_ID, {
          logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.Error,
        });

        // Mark as ready immediately - the SDK can handle calls right after initialize
        isReadyRef.current = true;
        setIsInitialized(true);
        console.log("🎯 Clarity marked as ready immediately after initialize");

        // Set callback for when session starts (for logging and session info)
        Clarity.setOnSessionStartedCallback((sessionId) => {
          console.log("Clarity session started:", sessionId);
          setCurrentSessionId(sessionId as string);

          // Process any pending user identification
          if (pendingUserDataRef.current) {
            console.log("🔄 Processing pending user identification from session callback");
            const userData = pendingUserDataRef.current;
            pendingUserDataRef.current = null; // Clear pending data
            
            // Call the actual identification logic
            performUserIdentification(userData);
          }

          // Force an event immediately after session starts to confirm data is flowing
          setTimeout(() => {
            try {
              Clarity.sendCustomEvent("SessionStartConfirmation");
              console.log("Session start confirmation event sent");

              // Set essential session metadata
              Clarity.setCustomTag("sessionStart", new Date().toISOString());
              Clarity.setCustomTag("devicePlatform", "React Native Mobile");
              Clarity.setCustomTag("isDebug", __DEV__ ? "true" : "false");

              // Try to manually trigger uploads in development
              if (__DEV__) {
                // Send multiple events to increase chances of upload
                for (let i = 0; i < 3; i++) {
                  setTimeout(() => {
                    Clarity.sendCustomEvent("SessionConfirmation_" + i);
                  }, i * 1000);
                }
                console.log("Multiple confirmation events scheduled");
              }
            } catch (e) {
              console.error("Error sending confirmation event:", e);
            }
          }, 2000);
        });

      } catch (error) {
        console.error("Failed to initialize Clarity:", error);
      }
    };

    initializeClarity();

    return () => {
      // No explicit cleanup needed as Clarity persists throughout app lifecycle
    };
  }, []);

  // Separate function to perform actual user identification
  const performUserIdentification = (userAttributes: UserAttributes) => {
    try {
      console.log("🎯 Performing user identification in Clarity");

      // Set the primary userId using the official method
      if (userAttributes.userId) {
        const fullName = `${userAttributes.firstName || ''} ${userAttributes.lastName || ''}`.trim();
        Clarity.setCustomUserId(fullName);
        console.log("✅ Custom user ID set:", fullName);
      }

      // Create a more visible custom session ID with user info
      const sessionIdentifier = `${userAttributes.firstName || 'User'}_${userAttributes.lastName || 'Unknown'}_${userAttributes.userId?.slice(-8) || 'NoID'}`;
      try {
        Clarity.setCustomSessionId(sessionIdentifier);
        console.log("✅ Custom session ID set for better visibility:", sessionIdentifier);
      } catch (sessionError) {
        console.warn("⚠️ Could not set custom session ID:", sessionError);
      }

      // Set essential user info as prominent session metadata (without user_ prefix for better visibility)
      const keyUserData = {
        'userName': `${userAttributes.firstName || ''} ${userAttributes.lastName || ''}`.trim(),
        'userEmail': userAttributes.email || '',
        'userHandle': userAttributes.username || '',
        'accountAge': userAttributes.accountAge || '0',
        'userType': 'registered_user',
        'platform': 'mobile_app'
      };

      // Set key data as session tags (more visible)
      Object.entries(keyUserData).forEach(([key, value]) => {
        if (value) {
          Clarity.setCustomTag(key, String(value));
          console.log(`✅ Session tag set: ${key} = ${value}`);
        }
      });

      // Set each attribute as a custom tag with user_ prefix (for detailed tracking)
      Object.entries(userAttributes).forEach(([key, value]) => {
        if (value && key !== 'userId') { // Skip userId as it's already set above
          Clarity.setCustomTag(`user_${key}`, String(value));
          console.log(`✅ Detailed tag set: user_${key} = ${value}`);
        }
      });

      // Add a consolidated user info tag for easier identification in dashboard
      const userInfoTag = 
        `${userAttributes.firstName || ""} ${userAttributes.lastName || ""} (${userAttributes.email || ""})`.trim();
      if (userInfoTag && userInfoTag !== " ()") {
        Clarity.setCustomTag("user_display_name", userInfoTag);
        Clarity.setCustomTag("displayName", userInfoTag); // Also set without prefix for visibility
        console.log("✅ User display name set:", userInfoTag);
      }

      // Set additional prominent session metadata
      Clarity.setCustomTag("sessionType", "authenticated_user");
      Clarity.setCustomTag("appVersion", "mobile_v3");
      Clarity.setCustomTag("userStatus", "active");
      
      // Add current timestamp for session tracking
      Clarity.setCustomTag("userIdentifiedAt", new Date().toISOString());

      // Send a custom event to confirm user identification
      Clarity.sendCustomEvent("UserIdentified");

      // Send a more detailed user identification event
      try {
        const userSummary = {
          name: `${userAttributes.firstName || ''} ${userAttributes.lastName || ''}`.trim(),
          email: userAttributes.email || '',
          username: userAttributes.username || '',
          accountAge: userAttributes.accountAge || '0'
        };
        Clarity.sendCustomEvent(`UserProfile: ${JSON.stringify(userSummary)}`);
        console.log("✅ Detailed user profile event sent");
      } catch (eventError) {
        console.warn("⚠️ Could not send detailed user event:", eventError);
      }

      setIsUserIdentified(true);
      console.log("🎉 User successfully identified in Clarity with enhanced visibility:", userAttributes);

    } catch (error) {
      console.error("❌ Failed to identify user in Clarity:", error);
    }
  };

  // Utility functions to expose
  const sendCustomEvent = (eventName: string, data?: Record<string, any>) => {
    if (!isReadyRef.current) {
      console.warn("Clarity not ready yet. Event not sent:", eventName);
      return;
    }

    try {
      // Fix by only passing a single argument if no data is provided
      if (data) {
        const eventData = JSON.stringify(data);
        Clarity.sendCustomEvent(`${eventName}: ${eventData}`);
      } else {
        Clarity.sendCustomEvent(eventName);
      }
    } catch (error) {
      console.error("Error sending Clarity event:", error);
    }
  };

  const setScreenName = (screenName: string) => {
    if (!isReadyRef.current) {
      console.warn(
        "Clarity not ready yet. Screen name not set:",
        screenName,
      );
      return;
    }

    try {
      Clarity.setCurrentScreenName(screenName);
    } catch (error) {
      console.error("Error setting Clarity screen name:", error);
    }
  };

  const setCustomTag = (key: string, value: string) => {
    if (!isReadyRef.current) {
      console.warn("Clarity not ready yet. Custom tag not set:", key);
      return;
    }

    try {
      Clarity.setCustomTag(key, value);
    } catch (error) {
      console.error("Error setting Clarity custom tag:", error);
    }
  };

  const setCustomUserId = (userId: string) => {
    if (!isReadyRef.current) {
      console.warn(
        "Clarity not ready yet. Custom user ID not set:",
        userId,
      );
      return;
    }

    try {
      Clarity.setCustomUserId(userId);
      setIsUserIdentified(true);
    } catch (error) {
      console.error("Error setting Clarity user ID:", error);
    }
  };

  // Add a network status monitor and session event
  const checkClarityNetworkStatus = () => {
    if (!isReadyRef.current) {
      return;
    }

    // Use a custom event to attempt to trigger an upload
    sendCustomEvent("NetworkStatusCheck", {
      timestamp: new Date().toISOString(),
      isOnline: true,
      check: "manual",
    });

    // Additional debugging info
    if (__DEV__) {
      console.log("Clarity network check triggered");
      // Check if session is active
      if (currentSessionId) {
        console.log("Clarity active session:", currentSessionId);
      } else {
        console.log("Clarity ready but no session ID yet");
      }
    }
  };

  // Schedule periodic checks during development
  useEffect(() => {
    if (__DEV__ && isReadyRef.current) {
      const interval = setInterval(() => {
        checkClarityNetworkStatus();
      }, 30000); // Check every 30 seconds in dev mode

      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  // FIXED: Use ref-based readiness check and queue user data if not ready
  const identifyUser = (userAttributes: UserAttributes) => {
    console.log("🎯 identifyUser called, checking readiness...");
    
    if (!isReadyRef.current) {
      console.log("📝 Clarity not ready yet, queuing user data for later processing");
      pendingUserDataRef.current = userAttributes;
      
      // Also try a delayed retry in case the session callback doesn't work
      setTimeout(() => {
        if (pendingUserDataRef.current && isReadyRef.current) {
          console.log("🔄 Retry: Processing queued user identification");
          const userData = pendingUserDataRef.current;
          pendingUserDataRef.current = null;
          performUserIdentification(userData);
        }
      }, 2000);
      return;
    }

    // If we're ready, process immediately
    performUserIdentification(userAttributes);
  };

  // Clear user identification when user logs out
  const clearUserIdentity = () => {
    if (!isReadyRef.current) {
      return;
    }

    try {
      // Start a new session to clear the previous user identification
      Clarity.startNewSession((newSessionId) => {
        console.log("Clarity session reset after logout:", newSessionId);
        setCurrentSessionId(newSessionId as string);
        setIsUserIdentified(false);
        
        // Send logout event
        Clarity.sendCustomEvent("UserLoggedOut");
      });
    } catch (error) {
      console.error("Failed to clear user identity in Clarity:", error);
    }
  };

  const pauseTracking = () => {
    if (isReadyRef.current) {
      try {
        Clarity.pause();
      } catch (error) {
        console.error("Error pausing Clarity:", error);
      }
    }
  };

  const resumeTracking = () => {
    if (isReadyRef.current) {
      try {
        Clarity.resume();
      } catch (error) {
        console.error("Error resuming Clarity:", error);
      }
    }
  };

  // Add session information for customer support
  const addSessionInfo = (sessionInfo: {
    sessionId?: string;
    deviceInfo?: string;
    location?: string;
    entryPoint?: string;
    exitPoint?: string;
    screenCount?: number;
    tapCount?: number;
    customSessionId?: string;
    timestamp?: string;
  }) => {
    if (!isReadyRef.current) {
      console.warn("Clarity not ready yet. Session info not added.");
      return;
    }

    try {
      // Add all session info as custom tags with session_ prefix
      Object.entries(sessionInfo).forEach(([key, value]) => {
        if (value) {
          setCustomTag(`session_${key}`, String(value));
        }
      });

      // Create a timestamp if not provided
      if (!sessionInfo.timestamp) {
        const now = new Date();
        setCustomTag("session_timestamp", now.toISOString());
      }

      // Send an event for this session info addition
      sendCustomEvent("SessionInfoCaptured", sessionInfo);
      console.log(
        "Session info added to Clarity for customer support",
        sessionInfo,
      );
    } catch (error) {
      console.error("Failed to add session info to Clarity:", error);
    }
  };

  return {
    isInitialized,
    isUserIdentified,
    currentSessionId,
    sendCustomEvent,
    setScreenName,
    setCustomTag,
    setCustomUserId,
    identifyUser,
    clearUserIdentity,
    pauseTracking,
    resumeTracking,
    addSessionInfo,
    checkClarityNetworkStatus,
  };
}

export default useClarity;
