import {
  View,
  Text,
  Dimensions,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
// import { ScrollView } from "react-native-virtualized-view";
import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
  useMemo,
} from "react";
import { TabView, TabBar, TabBarItem } from "react-native-tab-view";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import AllPostsList from "@/components/profile/myPostsList";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import { getToken, getUser } from "@/store/features/auth/utils";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate, formatNumber } from "@/helpers/helpers";
import BottomSheet from "@/components/global/bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";
import Favorites from "@/components/profile/favorites";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import MyBids from "@/components/profile/myBids";
import PostsComingSoon from "@/components/profile/postsComingSoon";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { ScrollView } from "react-native-virtualized-view";

const HEADER_HEIGHT = 0;
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
          // height: HEADER_HEIGHT,
          // position: "absolute",
          // top: 0,
          // left: 0,
          // right: 0,
          // transform: [{ translateY: headerTranslateY }],
          // zIndex: 1,
          backgroundColor: "#121212",
          marginBottom: 30,
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
                    {formatNumber(info?.postsCount)}
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
                    {formatNumber(info?.followingCount)}
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
                    {formatNumber(info?.followersCount)}
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
                  // onPress={() => router.push(`/welcome`)}
                >
                  <Text className="text-white font-LexendDeca text-[10px]">
                    Share Profile
                  </Text>
                  <Image
                    source={require("../../../assets/icons/coming-soon.png")}
                    style={{
                      width: 56,
                      height: 22,
                      position: "absolute",
                      right: -15,
                      top: -15,
                    }}
                    contentFit="contain"
                  />
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
            {info?.bio && (
              <Text
                className="text-[14px] font-LexendDeca text-[#ccc]"
                style={{ lineHeight: 16 }}
              >
                {info?.bio?.split("\n")?.slice(0, 4)?.join("\n")}
              </Text>
            )}
          </View>
          {/* <Pressable className="mt-[16px] py-[8px] px-[16px] rounded-[6px] border-[1px] border-[#16783A] flex-row items-center justify-between">
            <View className="flex-row items-center gap-[12px]">
              <Feather name="share-2" size={20} color="#fff" />
              <Text className="text-[#fff] text-[8.5px] font-LexendDeca">
                Invite Friends
              </Text>
            </View>
            <AntDesign name="arrowright" size={20} color="#ccc" />
          </Pressable> */}
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
    if (route.title == "Posts") {
      return <PostsComingSoon />;
    } else if (route.title == "My Bids") {
      return (
        <MyBids scrollY={scrollY} headerHeight={HEADER_HEIGHT} index={index} />
      );
    } else if (route.title == "caleb") {
      // return <PostsComingSoon />;
    } else {
      return (
        <Favorites
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
          index={index}
        />
      );
    }
  },
);

const Profile = () => {
  const isFocused = useIsFocused();
  // const insets = useSafeAreaInsets();
  // const statusBarHeight = insets.top;
  const layout = useWindowDimensions();
  const user = useSelector((state: RootState) => state.authState.user);
  const [index, setIndex] = useState(0);
  const routes = useMemo(
    () => [
      { key: 1, title: "My Bids" },
      { key: 2, title: "Favorites" },
      { key: 3, title: "Posts" },
    ],
    [],
  );

  // const [user, setUser] = useState<any>({});
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>({});
  const scrollY = useRef(new Animated.Value(0)).current;
  // const scrollY = useRef(new Animated.Value(0)).current;
  const renderScene = useCallback(({ route }: { route: any }) => {
    return (
      <TabScene
        route={route}
        scrollY={scrollY}
        id={user?._id || ""}
        index={index}
      />
    );
  }, []);

  // const renderTabBar = (props: any) => (
  //   <Animated.View
  //     style={{
  //       zIndex: 1,
  //       transform: [
  //         {
  //           translateY: scrollY.interpolate({
  //             inputRange: [0, HEADER_HEIGHT],
  //             outputRange: [HEADER_HEIGHT, 0],
  //             extrapolate: "clamp",
  //           }),
  //         },
  //       ],
  //     }}
  //   >
  //     <TabBar
  //       {...props}
  //       key={props.key}
  //       style={{ backgroundColor: "#121212" }}
  //       indicatorStyle={{ backgroundColor: "#16783A" }}
  //       activeColor="#16783A"
  //       inactiveColor="gray"
  //       renderTabBarItem={(props) => (
  //         <TabBarItem
  //           {...props}
  //           key={props.key}
  //           labelStyle={{
  //             fontSize: 12,
  //             fontFamily: "LexendDeca-Medium",
  //           }}
  //         />
  //       )}
  //     />
  //   </Animated.View>
  // );

  const getUserProfile = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      return setShowAuthSheet(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/profile`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setProfile(response.data?.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  useEffect(() => {
    console.log("happening");

    if (isFocused) getUserProfile();
  }, [isFocused]);

  // const handleIndexChange = (newIndex: number) => {
  //   setIndex(newIndex);
  //   scrollY.setValue(0);
  // };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      {user?._id && (
        <>
          {/* <View
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
          ></View> */}

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
                gap: 21,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/(root)/wallet")}
                className="items-center gap-[2px]"
                style={{
                  marginRight: 4,
                }}
              >
                <Image
                  source={require("../../../assets/icons/walletIcon.png")}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                />
                <Text className="font-LexendDecaLight text-[8px] text-[#ccc] ">
                  Wallet
                </Text>
              </TouchableOpacity>
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

          <ScrollView
            stickyHeaderIndices={[1]}
            style={{ flex: 1 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            <CollapsibleHeader scrollY={scrollY} info={profile} user={user} />

            <View
              className="flex-row items-center justify-center px-[16px] gap-[50px] bg-[#121212]"
              style={{
                borderBottomColor: "rgba(204, 204, 204, 0.25)",
                borderBottomWidth: 0.5,
                zIndex: 100,
                elevation: 100,
                position: "sticky",
                top: 0,
              }}
            >
              {routes?.map((tab, ind) => (
                <TouchableOpacity
                  onPress={() => setIndex(ind)}
                  className={`py-[4px] pb-[16px] ${index == ind ? "border-b-[1px] border-b-white" : ""}`}
                  key={ind}
                >
                  <Text
                    className={` font-LexendDecaMedium text-[12px] ${index == ind ? "text-white" : "text-[#94A3B1]"}`}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View>{renderScene({ route: routes[index] })}</View>
          </ScrollView>

          {/* <TabView
              lazy
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={handleIndexChange}
              initialLayout={{ width: Dimensions.get("window").width }}
              renderTabBar={renderTabBar}
            /> */}
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
