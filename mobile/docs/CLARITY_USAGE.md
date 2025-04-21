# Microsoft Clarity Integration

This application integrates Microsoft Clarity for session recording and analytics tracking. The integration is handled through a custom React hook.

## Configuration

The Clarity project ID is stored in the environment variables:

```
EXPO_PUBLIC_CLARITY_PROJECT_ID=your_project_id
```

You can find your project ID on the Settings page of your Clarity dashboard.

## How It Works

The Clarity SDK is initialized at application startup through the custom `useClarity` hook in `app/index.tsx`. The hook reads the project ID from environment variables.

## Using the Clarity Hook

Import the hook in any component where you want to track events or set custom data:

```typescript
import useClarity from "@/hooks/useClarity";

function YourComponent() {
  const { 
    isInitialized, 
    sendCustomEvent, 
    setScreenName, 
    setCustomTag, 
    setCustomUserId,
    pauseTracking,
    resumeTracking 
  } = useClarity();
  
  // Your component code...
  
  // Example: Track a button click
  const handleButtonClick = () => {
    sendCustomEvent("ButtonClicked", { buttonId: "login" });
  };
  
  // Example: Set current screen name
  useEffect(() => {
    setScreenName("Profile");
  }, []);
}
```

## Available Methods

- `isInitialized`: Boolean indicating if Clarity has been initialized
- `currentSessionId`: The current Clarity session ID
- `sendCustomEvent(eventName, data?)`: Send a custom event to Clarity
- `setScreenName(screenName)`: Set the current screen name
- `setCustomTag(key, value)`: Set a custom tag for the current session
- `setCustomUserId(userId)`: Set a custom user ID for the current session
- `pauseTracking()`: Pause tracking temporarily
- `resumeTracking()`: Resume tracking after pausing

## Integration with React Navigation

For automatic screen tracking with React Navigation, you can use the following pattern in your navigation container:

```typescript
import useClarity from "@/hooks/useClarity";
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';

export default function Navigation() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef();
  const { setScreenName } = useClarity();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute().name;
        setScreenName(routeNameRef.current);
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute().name;

        if (previousRouteName !== currentRouteName) {
          routeNameRef.current = currentRouteName;
          setScreenName(currentRouteName);
        }
      }}
    >
      {/* Your navigation structure */}
    </NavigationContainer>
  );
}
```

## Privacy Considerations

- Clarity records user sessions, including interactions and screen views
- Consider pausing tracking during sensitive operations using `pauseTracking()`
- To exclude certain user data, use `setCustomUserId()` with a non-identifiable ID

## Important Notes

- **Expo Go Compatibility**: Clarity requires native code and won't work in Expo Go. Use EAS Build for testing.
- **Platform Support**: Android and iOS are supported.
- **Session Visibility**: Sessions may take up to 2 hours to appear in the Clarity dashboard, though real-time viewing is available.
- **react-native-svg Users**: Upgrade to version 14+ if using react-native-svg to avoid compatibility issues. 