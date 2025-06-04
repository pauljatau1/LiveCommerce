# Microsoft Clarity Integration Guide

This guide outlines how to use Microsoft Clarity for analytics and session recording in different parts of the app.

## Setup Status

Clarity has been successfully integrated and is working in development builds. It is not available in Expo Go.

## User Identification

### Automatic User Identification

User details are automatically captured when the app starts through the `app/index.tsx` initialization. The following user attributes are tracked:

- User ID
- Username
- First Name
- Last Name
- Email
- Account Age (in days)
- Verification Status

### Manual User Identification

For login flows or when user data becomes available later, use the helper functions:

```jsx
import { useClarity } from '@/hooks/useClarity';
import { identifyUserInClarity, clearUserIdentityInClarity } from '@/utils/clarityUtils';

function LoginScreen() {
  const clarity = useClarity();
  
  const handleLoginSuccess = async (userData) => {
    // Your login logic here
    
    // Identify user in Clarity
    const success = await identifyUserInClarity(clarity, userData);
    if (success) {
      console.log('User identified in Clarity successfully');
    }
  };
  
  const handleLogout = () => {
    // Your logout logic here
    
    // Clear user identity in Clarity
    clearUserIdentityInClarity(clarity);
  };
  
  return (
    <View>
      {/* Your login UI */}
    </View>
  );
}
```

## Important Implementation Notes

### Using Official Microsoft Clarity APIs

The integration now uses the official Microsoft Clarity React Native SDK methods:

- `Clarity.setCustomUserId()` - Sets the primary user identifier
- `Clarity.setCustomTag()` - Sets individual user attributes
- `Clarity.startNewSession()` - Ensures proper user identification timing
- `Clarity.sendCustomEvent()` - Tracks custom events

### Timing Considerations

- User identification should happen **after** Clarity is fully initialized
- The SDK uses `setOnSessionStartedCallback` to ensure proper timing
- For login flows, call `identifyUserInClarity()` immediately after successful authentication

### Filtering in Clarity Dashboard

To filter sessions by user attributes in the Clarity dashboard:

1. **Custom User ID**: Use the "Custom User ID" filter with the actual user ID value
2. **Custom Tags**: Use "Custom filters" section to filter by custom tags like:
   - `user_username`
   - `user_email` 
   - `user_firstName`
   - `user_lastName`
   - `user_display_name`

**Note**: According to Microsoft documentation, custom user IDs are hashed for privacy, but you can still filter using the original unhashed value.

## Automatic Screen Tracking

To track screen views, add the `ClarityScreenTracker` component to your layout files:

```jsx
import ClarityScreenTracker from '@/components/ClarityScreenTracker';

export default function AppLayout() {
  return (
    <>
      <ClarityScreenTracker />
      {/* Your layout components */}
    </>
  );
}
```

## Manual Event Tracking

Use the `useClarity` hook to track custom events:

```jsx
import { useClarity } from '@/hooks/useClarity';

function YourComponent() {
  const { sendCustomEvent } = useClarity();
  
  const handleButtonPress = () => {
    // Your button logic
    
    // Track the button press in Clarity
    sendCustomEvent('ButtonPressed', { 
      buttonName: 'Submit',
      screen: 'Checkout' 
    });
  };
  
  return (
    <Button onPress={handleButtonPress} title="Submit" />
  );
}
```

## Available Hook Methods

The `useClarity` hook provides the following methods:

```typescript
const {
  // Status
  isInitialized,
  isUserIdentified,
  currentSessionId,
  
  // Tracking
  sendCustomEvent,
  setScreenName,
  
  // User identification (UPDATED)
  setCustomTag,
  setCustomUserId,
  identifyUser,        // ✅ Fixed to use official APIs
  clearUserIdentity,
  
  // Session control
  pauseTracking,
  resumeTracking,
} = useClarity();
```

## Tracking Key User Actions

### Login/Signup Success

```javascript
// In your authentication flow
const handleLoginSuccess = async (userData) => {
  // Identify user with all their attributes
  await identifyUserInClarity(clarity, userData);
  
  // Track the login event
  clarity.sendCustomEvent('LoginSuccess', { method: 'email' });
};
```

### Important User Actions

```javascript
// Purchase
sendCustomEvent('Purchase', { 
  amount: 99.99, 
  currency: 'USD',
  items: 2
});

// Feature Usage
sendCustomEvent('FeatureUsed', { 
  featureName: 'LiveStream',
  duration: 300 // seconds
});
```

### Error Tracking

```javascript
sendCustomEvent('Error', { 
  type: 'API',
  code: 404,
  message: 'Resource not found'
});
```

## Privacy Considerations

For sensitive screens or actions, you can pause tracking:

```javascript
import { useClarity } from '@/hooks/useClarity';

function SensitiveComponent() {
  const { pauseTracking, resumeTracking } = useClarity();
  
  useEffect(() => {
    // Pause tracking when the component mounts
    pauseTracking();
    
    // Resume tracking when the component unmounts
    return () => resumeTracking();
  }, []);
  
  return (
    <View>
      {/* Sensitive content */}
    </View>
  );
}
```

## Custom User Properties

To add custom properties for a user:

```javascript
// Track premium status
setCustomTag('isPremium', 'true');

// Track user preferences
setCustomTag('theme', 'dark');
```

## Troubleshooting

If you're not seeing user attributes in the Clarity dashboard:

1. **Check Session Logs**: Confirm the session ID is being logged (`Clarity session started: [id]`)
2. **Verify Timing**: User identification must happen after session starts
3. **Check Build Type**: Ensure you're using a development build, not Expo Go
4. **Wait for Data**: Allow 2+ hours for data to appear in the dashboard
5. **Verify Environment**: Check that `EXPO_PUBLIC_CLARITY_PROJECT_ID` is set correctly in .env
6. **Check Console Logs**: Look for user identification success messages

### Common Issues & Solutions

1. **"User not identified" warnings**: Ensure Clarity is initialized before calling `identifyUser`
2. **Custom tags not appearing**: Use the "Custom filters" section in dashboard, not basic filters
3. **User ID filtering not working**: Try using the actual user ID value (not hashed) in filters

## Example Integration: Tracking Livestream Engagement

```javascript
import { useClarity } from '@/hooks/useClarity';

function LivestreamScreen() {
  const { sendCustomEvent, setCustomTag } = useClarity();
  
  useEffect(() => {
    // Track livestream start
    sendCustomEvent('LivestreamStarted', { streamId: props.streamId });
    
    // Set custom tags for this session
    setCustomTag('currentStream', props.streamId);
    
    return () => {
      // Track livestream end
      sendCustomEvent('LivestreamEnded', { 
        streamId: props.streamId,
        duration: calculateDuration()
      });
    };
  }, []);
  
  return (
    <View>{/* Livestream content */}</View>
  );
}
```

## Key Changes Made

### ✅ Fixed Issues:
1. **Proper API Usage**: Now uses official `Clarity.setCustomUserId()` and `Clarity.setCustomTag()`
2. **Correct Timing**: Uses `Clarity.startNewSession()` to ensure proper user identification
3. **Better Error Handling**: Added retries and proper initialization checks
4. **Dashboard Filtering**: User attributes now properly appear as custom tags with `user_` prefix

### 🚀 Expected Results:
- User attributes should now appear in Clarity dashboard under "Custom filters"
- User ID filtering should work using the "Custom User ID" filter
- Session recordings will be properly tagged with user information 