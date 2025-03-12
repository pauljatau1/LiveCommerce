import { View, Text } from "react-native";
import React from "react";
import PopularCard from "./popular-card";
import SpotLight from "./spot-light";
import Sellers from "./sellers";
import Favourite from "./favourite";
import WatchCategory from "./watch-category";
import WatchFriends from "./watching-friends";
import ExploreMoreSection from "./expore-more";
import { useLivestream } from "../../../contexts/livestreamContext";
import { useEffect, useState } from "react";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";

const AuqliLive = () => {
  const { isDataReady, activeLivestream, fetchAllActiveLiveStreams } =
    useLivestream();
  const [filteredActiveLivestream, setFilteredActiveLivestream] = useState([]);
  // const [liveStreamLoading, setLiveStreamLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchAllActiveLiveStreams();
      setFilteredActiveLivestream(response);
      // setLiveStreamLoading(false);
    };

    fetchData();
  }, []);

  return (
    <View className="w-full pt-1">
      {/* {liveStreamLoading && (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      )} */}
      {<PopularCard />}
      <SpotLight />
      <Sellers />
      <Favourite />
      <WatchCategory />
      {/* <WatchFriends /> */}
      <ExploreMoreSection />
    </View>
  );
};

export default AuqliLive;
