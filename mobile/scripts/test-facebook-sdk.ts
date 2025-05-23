/**
 * Facebook SDK Test Script
 * 
 * This script can be imported and used to test if Facebook SDK is working correctly.
 * Add this to any component for testing purposes.
 * 
 * Usage:
 * import { testFacebookSDK } from '@/scripts/test-facebook-sdk';
 * 
 * // In a component:
 * useEffect(() => {
 *   testFacebookSDK();
 * }, []);
 */

import { Platform } from 'react-native';
import { Settings, AccessToken, LoginManager } from 'react-native-fbsdk-next';

/**
 * Test function to verify Facebook SDK functionality
 * @returns Promise<void>
 */
export const testFacebookSDK = async (): Promise<void> => {
  console.log('========== FACEBOOK SDK TEST ==========');
  
  try {
    // Check platform
    console.log('Platform:', Platform.OS);
    
    // Check if Settings is available
    if (Settings) {
      console.log('Settings object is available');
      
      // Try to get app ID
      try {
        const appID = '1749317145848990'; // The app ID should match what's in strings.xml
        console.log('App ID:', appID);
        
        // Test setAppID
        Settings.setAppID(appID);
        console.log('setAppID succeeded');
        
        // Test initializeSDK
        Settings.initializeSDK();
        console.log('initializeSDK succeeded');
      } catch (error) {
        console.error('Error with Settings methods:', error);
      }
    } else {
      console.error('Settings object is not available');
    }
    
    // Check AccessToken
    if (AccessToken) {
      console.log('AccessToken object is available');
      try {
        const token = await AccessToken.getCurrentAccessToken();
        console.log('Current access token:', token);
      } catch (error) {
        console.error('Error getting access token:', error);
      }
    } else {
      console.error('AccessToken object is not available');
    }
    
    // Check LoginManager
    if (LoginManager) {
      console.log('LoginManager object is available');
    } else {
      console.error('LoginManager object is not available');
    }
    
  } catch (error) {
    console.error('Facebook SDK test failed:', error);
  }
  
  console.log('========== END FACEBOOK SDK TEST ==========');
}; 