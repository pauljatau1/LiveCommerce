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
  ScrollView,
} from "react-native";
import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
  useMemo,
} from "react";
// import { ScrollView } from "react-native-virtualized-view";
import { TabView, TabBar, TabBarItem } from "react-native-tab-view";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AllPostsList from "@/components/profile/myPostsList";
import { Link, router, useLocalSearchParams } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import { getToken, getUser } from "@/store/features/auth/utils";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate } from "@/helpers/helpers";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Shops from "@/components/sellerProfile/shops";
import Blips from "@/components/sellerProfile/blips";
import ReviewsPage from "../reviews/[id]";
import SellerReviews from "@/components/sellerProfile/reviews";
import Shows from "@/components/sellerProfile/shows";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { MaterialIcons } from "@expo/vector-icons";
import { useShareAppLinks } from "@/hooks/useShareAppLinks";

const HEADER_HEIGHT = 0;
const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView,
);

const CollapsibleHeader = memo(
  ({
    scrollY,
    info,
    seller,
    handleSendMessage,
    sellerId,
  }: {
    scrollY: any;
    info: any;
    seller: any;
    handleSendMessage: any;
    sellerId: string;
  }) => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [0, -HEADER_HEIGHT],
      extrapolate: "clamp",
    });

    const [isFollowing, setFollowing] = useState<boolean>(
      seller?.storeInfo?.isFollowing,
    );

    const handleFollow = async () => {
      setFollowing(true);
      const token = await getToken();
      try {
        const response = await axios.post(
          process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${sellerId}`,
          {},
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );
      } catch (error) {
        console.error("Error following seller:", error);
      }
    };

    const handleUnFollow = async () => {
      setFollowing(false);
      const token = await getToken();
      try {
        const response = await axios.delete(
          process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${sellerId}`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );
      } catch (error) {
        console.error("Error following seller:", error);
      }
    };

    useEffect(() => {
      setFollowing(seller?.storeInfo?.isFollowing);
    }, [seller]);

    console.log(seller?.sellerInfo?.isFollowing);

    return (
      <Animated.View
        style={{
          // height: HEADER_HEIGHT,
          // position: "absolute",
          // top: 0,
          // left: 0,
          // right: 0,
          // transform: [{ translateY: headerTranslateY }],
          backgroundColor: "#121212",
          zIndex: 1,
          marginBottom: 20,
        }}
      >
        <View style={{ flex: 1, paddingTop: 0 }}>
          <View style={styles.banner}>
            <Image
              source={{ uri: seller?.storeInfo?.storeBanner?.url }}
              style={styles.bannerImage}
            />
            <View style={styles.profilePictureContainer}>
              <Image
                source={{ uri: seller?.storeInfo?.storeAvatar?.url }}
                style={styles.profilePicture}
              />
            </View>
          </View>
          <View style={styles.actions}>
            {isFollowing ? (
              <Pressable style={styles.followAction} onPress={handleUnFollow}>
                <Text style={styles.actionsText}>unfollow</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.followAction} onPress={handleFollow}>
                <Text style={styles.actionsText}>follow</Text>
              </Pressable>
            )}

            <Pressable style={styles.messageAction} onPress={handleSendMessage}>
              <Text style={styles.actionsText}>Send a Message</Text>
            </Pressable>
          </View>
          <View style={styles.infoContainer}>
            {seller?.storeInfo?.isVerified && (
              <View style={styles.infoBubble}>
                <Image
                  source={require("../../../assets/icons/elements.png")}
                  style={styles.infoBubbleImage}
                />
                <Text style={styles.infoBubbleText}>Verified</Text>
              </View>
            )}

            <View style={styles.infoBubble}>
              <Image
                source={require("../../../assets/icons/calendar.png")}
                style={styles.infoBubbleImage}
              />
              <Text style={styles.infoBubbleText}>
                Joined {formatDate(seller?.storeInfo?.joinedDate, "MMMM YYYY")}
              </Text>
            </View>
            <View style={styles.infoBubble}>
              <Image
                source={require("../../../assets/icons/location.png")}
                style={styles.infoBubbleImage}
              />
              <Text style={styles.infoBubbleText}>
                {seller?.location?.state
                  ? seller?.location?.state + ", " + seller?.location?.country
                  : "Lagos, Nigeria"}
              </Text>
            </View>

            {seller?.storeInfo?.socialMedia?.instagram ||
            seller?.storeInfo?.socialMedia?.facebook ||
            seller?.storeInfo?.socialMedia?.tiktok ? (
              <View style={styles.socialContainer}>
                {seller?.storeInfo?.socialMedia?.facebook && (
                  <Link href={`${seller?.storeInfo?.socialMedia?.facebook}`}>
                    <View style={[styles.socialCard]}>
                      <MaterialIcons name="facebook" size={12} color="white" />
                    </View>
                  </Link>
                )}
                {seller?.storeInfo?.socialMedia?.instagram && (
                  <Link href={`${seller?.storeInfo?.socialMedia?.instagram}`}>
                    <View style={[styles.socialCard]}>
                      <AntDesign name="instagram" size={12} color="white" />
                    </View>
                  </Link>
                )}
                {seller?.storeInfo?.socialMedia?.tiktok && (
                  <Link href={`${seller?.storeInfo?.socialMedia?.tiktok}`}>
                    <View style={[styles.socialCard]}>
                      <MaterialIcons name="tiktok" size={12} color="white" />
                    </View>
                  </Link>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {seller?.stats?.totalStreams}
              </Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{seller?.stats?.soldItems}</Text>
              <Text style={styles.statLabel}>Items Sold</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {seller?.stats?.followingCount || 0}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={[styles.stat, { borderRightWidth: 0 }]}>
              <Text style={styles.statValue}>
                {seller?.stats?.followersCount || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
          {seller?.storeInfo?.aboutStore && (
            <Text style={styles.bio} numberOfLines={6}>
              {seller?.storeInfo?.aboutStore}
            </Text>
          )}

          <View style={[styles.policyContainer]}>
            <View style={[styles.policyCard, { backgroundColor: "#DEFFEE" }]}>
              <Feather name="truck" size={14} color="black" />
              <View style={styles.policyText}>
                <Text style={styles.policyTextLabel}>Free Shipping</Text>
                <Text style={styles.policyTextValue}>
                  {seller?.storePolicies?.delivery?.freeShippingPolicy?.replaceAll(
                    "_",
                    " ",
                  )}
                </Text>
              </View>
            </View>

            <View style={[styles.policyCard, { backgroundColor: "#E1E8FF" }]}>
              <Image
                source={require("../../../assets/icons/cod.png")}
                contentFit="contain"
                style={{
                  width: 14,
                  height: 14,
                }}
              />
              <View style={styles.policyText}>
                <Text style={styles.policyTextLabel}>Pay on Delivery</Text>
                <Text style={styles.policyTextValue}>
                  {/* {seller?.storePolicies?.delivery?.allowsCod
                    ? "Available"
                    : "unavailable"} */}
                  Coming Soon
                </Text>
              </View>
            </View>
            <View style={[styles.policyCard, { backgroundColor: "#FFE6E4" }]}>
              <Image
                source={require("../../../assets/icons/return-icon.png")}
                contentFit="contain"
                style={{
                  width: 14,
                  height: 14,
                }}
              />
              <View style={styles.policyText}>
                <Text style={styles.policyTextLabel}>Return</Text>
                <Text style={styles.policyTextValue}>
                  {" "}
                  Within {seller?.storePolicies?.returns?.returnWindow} Days
                </Text>
              </View>
            </View>
          </View>
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
    storeName,
    storeAvatar,
  }: {
    route: any;
    scrollY: any;
    id: string;
    index: number;
    storeName: string;
    storeAvatar: string;
  }) => {
    const contentContainerStyle = {
      paddingTop: HEADER_HEIGHT, // Space for the header
      minHeight: Dimensions.get("window").height + HEADER_HEIGHT,
    };

    switch (route.title) {
      case "Shop":
        return (
          <Shops
            sellerId={id}
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            index={index}
          />
        );
      case "Blips":
        return (
          <Blips
            sellerId={id}
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            index={index}
          />
        );
      case "Shows":
        return (
          <Shows
            sellerId={id}
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            index={index}
          />
        );
      case "Reviews":
        return (
          <SellerReviews
            sellerId={id}
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            index={index}
            storeAvatar={storeAvatar}
            storeName={storeName}
          />
        );
      default:
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
    }
  },
);

const SellerProfile = () => {
  const { user } = useSelector((state: RootState) => state.authState);
  const { sellerId, itmSource } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    // { key: "first", title: "Posts" },
    { key: 1, title: "Shop" },
    { key: 2, title: "Blips" },
    { key: 3, title: "Shows" },
    { key: 4, title: "Reviews" },
  ]);

  const { displayShareDialog } = useShareAppLinks();

  const shareLinkUrl = useMemo(
    () =>
      // `https://app.auqli.live/sellerProfile?sellerId=${sellerId}&itmSource=share`,
      `https://app.auqli.live/s/${sellerId}B`,
    [sellerId],
  );

  const [seller, setSeller] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const [conversations, setConversations] = useState<any[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const renderScene = ({ route }: { route: any }) => (
    <TabScene
      route={route}
      scrollY={scrollY}
      id={sellerId?.toString()}
      index={index}
      storeName={storeName}
      storeAvatar={seller?.storeInfo?.storeAvatar?.url}
    />
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
        key={props.key}
        style={{ backgroundColor: "#121212" }}
        indicatorStyle={{ backgroundColor: "#16783A" }}
        activeColor="#16783A"
        inactiveColor="gray"
        renderTabBarItem={(props) => (
          <TabBarItem
            {...props}
            key={props.key}
            labelStyle={{
              fontSize: 12,
              fontFamily: "LexendDeca-Medium",
            }}
          />
        )}
      />
    </Animated.View>
  );

  const getSellerProfile = async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/seller/${sellerId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setSeller(response.data);
    } catch (error) {
      console.error("Error fetching blips:", error);
    }
  };

  const handleGetConversations = async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setConversations(response.data.conversations);
    } catch (e) {
      console.log("unable to get conversations in product details page", e);
    }
  };

  const handleSendMessage = async () => {
    const token = await getToken();
    try {
      router.push({
        pathname: `../(root)/messageRoom/${sellerId}`,
        params: {
          name: storeName,
          avatar: seller?.storeInfo?.storeAvatar?.url,
          conversationId:
            conversations?.find((convo) => convo.participant.id == sellerId)
              ?._id || "",
          userId: user?._id,
          token: token,
          model: "Seller",
        },
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getSellerProfile();
  }, [sellerId]);

  useEffect(() => {
    if (isFocused) handleGetConversations();
  }, [isFocused]);

  const storeName = useMemo(() => {
    return (
      seller?.storeInfo?.storeName ||
      seller?.storeInfo?.businessName ||
      seller?.businessInfo?.businessName ||
      (seller?.personalInfo?.firstName
        ? seller?.personalInfo?.firstName + " " + seller?.personalInfo?.lastName
        : "") ||
      ""
    );
  }, [seller]);

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    scrollY.setValue(0);
  };

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
          paddingBottom: 15,
          paddingHorizontal: 16,
          backgroundColor: "#121212",
          zIndex: 3,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <TouchableOpacity
          className=""
          onPress={() => {
            if (itmSource?.toString() == "share") {
              return router.push("/(root)/(tabs)/home/home");
            }
            router.back();
          }}
          // style={{
          //   position: "absolute",
          //   left: 12,
          // }}
        >
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>
        <View
          className="flex-row items-center gap-[8px] shrink"
          style={{ alignItems: "center" }}
        >
          {seller?.storeInfo?.isFeatured && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 2.5,
                backgroundColor: "#E8C300",
              }}
            >
              <Text className="font-LexendDeca text-[6px] ">Top seller</Text>
            </View>
          )}

          <View className="shrink">
            <Text style={styles.userName} numberOfLines={1}>
              {storeName}
            </Text>
          </View>

          {seller?.reviews?.averageRating > 0 && (
            <View className="flex-row items-center gap-[4px]">
              <Text className="text-white font-LexendDeca text-[14px]">
                {seller?.reviews?.averageRating?.toFixed(1)}
              </Text>
              <AntDesign name="star" size={14} color="#FFD700" />
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 23,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              displayShareDialog(shareLinkUrl);
            }}
            className="items-center gap-[2px]"
          >
            <Entypo name="share" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        stickyHeaderIndices={[1]}
        style={{ flex: 1 }}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Collapsible Header */}
        <CollapsibleHeader
          scrollY={scrollY}
          info={profile}
          seller={seller}
          handleSendMessage={handleSendMessage}
          sellerId={sellerId?.toString()}
        />

        <View
          className="flex-row items-center justify-between px-[16px] gap-[40px] bg-[#121212]"
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
              className={`py-[4px] pb-[16px] px-[8px] ${index == ind ? "border-b-[1px] border-b-white" : ""}`}
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

        {/* Tab View */}
        {/* <TabView
          lazy={true}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        /> */}
      </ScrollView>
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
  banner: {
    width: "100%",
    height: 140,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  profilePictureContainer: {
    position: "absolute",
    left: 28,
    bottom: -45,
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  profilePicture: {
    width: 85,
    height: 85,
    borderRadius: 85,
  },
  actions: {
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  followAction: {
    width: 100,
    paddingVertical: 7.5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#16783A",
    justifyContent: "center",
    alignItems: "center",
  },
  messageAction: {
    width: 100,
    paddingVertical: 7.5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#16783A",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16783A",
  },
  actionsText: {
    color: "#fff",
    fontFamily: "LexendDeca",
    fontSize: 10,
  },
  infoContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 15,
    gap: 5,
    flexWrap: "wrap",
    // backgroundColor: "red",
  },
  infoBubble: {
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  infoBubbleText: {
    color: "#fff",
    fontFamily: "LexendDeca",
    fontSize: 8,
  },
  infoBubbleImage: {
    width: 11,
    height: 11,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  stat: {
    borderRightColor: "rgba(255, 255, 255, 0.16)",
    borderRightWidth: 1,
    width: "30%",
    gap: 4,
    alignItems: "center",
    flexShrink: 1,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.63)",
    fontFamily: "LexendDeca",
    fontSize: 11,
  },
  statValue: {
    color: "#fff",
    fontFamily: "LexendDeca",
    fontSize: 14.5,
  },
  bio: {
    paddingHorizontal: 16,
    color: "#ccc",
    fontFamily: "LexendDeca",
    fontSize: 12,
    marginBottom: 15,
  },
  policyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    // flexWrap: "wrap",
  },
  policyCard: {
    borderRadius: 6,
    padding: 4,
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
    flexBasis: "33%",
    flexShrink: 1,
  },
  policyText: {},
  policyTextLabel: {
    color: "#3A3A3A",
    fontSize: 10,
    fontFamily: "LexendDeca-SemiBold",
  },
  policyTextValue: {
    color: "#3A3A3A",
    fontSize: 8,
    fontFamily: "LexendDeca",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    // paddingHorizontal: 32,
    marginBottom: 15,
    // flexWrap: "wrap",
  },
  socialCard: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(54, 54, 54, 0.69)",
    // flexBasis: "50%",
  },
  socialText: {
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "LexendDeca-SemiBold",
  },
});

export default SellerProfile;
