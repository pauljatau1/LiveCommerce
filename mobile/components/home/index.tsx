import { View, Text, FlatList } from "react-native";
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

const Home = () => {
  const tabBarHeight = useBottomTabBarHeight();

  const [selected, setSelected] = useState("Auqli Live");
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

  return (
    <View className="pt-[30px]">
      <HomeHeader />
      <Tags tags={tags} selected={selected} setSelected={setSelected} />
      <ScrollView
        className=""
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 20,
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
    </View>
  );
};

export default Home;
