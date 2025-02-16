import {
  View,
  Text,
  Dimensions,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { TabView, TabBar, TabBarItem } from "react-native-tab-view";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AllPostsList from "@/components/profile/myPostsList";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import { getToken, getUser } from "@/store/features/auth/utils";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate } from "@/helpers/helpers";

const HEADER_HEIGHT = 250;
const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView,
);

const CollapsibleHeader = memo(
  ({ scrollY, info }: { scrollY: any; info: any }) => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [0, -HEADER_HEIGHT],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          height: HEADER_HEIGHT,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: headerTranslateY }],
          backgroundColor: "#121212",
          zIndex: 1,
        }}
      >
        <View style={{ flex: 1, paddingTop: 10, paddingHorizontal: 16 }}>
          <View className="flex-row gap=[30px]">
            <View className="gap-[8px]">
              <Image
                source={
                  info?.profilePictureUrl
                    ? { uri: `${info.profilePictureUrl}` }
                    : require("../../../assets/icons/animoji.png")
                }
                style={{ width: 90, height: 90, borderRadius: 90 }}
                contentFit="cover"
              />
              <Text
                className="text-[8px] text-[#ccc] font-LexendDecaLight absolute left-0"
                style={{ bottom: 20 }}
              >
                Joined {formatDate(info?.createdAt, "MMMM YYYY")}
              </Text>
            </View>
            <View
              className="gap-[30px] items-center py-[20px] shrink"
              style={{ paddingHorizontal: 30 }}
            >
              <View className="flex-row items-center justify-between w-full shrink">
                <View className="gap-[4px] items-center">
                  <Text className="text-[16px] text-[#ccc] font-LexendDeca">
                    {info?.postsCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
                    Posts
                  </Text>
                </View>
                <View className="gap-[4px] items-center">
                  <Text className="text-[16px] text-[#ccc] font-LexendDeca">
                    {info?.followingCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
                    Following
                  </Text>
                </View>
                <View className="gap-[4px] items-center">
                  <Text className="text-[16px] text-[#ccc] font-LexendDeca">
                    {info?.followersCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
                    Followers
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-[20px] shrink">
                <Pressable
                  className="w-[100px] items-center justify-center rounded-[6px] border-[#16783A] border-[1px]"
                  style={{ paddingVertical: 7.5, width: 100 }}
                >
                  <Text className="text-white font-LexendDeca text-[8.5px]">
                    Share Profile
                  </Text>
                </Pressable>
                <Pressable
                  className="w-[100px] items-center justify-center rounded-[6px] border-[#16783A] border-[1px] bg-[#16783A]"
                  style={{ paddingVertical: 7.5, width: 100 }}
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/editProfile",
                      params: {
                        avatar: info?.profilePictureUrl,
                        username: info?.username,
                        bio: info?.bio,
                        email: info?.email,
                        phoneNumber: info?.phoneNumber,
                      },
                    })
                  }
                >
                  <Text className="text-white font-LexendDeca text-[8.5px]">
                    Edit Profile
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View>
            <Text className="text-[8px] font-LexendDeca text-[#ccc]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </Text>
          </View>
          <Pressable className="mt-[16px] py-[8px] px-[16px] rounded-[6px] border-[1px] border-[#16783A] flex-row items-center justify-between">
            <View className="flex-row items-center gap-[12px]">
              <Feather name="share-2" size={20} color="#fff" />
              <Text className="text-[#fff] text-[8.5px] font-LexendDeca">
                Invite Friends
              </Text>
            </View>
            <AntDesign name="arrowright" size={20} color="#ccc" />
          </Pressable>
        </View>
      </Animated.View>
    );
  },
);

const TabScene = memo(
  ({ route, scrollY, id }: { route: any; scrollY: any; id: string }) => {
    const contentContainerStyle = {
      paddingTop: HEADER_HEIGHT, // Space for the header
      minHeight: Dimensions.get("window").height + HEADER_HEIGHT,
    };

    if (route.title == "Posts") {
      return (
        <AllPostsList
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
          userId={id}
        />
      );
    }

    return (
      <View style={contentContainerStyle}>
        <View style={{ padding: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontFamily: "LexendDeca",
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            {route.title} coming soon
          </Text>
        </View>
      </View>
    );
  },
);

const Profile = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Posts" },
    { key: "second", title: "Favorites" },
  ]);

  const [user, setUser] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const renderScene = ({ route }: { route: any }) => (
    <TabScene route={route} scrollY={scrollY} id={user._id} />
  );

  const renderTabBar = (props: any) => (
    <Animated.View
      style={{
        zIndex: 1,
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [0, HEADER_HEIGHT],
              outputRange: [HEADER_HEIGHT, 0],
              extrapolate: "clamp",
            }),
          },
        ],
      }}
    >
      <TabBar
        {...props}
        style={{ backgroundColor: "#121212" }}
        indicatorStyle={{ backgroundColor: "#16783A" }}
        activeColor="#16783A"
        inactiveColor="gray"
        renderTabBarItem={(props) => (
          <TabBarItem
            {...props}
            key={props.key}
            // key={props.key}
            labelStyle={{
              fontSize: 12,
              fontFamily: "LexendDeca-Medium",
            }}
          />
        )}
      />
    </Animated.View>
  );

  const getUserProfile = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/profile`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching blips:", error);
    }
  }, []);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await getUser();
        setUser(user);
      } catch (e) {
        console.log("error getting user info");
      }
    };

    getUserInfo();
  }, []);

  useEffect(() => {
    if (isFocused) getUserProfile();
  }, [isFocused]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View
        style={{
          height: statusBarHeight,
          padding: 20,
          backgroundColor: "#121212",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          justifyContent: "center",
        }}
      ></View>

      {/* Main Static Header */}
      <View
        style={{
          // height: 0,
          paddingVertical: 20,
          paddingHorizontal: 16,
          backgroundColor: "#121212",
          zIndex: 3,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View className="flex-row items-center gap-[8px]">
          <TouchableOpacity className="" onPress={() => router.back()}>
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.username}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 23,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(root)/orders/orders")}
            className="items-center gap-[2px]"
          >
            <Image
              source={require("../../../assets/icons/orders.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
            <Text className="font-LexendDecaLight text-[8px] text-[#ccc] ">
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => null}
            className="items-center gap-[2px]"
          >
            <Image
              source={require("../../../assets/icons/settings.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
            <Text className="font-LexendDecaLight text-[8px] text-[#ccc] ">
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Collapsible Header */}
        <CollapsibleHeader scrollY={scrollY} info={profile} />

        {/* Tab View */}
        <TabView
          lazy={true}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userMetadata: {
    gap: 5,
  },
  userName: {
    fontSize: 18,
    color: "#ccc",
    fontFamily: "LexendDeca-Medium",
  },
});

export default Profile;
