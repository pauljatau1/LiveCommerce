# Intercom Integration

This application integrates Intercom for in-app customer support and user engagement. The integration is handled through Expo's plugin system and a custom React hook.

## Setup and Configuration

### Environment Variables

Intercom requires the following environment variables to be set:

```
EXPO_PUBLIC_INTERCOM_APP_ID=your_app_id_here
EXPO_PUBLIC_INTERCOM_ANDROID_API_KEY=your_android_api_key_here
EXPO_PUBLIC_INTERCOM_IOS_API_KEY=your_ios_api_key_here
```

Your current values are:

```
EXPO_PUBLIC_INTERCOM_APP_ID=s2xos2me
EXPO_PUBLIC_INTERCOM_ANDROID_API_KEY=android_sdk-5c2fa08e0ec79ec3f956b6db7425c82d16a5a6aa
EXPO_PUBLIC_INTERCOM_IOS_API_KEY=ios_sdk-e55985a44a03eb25ff72dd31c4ed3b5538167489
```

### Expo Configuration

Intercom is configured in the `app.json` file using the Expo plugin system. This configuration is already set up with your API keys.

## Important Notes

1. **Expo Go Compatibility**: 
   - Intercom requires native code and won't work in Expo Go
   - The integration gracefully handles this by providing mock functions in Expo Go
   - All Intercom operations will be skipped with debug messages in the console
   - No errors will be thrown when running in Expo Go

2. **Development Testing**: To test Intercom, you need to create a development build with:
   ```
   npx eas build --profile development --platform android
   ```
   or
   ```
   npx eas build --profile development --platform ios
   ```

3. **Required Permissions**:
   - Android: `READ_EXTERNAL_STORAGE` and `VIBRATE` (added in app.json)
   - iOS: `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` (added in app.json)

## Using the Intercom Hook

The custom hook `useIntercom` provides a simple interface to interact with Intercom:

```typescript
import useIntercom from '@/hooks/useIntercom';

function YourComponent() {
  const {
    // Status
    isInitialized,
    unreadCount,
    isExpoGo,  // Boolean to check if running in Expo Go
    
    // Authentication
    loginIdentifiedUser,
    loginUnidentifiedUser,
    logout,
    updateUser,
    
    // UI/UX
    presentMessenger,
    presentHelpCenter,
    presentMessageComposer,
    setLauncherVisibility,
    setInAppMessageVisibility,
    hideMessenger,
    
    // Analytics
    trackEvent,
    
    // Notifications
    addUnreadCountListener
  } = useIntercom();
  
  // Check before performing operations
  useEffect(() => {
    const doSomething = async () => {
      // Only perform operations on real devices, not in Expo Go
      if (!isExpoGo) {
        await presentMessenger();
      }
    };
    
    doSomething();
  }, []);
}
```

## Common Use Cases

### Safely Checking for Expo Go Environment

```typescript
// Get the isExpoGo flag from the hook
const { isExpoGo, presentMessenger } = useIntercom();

// Use it in your component
const handleHelpPress = async () => {
  if (!isExpoGo) {
    await presentMessenger();
  } else {
    // Fallback behavior for Expo Go
    Alert.alert("Help", "Please contact support@example.com for assistance");
  }
};
```

### Logging in Users

```typescript
// For anonymous users
loginUnidentifiedUser();

// For identified users
loginIdentifiedUser({
  userId: 'user-123',
  email: 'user@example.com'
});
```

### Tracking Events

```typescript
trackEvent('completed_purchase', {
  item_id: 'sku-123',
  amount: 99.99
});
```

### Presenting the Messenger

```typescript
// Show the Intercom messenger
presentMessenger();

// Open the help center
presentHelpCenter();

// Open with pre-populated message
presentMessageComposer('I need help with...');
```

### Customizing Appearance

```typescript
// Show/hide the launcher button
setLauncherVisibility(true);

// Show/hide in-app messages
setInAppMessageVisibility(true);
```

### Tracking Unread Message Count

```typescript
// Current count
console.log(unreadCount);

// Listen for changes
useEffect(() => {
  const removeListener = addUnreadCountListener((count) => {
    console.log('New unread count:', count);
  });
  
  return removeListener; // Clean up on unmount
}, []);
```

## Authentication Flow Recommendations

- **Unidentified Users**: Use this for users who haven't logged in to your app.
- **Identified Users**: Use this after a user logs in to your app.

When a user logs in, switch from unidentified to identified:

```typescript
// When user logs in
const handleLogin = async (userId, email) => {
  // Skip in Expo Go
  if (isExpoGo) return;
  
  // First logout any existing session
  await logout();
  
  // Then login with user details
  await loginIdentifiedUser({
    userId,
    email
  });
  
  // Optionally update with more user attributes
  await updateUser({
    name: 'John Doe',
    phone: '+1234567890',
    customAttributes: {
      plan: 'premium',
      signupDate: '2023-01-01'
    }
  });
};
```

## TypeScript Support

The hook provides full TypeScript support with proper type definitions for all Intercom operations. This ensures you'll get proper autocomplete and type checking in your IDE.

## Known Limitations

- Push notifications must be configured separately
- Identity verification requires additional setup
- The Intercom plugin doesn't support all Intercom features through the Expo config
- When running in Expo Go, all operations are mocked and no actual Intercom functionality will be available 