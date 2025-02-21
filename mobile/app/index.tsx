import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";

const Home = () => {
  // useEffect(() => {
  //   async function getToken() {
  //     const token = await AsyncStorage.getItem("token");
  //     if (token) {
  //       router.navigate("/(root)/(tabs)/home");
  //     } else {
  //       router.navigate("/(root)/(auth)/welcome");
  //     }
  //   }
  //   getToken();
  // }, []);
  return <Redirect href={"../(root)/(tabs)/home"} />;
};

export default Home;
