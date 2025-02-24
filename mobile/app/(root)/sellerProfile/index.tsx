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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AllPostsList from "@/components/profile/myPostsList";
import { router, useLocalSearchParams } from "expo-router";
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

const HEADER_HEIGHT = 450;
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
              <Text style={styles.infoBubbleText}>Lagos, Nigeria</Text>
            </View>
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
          <Text style={styles.bio}>
            {seller?.storeInfo?.aboutStore?.slice(0, 170)}
          </Text>
          <View style={styles.policyContainer}>
            <View style={[styles.policyCard, { backgroundColor: "#DEFFEE" }]}>
              <Text style={styles.policyTextLabel}>Free Shipping</Text>
              <Text style={styles.policyTextValue}> Over N5000</Text>
            </View>
            <View style={[styles.policyCard, { backgroundColor: "#E1E8FF" }]}>
              <Text style={styles.policyTextLabel}>Refund</Text>
              <Text style={styles.policyTextValue}>5-10 Days</Text>
            </View>
            <View style={[styles.policyCard, { backgroundColor: "#FFE6E4" }]}>
              <Text style={styles.policyTextLabel}>Return</Text>
              <Text style={styles.policyTextValue}> Within 30 Days</Text>
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
      case "Posts":
        return (
          <AllPostsList
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            userId={id}
            type="Seller"
            index={index}
          />
        );
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
  const { sellerId, sellerAvatar } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Posts" },
    { key: "second", title: "Shop" },
    { key: "third", title: "Blips" },
    { key: "fourth", title: "Shows" },
    { key: "fifth", title: "Reviews" },
  ]);

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

  const getSellerProfile = useCallback(async () => {
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
  }, []);

  const handleGetConversations = async () => {
    try {
      const token = await getToken();
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
    try {
      const user = await getUser();
      const token = await getToken();
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
    handleGetConversations();
  }, [sellerId]);

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
        </View>
        <View
          className="flex-row items-center gap-[8px]"
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

          <View>
            <Text style={styles.userName}>{storeName}</Text>
          </View>

          {seller?.reviews?.averageRating > 0 && (
            <View className="flex-row items-center gap-[4px]">
              <Text className="text-white font-LexendDeca text-[14px]">
                {seller?.reviews?.averageRating}
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
            onPress={() => null}
            className="items-center gap-[2px]"
          >
            <MaterialCommunityIcons
              name="dots-vertical-circle-outline"
              size={24}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Collapsible Header */}
        <CollapsibleHeader
          scrollY={scrollY}
          info={profile}
          seller={seller}
          handleSendMessage={handleSendMessage}
          sellerId={sellerId?.toString()}
        />

        {/* Tab View */}
        <TabView
          lazy={true}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={handleIndexChange}
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
    paddingVertical: 20,
    gap: 10,
    flexWrap: "wrap",
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  policyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    flexWrap: "wrap",
  },
  policyCard: {
    borderRadius: 6,
    padding: 4,
    gap: 2,
    alignItems: "center",
    minWidth: 80,
  },
  policyTextLabel: {
    color: "#3A3A3A",
    fontSize: 10,
    fontFamily: "LexendDeca",
  },
  policyTextValue: {
    color: "#3A3A3A",
    fontSize: 8,
    fontFamily: "LexendDeca-Light",
  },
});

export default SellerProfile;
