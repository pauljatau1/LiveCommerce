import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllPostsQuery } from "@/services/posts";
import { Pressable, TextInput } from "react-native-gesture-handler";
import AntDesign from "@expo/vector-icons/AntDesign";
import AllPostsList from "@/components/connect/all-posts-list";
import NewPostsList from "@/components/connect/new-posts-list";
import TrendingPostsList from "@/components/connect/trending-posts-list";
import { router } from "expo-router";
import { TabBar, TabBarItem, TabView } from "react-native-tab-view";

const tabs = ["All", "New", "Trending"];
const { width, height } = Dimensions.get("window");
const Connect = () => {
  const {
    data: posts,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllPostsQuery({});
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<string>("All");
  const [routes] = useState([
    { key: "All", title: "All" },
    { key: "New", title: "New" },
    { key: "Trending", title: "Trending" },
    // { key: "Featured", title: "Featured" },
    // { key: "Coming", title: "Coming" },
  ]);

  const renderScene = ({ route }: { route: any }) => {
    switch (route.key) {
      case "All":
        return <AllPostsList />;

      case "New":
        return <NewPostsList />;
      case "Trending":
        return <TrendingPostsList />;
      default:
        null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "All":
        return <AllPostsList />;
      case "New":
        return <NewPostsList />;
      case "Trending":
        return <TrendingPostsList />;
    }
  };
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView
        className="h-full flex-1 bg-[#121212]"
        style={{
          minHeight: height,
        }}
      >
        <View className="h-full flex-1 pt-[30px] px-[16px]">
          <View style={styles.header}>
            <Text className="text-[24px] font-LexendDecaSemiBold text-[#ccc]">
              Auqli Connect
            </Text>

            <View
              className=""
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 20,
              }}
            >
              <Pressable style={styles.headerBtn}>
                <Image
                  source={require("../../../assets/icons/connect-search.png")}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                  resizeMode="cover"
                />
                <Text className="text-[7px] text-[#94A3B1] font-LexendDeca">
                  Search
                </Text>
              </Pressable>
              <Pressable style={styles.headerBtn}>
                <Image
                  source={require("../../../assets/icons/animoji.png")}
                  style={{
                    width: 33,
                    height: 33,
                  }}
                  resizeMode="cover"
                />
                <Text className="text-[7px] text-[#94A3B1] ">Profile</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Whats on your mind?"
                placeholderTextColor={"#ccc"}
                style={styles.input}
              />
            </View>

            <View style={styles.search}>
              <Pressable
                style={styles.post}
                onPress={() => router.push("/createPosts/createPost")}
              >
                <AntDesign name="plus" size={18} color="black" />
              </Pressable>
              <Text className="text-[7.5px] font-LexendDeca text-[#94A3B1]">
                Post
              </Text>
            </View>
          </View>

          <TabView
            lazy={true}
            renderTabBar={(props) => (
              <TabBar
                key={1}
                {...props}
                scrollEnabled={true}
                activeColor="#16783A"
                inactiveColor="#ccc"
                tabStyle={{
                  width: (width - 32) / 3,
                  // width: "auto",
                  // paddingHorizontal: 10,
                }}
                style={{
                  backgroundColor: "red",
                  // marginLeft: 23,
                  borderBottomColor: "#ccc",
                  borderBottomWidth: 0.4,
                  marginTop: -15,
                }}
                indicatorStyle={{
                  backgroundColor: "#16783A",
                }}
                indicatorContainerStyle={{
                  backgroundColor: "#121212",
                }}
                renderTabBarItem={(props) => (
                  <TabBarItem
                    {...props}
                    labelStyle={{
                      fontSize: 12,
                      fontFamily: "LexendDeca",
                    }}
                  />
                )}
              />
            )}
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
          />

          {/* <View className="flex-row items-center justify-between border-b-[1px] border-b-[#C6C6C6]">
            {tabs?.map((tab, index) => (
              <TouchableOpacity
                style={[styles.tab, activeTab == tab && styles.activeTab]}
                key={index}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab == tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderContent()} */}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  headerBtn: {
    gap: 6,
    alignItems: "center",
  },
  inputContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: "#ccc",
    borderWidth: 0.3,
    borderRadius: 2,
    width: "100%",
    flexShrink: 1,
  },
  input: {
    fontFamily: "LexendDeca-Light",
    fontSize: 12,
    color: "white",
    textAlignVertical: "center",
    padding: 0,
  },
  searchSection: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    width: "100%",
    // backgroundColor: "red",
    position: "relative",
    marginBottom: 25,
  },
  search: {
    gap: 4,
    alignItems: "center",
    width: 30,
  },
  post: {
    width: 28.5,
    height: 28.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 8,
  },
  tab: {
    paddingBottom: 11,
    paddingHorizontal: 10,
    width: 80,
  },
  activeTab: {
    borderBottomColor: "#16783A",
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
    fontFamily: "LexendDeca",
    color: "white",
    textAlign: "center",
  },
  activeTabText: {
    color: "#16783A",
    fontFamily: "LexendDeca-Medium",
  },
});

export default Connect;
