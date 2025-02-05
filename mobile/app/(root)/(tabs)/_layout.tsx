import { View, Text, Image, Platform } from "react-native";
import { Redirect, SplashScreen, Tabs } from "expo-router";
import { icons } from "@/constants"; // Ensure only necessary icons are imported
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import React, { useCallback, useEffect, useState } from "react";
import TabBar from "@/components/tab-bar";
import HomeHeader from "@/components/home/home-header";
import AntDesign from "@expo/vector-icons/AntDesign";
import Fontisto from "@expo/vector-icons/Fontisto";
import Octicons from "@expo/vector-icons/Octicons";
import { getUser } from "@/store/features/auth/utils";

const TabsLayout = () => {
  const status = useSelector((state: RootState) => state.authState.status);
  // const [user,setUser] = useState<any>()

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      hideSplash();
    }, 1000);
  }, [hideSplash, status]);

  // useEffect(()=>{
  //  if (status === "signIn")
  //  {

  //  }
  // },[status])
  if (status === "signOut") {
    return <Redirect href="/(root)/(auth)/sign-in" />;
  }
  return (
    <Tabs
      // scenecovererStyle={{
      //     backgroundColor: colors.background,
      // }}
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#16783A",
        tabBarInactiveTintColor: "#94A3B1",
        tabBarLabelStyle: {
          fontFamily: "LexendDeca",
          fontWeight: "400",
          fontSize: Platform.OS == "android" ? 10 : 12,
          marginTop: 4,
        },
        tabBarStyle: {
          height: Platform.OS == "android" ? 60 : 80,
          backgroundColor: "#121212",
          borderTopWidth: 0,
          paddingVertical: 10,
        },
      }}
      // tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          title: "Home",
          headerShown: false,

          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <Image
                source={require("../../../assets/icons/home-icon-fill.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/home.png")}
                resizeMode="cover"
                style={{
                  width: 24,
                  height: 24,
                }}
              />
            ),
          // <AntDesign name="home" size={18} color={color} />
          // header() { return <HomeHeader />; }
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: "Explore",

          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <Image
                source={require("../../../assets/icons/explore-fill.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/explore.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="blips"
        options={{
          tabBarLabel: "Blips",

          title: "Blips",
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <Image
                source={require("../../../assets/icons/blips-fill.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/blips.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          tabBarLabel: "Connect",

          title: "Connect",
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <Image
                source={require("../../../assets/icons/connect-fill.png")}
                resizeMode="cover"
                style={{
                  width: 24,
                  height: 24,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/connect.png")}
                resizeMode="cover"
                style={{
                  width: 24,
                  height: 24,
                }}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarLabel: "Messages",

          title: "Messages",
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <Image
                source={require("../../../assets/icons/messages-fill.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/messages.png")}
                resizeMode="cover"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",

          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/animoji.png")}
              style={{
                width: 20,
                height: 20,
              }}
              resizeMode="cover"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
