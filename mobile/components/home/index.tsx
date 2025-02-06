import { View, Text, FlatList, useWindowDimensions } from "react-native";
import React, { useState } from "react";
import HomeHeader from "./home-header";
import Tags from "../global/tags";
import AuqliLive from "./auqli-live";
import ForYou from "./for-you";
import Featured from "./featured";
import Auctions from "./auctions";
import Coming from "./coming";
import { ScrollView } from "react-native-virtualized-view";
import CustomButton from "../global/button/CustomButton";
import { router } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { TabView, TabBar, TabBarItem } from "react-native-tab-view";

const Home = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);

  const [selected, setSelected] = useState("Auqli Live");
  const [routes] = useState([
    { key: "Auqli Live", title: "Auqli Live" },
    { key: "For You", title: "For You" },
    { key: "Auctions", title: "Auctions" },
    { key: "Featured", title: "Featured" },
    { key: "Coming", title: "Coming" },
  ]);
  const tags = ["Auqli Live", "For You", "Auctions", "Featured", "Coming"];

  const renderContent = () => {
    switch (selected) {
      case "Auqli Live":
        return <AuqliLive />;
      case "For You":
        return <ForYou />;
      case "Auctions":
        return <Auctions />;
      case "Featured":
        return <Featured />;
      case "Coming":
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

  return (
    <View className="pt-[30px] flex-1">
      <HomeHeader />
      <Tags tags={tags} selected={selected} setSelected={setSelected} />
      <ScrollView
        className=""
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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

      {/* <TabView
        animationEnabled={true}
        swipeEnabled={false}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled={true}
            activeColor="#16783A"
            inactiveColor="#ccc"
            tabStyle={{
              width: "auto",
              paddingHorizontal: 10,
            }}
            style={{
              backgroundColor: "#121212",
              marginLeft: 23,
              borderBottomColor: "#ccc",
              borderBottomWidth: 0.3,
              marginTop: 20,
            }}
            contentContainerStyle={{}}
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
      /> */}
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
