import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useMemo, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, TextInput } from "react-native-gesture-handler";
import AntDesign from "@expo/vector-icons/AntDesign";
import AllPostsList from "@/components/connect/all-posts-list";
import NewPostsList from "@/components/connect/new-posts-list";
import TrendingPostsList from "@/components/connect/trending-posts-list";
import { router } from "expo-router";
import { TabBar, TabBarItem, TabView, SceneMap } from "react-native-tab-view";

const { width, height } = Dimensions.get("window");
const tabs = ["All", "New", "Trending"];

const Connect = () => {
  const [activeTab, setActiveTab] = useState<string>("All");

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />
        <SafeAreaView
          className="h-full flex-1 bg-[#121212]"
          style={{
            minHeight: height,
          }}
        >
          <View className="h-full flex-1 pt-[20px] px-[16px]">
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

            <View className="flex-row items-center justify-between border-b-[1px] border-b-[#888787]">
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
            {renderContent()}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    marginBottom: 15,
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
