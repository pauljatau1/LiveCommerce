import { useEffect, useState } from 'react';
import * as Clarity from '@microsoft/react-native-clarity';
import { LogLevel } from '@microsoft/react-native-clarity';
import { useNavigation } from '@react-navigation/native';

// Get the project ID from environment variables
const CLARITY_PROJECT_ID = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID || '';

// Add debug function
const debugClaritySetup = () => {
  if (__DEV__) {
    console.log('=====================================');
    console.log('CLARITY SETUP DEBUGGING');
    console.log('Project ID:', CLARITY_PROJECT_ID || 'NOT FOUND');
    console.log('Project ID length:', CLARITY_PROJECT_ID?.length || 0);
    console.log('Is Empty:', !CLARITY_PROJECT_ID || CLARITY_PROJECT_ID.trim() === '');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('=====================================');
  }
};

// Call the debug function immediately
debugClaritySetup();

// Define user attributes interface
export interface UserAttributes {
  userId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any; // Allow for additional custom attributes
}

export function useClarity() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isUserIdentified, setIsUserIdentified] = useState(false);

  useEffect(() => {
    const initializeClarity = async () => {
      try {
        if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID.trim() === '') {
          console.error('Clarity project ID is empty or invalid');
          return;
        }
        
        // Log for debugging
        if (__DEV__) {
          console.log('Initializing Clarity with project ID:', CLARITY_PROJECT_ID);
        }
        
        // Standard initialization
        Clarity.initialize(CLARITY_PROJECT_ID, {
          logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.Error
        });

        // Set callback for when session starts
        Clarity.setOnSessionStartedCallback((sessionId) => {
          console.log('Clarity session started:', sessionId);
          // Fix type issue by using the correct type
          setCurrentSessionId(sessionId as string);
          
          // Force an event immediately after session starts to confirm data is flowing
          setTimeout(() => {
            try {
              Clarity.sendCustomEvent('SessionStartConfirmation');
              console.log('Session start confirmation event sent');
              
              // Set essential session metadata
              Clarity.setCustomTag('sessionStart', new Date().toISOString());
              Clarity.setCustomTag('devicePlatform', 'React Native Mobile');
              Clarity.setCustomTag('isDebug', __DEV__ ? 'true' : 'false');
              
              // Try to manually trigger uploads in development
              if (__DEV__) {
                // Send multiple events to increase chances of upload
                for (let i = 0; i < 3; i++) {
                  setTimeout(() => {
                    Clarity.sendCustomEvent('SessionConfirmation_' + i);
                  }, i * 1000);
                }
                console.log('Multiple confirmation events scheduled');
              }
            } catch (e) {
              console.error('Error sending confirmation event:', e);
            }
          }, 2000);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Clarity:', error);
      }
    };

    initializeClarity();

    return () => {
      // No explicit cleanup needed as Clarity persists throughout app lifecycle
    };
  }, []);

  // Utility functions to expose
  const sendCustomEvent = (eventName: string, data?: Record<string, any>) => {
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. Event not sent:', eventName);
      return;
    }
    
    // Fix by only passing a single argument if no data is provided
    if (data) {
      const eventData = JSON.stringify(data);
      Clarity.sendCustomEvent(`${eventName}: ${eventData}`);
    } else {
      Clarity.sendCustomEvent(eventName);
    }
  };

  const setScreenName = (screenName: string) => {
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. Screen name not set:', screenName);
      return;
    }
    
    Clarity.setCurrentScreenName(screenName);
  };

  const setCustomTag = (key: string, value: string) => {
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. Custom tag not set:', key);
      return;
    }
    
    Clarity.setCustomTag(key, value);
  };

  const setCustomUserId = (userId: string) => {
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. Custom user ID not set:', userId);
      return;
    }
    
    Clarity.setCustomUserId(userId);
    setIsUserIdentified(true);
  };

  // Add a network status monitor and session event
  const checkClarityNetworkStatus = () => {
    if (!isInitialized) {
      return;
    }

    // Use a custom event to attempt to trigger an upload
    sendCustomEvent('NetworkStatusCheck', { 
      timestamp: new Date().toISOString(),
      isOnline: true,
      check: 'manual'
    });

    // Additional debugging info
    if (__DEV__) {
      console.log('Clarity network check triggered');
      // Check if session is active
      if (currentSessionId) {
        console.log('Clarity active session:', currentSessionId);
      } else {
        console.warn('No active Clarity session detected');
      }
    }
  };

  // Schedule periodic checks during development
  useEffect(() => {
    if (__DEV__ && isInitialized) {
      const interval = setInterval(() => {
        checkClarityNetworkStatus();
      }, 30000); // Check every 30 seconds in dev mode
      
      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  // New method to identify a user with all their attributes
  const identifyUser = (userAttributes: UserAttributes) => {
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. User not identified.');
      return;
    }

    try {
      // Set the primary userId for Clarity
      if (userAttributes.userId) {
        setCustomUserId(userAttributes.userId);
      }

      // Set each attribute as a custom tag with proper prefixing to ensure visibility
      if (userAttributes.username) {
        setCustomTag('user_username', userAttributes.username);
      }
      
      if (userAttributes.firstName) {
        setCustomTag('user_firstName', userAttributes.firstName);
      }
      
      if (userAttributes.lastName) {
        setCustomTag('user_lastName', userAttributes.lastName);
      }
      
      if (userAttributes.email) {
        setCustomTag('user_email', userAttributes.email);
      }

      // Add a consolidated user info tag to make it easier to see in the Clarity dashboard
      const userInfoTag = `${userAttributes.firstName || ''} ${userAttributes.lastName || ''} (${userAttributes.email || ''})`.trim();
      if (userInfoTag) {
        setCustomTag('user_info', userInfoTag);
      }

      // Set any additional custom attributes with user_ prefix
      Object.entries(userAttributes).forEach(([key, value]) => {
        if (!['userId', 'username', 'firstName', 'lastName', 'email'].includes(key) && value) {
          setCustomTag(`user_${key}`, String(value));
        }
      });

      sendCustomEvent('UserIdentified', { 
        identified: true,
        username: userAttributes.username
      });
      
      setIsUserIdentified(true);
      console.log('User identified in Clarity with full attributes:', userAttributes);
      
    } catch (error) {
      console.error('Failed to identify user in Clarity:', error);
    }
  };

  // Clear user identification when user logs out
  const clearUserIdentity = () => {
    if (!isInitialized) {
      return;
    }

    try {
      // Attempt to reset the user ID - but Clarity doesn't have a clear method
      // Best practice is to start a new session
      Clarity.startNewSession((newSessionId) => {
        console.log('Clarity session reset after logout:', newSessionId);
        setCurrentSessionId(newSessionId as string);
      });
      
      setIsUserIdentified(false);
      sendCustomEvent('UserLoggedOut');
    } catch (error) {
      console.error('Failed to clear user identity in Clarity:', error);
    }
  };

  const pauseTracking = () => {
    if (isInitialized) {
      Clarity.pause();
    }
  };

  const resumeTracking = () => {
    if (isInitialized) {
      Clarity.resume();
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
    if (!isInitialized) {
      console.warn('Clarity not initialized yet. Session info not added.');
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
        setCustomTag('session_timestamp', now.toISOString());
      }

      // Send an event for this session info addition
      sendCustomEvent('SessionInfoCaptured', sessionInfo);
      console.log('Session info added to Clarity for customer support', sessionInfo);
    } catch (error) {
      console.error('Failed to add session info to Clarity:', error);
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