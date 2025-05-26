# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   Create a `.env` file in the root directory with the following variables:
   ```
   # Customer.io
   EXPO_PUBLIC_CIO_SITE_ID=your_customer_io_site_id
   EXPO_PUBLIC_CDP_API_KEY=your_customer_io_cdp_api_key

   # Mixpanel
   EXPO_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token
   ```

3. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Facebook SDK Integration

The app uses Facebook SDK for authentication and sharing, but there are known issues with it causing crashes in development and preview builds.

### Our Implementation:

1. **Development Mode (Local Development)**: 
   - Facebook SDK initialization is completely skipped
   - Mock Facebook functionality is provided for testing

2. **Preview Builds**:
   - Facebook SDK initialization is skipped using `forceSafeMode: true`
   - This prevents crashes in test/preview builds from EAS

3. **Production Builds**:
   - Facebook SDK is fully initialized
   - All Facebook features are available

### Building for Different Environments:

1. **Development Mode (Local)**:
   ```bash
   npx expo start
   ```

2. **Preview Build**:
   ```bash
   eas build --platform android --profile preview
   ```
   This will create a build with Facebook SDK in safe mode (not initialized).

3. **Production Build**:
   ```bash
   eas build --platform android --profile production
   ```
   This will create a build with Facebook SDK fully enabled.

### Known Issues:

The Facebook SDK is known to crash on initialization in development builds and sometimes in preview builds. This is a widespread issue in the React Native community. Our implementation follows best practices to avoid these crashes.

## Analytics Integration

This project integrates two analytics platforms:

### Customer.io

Customer.io is used for customer engagement and messaging. The integration includes:
- Identifying users
- Tracking events
- Tracking screen views

Usage example:
```javascript
import { identifyUser, trackEvent, trackScreen } from '@/utils/customerio';

// Identify a user
identifyUser('user123', { email: 'user@example.com' });

// Track an event
trackEvent('button_clicked', { buttonName: 'Submit' });

// Track a screen view
trackScreen('HomeScreen');
```

### Mixpanel

Mixpanel is used for product analytics. The integration includes:
- Identifying users
- Tracking events
- Setting user profiles
- Managing super properties

Usage example:
```javascript
import { identifyUser, trackEvent, trackScreen } from '@/utils/mixpanel';

// Identify a user
identifyUser('user123', { email: 'user@example.com' });

// Track an event
trackEvent('button_clicked', { buttonName: 'Submit' });

// Track a screen view
trackScreen('HomeScreen');
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
