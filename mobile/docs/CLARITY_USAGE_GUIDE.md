# Microsoft Clarity Integration Guide

This guide outlines how to use Microsoft Clarity for analytics and session recording in different parts of the app.

## Setup Status

Clarity has been successfully integrated and is working in development builds. It is not available in Expo Go.

## User Identification

User details are automatically captured when a user logs in through the `useInitializeAuthState` hook. The following user attributes are tracked:

- User ID
- Username
- First Name
- Last Name
- Email
- Account Age (in days)
- Verification Status

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
import useClarity from '@/hooks/useClarity';

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
  
  // User identification
  setCustomTag,
  setCustomUserId,
  identifyUser,
  clearUserIdentity,
  
  // Session control
  pauseTracking,
  resumeTracking,
} = useClarity();
```

## Tracking Key User Actions

### Login/Signup Success

The user identification is automatically handled, but you can track additional events:

```javascript
sendCustomEvent('LoginSuccess', { method: 'email' });
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
import useClarity from '@/hooks/useClarity';

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

If you're not seeing events in the Clarity dashboard:

1. Confirm the session ID is being logged (`Clarity session started: [id]`)
2. Ensure you're using a development build, not Expo Go
3. Wait a few hours for data to appear in the dashboard
4. Check that `EXPO_PUBLIC_CLARITY_PROJECT_ID` is set correctly in .env

## Example Integration: Tracking Livestream Engagement

```javascript
import useClarity from '@/hooks/useClarity';

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