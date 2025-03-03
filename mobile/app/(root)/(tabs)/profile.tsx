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
import BottomSheet from "@/components/global/bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";
import Favorites from "@/components/profile/favorites";

const HEADER_HEIGHT = 250;
const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView,
);

const CollapsibleHeader = memo(
  ({ scrollY, info, user }: { scrollY: any; info: any; user: any }) => {
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
        <View style={{ flex: 1, paddingTop: 0, paddingHorizontal: 16 }}>
          <View className="flex-row gap=[30px]">
            <View className="gap-[8px]">
              <Image
                source={
                  info?.profilePictureUrl
                    ? { uri: `${info.profilePictureUrl}` }
                    : user?.profileImage?.url
                      ? { uri: user?.profileImage?.url }
                      : require("../../../assets/icons/profile.jpg")
                }
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 90,
                  backgroundColor: "#fff",
                }}
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
                  <Text className="text-[18px] text-[#ccc] font-LexendDeca">
                    {info?.postsCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDeca">
                    Posts
                  </Text>
                </View>
                <Pressable
                  className="gap-[4px] items-center"
                  onPress={() =>
                    router.push({
                      pathname: "/profileStats/stats",
                      params: {
                        username: user?.username,
                        activeTab: "following",
                      },
                    })
                  }
                >
                  <Text className="text-[18px] text-[#ccc] font-LexendDeca">
                    {info?.followingCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDeca">
                    Following
                  </Text>
                </Pressable>
                <Pressable
                  className="gap-[4px] items-center"
                  onPress={() =>
                    router.push({
                      pathname: "/profileStats/stats",
                      params: {
                        username: user?.username,
                        activeTab: "followers",
                      },
                    })
                  }
                >
                  <Text className="text-[18px] text-[#ccc] font-LexendDeca">
                    {info?.followersCount}
                  </Text>
                  <Text className="text-[12px] text-[#ccc] font-LexendDeca">
                    Followers
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-center gap-[20px] shrink">
                <Pressable
                  className="w-[100px] items-center justify-center rounded-[6px] border-[#16783A] border-[1px]"
                  style={{ paddingVertical: 7.5, width: 100 }}
                >
                  <Text className="text-white font-LexendDeca text-[10px]">
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
                        firstName: info?.firstName,
                        lastName: info?.lastName,
                      },
                    })
                  }
                >
                  <Text className="text-white font-LexendDeca text-[10px]">
                    Edit Profile
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View>
            <Text
              className="text-[12px] font-LexendDeca text-[#ccc]"
              style={{ lineHeight: 16 }}
            >
              {info?.bio?.split("\n")?.slice(0, 4)?.join("\n")}
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
  ({
    route,
    scrollY,
    id,
    index,
  }: {
    route: any;
    scrollY: any;
    id: string;
    index: number;
  }) => {
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
          type="Buyer"
          index={index}
        />
      );
    }

    return (
      <Favorites scrollY={scrollY} headerHeight={HEADER_HEIGHT} index={index} />
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
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const renderScene = ({ route }: { route: any }) => (
    <TabScene route={route} scrollY={scrollY} id={user._id} index={index} />
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
    if (!token) {
      return setShowAuthSheet(true);
    }
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

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    scrollY.setValue(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      {user?._id && (
        <>
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
              <Text style={styles.userName}>
                {profile?.username || user?.username}
              </Text>
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
                onPress={() => router.push("../../(root)/settings")}
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
            <CollapsibleHeader scrollY={scrollY} info={profile} user={user} />

            <TabView
              lazy={true}
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={handleIndexChange}
              initialLayout={{ width: layout.width }}
              renderTabBar={renderTabBar}
            />
          </View>
        </>
      )}

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => {
          setShowAuthSheet(false);
        }}
        keyboardBehavior="interactive"
      >
        <AuthSheet
          closeSheet={() => {
            setShowAuthSheet(false);
          }}
        />
      </BottomSheet>
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
