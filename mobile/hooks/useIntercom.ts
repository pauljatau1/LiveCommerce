import { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Import Intercom with a safety check
let Intercom: any;
let isIntercomAvailable = false;

try {
  Intercom = require('@intercom/intercom-react-native');
  isIntercomAvailable = !!Intercom && typeof Intercom === 'object';
  console.log('[Intercom] SDK is available:', isIntercomAvailable);
} catch (error) {
  console.log('[Intercom] Failed to import the SDK:', error);
  Intercom = null;
  isIntercomAvailable = false;
}

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Store unread count listeners
type ListenerCallback = (count: number) => void;
const unreadCountListeners: ListenerCallback[] = [];

// Get Intercom config from environment variables
const INTERCOM_APP_ID = process.env.EXPO_PUBLIC_INTERCOM_APP_ID || '';
const INTERCOM_ANDROID_API_KEY = process.env.EXPO_PUBLIC_INTERCOM_ANDROID_API_KEY || '';
const INTERCOM_IOS_API_KEY = process.env.EXPO_PUBLIC_INTERCOM_IOS_API_KEY || '';

// Define constants directly if the SDK is not available
const MOCK_EVENTS = { IntercomUnreadCountDidChange: 'IntercomUnreadCountDidChange' };
const MOCK_VISIBILITY = { VISIBLE: 'VISIBLE', GONE: 'GONE' };
const MOCK_CONTENT = { helpCenter: () => ({}) };

// Custom hook for Intercom integration
export const useIntercom = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountListenerRef = useRef<any>(null);

  // Check if Intercom can be used
  const canUseIntercom = !isExpoGo && isIntercomAvailable;

  useEffect(() => {
    const initializeIntercom = async () => {
      try {
        // Skip if we can't use Intercom
        if (!canUseIntercom) {
          console.log('[Intercom] Skipping initialization - SDK not available or running in Expo Go');
          return;
        }

        // Check if API keys are available
        if (!INTERCOM_APP_ID || !INTERCOM_ANDROID_API_KEY || !INTERCOM_IOS_API_KEY) {
          console.error('[Intercom] API keys not configured in environment variables');
          return;
        }
        
        try {
          // Check if addEventListener exists
          if (typeof Intercom.addEventListener === 'function') {
            unreadCountListenerRef.current = Intercom.addEventListener(
              Intercom.IntercomEvents?.IntercomUnreadCountDidChange || 'IntercomUnreadCountDidChange',
              (response: any) => {
                const count = response?.count || 0;
                setUnreadCount(count);
                
                // Notify all listeners
                unreadCountListeners.forEach(listener => listener(count));
              }
            );
          }
          
          setIsInitialized(true);
          console.log('[Intercom] Initialized successfully');
        } catch (error) {
          console.error('[Intercom] Failed to set up listener:', error);
        }
      } catch (error) {
        console.error('[Intercom] Failed to initialize:', error);
      }
    };

    initializeIntercom();

    return () => {
      if (unreadCountListenerRef.current && typeof unreadCountListenerRef.current.remove === 'function') {
        unreadCountListenerRef.current.remove();
      }
    };
  }, [canUseIntercom]);

  // Get the enum values safely
  const getIntercomEvents = () => {
    if (canUseIntercom && Intercom.IntercomEvents) {
      return Intercom.IntercomEvents;
    }
    return MOCK_EVENTS;
  };

  const getIntercomVisibility = () => {
    if (canUseIntercom && Intercom.Visibility) {
      return Intercom.Visibility;
    }
    return MOCK_VISIBILITY;
  };

  const getIntercomContent = () => {
    if (canUseIntercom && Intercom.IntercomContent) {
      return Intercom.IntercomContent;
    }
    return MOCK_CONTENT;
  };

  // Safely call Intercom methods
  const safeIntercomCall = async (methodName: string, ...args: any[]) => {
    if (!canUseIntercom) {
      console.log(`[Intercom] ${methodName} skipped - SDK not available or running in Expo Go`);
      return false;
    }
    
    if (!isInitialized && methodName !== 'loginUnidentifiedUser' && methodName !== 'loginUserWithUserAttributes') {
      console.warn(`[Intercom] ${methodName} failed - not initialized yet`);
      return false;
    }

    try {
      if (typeof Intercom[methodName] === 'function') {
        return await Intercom[methodName](...args);
      } else {
        console.warn(`[Intercom] ${methodName} is not a function`);
        return false;
      }
    } catch (error) {
      console.error(`[Intercom] ${methodName} failed:`, error);
      return false;
    }
  };

  // Login as an identified user
  const loginIdentifiedUser = async (userData: { userId?: string; email?: string }) => {
    return safeIntercomCall('loginUserWithUserAttributes', userData);
  };

  // Login as an unidentified user
  const loginUnidentifiedUser = async () => {
    return safeIntercomCall('loginUnidentifiedUser');
  };

  // Logout current user
  const logout = async () => {
    return safeIntercomCall('logout');
  };

  // Update user attributes
  const updateUser = async (userAttributes: any) => {
    return safeIntercomCall('updateUser', userAttributes);
  };

  // Present the Intercom Messenger
  const presentMessenger = async () => {
    return safeIntercomCall('present');
  };

  // Open the help center
  const presentHelpCenter = async () => {
    const content = getIntercomContent();
    return safeIntercomCall('presentContent', content.helpCenter());
  };

  // Open the message composer with pre-populated text
  const presentMessageComposer = async (initialMessage: string) => {
    return safeIntercomCall('displayMessageComposer', initialMessage);
  };

  // Track an event
  const trackEvent = async (eventName: string, metadata?: Object) => {
    return metadata 
      ? safeIntercomCall('logEvent', eventName, metadata)
      : safeIntercomCall('logEvent', eventName);
  };

  // Set the launcher visibility
  const setLauncherVisibility = async (visible: boolean) => {
    const visibility = getIntercomVisibility();
    return safeIntercomCall('setLauncherVisibility', visible ? visibility.VISIBLE : visibility.GONE);
  };

  // Set in-app message visibility
  const setInAppMessageVisibility = async (visible: boolean) => {
    const visibility = getIntercomVisibility();
    return safeIntercomCall('setInAppMessageVisibility', visible ? visibility.VISIBLE : visibility.GONE);
  };

  // Register a listener for unread count changes
  const addUnreadCountListener = (callback: ListenerCallback) => {
    if (!canUseIntercom) {
      console.log('[Intercom] addUnreadCountListener skipped - SDK not available or running in Expo Go');
      return () => {}; // Return no-op function
    }
    
    unreadCountListeners.push(callback);
    // Return a function to remove the listener
    return () => {
      const index = unreadCountListeners.indexOf(callback);
      if (index !== -1) {
        unreadCountListeners.splice(index, 1);
      }
    };
  };

  // Hide the Intercom Messenger
  const hideMessenger = async () => {
    return safeIntercomCall('hideIntercom');
  };

  return {
    isInitialized: canUseIntercom && isInitialized,
    unreadCount,
    loginIdentifiedUser,
    loginUnidentifiedUser,
    logout,
    updateUser,
    presentMessenger,
    presentHelpCenter,
    presentMessageComposer,
    trackEvent,
    setLauncherVisibility,
    setInAppMessageVisibility,
    addUnreadCountListener,
    hideMessenger,
    isExpoGo,
    isIntercomAvailable
  };
};

export default useIntercom; 