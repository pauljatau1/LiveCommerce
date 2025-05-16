import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Platform,
  useWindowDimensions,
  StyleSheet,
  Dimensions,
} from "react-native";
import React, { memo, useCallback, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";
import HomeHeader from "@/components/home/home-header";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { TabBar, TabBarItem, TabView } from "react-native-tab-view";
import CatalogCard from "@/components/catalog/catalogCard";
import CatalogComponent from "@/components/catalog/catalogComponent";
import LiveStreamCatalog from "@/components/catalog/liveStreamCatalog";
import SellerCatalog from "@/components/catalog/SellerCatalog";

const { width } = Dimensions.get("window");

const CatalogPage = () => {
  const { id, searchTab } = useLocalSearchParams();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(
    searchTab ? parseInt(searchTab?.toString()) : 0,
  );
  const [routes] = useState([
    { key: "Auqli Live", title: "Auqli Live" },
    { key: "Products", title: "Products" },
    { key: "Sellers", title: "Sellers" },
  ]);

  const renderScene = useCallback(
    ({ route }: { route: any }) => {
      switch (route.key) {
        case "Auqli Live":
          return <LiveStreamCatalog query={id} />;
        case "Products":
          return <CatalogComponent searchQuery={id} />;
        case "Sellers":
          return <SellerCatalog query={id} />;

        default:
          return null;
      }
    },
    [id],
  );
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="mt-[30px]">
        <CatalogHeader searchQuery={id} searchTab={index} />
      </View>

      <TabView
        animationEnabled
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled={true}
            activeColor="#fff"
            inactiveColor="#ccc"
            tabStyle={{
              width: width / 3 - 8,
              paddingHorizontal: 4,
            }}
            style={{
              backgroundColor: "#121212",
              borderBottomColor: "#888787",
              borderBottomWidth: StyleSheet.hairlineWidth,
              marginTop: 10,
            }}
            contentContainerStyle={{
              paddingHorizontal: 8,
              justifyContent: "center",
            }}
            indicatorStyle={{
              backgroundColor: "#fff",
              height: 1,
            }}
            indicatorContainerStyle={{
              backgroundColor: "#121212",
              marginLeft: 4,
            }}
            renderTabBarItem={(props) => (
              <TabBarItem
                {...props}
                key={props.key}
                labelStyle={{
                  fontSize: 15,
                  fontFamily: "LexendDeca-Medium",
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
    </SafeAreaView>
  );
};

const CatalogHeader = memo(
  ({
    searchQuery,
    searchTab,
  }: {
    searchQuery: string | string[];
    searchTab: number;
  }) => {
    return (
      <View className="flex-row items-center justify-between w-full px-[23px] gap-[10px]">
        <Pressable onPress={() => router.back()} style={{ marginLeft: -8 }}>
          <Entypo name="chevron-left" size={24} color="#fff" />
        </Pressable>
        <Pressable
          className="flex-row w-full px-[12px] items-center gap-[5px] shrink"
          style={{
            borderRadius: 15,
            // borderWidth: 1,
            // borderColor: keyboardFocused ? "#16783A" : "#c6c6c6",
            backgroundColor: "#232323",
            paddingVertical: 13,
          }}
          onPress={() =>
            router.push({
              pathname: "/(root)/(modals)/search",
              params: { searchTab, prevQuery: searchQuery },
            })
          }
        >
          <EvilIcons
            name="search"
            size={20}
            color="#909090"
            className={Platform.OS === "android" ? "mt-[-2px]" : ""}
          />
          <Text className="text-[14px] text-[#fff] font-LexendDecaLight">
            {searchQuery}
          </Text>
        </Pressable>
      </View>
    );
  },
);

export default CatalogPage;
