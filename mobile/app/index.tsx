import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRootNavigationState, Redirect, SplashScreen } from "expo-router";
import { useEffect, useRef } from "react";
import { usePushNotifications } from "../hooks/useExpoPushToken";
import useInitializeAuthState from "@/hooks/useInitializeAuthState";
import { View } from "react-native";
import useClarity from "@/hooks/useClarity";
import { getToken, getUser } from "@/store/features/auth/utils";
import { getUserAttributesForClarity } from "@/utils/clarityUtils";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

const Home = () => {
  const clarityHook = useClarity();
  const { isFirstTimeUser, loading: authLoading, user: authUser, setInitialScreen } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const clarityUserIdentified = useRef(false);
  
  const { expoPushToken } = usePushNotifications();
  useInitializeAuthState();
  console.log("expoPushToken", expoPushToken);

  useEffect(() => {
    // Initialize Clarity
    const initClarity = async () => {
      // The Clarity hook automatically initializes when imported
      
      // Try to identify user early
      const identifyUserEarly = async () => {
        try {
          // Try to get the user as early as possible
          const user = await getUser();
          
          if (user) {
            console.log("Early user identification for Clarity");
            const userAttributes = await getUserAttributesForClarity(user);
            
            if (userAttributes) {
              clarityHook.identifyUser(userAttributes);
            }
          }
        } catch (error) {
          console.error("Error during early user identification:", error);
        }
      };
      
      identifyUserEarly();
    };
    
    initClarity();
    

  }, []);

  // User-based tracking is handled in the auth hook
  useEffect(() => {
    if (authUser) {
      getUserAttributesForClarity(authUser).then(userAttributes => {
        if (userAttributes) {
          clarityHook.identifyUser(userAttributes);
        }
      });
    }
  }, [authUser]);

  // Track app startup in Clarity and identify user if logged in
  useEffect(() => {
    const setupClarity = async () => {
      if (!clarityUserIdentified.current) {
        console.log('[App] Clarity initialized successfully');
        
        try {
          // Check if user is logged in and identify them in Clarity
          const token = await getToken();
          if (token) {
            const user = await getUser();
            if (user) {
              const userAttributes = await getUserAttributesForClarity(user);
              if (userAttributes) {
                clarityHook.identifyUser(userAttributes);
                clarityUserIdentified.current = true;
                console.log('[App] User identified in Clarity from index');
              }
            }
          }
        } catch (error) {
          console.log('[App] Failed to identify user in Clarity:', error);
          // Non-blocking - continue even if identification fails
        }
      }
    };
    
    setupClarity();
  }, []);

  // Handle navigation - CRITICAL: don't make this depend on Clarity
  useEffect(() => {
    async function checkFirstTimeUser() {
      try {
        const isFirstTime = await AsyncStorage.getItem("isFirstTime");
        console.log("isFirstTime", isFirstTime);

        // Ensure navigation happens regardless of Clarity's state
        if (isFirstTime) {
          router.replace("../(root)/(tabs)/home/home");
        } else {
          router.replace("../(root)/(auth)/welcome");
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback navigation in case of error
        router.replace("../(root)/(auth)/welcome");
      }
    }
    
    checkFirstTimeUser();
    SplashScreen.hideAsync();
  }, []); // Remove any dependencies to ensure this always runs
  
  return <View className="h-full w-full bg-[#121212]" />;
};

export default Home;
