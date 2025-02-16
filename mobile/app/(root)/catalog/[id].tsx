import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import React, { memo, useCallback, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router, useGlobalSearchParams } from "expo-router";
import HomeHeader from "@/components/home/home-header";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { TabBar, TabBarItem, TabView } from "react-native-tab-view";
import CatalogCard from "@/components/catalog/catalogCard";
import CatalogComponent from "@/components/catalog/catalogComponent";

const CatalogPage = () => {
  const { id } = useGlobalSearchParams();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "Auqli Live", title: "Auqli Live" },
    { key: "Products", title: "Products" },
  ]);

  const renderScene = useCallback(({ route }: { route: any }) => {
    switch (route.key) {
      case "Auqli Live":
        return (
          <View className="px-[23px] mt-[20px]">
            <Text className="text-white self-center font-LexendDeca">
              No lives right now
            </Text>
          </View>
        );
      case "Products":
        return <CatalogComponent searchQuery={id} />;

      default:
        return null;
    }
  },[]);
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="mt-[30px]">
        <CatalogHeader searchQuery={id} />
      </View>

      <TabView
        animationEnabled
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled={true}
            activeColor="#16783A"
            inactiveColor="#ccc"
            tabStyle={{
              width: "auto",
              paddingHorizontal: 4,
            }}
            style={{
              backgroundColor: "#121212",
              borderBottomColor: "#888787",
              borderBottomWidth: StyleSheet.hairlineWidth,
              marginTop: 10,
            }}
            contentContainerStyle={{
              marginLeft: 23,
            }}
            indicatorStyle={{
              backgroundColor: "#16783A",
            }}
            indicatorContainerStyle={{
              backgroundColor: "#121212",
              marginLeft: 23,
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

const CatalogHeader = memo(({ searchQuery }: { searchQuery: string | string[] }) => {
  return (
    <View className="flex-row items-center justify-between w-full px-[23px] gap-[10px]">
      <Pressable onPress={() => router.back()} style={{ marginLeft: -8 }}>
        <Entypo
          name="chevron-left"
          size={24}
          color="rgba(204, 204, 204, 0.8)"
        />
      </Pressable>
      <Pressable
        className="flex-row w-full px-[12px] items-center gap-[5px] shrink"
        style={{
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#c6c6c6",
          paddingVertical: 12,
        }}
        onPress={() => router.push("/(root)/(modals)/search")}
      >
        <EvilIcons
          name="search"
          size={24}
          color="#888787"
          className={Platform.OS === "android" ? "mt-[-4px]" : ""}
        />
        <Text className="text-[14px] text-[#888787] font-LexendDecaLight">
          {searchQuery}
        </Text>
      </Pressable>
    </View>
  );
});

export default CatalogPage;
