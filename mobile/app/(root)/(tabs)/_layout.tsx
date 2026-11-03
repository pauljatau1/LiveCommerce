import { View, Text, Image, Platform } from "react-native";
import { Redirect, SplashScreen, Tabs, useFocusEffect } from "expo-router";
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
import axios from "axios";
import { initializeSocket } from "@/core/sockets";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const TabsLayout = () => {
  const status = useSelector((state: RootState) => state.authState.status);
  const { user, token } = useSelector((state: RootState) => state.authState);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  const handleGetConversations = async () => {
    try {

      if (!token) {
        return;
      }
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const conversations = response.data.conversations as any[];
      setUnreadCount(
        conversations?.filter((convo: any) => convo.unreadCount > 0)?.length,
      );
      console.log(
        "length ",
        conversations?.filter((convo: any) => convo.unreadCount > 0)?.length,
      );
    } catch (e) {
      console.log("unable to get conversations ", e);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      hideSplash();
    }, 1000);
  }, [hideSplash, status]);

  useFocusEffect(
    useCallback(() => {
      handleGetConversations();
    }, []),
  );

  // if (status === "signOut") {
  //   return <Redirect href="/(root)/(auth)/sign-in" />;
  // }
  return (
    <Tabs
      // scenecovererStyle={{
      //     backgroundColor: colors.background,
      // }}
      screenOptions={{
        // tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#16783A",
        tabBarInactiveTintColor: "#94A3B1",
        tabBarLabelStyle: {
          fontFamily: "LexendDeca",
          fontSize: 9,
        },
        tabBarStyle: {
          // height: Platform.OS == "android" ? 60 : 80,
          backgroundColor: "#000",
          alignItems: "center",
          borderTopWidth: 0,
        },
      }}
      // tabBar={(props) => <TabBar {...props} />}
    >
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
        name="home"
        options={{
          tabBarLabel: "Shop",
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <MaterialCommunityIcons
                name="shopping-outline"
                size={21}
                color="#16783A"
              />
            ) : (
              <MaterialCommunityIcons
                name="shopping-outline"
                size={21}
                color="#94A3B1"
              />
            ),
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
                  width: 22,
                  height: 22,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/explore.png")}
                resizeMode="cover"
                style={{
                  width: 22,
                  height: 22,
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
                  width: 26,
                  height: 26,
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/icons/connect.png")}
                resizeMode="cover"
                style={{
                  width: 26,
                  height: 26,
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
              <View>
                <Image
                  source={require("../../../assets/icons/messages-fill.png")}
                  resizeMode="cover"
                  style={{
                    width: 22,
                    height: 22,
                  }}
                />
                {unreadCount > 0 && (
                  <View
                    className="absolute top-[-15px]"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 16,
                      backgroundColor: "#16783A",
                      justifyContent: "center",
                      alignItems: "center",
                      right: -6,
                      top: -6,
                    }}
                  >
                    <Text className="text-[#fff] text-[10px] font-[400] font-LexendDeca">
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Image
                  source={require("../../../assets/icons/messages.png")}
                  resizeMode="cover"
                  style={{
                    width: 22,
                    height: 22,
                  }}
                />
                {unreadCount > 0 && (
                  <View
                    className="absolute top-[-15px]"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 16,
                      backgroundColor: "#16783A",
                      justifyContent: "center",
                      alignItems: "center",
                      right: -6,
                      top: -6,
                    }}
                  >
                    <Text className="text-[#fff] text-[10px] font-[400] font-LexendDeca">
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
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
              source={
                user?.profileImage?.url
                  ? { uri: user?.profileImage?.url }
                  : require("../../../assets/icons/profile.jpg")
              }
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
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
