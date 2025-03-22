import { useFonts } from "expo-font";
import { Stack, useNavigationContainerRef, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
// import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Provider } from "react-redux";
import { store } from "@/store";
import { StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import Constants from "expo-constants";
import * as SystemUI from "expo-system-ui";
import { LivestreamProvider } from "@/contexts/livestreamContext";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { ToastProvider } from "@/contexts/ToastContext";

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      {/* <KeyboardProvider> */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <ToastProvider>
              <LivestreamProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(categories)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="(root)" options={{ headerShown: false }} />

                  <Stack.Screen name="+not-found" />
                </Stack>
                <FlashMessage floating style={styles.flashMessage} />
              </LivestreamProvider>
            </ToastProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>

      {/* </KeyboardProvider> */}
    </Provider>
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
