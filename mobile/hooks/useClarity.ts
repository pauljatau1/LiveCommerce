import { useEffect, useState } from 'react';
import * as Clarity from '@microsoft/react-native-clarity';
import { LogLevel } from '@microsoft/react-native-clarity';
import { useNavigation } from '@react-navigation/native';

// Get the project ID from environment variables
const CLARITY_PROJECT_ID = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID || '';

export function useClarity() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeClarity = async () => {
      try {
        if (!CLARITY_PROJECT_ID) {
          console.error('Clarity project ID is not configured in environment variables');
          return;
        }
        
        // Initialize Clarity with verbose logging during development
        Clarity.initialize(CLARITY_PROJECT_ID, {
          logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.Error,
        });

        // Set callback for when session starts
        Clarity.setOnSessionStartedCallback((sessionId) => {
          console.log('Clarity session started:', sessionId);
          // Fix type issue by using the correct type
          setCurrentSessionId(sessionId as string);
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

  return {
    isInitialized,
    currentSessionId,
    sendCustomEvent,
    setScreenName,
    setCustomTag,
    setCustomUserId,
    pauseTracking,
    resumeTracking,
  };
}

export default useClarity; 