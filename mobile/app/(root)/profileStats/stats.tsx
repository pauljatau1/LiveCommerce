import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Image } from "expo-image";
import Entypo from "@expo/vector-icons/Entypo";
import { FlatList, TextInput } from "react-native-gesture-handler";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { ActivityIndicator } from "react-native-paper";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const ProfileStats = () => {
  const { username, activeTab } = useLocalSearchParams();
  const searchTerm = useRef("");
  const [searchState, setSearchState] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>(activeTab?.toString());
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number | null>();
  const [following, setFollowing] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState<number | null>();
  const [filteredfollowers, setfilteredfollowers] = useState<any[]>([]);
  const [filteredfollowing, setfilteredFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const handleGetFollowers = async () => {
    try {
      setFetching(true);

      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/buyer/followers?page=${page}&limit=${20}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setFollowers(response.data.followers);
      setfilteredfollowers(response.data.followers);
      setFollowersCount(response.data.pagination.total);
    } catch (e) {
      console.log("error getting followers", e);
    }
  };

  const handleGetFollowing = async () => {
    try {
      setFetching(true);

      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/buyer/following?page=${page}&limit=${20}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setFollowing(response.data.following);
      setfilteredFollowing(response.data.following);
      setFollowingCount(response.data.pagination.total);
    } catch (e) {
      console.log("error getting following", e);
    }
  };

  const filterFollowing = () => {
    const filteredFollowing = following.filter(
      (item) =>
        item?.name
          ?.toLowerCase()
          ?.includes(searchTerm.current?.toLowerCase()) ||
        item?.storeName
          ?.toLowerCase()
          ?.includes(searchTerm.current?.toLowerCase()),
    );
    console.log(filteredFollowing);

    setfilteredFollowing(filteredFollowing);
  };

  const filterFollowers = () => {
    const filteredFollowers = followers.filter(
      (item) =>
        item?.name
          ?.toLowerCase()
          ?.includes(searchTerm.current?.toLowerCase()) ||
        item?.storeName
          ?.toLowerCase()
          ?.includes(searchTerm.current?.toLowerCase()),
    );
    setfilteredfollowers(filteredFollowers);
  };

  const handleFollow = async (action: string, item: any) => {
    let method = "";
    if (action == "follow") {
      method = "POST";
    } else {
      method = "DELETE";
    }
    setFollowLoading(item.id);
    const token = await getToken();
    const config = {
      url: process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${item?.id}`,
      method,
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {},
    };
    try {
      const response = await axios(config);
      console.log("follow from profile ", response.data);
      if (action == "follow") {
        setFollowingCount((followingCount || 0) + 1);
        setfilteredFollowing([...following, item]);
      } else {
        setFollowingCount((followingCount || 1) - 1);
        setfilteredFollowing(
          filteredfollowing?.filter((fol: any) => fol?.id !== item?.id),
        );
      }
    } catch (error) {
      console.error("Error following seller:", error);
    } finally {
      setFollowLoading("");
    }
  };

  useEffect(() => {
    handleGetFollowers();
    handleGetFollowing();
  }, []);

  const renderFollowingCard = useCallback(
    ({ item }: { item: any }) => {
      return (
        <Pressable
          style={styles.followingCard}
          onPress={() =>
            router.push({
              pathname: "/(root)/sellerProfile",
              params: { sellerId: item?.id, sellerAvatar: item?.profileImage },
            })
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: item?.profileImage }}
              style={styles.followingImage}
              contentFit="cover"
            />
            <Text style={styles.followingText}>
              {item?.storeName || item?.name}
            </Text>
          </View>
          <Pressable
            className="w-[100px] items-center justify-center rounded-[6px] border-[#16783A] border-[1px]"
            style={{
              height: 31,
              paddingVertical: 7.5,
              width: 100,
              backgroundColor: filteredfollowing?.some(
                (fol: any) => fol?.id == item?.id,
              )
                ? "#121212"
                : "#16783A",
            }}
            onPress={() =>
              handleFollow(
                filteredfollowing?.some((fol: any) => fol?.id == item?.id)
                  ? "unfollow"
                  : "follow",
                item,
              )
            }
          >
            <Text className="text-white font-LexendDeca text-[10px]">
              {followLoading && followLoading == item?.id ? (
                <ActivityIndicator size={10} color="#fff" />
              ) : filteredfollowing?.some((fol: any) => fol?.id == item?.id) ? (
                "Following"
              ) : (
                "Follow"
              )}
            </Text>
          </Pressable>
        </Pressable>
      );
    },
    [selectedTab, filteredfollowing, filteredfollowers, followLoading],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View
        style={{
          paddingVertical: 20,
          paddingHorizontal: 16,
          backgroundColor: "#121212",
          flexDirection: "row",
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
          <Text style={styles.userName}>{username}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={styles.tabLabelContainer}
          onPress={() => setSelectedTab("followers")}
        >
          <Text
            style={
              selectedTab == "followers"
                ? styles.tabLabel
                : styles.inactiveTabLabel
            }
          >
            {followersCount} Followers
          </Text>
          {selectedTab == "followers" && (
            <View style={styles.tabIndicator}></View>
          )}
        </Pressable>
        <Pressable
          style={styles.tabLabelContainer}
          onPress={() => setSelectedTab("following")}
        >
          <Text
            style={
              selectedTab == "following"
                ? styles.tabLabel
                : styles.inactiveTabLabel
            }
          >
            {followingCount} Following
          </Text>
          {selectedTab == "following" && (
            <View style={styles.tabIndicator}></View>
          )}
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Image
          source={require("../../../assets/icons/connect-search.png")}
          style={{
            width: 16,
            height: 16,
          }}
          contentFit="cover"
        />
        <TextInput
          style={styles.input}
          placeholder={
            selectedTab == "following"
              ? " Search Following"
              : "Search Followers"
          }
          value={searchState}
          placeholderTextColor="#ccc"
          onChangeText={(text) => {
            setSearchState(text);
            searchTerm.current = text;
          }}
          onSubmitEditing={() =>
            selectedTab == "following" ? filterFollowing() : filterFollowers()
          }
        />
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={
            selectedTab == "following" ? filteredfollowing : filteredfollowers
          }
          renderItem={renderFollowingCard}
          keyExtractor={(item, index) => item.id || index}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 60,
    borderBottomColor: "#888787",
    borderBottomWidth: 0.3,
  },
  tabLabelContainer: {},
  tabLabel: {
    color: "#fff",
    fontFamily: "LexendDeca",
    fontSize: 14,
    marginBottom: 5,
  },
  inactiveTabLabel: {
    color: "#ccc",
    opacity: 0.45,
    fontFamily: "LexendDeca",
    fontSize: 14,
    marginBottom: 5,
  },
  tabIndicator: {
    width: 40,
    alignSelf: "center",
    height: 2,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  searchContainer: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginVertical: 10,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  input: {
    padding: 0,
    fontSize: 14,
    color: "#fff",
    fontFamily: "LexendDeca",
    width: "100%",
    flexShrink: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  followingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  followingText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 8,
  },
  followingImage: {
    width: 45,
    height: 45,
    borderRadius: 45,
  },
});
export default ProfileStats;
