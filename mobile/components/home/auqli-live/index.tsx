import { View, Text, RefreshControl } from "react-native";
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

const AuqliLive = () => {
  const { isDataReady, activeLivestream, fetchAllActiveLiveStreams } =
    useLivestream();
  const [filteredActiveLivestream, setFilteredActiveLivestream] = useState([]);
  // const [liveStreamLoading, setLiveStreamLoading] = useState<boolean>(true);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => {
    setRefreshing(true);

    const refreshTimeout = setTimeout(() => setRefreshing(false), 1000);
    return () => clearTimeout(refreshTimeout);
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchAllActiveLiveStreams();
      setFilteredActiveLivestream(response);
      // setLiveStreamLoading(false);
    };

    fetchData();
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
