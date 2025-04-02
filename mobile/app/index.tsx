import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { usePushNotifications } from "../hooks/useExpoPushToken";
import useInitializeAuthState from "@/hooks/useInitializeAuthState";
import { View } from "react-native";

const Home = () => {
  const { expoPushToken } = usePushNotifications();
  useInitializeAuthState();
  console.log("expoPushToken", expoPushToken);

  useEffect(() => {
    async function getToken() {
      const isFirstTime = await AsyncStorage.getItem("isFirstTime");
      console.log("isFirstTime", isFirstTime);

      if (isFirstTime) {
        router.replace("../(root)/(tabs)/home");
      } else {
        router.replace("../(root)/(auth)/welcome");
      }
    }
    getToken();
  }, []);
  return <View className="h-full w-full bg-[#121212]" />;
  return null;
  return <Redirect href={"../(root)/(tabs)/home"} />;
};

export default Home;
