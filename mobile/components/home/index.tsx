import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import HomeHeader from "./home-header";
import Tags from "../global/tags";
import AuqliLive from "./auqli-live";
import ForYou from "./for-you";
import Featured from "./featured";
import Auctions from "./auctions";
import Coming from "./coming";
import { ScrollView } from "react-native-virtualized-view";
import CustomButton from "../global/button/CustomButton";
import { router, useFocusEffect, useSegments } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { TabView, TabBar, TabBarItem } from "react-native-tab-view";

const Home = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const segments = useSegments();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);

  const [selected, setSelected] = useState("Auqli Live");
  const [routes] = useState([
    { key: "Auqli Live", title: "Auqli Live" },
    { key: "Live Auctions", title: "Auctions" },
    { key: "Featured", title: "Featured" },
    { key: "Upcoming", title: "Coming" },
  ]);
  const tags = ["Auqli Live", "Live Auctions", "Featured", "Upcoming"];

  const renderContent = () => {
    switch (selected) {
      case "Auqli Live":
        return <AuqliLive />;
      // case "For You":
      //   return <ForYou />;
      case "Live Auctions":
        return <Auctions />;
      case "Featured":
        return <Featured />;
      case "Upcoming":
        return <Coming />;
      default:
        return <Text className="text-white">No Content Available</Text>;
    }
  };

  const renderScene = ({ route }: { route: any }) => {
    switch (route.key) {
      case "Auqli Live":
        return (
          <TabWrapper>
            <AuqliLive />
          </TabWrapper>
        );
      case "For You":
        return (
          <TabWrapper>
            <ForYou />
          </TabWrapper>
        );
      case "Auctions":
        return (
          <TabWrapper>
            <Auctions />
          </TabWrapper>
        );
      case "Featured":
        return (
          <TabWrapper>
            <Featured />
          </TabWrapper>
        );
      case "Coming":
        return (
          <TabWrapper>
            <Coming />
          </TabWrapper>
        );
      default:
        return (
          <TabWrapper>
            <Coming />
          </TabWrapper>
        );
    }
  };

  useEffect(() => {
    if (segments[3] === "home") {
      return setSelected("Auqli Live");
    }
  }, [segments]);

  return (
    <View className="pt-[30px] flex-1">
      <HomeHeader />
      <Tags tags={tags} selected={selected} setSelected={setSelected} />
      <ScrollView
        className=""
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      <View
        className=" flex-row justify-around w-[260px] mx-auto absolute bottom-[20px] self-center"
        style={{
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
            },
            android: {
              elevation: 5,
            },
          }),
        }}
      >
        <CustomButton
          title="Live Show"
          className="!w-[130px] !bg-primary-200 rounded-tr-none rounded-br-none"
          onPress={() => {
            router.push("/(root)/(tabs)/home/home");
          }}
        />
        <CustomButton
          title="Markets"
          textStyle="!text-[#141B34]"
          className="!w-[130px] !rounded-tl-none !rounded-bl-none !rounded-[40px]  !bg-[#F2F2F2]"
          onPress={() => {
            router.push("/(root)/(tabs)/home/marketplace");
          }}
        />
      </View>
    </View>
  );
};

const TabWrapper = ({ children }: { children: any }) => {
  return (
    <ScrollView
      className=""
      contentContainerStyle={{
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
      <View className="pb-[50px] flex-row justify-around w-[260px] mx-auto">
        <CustomButton
          title="Live Show"
          className="!w-[130px] !bg-primary-200 rounded-tr-none rounded-br-none"
          onPress={() => {
            router.push("/(root)/(tabs)/home/home");
          }}
        />
        <CustomButton
          title="Markets"
          textStyle="!text-[#141B34]"
          className="!w-[130px] !rounded-tl-none !rounded-bl-none !rounded-[40px]  !bg-[#F2F2F2]"
          onPress={() => {
            router.push("/(root)/(tabs)/home/marketplace");
          }}
        />
      </View>
    </ScrollView>
  );
};

export default Home;
