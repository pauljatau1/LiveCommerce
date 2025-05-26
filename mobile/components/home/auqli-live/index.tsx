import { View, Text, RefreshControl, Platform } from "react-native";
import React from "react";
import PopularCard from "./popular-card";
import SpotLight from "./spot-light";
import Sellers from "./sellers";
import Favourite from "./favourite";
import WatchCategory from "./watch-category";
import ExploreMoreSection from "./expore-more";
import { useLivestream } from "../../../contexts/livestreamContext";
import { useEffect, useState } from "react";
import SuggestedBlips from "./suggested-blips";
import ForYou from "./for-you";
import { ScrollView } from "react-native-virtualized-view";
import UpComing from "./upcoming-shows";
import { trackScreen } from "@/utils/customerio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuqliLive = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => {
    setRefreshing(true);

    const refreshTimeout = setTimeout(() => setRefreshing(false), 1000);
    return () => clearTimeout(refreshTimeout);
  };

  useEffect(() => {
    const triggerAppLaunchAnalytics = async () => {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData || "{}");

      // Track initial app launch screen view
      trackScreen("app_opened", {
        screenName: "home",
        userId: user?._id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        country: user?.country,
        phoneNumber: user?.phoneNumber,
        osType: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    };
    triggerAppLaunchAnalytics();
  }, []);

  return (
    <ScrollView
      className=""
      contentContainerStyle={{
        paddingBottom: 80,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="w-full pt-1">
        {/* {liveStreamLoading && (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      )} */}
        <ForYou />
        <PopularCard />
        <SpotLight />
        <SuggestedBlips />
        <Sellers />
        <Favourite />
        <UpComing />
        <WatchCategory />

        <ExploreMoreSection />
      </View>
    </ScrollView>
  );
};

export default AuqliLive;
