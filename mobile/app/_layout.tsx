import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack, useNavigationContainerRef, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
// import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Provider } from "react-redux";
import { store } from "@/store";
import { Linking, StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import Constants from "expo-constants";
import * as SystemUI from "expo-system-ui";
import { LivestreamProvider } from "@/contexts/livestreamContext";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { ToastProvider } from "@/contexts/ToastContext";
import useInitializeAuthState from "@/hooks/useInitializeAuthState";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#121212");

export default function RootLayout() {
  return <RootLayoutNav />;
}
function RootLayoutNav() {
  const router = useRouter();

  const [loaded] = useFonts({
    LexendDeca: require("../assets/fonts/LexendDeca-Regular.ttf"),
    "LexendDeca-Black": require("../assets/fonts/LexendDeca-Black.ttf"),
    "LexendDeca-Bold": require("../assets/fonts/LexendDeca-Bold.ttf"),
    "LexendDeca-ExtraBold": require("../assets/fonts/LexendDeca-ExtraBold.ttf"),
    "LexendDeca-ExtraLight": require("../assets/fonts/LexendDeca-ExtraLight.ttf"),
    "LexendDeca-Light": require("../assets/fonts/LexendDeca-Light.ttf"),
    "LexendDeca-Medium": require("../assets/fonts/LexendDeca-Medium.ttf"),
    "LexendDeca-SemiBold": require("../assets/fonts/LexendDeca-SemiBold.ttf"),
    "LexendDeca-Thin": require("../assets/fonts/LexendDeca-Thin.ttf"),
  });
  // const [loaded] = useFonts({
  //   LexendDeca: require("../assets/fonts/Inter_18pt-Regular.ttf"),
  //   "LexendDeca-Black": require("../assets/fonts/Inter_18pt-Black.ttf"),
  //   "LexendDeca-Bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
  //   "LexendDeca-ExtraBold": require("../assets/fonts/Inter_18pt-ExtraBold.ttf"),
  //   "LexendDeca-ExtraLight": require("../assets/fonts/Inter_18pt-ExtraLight.ttf"),
  //   "LexendDeca-Light": require("../assets/fonts/Inter_18pt-Light.ttf"),
  //   "LexendDeca-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
  //   "LexendDeca-SemiBold": require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
  //   "LexendDeca-Thin": require("../assets/fonts/Inter_18pt-Thin.ttf"),
  // });
  // const [loaded] = useFonts({
  //   LexendDeca: require("../assets/fonts/Roboto-Regular.ttf"),
  //   "LexendDeca-Black": require("../assets/fonts/Roboto-Black.ttf"),
  //   "LexendDeca-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
  //   "LexendDeca-ExtraBold": require("../assets/fonts/Roboto-ExtraBold.ttf"),
  //   "LexendDeca-ExtraLight": require("../assets/fonts/Roboto-ExtraLight.ttf"),
  //   "LexendDeca-Light": require("../assets/fonts/Roboto-Light.ttf"),
  //   "LexendDeca-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
  //   "LexendDeca-SemiBold": require("../assets/fonts/Roboto-SemiBold.ttf"),
  //   "LexendDeca-Thin": require("../assets/fonts/Roboto-Thin.ttf"),
  // });

  const handleDeepLink = async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      const path = url.replace(/^https?:\/\/[^/]+/, "");
      console.log("safe path", path);

      router.replace(path);
    }
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // handleDeepLink();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        {/* <KeyboardProvider> */}
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ToastProvider>
            <BottomSheetModalProvider>
              <LivestreamProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(categories)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(root)"
                    options={{ headerShown: false }}
                  />

                  <Stack.Screen name="+not-found" />
                </Stack>
                <FlashMessage floating style={styles.flashMessage} />
              </LivestreamProvider>
            </BottomSheetModalProvider>
          </ToastProvider>
        </SafeAreaProvider>

        {/* </KeyboardProvider> */}
      </Provider>
    </GestureHandlerRootView>
  );
}

// function Providers({ children }: { children: React.ReactNode }) {
//     return (
//         <KeyboardProvider>
//             {children}
//         </KeyboardProvider>
//     );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flashMessage: {
    marginTop: Constants.platform?.android ? Constants.statusBarHeight : "auto",
  },
});
